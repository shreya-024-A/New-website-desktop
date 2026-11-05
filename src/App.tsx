import { useState, useEffect, useRef, forwardRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { 
  Upload, CheckCircle2, XCircle, Clock, FileText, User as UserIcon, 
  LogOut, ShieldCheck, Plus, Search, Download, Filter, ArrowRight, 
  Zap, ArrowLeft, Eye, ChevronDown, X, EyeOff, Lock, Mail, GraduationCap 
} from 'lucide-react';
import { analyzeCertificate, CertificateAnalysis } from './services/geminiService';
import { compressImage } from './lib/compression'; 
import { cn } from './lib/utils';
import { User, Activity } from './types';

// --- Global UI Components ---

const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' }>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: 'bg-[#0F172A] text-white hover:bg-slate-800 shadow-md',
      secondary: 'text-slate-400 hover:text-[#0F172A] font-semibold',
      outline: 'border-2 border-[#0F172A] text-[#0F172A] hover:bg-slate-50',
    };
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode; rightIcon?: React.ReactNode }>(
  ({ className, icon, rightIcon, ...props }, ref) => (
    <div className="relative group w-full text-left">
      {icon && <div className="absolute left-0 bottom-3 text-slate-300 group-focus-within:text-[#0F172A] transition-colors">{icon}</div>}
      <input
        ref={ref}
        className={cn(
          'flex h-12 w-full border-b border-slate-200 bg-transparent px-0 py-2 pb-3 text-sm transition-all focus:outline-none focus:border-[#0F172A] placeholder:text-slate-300 font-medium',
          icon && 'pl-8',
          rightIcon && 'pr-8',
          className
        )}
        {...props}
      />
      {rightIcon && <div className="absolute right-0 bottom-3 text-slate-300 cursor-pointer">{rightIcon}</div>}
    </div>
  )
);

const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { icon?: React.ReactNode }>(
  ({ className, children, icon, ...props }, ref) => (
    <div className="relative group w-full text-left">
      {icon && <div className="absolute left-0 bottom-3 text-slate-300 pointer-events-none">{icon}</div>}
      <select
        ref={ref}
        className={cn(
          'flex h-12 w-full border-b border-slate-200 bg-transparent px-0 py-2 pb-3 text-sm transition-all focus:outline-none focus:border-[#0F172A] appearance-none cursor-pointer font-medium',
          icon && 'pl-8',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <div className="absolute right-0 bottom-3 text-slate-300 pointer-events-none"><ChevronDown size={16} /></div>
    </div>
  )
);

// --- Setup Guard ---

function SetupRequired() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[40px] p-12 border border-slate-100 shadow-xl text-center">
        <ShieldCheck className="w-16 h-16 text-amber-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-[#0F172A] mb-4">Configuration Error</h2>
        <p className="text-slate-500">Please check your .env file for Supabase keys.</p>
      </div>
    </div>
  );
}

// --- Main App Logic ---

export default function App() {
  if (!isSupabaseConfigured) return <SetupRequired />;

  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'dashboard'>('landing');
  const [role, setRole] = useState<'student' | 'teacher'>('student');

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) {
          setUser({ ...profile, email: session.user.email } as User);
          setView('dashboard');
        }
      }
    };
    checkSession();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView('landing');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <nav className="px-12 py-4 flex items-center justify-between border-b border-slate-100 sticky top-0 z-50 bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView(user ? 'dashboard' : 'landing')}>
          <div className="w-9 h-9 bg-[#0F172A] rounded-lg flex items-center justify-center"><ShieldCheck className="text-white w-5 h-5" /></div>
          <span className="font-bold text-xl tracking-tight text-[#0F172A]">PointAnalyzer</span>
        </div>
        {user ? (
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm font-bold text-[#0F172A] leading-none">{user.name.toLowerCase()}</p>
              <p className="text-[10px] font-bold text-slate-300 uppercase mt-1">{user.role} portal</p>
            </div>
            <button onClick={handleLogout} className="text-sm font-bold text-slate-400 hover:text-red-500 transition-colors">Logout</button>
          </div>
        ) : (
          <div className="flex gap-4">
            <Button variant="secondary" onClick={() => setView('login')}>Sign In</Button>
            <Button onClick={() => setView('register')}>Register</Button>
          </div>
        )}
      </nav>

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {view === 'landing' && <LandingView onStart={(r) => { setRole(r); setView(r === 'student' ? 'register' : 'login'); }} />}
          {view === 'login' && <LoginView onLogin={(u: User) => { setUser(u); setView('dashboard'); }} onSwitch={() => setView('register')} onBack={() => setView('landing')} />}
          {view === 'register' && <RegisterView onRegister={(u: User) => { setUser(u); setView('dashboard'); }} onSwitch={() => setView('login')} onBack={() => setView('landing')} />}
          {view === 'dashboard' && user && (user.role === 'student' ? <StudentDashboard user={user} onLogout={handleLogout} /> : <div className="p-20 text-center font-bold">Teacher Dashboard Coming Soon</div>)}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- View Components ---

function LandingView({ onStart }: { onStart: (role: 'student' | 'teacher') => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto px-6 py-32 text-left">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E0F2FE] text-[#0369A1] rounded-md mb-8">
        <Zap size={14} /> <span className="text-[10px] font-bold uppercase tracking-wider">AI-Powered Verification</span>
      </div>
      <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-[#0F172A] mb-8 max-w-4xl">Activity Points Management</h1>
      <div className="flex gap-4">
        <Button className="h-16 px-8 text-lg" onClick={() => onStart('student')}>Student Portal <ArrowRight className="ml-2" /></Button>
        <Button variant="outline" className="h-16 px-8 text-lg bg-white" onClick={() => onStart('teacher')}>Faculty Portal</Button>
      </div>
    </motion.div>
  );
}

function LoginView({ onLogin, onSwitch, onBack }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
    onLogin({ ...profile, email: data.user.email });
  };
  return (
    <div className="max-w-md mx-auto py-24 px-6 text-center">
      <button onClick={onBack} className="text-[10px] font-bold text-slate-300 mb-8 uppercase flex items-center gap-2 justify-center hover:text-black"><ArrowLeft size={12}/> Back to home</button>
      <h2 className="text-4xl font-bold mb-10 text-[#0F172A]">Sign In</h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        <Input placeholder="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} required icon={<Mail size={16}/>}/>
        <Input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required icon={<Lock size={16}/>}/>
        <Button className="w-full h-14">Access Portal</Button>
      </form>
      <p className="mt-8 text-center text-xs text-slate-400 font-bold uppercase">New? <button onClick={onSwitch} className="text-[#0F172A] underline">Register</button></p>
    </div>
  );
}

function RegisterView({ onRegister, onSwitch, onBack }: any) {
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', branch: '', year: '', section: '', college_id: '' });
  const [showPass, setShowPass] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({ email: formData.email, password: formData.password });
    if (error) return alert(error.message);
    const profile = { id: data.user!.id, name: formData.name, role, branch: formData.branch, year: formData.year, section: formData.section, college_id: formData.college_id };
    await supabase.from('profiles').insert([profile]);
    onRegister({ ...profile, email: formData.email });
  };

  return (
    <div className="max-w-xl mx-auto py-16 px-6 text-center">
      <button onClick={onBack} className="text-[10px] font-bold text-slate-300 mb-12 uppercase flex items-center justify-center gap-2"><ArrowLeft size={12}/> Back to Home</button>
      <div className="flex flex-col items-center mb-10">
        <ShieldCheck className="w-10 h-10 text-[#0F172A] mb-4" />
        <h2 className="text-4xl font-bold text-[#0F172A]">Create Account</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <Input placeholder="Full Name" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} required icon={<UserIcon size={16}/>}/>
        <Input placeholder="Email Address" type="email" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})} required icon={<Mail size={16}/>}/>
        <Input placeholder="Password" type={showPass ? "text" : "password"} value={formData.password} onChange={e=>setFormData({...formData, password:e.target.value})} required icon={<ShieldCheck size={16}/>} rightIcon={showPass ? <EyeOff size={16} onClick={()=>setShowPass(false)}/> : <Eye size={16} onClick={()=>setShowPass(true)}/>}/>
        
        <div className="space-y-4 text-left">
          <label className="text-[10px] font-bold uppercase text-slate-300">Account Type</label>
          <div className="flex border-b border-slate-100">
            <button type="button" className={cn("flex-1 py-3 text-[10px] font-bold uppercase", role==='student' ? "border-b-2 border-[#0F172A] text-[#0F172A]" : "text-slate-300")} onClick={()=>setRole('student')}>Student</button>
            <button type="button" className={cn("flex-1 py-3 text-[10px] font-bold uppercase", role==='teacher' ? "border-b-2 border-[#0F172A] text-[#0F172A]" : "text-slate-300")} onClick={()=>setRole('teacher')}>Faculty</button>
          </div>
        </div>

        {role === 'student' && (
          <div className="grid grid-cols-2 gap-x-8 gap-y-10">
            <Select value={formData.branch} onChange={e=>setFormData({...formData, branch:e.target.value})} required icon={<GraduationCap size={16}/>}>
              <option value="">Branch</option><option value="CSE">CSE</option><option value="ECE">ECE</option>
            </Select>
            <Select value={formData.year} onChange={e=>setFormData({...formData, year:e.target.value})} required icon={<Clock size={16}/>}>
              <option value="">Year</option><option value="1">1st Year</option><option value="2">2nd Year</option>
            </Select>
            <Input placeholder="Section" value={formData.section} onChange={e=>setFormData({...formData, section:e.target.value})} />
            <Input placeholder="College ID" value={formData.college_id} onChange={e=>setFormData({...formData, college_id:e.target.value.toUpperCase()})} required/>
          </div>
        )}

        <Button className="w-full h-16 rounded-xl">Complete Registration</Button>
      </form>
    </div>
  );
}

// --- Student Dashboard ---

function StudentDashboard({ user, onLogout }: { user: User, onLogout: () => void }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressedData, setCompressedData] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<CertificateAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchActivities(); }, []);

  const fetchActivities = async () => {
    const { data } = await supabase.from('activities').select('*').eq('student_id', user.id).order('created_at', { ascending: false });
    setActivities(data as Activity[] || []);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      const raw = await new Promise<string>((res) => { reader.onload=(e)=>res(e.target?.result as string); reader.readAsDataURL(selectedFile); });
      const compressed = await compressImage(raw);
      setCompressedData(compressed);
      const result = await analyzeCertificate(compressed, user.name);
      setAnalysisResult({ ...result, extractedText: result.extractedText || "" });
    } catch (err) { alert('AI analysis failed.'); } finally { setUploading(false); }
  };

  const handleConfirm = async () => {
    if (!analysisResult || !compressedData || isSubmitting) return;

    if (!analysisResult.isNameMatch) {
      alert(`STOP: Mismatch detected. Certificate belongs to ${analysisResult.extractedName}`);
      setAnalysisResult(null); setSelectedFile(null); return;
    }

    if (activities.some(a => a.file_name === selectedFile?.name)) {
      return alert("Duplicate File: You have already uploaded this certificate.");
    }

    setIsSubmitting(true);
    const { error } = await supabase.from('activities').insert([{
      student_id: user.id, title: selectedFile?.name, category: analysisResult.category,
      points: analysisResult.points, extracted_text: analysisResult.extractedText,
      description: analysisResult.description, file_name: selectedFile?.name,
      file_data: compressedData, status: 'pending'
    }]);
    
    if (!error) {
      await fetchActivities();
      setAnalysisResult(null); setSelectedFile(null); setCompressedData(null);
      alert('Submitted successfully!');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-12">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-6 text-left">
            <div className="w-16 h-16 bg-[#0F172A] rounded-2xl flex items-center justify-center shadow-lg text-white font-bold"><UserIcon /></div>
            <div>
              <h2 className="text-3xl font-bold text-[#0F172A]">Welcome, {user.name.toLowerCase()}</h2>
              <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">{user.college_id} • {user.branch}</p>
            </div>
          </div>
          <div className="flex items-center gap-12 text-right">
             <div>
                <p className="text-[10px] font-bold text-slate-300 uppercase mb-1">Total Points</p>
                <p className="text-4xl font-bold text-[#0F172A]">{activities.filter(a=>a.status==='approved').reduce((s,a)=>s+a.points,0)} <span className="text-slate-200 text-2xl font-medium">/ 100</span></p>
             </div>
             <div className="h-10 w-[1px] bg-slate-100"></div>
             <div>
                <p className="text-[10px] font-bold text-slate-300 uppercase mb-1">Status</p>
                <p className="text-emerald-500 font-bold flex items-center gap-1"><CheckCircle2 size={16}/> Active</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Upload */}
          <div className="lg:col-span-4 bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold text-[#0F172A] mb-2 text-left">Upload Certificate</h3>
            <p className="text-sm text-slate-400 mb-10 font-medium opacity-80 text-left">AI will automatically analyze your points.</p>

            <div className={cn("border-2 border-dashed border-slate-100 rounded-[32px] p-12 text-center cursor-pointer bg-slate-50/20", analysisResult && "border-emerald-200 bg-emerald-50/10")} onClick={() => !analysisResult && fileInputRef.current?.click()}>
              <input type="file" className="hidden" ref={fileInputRef} onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-50 shadow-sm"><FileText className="text-[#0F172A]" /></div>
              <p className="text-sm font-bold text-[#0F172A] truncate">{selectedFile ? selectedFile.name : 'Choose Certificate'}</p>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">{selectedFile ? 'Click to change file' : 'Drag & drop or click to browse'}</p>
            </div>

            {selectedFile && !analysisResult && (
              <Button onClick={handleAnalyze} disabled={uploading} className="w-full mt-8 h-14 rounded-2xl">
                {uploading ? "Analyzing..." : <><Zap size={18} className="mr-2"/> Upload & Analyze</>}
              </Button>
            )}

            {analysisResult && (
              <div className="mt-12 space-y-8 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Extracted Name</label>
                  <div className={cn("rounded-2xl p-4 border", analysisResult.isNameMatch ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100")}>
                    <p className={cn("font-bold text-lg", analysisResult.isNameMatch ? "text-emerald-700" : "text-red-700")}>{analysisResult.extractedName}</p>
                  </div>
                  <p className="text-[10px] italic text-slate-300 font-medium">Registered Name: {user.name.toLowerCase()}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Activity Category</label>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 font-bold text-[#0F172A]">{analysisResult.category}</div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Description</label>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-xs font-bold leading-relaxed text-[#0F172A]">{analysisResult.description}</div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Points Claimed</label>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 font-bold text-[#0F172A] text-lg">{analysisResult.points}</div>
                </div>

                <div className="flex gap-4 pt-4 items-center">
                  <button onClick={()=>{setAnalysisResult(null); setSelectedFile(null);}} className="text-sm font-bold text-slate-400 px-4 hover:text-slate-600">Discard</button>
                  {analysisResult.isNameMatch ? (
                    <Button onClick={handleConfirm} disabled={isSubmitting} className="flex-1 h-14 rounded-2xl">
                      {isSubmitting ? "Uploading..." : <><CheckCircle2 size={18} className="mr-2"/> Confirm & Submit</>}
                    </Button>
                  ) : (
                    <div className="flex-1 bg-red-600 text-white rounded-2xl flex items-center justify-center font-bold text-xs uppercase cursor-not-allowed">Blocked: Name Mismatch</div>
                  )}
                </div>
              </div>
            )}
            <div className="mt-10 text-center uppercase tracking-widest font-bold text-[9px] text-slate-200">MAX 10MB • PDF, JPG, PNG</div>
          </div>

          {/* History */}
          <div className="lg:col-span-8 bg-white rounded-[40px] border border-slate-100 shadow-sm min-h-[600px] overflow-hidden text-left">
            <div className="p-10 border-b border-slate-50 flex items-center gap-3">
              <Clock className="text-slate-300" size={20}/><h3 className="text-xl font-bold text-[#0F172A]">Activity History</h3>
            </div>
            <div className="p-10">
              {activities.length === 0 ? (
                <div className="text-center py-24 opacity-20"><FileText className="mx-auto mb-4" size={40}/> No activity recorded yet.</div>
              ) : (
                <div className="space-y-6">
                  {activities.map(a => (
                    <div key={a.id} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0 group">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#0F172A] truncate max-w-[200px]">{a.title}</p>
                        <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-tighter">{a.category}</p>
                      </div>
                      <div className="flex-1 text-center font-bold text-[#0F172A]">{a.points} Pts</div>
                      <div className="flex-1 text-center">
                        <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase", a.status === 'approved' ? "bg-emerald-50 text-emerald-500" : "bg-slate-100 text-slate-300")}>{a.status}</span>
                      </div>
                      <button onClick={async () => { if(confirm('Delete?')) { await supabase.from('activities').delete().eq('id', a.id); fetchActivities(); } }} className="text-red-400 font-bold text-[10px] uppercase opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}