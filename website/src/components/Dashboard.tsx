import { 
  Home, PhoneCall, FileText, FolderOpen, 
  Download, HelpCircle, LogOut, Plus,
  CreditCard, ExternalLink, ChevronRight,
  User, CheckCircle2, MessageSquare, Briefcase,
  Mic, Zap
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const data = await api.auth.me();
      setUser(data.user);
      fetchData();
    } catch (err) {
      navigate('/');
    }
  }

  async function fetchData() {
    setLoading(true);
    try {
      const profileData = await api.user.getCredits();
      if (profileData) setProfile(profileData);

      const sessionData = await api.sessions.list();
      if (sessionData) setSessions(sessionData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
    setLoading(false);
  }

  const handleSignOut = () => {
    api.auth.logout();
    navigate('/');
  };

  const handleBuyCredits = async (planId: string) => {
    try {
      const data = await api.request('/payments/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({ planId })
      });
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error('Payment failed:', err);
    }
  };

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'sessions', icon: PhoneCall, label: 'Call Sessions' },
    { id: 'resumes', icon: FileText, label: 'CVs / Resumes' },
    { id: 'documents', icon: FolderOpen, label: 'Documents' },
  ];

  return (
    <div className="flex h-screen bg-background text-slate-900 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-slate-50 flex flex-col">
        <div className="p-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">AceAI</span>
          </div>
        </div>

        <nav className="flex-1 px-4 mt-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'bg-primary/10 text-primary font-semibold' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-4">
          <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Credits</span>
              <span className="text-[11px] font-bold text-primary">{profile?.credits || 0} / 10</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-primary" style={{ width: `${Math.min((profile?.credits || 0) * 10, 100)}%` }} />
            </div>
            <button 
              onClick={() => handleBuyCredits('pro')}
              className="w-full py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
            >
              Upgrade Plan
            </button>
          </div>
          
          <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
            <Download className="w-4 h-4" />
            <span>Download Desktop</span>
          </button>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-white relative">
        <header className="px-8 h-20 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-20 border-b border-border">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Welcome, {user?.email?.split('@')[0] || 'User'}</h1>
            <p className="text-slate-500 text-xs font-medium">Your interview dashboard</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 border border-border rounded-lg transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-border flex items-center justify-center">
              <User className="w-5 h-5 text-slate-500" />
            </div>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto">
          {activeTab === 'home' && (
            <div className="space-y-10">
              {/* Quick Actions Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: 'Resume', desc: 'Upload for AI context', icon: FileText, action: 'Upload', color: 'blue' },
                  { title: 'Free Session', desc: '10 minute trial', icon: Zap, action: 'Start', color: 'purple' },
                  { title: 'Credits', desc: 'Get more time', icon: CreditCard, action: 'Purchase', color: 'emerald' },
                  { title: 'Live Mode', desc: 'Start full interview', icon: PhoneCall, action: 'Go Live', color: 'orange' },
                ].map((card, i) => (
                  <div key={i} className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all group">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 bg-slate-50 text-primary`}>
                      <card.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-slate-900 mb-1">{card.title}</h3>
                    <p className="text-slate-500 text-xs mb-6 leading-relaxed">{card.desc}</p>
                    <button 
                      onClick={() => {
                        if (card.title === 'Credits') handleBuyCredits('10_credits');
                      }}
                      className="w-full py-2 bg-slate-50 hover:bg-primary hover:text-white border border-border hover:border-primary rounded-lg text-xs font-bold text-slate-700 transition-all"
                    >
                      {card.action}
                    </button>
                  </div>
                ))}
              </div>

              {/* Stats / Info Section */}
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 bg-white rounded-xl border border-border shadow-sm p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-lg font-bold flex items-center space-x-2 text-slate-900">
                      <PhoneCall className="w-4 h-4 text-primary" />
                      <span>Recent Sessions</span>
                    </h2>
                    <button className="text-xs font-bold text-primary hover:underline">View all</button>
                  </div>
                  {sessions.length > 0 ? (
                    <div className="space-y-3">
                      {sessions.slice(0, 3).map((s) => (
                        <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg">
                          <div>
                            <p className="font-bold text-sm text-slate-900">{s.company || 'Unknown Company'}</p>
                            <p className="text-[11px] text-slate-500">{s.role || 'General Interview'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] text-slate-400 font-medium">{new Date(s.created_at).toLocaleDateString()}</p>
                            <span className="text-[10px] uppercase font-bold text-primary px-2 py-0.5 bg-primary/10 rounded">{s.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
                      <MessageSquare className="w-10 h-10 opacity-20" />
                      <p className="text-sm font-medium">No sessions recorded yet.</p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 rounded-xl border border-border p-8 space-y-6">
                  <h2 className="text-lg font-bold text-slate-900">Pro Tip 💡</h2>
                  <div className="bg-white border border-border p-4 rounded-lg shadow-sm">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Use the <strong>Extra Context</strong> field in the desktop app to add specific details about the company. AI will tailor answers accordingly.
                    </p>
                  </div>
                  <div className="space-y-4 pt-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recommended</p>
                    <div className="flex items-center space-x-3 text-xs font-medium text-slate-600 hover:text-primary cursor-pointer transition-colors">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>Complete your profile</span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs font-medium text-slate-600 hover:text-primary cursor-pointer transition-colors">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>Download desktop app</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="bg-white rounded-xl border border-border shadow-sm p-8">
               <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-bold text-slate-900">Call Sessions</h2>
                <button className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm flex items-center space-x-2 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>New Session</span>
                </button>
              </div>
              <div className="overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-100">
                      <th className="pb-4 font-bold">Session ID</th>
                      <th className="pb-4 font-bold">Company / Role</th>
                      <th className="pb-4 font-bold">Date</th>
                      <th className="pb-4 font-bold">Duration</th>
                      <th className="pb-4 font-bold">Status</th>
                      <th className="pb-4 font-bold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-slate-400 font-medium">
                        No sessions found. Start your first interview session!
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
             <div>
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Documents</h2>
                    <p className="text-slate-500 text-sm mt-1">Extra context for your AI assistant</p>
                  </div>
                  <button className="bg-white border border-border px-5 py-2.5 rounded-lg font-bold text-sm flex items-center space-x-2 hover:bg-slate-50 transition-colors text-slate-700">
                    <Plus className="w-4 h-4" />
                    <span>Add Document</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { name: 'About Company', type: 'Text' },
                    { name: 'Sales Bible', type: 'PDF' },
                    { name: 'Pricing Guide', type: 'Docx' },
                    { name: 'Features List', type: 'Text' },
                  ].map((doc, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer group">
                      <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                        <FolderOpen className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-base text-slate-900 mb-1">{doc.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">{doc.type}</p>
                      <div className="flex items-center text-[11px] font-bold text-slate-400 group-hover:text-primary transition-colors">
                        <span>Edit Document</span>
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-8 max-w-6xl mx-auto border-t border-border flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <p className="text-xs text-slate-400 font-medium">Resources & Community</p>
          <div className="flex items-center space-x-6">
             <button className="text-slate-400 hover:text-primary transition-colors"><ExternalLink className="w-5 h-5" /></button>
             <button className="text-slate-400 hover:text-primary transition-colors"><MessageSquare className="w-5 h-5" /></button>
             <button className="text-slate-400 hover:text-primary transition-colors"><Briefcase className="w-5 h-5" /></button>
          </div>
        </div>
      </main>
    </div>
  );
}
