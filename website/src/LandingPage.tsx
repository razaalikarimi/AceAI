import { motion } from 'framer-motion';
import { 
  Mic, Shield, Monitor, Zap, CheckCircle2, 
  ArrowRight, PlayCircle, Globe, Lock, Cpu
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useEffect } from 'react';

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard');
    });
  }, []);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/#/dashboard'
      }
    });
    if (error) console.error('Error logging in:', error.message);
  };
  return (
    <div className="min-h-screen bg-background text-slate-900 font-sans">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">AceAI</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
          </div>
          
          <div className="flex items-center space-x-4">
            <button onClick={handleGoogleLogin} className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Sign In</button>
            <button onClick={handleGoogleLogin} className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-8">
            <span className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 text-blue-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
              <Zap className="w-3 h-3 fill-current" />
              <span>Intelligent Interview Assistant</span>
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
            Ace Your Next Interview with <br />
            <span className="text-primary">Real-Time AI Support</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Get live transcriptions and expert answers delivered discreetly during your calls. 
            Stay focused while our AI handles the technical depth.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button onClick={handleGoogleLogin} className="w-full sm:w-auto bg-primary text-white hover:bg-primary-dark px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-md">
              Start Free Trial
            </button>
            <button className="w-full sm:w-auto bg-white border border-border text-slate-700 hover:bg-slate-50 px-8 py-4 rounded-xl font-bold text-lg transition-all">
              See How It Works
            </button>
          </div>

          {/* App Preview Mockup */}
          <div className="mt-20 max-w-4xl mx-auto border border-border rounded-2xl shadow-2xl overflow-hidden bg-slate-50 p-2">
            <img 
              src="https://framerusercontent.com/images/3tE7Zf9qLqK3P6Vf2O8A8LqM.png" 
              alt="Platform Preview" 
              className="rounded-xl w-full border border-border shadow-inner"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Powerful Features for Modern Candidates</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Designed by experienced engineers to give you a natural, professional edge.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Mic className="w-6 h-6 text-primary" />,
                title: "Live Transcription",
                desc: "Captures every word with high accuracy and low latency."
              },
              {
                icon: <Shield className="w-6 h-6 text-accent" />,
                title: "Stealth Mode",
                desc: "Undetectable overlay that stays hidden from screen sharing."
              },
              {
                icon: <Monitor className="w-6 h-6 text-blue-500" />,
                title: "Screen Analysis",
                desc: "Analyze coding prompts and technical diagrams instantly."
              },
              {
                icon: <Zap className="w-6 h-6 text-yellow-500" />,
                title: "Expert Answers",
                desc: "Context-aware responses tailored to your specific resume."
              },
              {
                icon: <Globe className="w-6 h-6 text-purple-500" />,
                title: "Multi-Language",
                desc: "Full support for interviews in over 50 different languages."
              },
              {
                icon: <Lock className="w-6 h-6 text-red-500" />,
                title: "Secure & Private",
                desc: "Your data is processed locally and never stored centrally."
              }
            ].map((feat, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4 p-3 bg-slate-50 rounded-lg inline-block text-primary">
                  {feat.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900">{feat.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Fair Pricing. No Surprises.</h2>
            <p className="text-slate-500">Choose the plan that fits your interview schedule.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white p-10 rounded-2xl border border-border flex flex-col shadow-sm">
              <h3 className="text-lg font-bold mb-4">Trial</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">$0</span>
                <span className="text-slate-400 ml-1">/ session</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['10-min Daily sessions', 'All Call platforms', 'Basic AI Guidance'].map((item, i) => (
                  <li key={i} className="flex items-center space-x-2 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/dashboard" className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-border rounded-lg font-bold text-slate-700 transition-colors text-center">
                Try Free
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-white p-10 rounded-2xl border-2 border-primary flex flex-col shadow-xl relative scale-105">
              <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-lg">
                Popular
              </div>
              <h3 className="text-lg font-bold mb-4 text-primary">Unlimited</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">$29</span>
                <span className="text-slate-400 ml-1">/ month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['Unlimited Sessions', 'Priority AI Response', 'Advanced Screen OCR', 'Custom Context'].map((item, i) => (
                  <li key={i} className="flex items-center space-x-2 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/dashboard" className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold transition-colors text-center shadow-lg shadow-primary/20">
                Upgrade Now
              </Link>
            </div>

            {/* Credits Plan */}
            <div className="bg-white p-10 rounded-2xl border border-border flex flex-col shadow-sm">
              <h3 className="text-lg font-bold mb-4 text-slate-900">Flexible</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">$19</span>
                <span className="text-slate-400 ml-1">/ 10 sessions</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['No Expiration', 'All Pro Features', 'Email Support'].map((item, i) => (
                  <li key={i} className="flex items-center space-x-2 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-slate-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/dashboard" className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-border rounded-lg font-bold text-slate-700 transition-colors text-center">
                Buy Pack
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-slate-50 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">AceAI</span>
          </div>
          
          <div className="flex space-x-8 text-sm text-slate-500">
            <a href="#" className="hover:text-primary">Terms</a>
            <a href="#" className="hover:text-primary">Privacy</a>
          </div>
          
          <p className="text-sm text-slate-400">
            © 2026 AceAI. Built for better interviews.
          </p>
        </div>
      </footer>
    </div>
  );
}
