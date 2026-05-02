import { useEffect, useState } from 'react';
import { useSessionStore } from './stores/sessionStore';
import { AudioRecorder } from './services/audio.service';
import { analyzeScreenshot, generateAnswer } from './services/openai.service';
import { 
  Settings, Play, Square, Mic, Shield, ExternalLink, 
  Key, LayoutTemplate 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

const audioRecorder = new AudioRecorder();

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');
  const store = useSessionStore();
  const { config, updateConfig, isSessionActive, startSession, stopSession } = store;
  const [volume, setVolume] = useState(0);

  // Load saved config on mount
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.storeGet('apiKey').then((res) => {
        if (res.value) updateConfig({ apiKey: res.value });
      });
      
      // Setup IPC listeners for shortcuts
      window.electronAPI.onShortcutAnalyze(() => {
        handleAnalyzeScreen();
      });
    }
  }, []);

  const handleStartSession = async () => {
    if (!config.apiKey) {
      toast.error('Please enter your OpenAI API key in settings first.');
      setActiveTab('settings');
      return;
    }

    try {
      startSession();
      store.setListening(true);
      
      // Launch overlay automatically
      await window.electronAPI?.launchOverlay();

      await audioRecorder.start({
        apiKey: config.apiKey,
        language: config.language,
        onVolumeChange: setVolume,
        onTranscript: async (text) => {
          store.appendTranscript(text);
          // Auto-generate answer if question detected in transcript
          if (text.includes('?')) {
            // handleGenerateAnswer(text, 'audio');
          }
        },
        onError: (err) => {
          toast.error(err);
          handleStopSession();
        }
      });
      toast.success('Session started! Overlay launched.');
    } catch (err: any) {
      toast.error(`Failed to start: ${err.message}`);
      stopSession();
    }
  };

  const handleStopSession = () => {
    audioRecorder.stop();
    stopSession();
    store.setListening(false);
    setVolume(0);
    window.electronAPI?.closeOverlay();
    toast.success('Session ended.');
  };

  const handleAnalyzeScreen = async () => {
    if (!config.apiKey) return toast.error('API key required.');
    
    toast('Analyzing screen...', { icon: '📸' });
    store.setGenerating(true);

    try {
      const { dataUrl, error } = await window.electronAPI!.captureScreen();
      if (error || !dataUrl) throw new Error(error || 'Failed to capture screen');

      // Add user message to indicate screen analysis
      store.addMessage({ role: 'user', content: '📸 *Screen Analysis Requested*', source: 'screen' });

      // Create a temporary assistant message for streaming
      const answerId = store.addMessage({ role: 'assistant', content: '', source: 'screen', isStreaming: true });

      const { question } = await analyzeScreenshot(dataUrl, {
        apiKey: config.apiKey,
        jobTitle: config.jobTitle,
        company: config.company,
        resumeContext: config.resumeContext,
        extraContext: config.extraContext,
        onStream: () => {
          // In a real app we'd accumulate and update the message
          // For simplicity in store, we might just append, but let's assume we update
          // Here we just use a local ref or state to build the string, but we need it in store
        }
      });

      if (question === 'No question detected.') {
        store.updateMessage(answerId, { content: 'No question detected on screen.', isStreaming: false });
        toast('No question found on screen.', { icon: 'ℹ️' });
      } else {
        // Simple non-streaming update for this demo
        const answer = await generateAnswer(question, {
          apiKey: config.apiKey,
          jobTitle: config.jobTitle,
          company: config.company,
          resumeContext: config.resumeContext,
          extraContext: config.extraContext,
        });
        
        store.updateMessage(answerId, { 
          content: `**Detected Question:**\n${question}\n\n${answer}`, 
          isStreaming: false 
        });

        // Send to overlay
        window.electronAPI?.sendAnswerToOverlay({
          question,
          answer,
          type: 'screen',
          timestamp: Date.now()
        });

        toast.success('Analysis complete!');
      }

    } catch (err: any) {
      toast.error(`Analysis failed: ${err.message}`);
    } finally {
      store.setGenerating(false);
    }
  };

  const saveApiKey = async (val: string) => {
    updateConfig({ apiKey: val });
    if (window.electronAPI) {
      await window.electronAPI.storeSet('apiKey', val);
    }
  };

  return (
    <div className="flex h-screen bg-background text-slate-900 font-sans overflow-hidden drag-region">
      <Toaster position="top-right" toastOptions={{ style: { background: '#fff', color: '#111', border: '1px solid #e5e7eb' } }} />
      
      {/* Sidebar */}
      <div className="w-64 bg-surface border-r border-border flex flex-col no-drag">
        <div className="p-6 flex items-center space-x-3 drag-region pb-8">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold tracking-tight text-lg text-slate-900">AceAI</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors ${
              activeTab === 'dashboard' ? 'bg-primary/10 text-primary font-medium' : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
            }`}
          >
            <LayoutTemplate className="w-5 h-5" />
            <span className="text-sm">Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors ${
              activeTab === 'settings' ? 'bg-primary/10 text-primary font-medium' : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm">Settings</span>
          </button>
        </nav>

        <div className="p-4 m-4 rounded-lg bg-slate-100/50 border border-border">
          <div className="flex items-center space-x-2 text-[11px] font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5 text-accent" />
            <span>Stealth Mode</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">
            Overlay is hidden from Zoom, Teams, and screen recordings.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col no-drag overflow-y-auto">
        {/* Window controls placeholder for custom frame if needed */}
        <div className="h-8 drag-region w-full" /> 

        <div className="px-10 pb-10 max-w-4xl mx-auto w-full">
          {activeTab === 'dashboard' ? (
            <div className="space-y-8">
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Dashboard</h1>
                  <p className="text-sm text-slate-500 mt-0.5">Real-time interview assistance.</p>
                </div>
                <div className="flex space-x-3">
                  {!isSessionActive ? (
                    <button 
                      onClick={handleStartSession}
                      className="flex items-center space-x-2 bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start Session</span>
                    </button>
                  ) : (
                    <button 
                      onClick={handleStopSession}
                      className="flex items-center space-x-2 bg-red-50 text-red-600 hover:bg-red-100 px-5 py-2 rounded-lg text-sm font-medium transition-colors border border-red-200"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>End Session</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Status Cards */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white border border-border p-5 rounded-xl shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mic Status</h3>
                    <div className={`w-2 h-2 rounded-full ${isSessionActive ? 'bg-accent' : 'bg-slate-300'}`} />
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mic className={`w-6 h-6 ${isSessionActive ? 'text-accent' : 'text-slate-400'}`} />
                    <span className="text-xl font-semibold text-slate-900">{isSessionActive ? 'Listening' : 'Inactive'}</span>
                  </div>
                  {isSessionActive && (
                    <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-accent transition-all duration-75" style={{ width: `${volume * 100}%` }} />
                    </div>
                  )}
                </div>

                <div className="bg-white border border-border p-5 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Screen Analysis</h3>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button 
                      onClick={handleAnalyzeScreen}
                      disabled={!isSessionActive}
                      className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors border border-border"
                    >
                      Analyze Now
                    </button>
                    <p className="text-[11px] text-center text-slate-400 font-medium">Shortcut: Alt+A</p>
                  </div>
                </div>

                <div className="bg-white border border-border p-5 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overlay</h3>
                  </div>
                  <button 
                    onClick={() => window.electronAPI?.launchOverlay()}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-medium transition-colors border border-border flex justify-center items-center space-x-2"
                  >
                    <span>Show Overlay</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <p className="text-[11px] text-center text-slate-400 font-medium mt-2">Shortcut: Alt+H</p>
                </div>
              </div>

              {/* Live Transcript / Logs */}
              <div className="bg-white border border-border rounded-xl flex flex-col shadow-sm" style={{ height: '400px' }}>
                <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-sm font-semibold text-slate-700">Session Activity</h3>
                  {isSessionActive && (
                    <span className="flex items-center text-[11px] font-bold text-accent uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 bg-accent rounded-full mr-2" />
                      Live
                    </span>
                  )}
                </div>
                <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-white">
                  {store.messages.length === 0 && !store.transcript ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <LayoutTemplate className="w-10 h-10 mb-3 opacity-20" />
                      <p className="text-sm">No activity recorded. Start a session to begin.</p>
                    </div>
                  ) : (
                    <>
                      {store.transcript && (
                        <div className="bg-slate-50 border border-border rounded-lg p-4 text-sm text-slate-600">
                          <p className="text-[10px] text-slate-400 mb-2 uppercase font-bold tracking-tight">Live Transcript</p>
                          <p className="leading-relaxed">{store.transcript}</p>
                        </div>
                      )}
                      {store.messages.map(msg => (
                        <div key={msg.id} className={`rounded-lg p-4 text-sm border ${msg.role === 'user' ? 'bg-white border-slate-200' : 'bg-blue-50/30 border-blue-100'}`}>
                          <p className={`text-[10px] mb-2 uppercase font-bold tracking-tight ${msg.role === 'user' ? 'text-slate-400' : 'text-blue-500'}`}>
                            {msg.role === 'user' ? (msg.source === 'screen' ? 'Screen Captured' : 'User Query') : 'AI Recommendation'}
                          </p>
                          <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'text-slate-700' : 'text-slate-800'}`}>
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Settings</h1>
                <p className="text-sm text-slate-500 mt-0.5">Manage your application preferences.</p>
              </div>

              <div className="bg-white border border-border rounded-xl p-6 shadow-sm space-y-6">
                
                {/* API Key */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                    <Key className="w-4 h-4 text-primary" />
                    <span>OpenAI API Key</span>
                  </label>
                  <input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => saveApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-white border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-sm"
                  />
                  <p className="text-[11px] text-slate-400">Your API key is stored locally on your device.</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Job Title */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Target Job Title</label>
                    <input
                      type="text"
                      value={config.jobTitle}
                      onChange={(e) => updateConfig({ jobTitle: e.target.value })}
                      placeholder="e.g. Senior Software Engineer"
                      className="w-full bg-white border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    />
                  </div>
                  {/* Company */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Target Company</label>
                    <input
                      type="text"
                      value={config.company}
                      onChange={(e) => updateConfig({ company: e.target.value })}
                      placeholder="e.g. Google"
                      className="w-full bg-white border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Extra Context */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Resume / Interview Context</label>
                  <textarea
                    value={config.extraContext}
                    onChange={(e) => updateConfig({ extraContext: e.target.value })}
                    placeholder="Paste your resume or job description here..."
                    className="w-full bg-white border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm h-40 resize-none"
                  />
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
