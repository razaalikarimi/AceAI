import { useEffect, useState, useRef } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import ReactMarkdown from 'react-markdown';
import { Mic, Eye, Zap, X, Move, Monitor } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Overlay() {
  const { messages, isListening, overlayVisible } = useSessionStore();
  const [activeTab, setActiveTab] = useState<'answer' | 'chat'>('answer');
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Latest answer
  const latestAnswers = messages.filter((m) => m.role === 'assistant');
  const currentAnswer = latestAnswers.length > 0 ? latestAnswers[latestAnswers.length - 1] : null;

  useEffect(() => {
    // Listen for new answers from main window
    if (window.electronAPI) {
      window.electronAPI.onReceiveAnswer((data) => {
        // Handled by store in main app, here we just observe the store
        // But in a multi-window setup, store states might not sync automatically unless we use a sync layer.
        // For simplicity, we assume we receive IPC events to update local state or we forward actions to main.
        // Actually, since Zustand is in-memory per window, we *must* sync state via IPC or use a shared state.
        // Let's implement a simple IPC listener here to receive answers.
        toast(`New answer received via ${data.type}`);
      });
    }
  }, []);

  const handleDrag = () => {
    // Basic drag handling is managed by CSS `-webkit-app-region: drag`
  };

  if (!overlayVisible) return null;

  return (
    <div className="flex flex-col h-screen bg-white text-slate-900 font-sans overflow-hidden border border-slate-300 rounded shadow-lg">
      <Toaster position="top-center" toastOptions={{ style: { background: '#fff', color: '#111', border: '1px solid #e5e7eb' } }} />
      
      {/* Top Toolbar (Draggable) */}
      <div 
        className="drag-region flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-slate-200"
        onMouseDown={handleDrag}
      >
        <div className="flex items-center space-x-2">
          <Monitor className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] font-bold tracking-tight text-slate-500 uppercase">AceAI Overlay</span>
        </div>
        
        <div className="no-drag flex items-center space-x-1">
          <button 
            onClick={() => window.electronAPI?.captureScreen()}
            className="p-1 rounded hover:bg-slate-200 text-slate-500 transition-colors"
            title="Analyze Screen (Alt+A)"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          
          <div className={`p-1 ${isListening ? 'text-red-600' : 'text-slate-300'}`}>
            <Mic className="w-3.5 h-3.5" />
          </div>

          <button 
            onClick={() => window.electronAPI?.closeOverlay()}
            className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-slate-100 no-drag">
        <button
          onClick={() => setActiveTab('answer')}
          className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-tight transition-colors ${activeTab === 'answer' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          Recommendation
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-tight transition-colors ${activeTab === 'chat' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          Assistant
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 no-drag scroll-smooth bg-white">
        {activeTab === 'answer' ? (
          <div className="space-y-4">
            {currentAnswer ? (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Zap className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Suggested Response</span>
                </div>
                <div className="prose prose-slate prose-sm max-w-none text-slate-800 prose-p:leading-relaxed">
                  <ReactMarkdown>{currentAnswer.content}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 pt-10">
                <Mic className="w-8 h-8 mb-3 text-slate-400" />
                <p className="text-xs font-medium text-slate-600">Waiting for interview questions...</p>
                <p className="text-[10px] mt-1 text-slate-500">Shortcut: Alt+A to scan screen</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-3 pb-2">
              {messages.filter(m => m.source === 'chat' || m.role === 'user').map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[90%] rounded-lg px-3 py-2 text-sm border ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white border-primary' 
                      : 'bg-slate-50 text-slate-800 border-slate-200'
                  }`}>
                    <div className="prose prose-sm prose-slate"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <form 
              onSubmit={(e) => { e.preventDefault(); /* send chat */ setChatInput(''); }}
              className="mt-auto border-t border-slate-100 pt-3 relative"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-slate-800 placeholder-slate-400"
              />
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
