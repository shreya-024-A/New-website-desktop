import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  User as UserIcon, 
  LogOut, 
  ShieldCheck, 
  ChevronRight,
  Plus,
  BarChart3,
  Search,
  Download,
  Filter,
  ArrowRight,
  Zap,
  ArrowLeft,
  Eye,
  ChevronDown,
  X,
  EyeOff,
  Lock,
  Mail,
  GraduationCap
} from 'lucide-react';
import { analyzeCertificate, CertificateAnalysis } from './services/geminiService';
import { cn } from './lib/utils';
import { User, Activity, Stats } from './types';

// --- Components ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' }>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: 'bg-brand-ink text-brand-bg hover:bg-brand-ink/90',
      secondary: 'bg-white text-brand-ink border border-brand-ink/10 hover:bg-brand-bg',
      outline: 'border border-brand-ink text-brand-ink hover:bg-brand-ink hover:text-brand-bg',
      ghost: 'text-brand-ink hover:bg-brand-ink/5',
    };
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode; rightIcon?: React.ReactNode }>(
  ({ className, icon, rightIcon, ...props }, ref) => (
    <div className="relative group">
      {icon && (
        <div className="absolute left-0 bottom-3 text-slate-400 group-focus-within:text-[#0F172A] transition-colors">
          {icon}
        </div>
      )}
      <input
        ref={ref}
        className={cn(
          'flex h-12 w-full border-b border-slate-200 bg-transparent px-0 py-2 pb-3 text-sm transition-all focus:outline-none focus:border-[#0F172A] placeholder:text-slate-300',
          icon && 'pl-8',
          rightIcon && 'pr-8',
          className
        )}
        {...props}
      />
      {rightIcon && (
        <div className="absolute right-0 bottom-3 text-slate-400 cursor-pointer hover:text-[#0F172A] transition-colors">
          {rightIcon}
        </div>
      )}
    </div>
  )
);

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { icon?: React.ReactNode }>(
  ({ className, children, icon, ...props }, ref) => (
    <div className="relative group">
      {icon && (
        <div className="absolute left-0 bottom-3 text-slate-400 group-focus-within:text-[#0F172A] transition-colors pointer-events-none">
          {icon}
        </div>
      )}
      <select
        ref={ref}
        className={cn(
          'flex h-12 w-full border-b border-slate-200 bg-transparent px-0 py-2 pb-3 text-sm transition-all focus:outline-none focus:border-[#0F172A] appearance-none cursor-pointer',
          icon && 'pl-8',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <div className="absolute right-0 bottom-3 text-slate-400 pointer-events-none">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  )
);

const Card = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('bg-white rounded-3xl p-6 shadow-sm border border-brand-ink/5', className)} {...props}>
    {children}
  </div>
);

// --- Main App ---

function SetupRequired() {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const url = ((import.meta as any).env.VITE_SUPABASE_URL || '').trim();
      const key = ((import.meta as any).env.VITE_SUPABASE_ANON_KEY || '').trim();

      if (!url || !key) {
        throw new Error('Variables are missing. Please add them to your environment.');
      }

      if (!url.startsWith('https://')) {
        throw new Error('URL must start with https://');
      }

      const client = createClient(url, key);
      const { error } = await client.from('profiles').select('count', { count: 'exact', head: true });
      
      if (error) {
        if (error.message.includes('relation "profiles" does not exist')) {
          setTestResult({ success: true, message: 'Connected! But the "profiles" table is missing. Run the SQL script.' });
        } else {
          throw error;
        }
      } else {
        setTestResult({ success: true, message: 'Connection Successful! Everything is ready.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection failed' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[40px] p-12 border border-slate-100 shadow-xl text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <ShieldCheck className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-3xl font-bold text-[#0F172A] mb-4">Setup Required</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">
          To use the Activity Point Analyzer, you need to connect your Supabase project. 
          Please add the following environment variables to your secrets:
        </p>
        <div className="space-y-3 text-left mb-8">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-mono text-xs text-slate-600">
            VITE_SUPABASE_URL (Must start with https://)
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-mono text-xs text-slate-600">
            VITE_SUPABASE_ANON_KEY
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <button 
            onClick={testConnection}
            disabled={testing}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-[#0F172A] rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          >
            {testing ? 'Testing Connection...' : 'Test Connection Now'}
          </button>

          {testResult && (
            <div className={cn(
              "p-4 rounded-xl text-xs text-left",
              testResult.success ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
            )}>
              <div className="font-bold mb-1">{testResult.success ? 'Success!' : 'Error:'}</div>
              {testResult.message}
            </div>
          )}
        </div>

        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl mb-8 text-left">
          <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider mb-2">Important Note</p>
          <p className="text-xs text-amber-600 leading-relaxed">
            Make sure you are using the <strong>Project URL</strong> from Supabase (e.g., <code>https://xyz.supabase.co</code>), 
            NOT the Database connection string (e.g., <code>postgres://...</code>).
          </p>
        </div>
        <p className="text-xs text-slate-400">
          After adding these, the app will automatically reload and be ready to use.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  if (!isSupabaseConfigured) {
    return <SetupRequired />;
  }

  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'dashboard'>('landing');
  const [role, setRole] = useState<'student' | 'teacher'>('student');

  useEffect(() => {
    const checkSupabase = async () => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
          if (error && error.message.includes('relation "profiles" does not exist')) {
            console.warn('Supabase profiles table missing. Please run the SQL setup script.');
          }
        } catch (e) {
          console.error('Supabase connection check failed:', e);
        }
      }
    };
    checkSupabase();
  }, []);

  // Load user from local storage
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          const user = { ...profile, email: session.user.email };
          setUser(user as User);
          setView('dashboard');
        }
      } else {
        const saved = localStorage.getItem('user');
        if (saved) {
          localStorage.removeItem('user');
          setView('landing');
        }
      }
    };
    checkSession();
  }, []);

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('user');
    setUser(null);
    setView('landing');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="px-12 py-4 flex items-center justify-between bg-white border-b border-slate-100 sticky top-0 z-50">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => setView(user ? 'dashboard' : 'landing')}
        >
          <div className="w-9 h-9 bg-[#0F172A] rounded-lg flex items-center justify-center shadow-sm">
            <ShieldCheck className="text-white w-5 h-5" />
          </div>
          <span className="font-sans font-bold text-xl tracking-tight text-[#0F172A]">PointAnalyzer</span>
        </div>

        <div className="flex items-center gap-8">
          {user ? (
            <>
              <div className="text-right">
                <div className="text-sm font-bold text-[#0F172A] leading-none">{user.name.toLowerCase()}</div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-1">
                  {user.role} portal
                </div>
              </div>
              <div className="h-8 w-[1px] bg-slate-100" />
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#0F172A] transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="text-sm font-semibold px-5" onClick={() => { setView('login'); setRole('student'); }}>Sign In</Button>
              <Button className="bg-[#0F172A] text-white rounded-lg px-6 py-2 text-sm font-semibold" onClick={() => { setView('register'); setRole('student'); }}>Register</Button>
            </>
          )}
        </div>
      </nav>

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {view === 'landing' && <LandingView onStart={(r) => { setRole(r); setView(r === 'student' ? 'register' : 'login'); }} />}
          {view === 'login' && <LoginView role={role} onLogin={(u) => { setUser(u); setView('dashboard'); }} onSwitch={() => setView('register')} onBack={() => setView('landing')} />}
          {view === 'register' && <RegisterView onRegister={(u) => { setUser(u); setView('dashboard'); }} onSwitch={() => setView('login')} onBack={() => setView('landing')} />}
          {view === 'dashboard' && user && (
            user.role === 'student' ? <StudentDashboard user={user} onLogout={handleLogout} /> : <TeacherDashboard user={user} onLogout={handleLogout} />
          )}
        </AnimatePresence>
      </main>

      <footer className="p-8 border-t border-brand-ink/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] uppercase tracking-widest opacity-40 font-bold">
        <div>© 2026 Activity Point Analyzer Project</div>
        <div className="flex gap-6">
          <a href="#" className="hover:opacity-100 transition-opacity">Documentation</a>
          <a href="#" className="hover:opacity-100 transition-opacity">Privacy</a>
          <a href="#" className="hover:opacity-100 transition-opacity">Support</a>
        </div>
      </footer>
    </div>
  );
}

// --- Views ---

function LandingView({ onStart }: { onStart: (role: 'student' | 'teacher') => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="max-w-7xl mx-auto px-6 py-24 md:py-32 text-left"
    >
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E0F2FE] text-[#0369A1] rounded-md mb-8">
        <Zap className="w-3.5 h-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-wider">AI-Powered Verification</span>
      </div>
      
      <h1 className="text-6xl md:text-8xl font-sans font-bold tracking-tight text-[#0F172A] mb-8 max-w-4xl leading-[1.05]">
        Activity Points Management System
      </h1>
      
      <p className="max-w-2xl text-xl text-[#475569] mb-12 leading-relaxed">
        A formal platform for KTU students and faculty to manage activity points. Extract data from certificates automatically and streamline the verification process.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Button 
          className="h-16 px-8 text-lg bg-[#0F172A] text-white rounded-xl font-bold flex items-center gap-3 w-full sm:w-auto" 
          onClick={() => onStart('student')}
        >
          Student Portal <ArrowRight className="w-5 h-5" />
        </Button>
        <Button 
          variant="outline" 
          className="h-16 px-8 text-lg border-2 border-[#0F172A] text-[#0F172A] rounded-xl font-bold flex items-center gap-3 w-full sm:w-auto bg-white" 
          onClick={() => onStart('teacher')}
        >
          <ShieldCheck className="w-5 h-5" /> Faculty Portal
        </Button>
      </div>
    </motion.div>
  );
}

function LoginView({ role, onLogin, onSwitch, onBack }: { role: 'student' | 'teacher', onLogin: (u: User) => void, onSwitch: () => void, onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const runTest = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      if (error) {
        if (error.message.includes('relation "profiles" does not exist')) {
          setTestResult('✅ Connected! But your database tables are missing. Run the SQL script.');
        } else {
          throw error;
        }
      } else {
        setTestResult('✅ Connection Successful! Your database is ready.');
      }
    } catch (err: any) {
      setTestResult('❌ Connection Failed: ' + (err.message || 'Unknown error'));
    } finally {
      setTestLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      const user = { ...profileData, email: authData.user.email };
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user as User);
    } catch (err: any) {
      console.error('Login error details:', err);
      let msg = err.message || 'Login failed';
      if (msg.includes('fetch')) {
        msg = 'Network Error: The app cannot reach your Supabase project. This usually means the URL is wrong or your project is paused.';
      } else if (msg.includes('Invalid login credentials')) {
        msg = 'Invalid email or password. If you haven\'t registered yet, please create an account first.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto px-6 py-12"
    >
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#0F172A] transition-colors mb-12"
      >
        <ArrowLeft className="w-3 h-3" /> Back to Home
      </button>

      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-8">
          <ShieldCheck className="w-6 h-6 text-[#0F172A]" />
          <span className="font-bold text-lg tracking-tight text-[#0F172A]">KTU Point Portal</span>
        </div>
        <h2 className="text-3xl font-bold text-[#0F172A] mb-2">Sign In</h2>
        <p className="text-sm text-slate-500 mb-4">Access your activity point dashboard</p>
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-bold uppercase tracking-wider border border-emerald-100">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
            Supabase Connected
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Email Address</label>
          <Input 
            type="email" 
            placeholder="you@college.edu" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            icon={<FileText className="w-4 h-4" />}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Password</label>
          <Input 
            type={showPassword ? "text" : "password"} 
            placeholder="••••••••" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            icon={<ShieldCheck className="w-4 h-4" />}
            rightIcon={<Eye className="w-4 h-4" onClick={() => setShowPassword(!showPassword)} />}
          />
        </div>
        
        {error && (
          <div className="space-y-4">
            <p className="text-xs text-red-500 font-medium text-center bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </p>
            {error.includes('Network Error') && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-left">
                <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider mb-2">Troubleshooting</p>
                <ul className="text-[11px] text-amber-600 space-y-1 list-disc pl-4 mb-3">
                  <li>Check if your Supabase project is <strong>Paused</strong> (Restore it in dashboard).</li>
                  <li>Ensure <code>VITE_SUPABASE_URL</code> starts with <code>https://</code>.</li>
                  <li>Disable Ad-blockers or VPNs that might block Supabase.</li>
                </ul>
                <button 
                  type="button"
                  onClick={runTest}
                  disabled={testLoading}
                  className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {testLoading ? 'Testing...' : 'Run Connection Test Now'}
                </button>
                {testResult && (
                  <p className="mt-2 text-[10px] font-medium text-amber-900 bg-amber-200/50 p-2 rounded border border-amber-300">
                    {testResult}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        
        <Button className="w-full h-14 bg-[#0F172A] text-white rounded-xl text-sm font-bold" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="mt-16 text-center space-y-4">
        <p className="text-xs text-slate-500">New to the portal?</p>
        <button 
          onClick={onSwitch} 
          className="inline-flex items-center gap-2 px-8 py-3 bg-white border border-slate-100 rounded-full text-xs font-bold text-[#0F172A] shadow-sm hover:shadow-md transition-all"
        >
          Create a New Account <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

function RegisterView({ onRegister, onSwitch, onBack }: { onRegister: (u: User) => void, onSwitch: () => void, onBack: () => void }) {
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', branch: '', year: '', section: '', collegeId: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const runTest = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      if (error) {
        if (error.message.includes('relation "profiles" does not exist')) {
          setTestResult('✅ Connected! But your database tables are missing. Run the SQL script.');
        } else {
          throw error;
        }
      } else {
        setTestResult('✅ Connection Successful! Your database is ready.');
      }
    } catch (err: any) {
      setTestResult('❌ Connection Failed: ' + (err.message || 'Unknown error'));
    } finally {
      setTestLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Signup failed');

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          name: formData.name,
          role: role,
          branch: formData.branch,
          year: formData.year,
          section: formData.section,
          college_id: formData.collegeId
        }]);

      if (profileError) throw profileError;

      const user = { 
        id: authData.user.id,
        email: formData.email,
        name: formData.name,
        role: role,
        branch: formData.branch,
        year: formData.year,
        section: formData.section,
        college_id: formData.collegeId
      };
      localStorage.setItem('user', JSON.stringify(user));
      onRegister(user as User);
    } catch (err: any) {
      console.error('Registration error details:', err);
      let msg = err.message || 'Registration failed';
      if (msg.includes('fetch')) {
        msg = 'Network Error: The app cannot reach your Supabase project. This usually means the URL is wrong or your project is paused.';
      } else if (msg.includes('Database error') || msg.includes('relation "profiles" does not exist')) {
        msg = 'Database Error: The "profiles" table was not found. Did you run the SQL setup script in your Supabase dashboard?';
      } else if (msg.includes('User already registered')) {
        msg = 'This email is already registered. Please try logging in instead.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto px-6 py-12"
    >
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#0F172A] transition-colors mb-12"
      >
        <ArrowLeft className="w-3 h-3" /> Back to Home
      </button>

      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-8">
          <ShieldCheck className="w-6 h-6 text-[#0F172A]" />
          <span className="font-bold text-lg tracking-tight text-[#0F172A]">KTU Point Portal</span>
        </div>
        <h2 className="text-3xl font-bold text-[#0F172A] mb-2">Create Account</h2>
        <p className="text-sm text-slate-500 mb-4">Join the platform to track your points</p>
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-bold uppercase tracking-wider border border-emerald-100">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
            Supabase Connected
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Full Name</label>
          <Input 
            placeholder="John Doe" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            required 
            icon={<UserIcon className="w-4 h-4" />}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Email Address</label>
          <Input 
            type="email" 
            placeholder="you@college.edu" 
            value={formData.email} 
            onChange={e => setFormData({...formData, email: e.target.value})} 
            required 
            icon={<FileText className="w-4 h-4" />}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Password</label>
          <Input 
            type={showPassword ? "text" : "password"} 
            placeholder="••••••••" 
            value={formData.password} 
            onChange={e => setFormData({...formData, password: e.target.value})} 
            required 
            icon={<ShieldCheck className="w-4 h-4" />}
            rightIcon={<Eye className="w-4 h-4" onClick={() => setShowPassword(!showPassword)} />}
          />
        </div>

        <div className="space-y-4">
          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Account Type</label>
          <div className="flex border-b border-slate-100">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={cn(
                "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2",
                role === 'student' ? "border-[#0F172A] text-[#0F172A]" : "border-transparent text-slate-300"
              )}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole('teacher')}
              className={cn(
                "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2",
                role === 'teacher' ? "border-[#0F172A] text-[#0F172A]" : "border-transparent text-slate-300"
              )}
            >
              Faculty
            </button>
          </div>
        </div>
        
        {role === 'student' && (
          <div className="grid grid-cols-2 gap-x-8 gap-y-8">
            <Select value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} required>
              <option value="">Branch</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
            </Select>
            <Select value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} required>
              <option value="">Year</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </Select>
            <Input placeholder="Section" value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} />
            <Input 
              placeholder="College ID" 
              value={formData.collegeId} 
              onChange={e => setFormData({...formData, collegeId: e.target.value.toUpperCase()})} 
              required
              pattern="[A-Z]{3}[0-9]{2}[A-Z]{2}[0-9]{3}"
              title="Format: CHN23CS122"
            />
          </div>
        )}

        {error && (
          <div className="space-y-4">
            <p className="text-xs text-red-500 font-medium text-center bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </p>
            {error.includes('Network Error') && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-left">
                <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider mb-2">Troubleshooting</p>
                <ul className="text-[11px] text-amber-600 space-y-1 list-disc pl-4">
                  <li>Check if your Supabase project is <strong>Paused</strong> (Restore it in dashboard).</li>
                  <li>Ensure <code>VITE_SUPABASE_URL</code> starts with <code>https://</code>.</li>
                  <li>Disable Ad-blockers or VPNs that might block Supabase.</li>
                </ul>
              </div>
            )}
            {error.includes('Database Error') && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-left">
                <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider mb-2">Troubleshooting</p>
                <p className="text-[11px] text-amber-600 leading-relaxed">
                  Go to Supabase <strong>SQL Editor</strong> and run the setup script to create the <code>profiles</code> and <code>activities</code> tables.
                </p>
              </div>
            )}
          </div>
        )}
        
        <Button className="w-full h-14 bg-[#0F172A] text-white rounded-xl text-sm font-bold" disabled={loading}>
          {loading ? 'Processing...' : 'Complete Registration'}
        </Button>
      </form>

      <p className="mt-8 text-center text-xs text-slate-500">
        Already have an account? <button onClick={onSwitch} className="font-bold text-[#0F172A] underline underline-offset-4">Login here</button>
      </p>
    </motion.div>
  );
}

// --- Dashboards ---

function StudentDashboard({ user, onLogout }: { user: User, onLogout: () => void }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<CertificateAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    if (!user?.id) {
      console.error('No user ID found for fetching activities');
      return;
    }
    try {
      console.log('Fetching activities for user:', user.id);
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched activities:', data);
      setActivities(data as Activity[]);
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(10);

    try {
      // Read file as base64
      setProgress(20);
      const reader = new FileReader();
      const fileDataPromise = new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(selectedFile);
      });
      const fileData = await fileDataPromise;
      
      setProgress(40);
      // Use Gemini for analysis
      const result = await analyzeCertificate(fileData, user.name);
      
      setProgress(90);

      if (!result.isNameMatch) {
        const proceed = window.confirm(`Name mismatch detected!\n\nThe name on the certificate (${result.extractedName}) does not seem to match your registered name (${user.name}).\n\nAre you sure you want to proceed with this submission?`);
        if (!proceed) {
          setUploading(false);
          setProgress(0);
          return;
        }
      }

      setAnalysisResult({
        ...result,
        // We still need to store the fileData for the submission
        extractedText: result.extractedText || "",
      });

      // Store fileData in a ref or another state if needed, 
      // but for now let's just add it to the result object for the confirm step
      // Actually, I'll just keep the fileData in a local variable or update the state
      
      setProgress(100);
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);

    } catch (err) {
      console.error(err);
      alert('AI Analysis failed. Please try again.');
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!analysisResult || !selectedFile) return;

    try {
      const reader = new FileReader();
      const fileDataPromise = new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(selectedFile);
      });
      const fileData = await fileDataPromise;

      const { error } = await supabase
        .from('activities')
        .insert([{
          student_id: user.id,
          title: selectedFile.name,
          category: analysisResult.category,
          points: analysisResult.points,
          extracted_text: analysisResult.extractedText,
          description: analysisResult.description,
          file_name: selectedFile.name,
          file_data: fileData,
          status: 'pending'
        }]);

      if (error) throw error;

      await fetchActivities();
      setAnalysisResult(null);
      setSelectedFile(null);
      alert('Activity submitted successfully!');
    } catch (err: any) {
      console.error('Confirm error:', err);
      alert(err.message || 'Failed to save activity');
    }
  };

  const handleDelete = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;
    
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId)
      .eq('status', 'pending');
    
    if (!error) {
      fetchActivities();
    } else {
      alert(error.message || 'Failed to delete');
    }
  };

  const totalPoints = activities
    .filter(a => a.status === 'approved')
    .reduce((sum, a) => sum + a.points, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-7xl mx-auto px-12 py-8">
        <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#0F172A] transition-colors mb-8">
          <ArrowLeft className="w-3 h-3" /> Back to Login
        </button>

        <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm flex items-center justify-between mb-12">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 bg-[#0F172A] rounded-3xl flex items-center justify-center shadow-lg">
              <UserIcon className="text-white w-10 h-10" />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-[#0F172A] mb-1">Welcome, {user.name.toLowerCase()}</h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                {user.college_id || 'CHN23CS076'} • {user.branch || 'CSE'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-16 pr-10">
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Total Points</div>
              <div className="text-4xl font-bold text-[#0F172A]">
                {totalPoints} <span className="text-slate-200 text-2xl">/ 100</span>
              </div>
            </div>
            <div className="h-12 w-[1px] bg-slate-100" />
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Status</div>
              <div className="flex items-center gap-2 text-emerald-500 font-bold">
                <CheckCircle2 className="w-5 h-5" /> Active
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm h-full">
              <h3 className="text-xl font-bold text-[#0F172A] mb-2">Upload Certificate</h3>
              <p className="text-sm text-slate-400 mb-10">AI will automatically analyze your points.</p>
              
              <div 
                className={cn(
                  "border-2 border-dashed border-slate-100 rounded-[32px] p-12 text-center transition-all cursor-pointer hover:border-[#0F172A]/20 bg-slate-50/30",
                  uploading && "pointer-events-none opacity-50",
                  selectedFile && "border-[#0F172A]/40 bg-[#0F172A]/5",
                  analysisResult && "border-emerald-500/40 bg-emerald-50/30"
                )}
                onClick={() => !analysisResult && fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect}
                  accept="image/*,.pdf"
                />
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-50">
                  {selectedFile ? <FileText className="w-6 h-6 text-[#0F172A]" /> : <Upload className="w-6 h-6 text-[#0F172A]" />}
                </div>
                <p className="text-sm font-bold text-[#0F172A] mb-2">
                  {selectedFile ? selectedFile.name : 'Choose Certificate'}
                </p>
                <p className="text-xs text-slate-400">
                  {selectedFile ? 'Click to change file' : 'Drag & drop or click to browse'}
                </p>
              </div>

              {selectedFile && !uploading && !analysisResult && (
                <Button 
                  onClick={(e) => { e.stopPropagation(); handleAnalyze(); }}
                  className="w-full mt-8 bg-[#0F172A] text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" /> Upload & Analyze
                </Button>
              )}

              {uploading && (
                <div className="mt-8 space-y-2">
                  <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-slate-400">
                    <span>Analyzing with AI...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-[#0F172A]" 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {analysisResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-12 space-y-8"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Extracted Name</label>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                      <p className="text-emerald-700 font-bold text-lg">{analysisResult.extractedName}</p>
                    </div>
                    <p className="text-[10px] italic text-slate-400">Registered Name: {user.name.toLowerCase()}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Activity Category</label>
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                      <p className="text-[#0F172A] font-bold">{analysisResult.category}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Description</label>
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                      <p className="text-[#0F172A] font-bold">{analysisResult.description}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Points Claimed</label>
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                      <p className="text-[#0F172A] font-bold text-lg">{analysisResult.points}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <button 
                      onClick={() => {
                        setAnalysisResult(null);
                        setSelectedFile(null);
                      }}
                      className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors px-6"
                    >
                      Discard
                    </button>
                    <Button 
                      onClick={handleConfirm}
                      className="bg-[#0F172A] text-white h-14 px-8 rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Confirm & Submit
                    </Button>
                  </div>
                </motion.div>
              )}

              <div className="mt-10 flex justify-center">
                <div className="px-4 py-1.5 bg-slate-100 rounded-full text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  Max 10MB • PDF, JPG, PNG
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
              <div className="p-10 border-b border-slate-50">
                <h3 className="text-xl font-bold text-[#0F172A] flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400" /> Activity History
                </h3>
              </div>

              <div className="bg-slate-50/50 px-10 py-4 grid grid-cols-5 gap-4">
                {['Certificate', 'Category', 'Points', 'Status', 'Actions'].map((header) => (
                  <div key={header} className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                    {header}
                  </div>
                ))}
              </div>

              <div className="p-10">
                {activities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-40">
                    <FileText className="w-16 h-16 mb-6 text-slate-200" />
                    <p className="text-sm font-medium text-slate-400">No activity recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="grid grid-cols-5 gap-4 items-center py-4 border-b border-slate-50 last:border-0">
                        <div className="text-sm font-bold text-[#0F172A] truncate pr-4">{activity.title}</div>
                        <div className="text-sm text-slate-500">{activity.category}</div>
                        <div className="text-sm font-bold text-[#0F172A]">{activity.points}</div>
                        <div>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                            activity.status === 'approved' ? "bg-emerald-50 text-emerald-600" :
                            activity.status === 'rejected' ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-400"
                          )}>
                            {activity.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => {
                              if (activity.file_data) {
                                const win = window.open();
                                if (win) {
                                  win.document.write(`<iframe src="${activity.file_data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                }
                              } else {
                                alert('No file data found for this certificate.');
                              }
                            }}
                            className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#0F172A] transition-colors"
                          >
                            View
                          </button>
                          {activity.status === 'pending' && (
                            <button 
                              onClick={() => handleDelete(activity.id)}
                              className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeacherDashboard({ user, onLogout }: { user: User, onLogout: () => void }) {
  const [pending, setPending] = useState<Activity[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [filters, setFilters] = useState({ year: '', branch: '', section: '' });

  useEffect(() => {
    if (showResults) {
      fetchData();
    }
  }, [showResults]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: pendingData, error: pendingError } = await supabase
        .from('activities')
        .select(`
          *,
          profiles:student_id (
            name,
            branch,
            year,
            college_id
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (pendingError) throw pendingError;

      const formatted = (pendingData || []).map(a => {
        const profile = a.profiles as any;
        return {
          ...a,
          student_name: profile?.name,
          branch: profile?.branch,
          year: profile?.year,
          college_id: profile?.college_id
        };
      });

      const [totalStudents, pendingReviews, verifiedActivities] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('activities').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('activities').select('*', { count: 'exact', head: true }).eq('status', 'approved')
      ]);

      setPending(formatted as any);
      setStats({
        total_students: totalStudents.count || 0,
        pending_reviews: pendingReviews.count || 0,
        verified_activities: verifiedActivities.count || 0
      });
    } catch (err) {
      console.error('Error fetching teacher data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (activityId: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('activities')
      .update({ status })
      .eq('id', activityId);

    if (error) {
      alert(error.message || 'Failed to verify activity');
    } else {
      setSelectedActivity(null);
      fetchData();
    }
  };

  if (!showResults) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center pt-20 px-6">
        <div className="w-full max-w-4xl">
          <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#0F172A] transition-colors mb-8">
            <ArrowLeft className="w-3 h-3" /> Back to Login
          </button>
          <h2 className="text-4xl font-bold text-[#0F172A] mb-2 text-center md:text-left">Faculty Dashboard</h2>
          <p className="text-slate-400 mb-12 text-center md:text-left">Review and verify student activity point submissions.</p>

          <div className="bg-white rounded-[40px] p-16 border border-slate-100 shadow-sm flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-8">
              <Filter className="w-8 h-8 text-[#0F172A]" />
            </div>
            <h3 className="text-2xl font-bold text-[#0F172A] mb-2">Filter Submissions</h3>
            <p className="text-slate-400 mb-12">Select criteria to view certificates.</p>

            <div className="w-full grid grid-cols-2 gap-8 mb-8">
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-300">Academic Year</label>
                <Select value={filters.year} onChange={e => setFilters({...filters, year: e.target.value})}>
                  <option value="">All Years</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </Select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-300">Branch</label>
                <Select value={filters.branch} onChange={e => setFilters({...filters, branch: e.target.value})}>
                  <option value="">All Branches</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                </Select>
              </div>
            </div>

            <div className="w-full space-y-3 mb-12">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-300">Section</label>
              <Input 
                placeholder="e.g. A" 
                value={filters.section} 
                onChange={e => setFilters({...filters, section: e.target.value})}
              />
            </div>

            <Button 
              onClick={() => setShowResults(true)}
              className="w-full h-16 bg-[#0F172A] text-white rounded-2xl font-bold flex items-center justify-center gap-3 text-lg"
            >
              <Search className="w-5 h-5" /> Apply Filter
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-7xl mx-auto px-12 py-8">
        <button 
          onClick={() => setShowResults(false)}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#0F172A] transition-colors mb-8"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Login
        </button>

        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-bold text-[#0F172A] mb-2">Faculty Dashboard</h2>
            <p className="text-slate-400">Review and verify student activity point submissions.</p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setShowResults(false)}
              className="h-12 px-6 border border-slate-100 bg-white rounded-xl text-slate-500 font-bold text-xs flex items-center gap-2"
            >
              <Filter className="w-4 h-4" /> Change Filters
            </Button>
            <Button className="h-12 px-6 bg-[#0F172A] text-white rounded-xl font-bold text-xs flex items-center gap-2">
              <Download className="w-4 h-4" /> Export Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8 mb-12">
          {[
            { label: "Total Submissions", value: stats?.total_students || 0, icon: FileText, color: "bg-[#0F172A]" },
            { label: "Pending Review", value: stats?.pending_reviews || 0, icon: Clock, color: "bg-amber-50 text-amber-500" },
            { label: "Verified", value: stats?.verified_activities || 0, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-500" }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", stat.color)}>
                <stat.icon className={cn("w-6 h-6", i === 0 ? "text-white" : "")} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">{stat.label}</div>
                <div className="text-3xl font-bold text-[#0F172A]">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
          <div className="p-10 border-b border-slate-50">
            <h3 className="text-xl font-bold text-[#0F172A] mb-1">Filtered Results</h3>
            <p className="text-xs text-slate-400">{filters.year ? `${filters.year} Year` : 'All Years'}</p>
          </div>

          <div className="bg-slate-50/50 px-10 py-4 grid grid-cols-5 gap-4">
            {['Student', 'Activity', 'Points', 'Status', 'Actions'].map((header) => (
              <div key={header} className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                {header}
              </div>
            ))}
          </div>

          <div className="p-10">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F172A]"></div>
              </div>
            ) : pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-40">
                <FileText className="w-16 h-16 mb-6 text-slate-200" />
                <p className="text-sm font-medium text-slate-400">No submissions found.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pending.map((activity) => (
                  <div key={activity.id} className="grid grid-cols-5 gap-4 items-center py-4 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-slate-300" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#0F172A]">{activity.student_name}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{activity.college_id}</div>
                      </div>
                    </div>
                    <div className="text-sm text-slate-500">{activity.category}</div>
                    <div className="text-sm font-bold text-[#0F172A]">{activity.points}</div>
                    <div>
                      <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        {activity.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setSelectedActivity(activity)}
                        className="text-[10px] font-bold uppercase tracking-widest text-[#0F172A] hover:underline"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedActivity && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[#0F172A] mb-1">Review Submission</h3>
                  <p className="text-sm text-slate-400">{selectedActivity.student_name} • {selectedActivity.category}</p>
                </div>
                <button onClick={() => setSelectedActivity(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              <div className="p-10">
                <div className="mb-8">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-4">AI Summary</div>
                  <div className="bg-emerald-50 p-6 rounded-2xl text-sm font-bold text-emerald-800 border border-emerald-100 mb-6">
                    {selectedActivity.description || "No summary available."}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-4">Extracted Text (OCR)</div>
                  <div className="bg-slate-50 p-6 rounded-2xl text-xs font-mono leading-relaxed text-slate-600 max-h-60 overflow-y-auto border border-slate-100 mb-6">
                    {selectedActivity.extracted_text || "No text extracted."}
                  </div>
                  {selectedActivity.file_data && (
                    <Button 
                      onClick={() => {
                        const win = window.open();
                        if (win) {
                          win.document.write(`<iframe src="${selectedActivity.file_data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                        }
                      }}
                      className="w-full h-14 bg-slate-50 text-[#0F172A] border border-slate-100 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors"
                    >
                      <Eye className="w-5 h-5" /> View Original Certificate
                    </Button>
                  )}
                </div>
                <div className="flex gap-4">
                  <Button 
                    className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm"
                    onClick={() => handleVerify(selectedActivity.id, 'approved')}
                  >
                    Approve Submission
                  </Button>
                  <Button 
                    className="flex-1 h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-sm"
                    onClick={() => handleVerify(selectedActivity.id, 'rejected')}
                  >
                    Reject Submission
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
