
import React, { useState } from 'react';
import { Role } from '../types';
import { SUPER_ADMIN_CREDS } from '../constants';
import Logo from './Logo';
import { 
  Monitor, 
  ShieldCheck, 
  UserRound, 
  ClipboardList,
  ArrowRight,
  Lock,
  User,
  CheckCircle,
  ChevronLeft,
  ShieldAlert
} from 'lucide-react';

interface Props {
  onLogin: (role: Role) => void;
  clinicName: string;
  onBack: () => void;
  isSuperAdminPath?: boolean;
}

const Login: React.FC<Props> = ({ onLogin, clinicName, onBack, isSuperAdminPath }) => {
  // If isSuperAdminPath is true, we directly show the login form for Super Admin
  const [showStaffLogin, setShowStaffLogin] = useState(isSuperAdminPath ? true : false);
  const [staffRole, setStaffRole] = useState<Role | null>(isSuperAdminPath ? Role.SUPER_ADMIN : null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (staffRole === Role.SUPER_ADMIN) {
      if (username === SUPER_ADMIN_CREDS.user && password === SUPER_ADMIN_CREDS.pass) {
        onLogin(Role.SUPER_ADMIN);
        return;
      }
    }

    const credentials: Record<string, { user: string; pass: string }> = {
      [Role.ADMIN]: { user: 'admin', pass: 'admin123' },
      [Role.DOCTOR]: { user: 'doctor', pass: 'doctor123' },
      [Role.ASSISTANT]: { user: 'assistant', pass: 'asst123' }
    };

    if (staffRole && staffRole !== Role.SUPER_ADMIN) {
      const creds = credentials[staffRole];
      if (username === creds.user && password === creds.pass) {
        onLogin(staffRole);
      } else {
        setError('Invalid credentials for this facility.');
        setTimeout(() => setError(''), 3000);
      }
    } else if (staffRole === Role.SUPER_ADMIN) {
      setError('Invalid command center master credentials.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const resetState = () => {
    if (isSuperAdminPath) {
      // Just clear fields instead of going back since the directory is removed
      setUsername('');
      setPassword('');
      setError('');
    } else {
      setShowStaffLogin(false);
      setStaffRole(null);
      setUsername('');
      setPassword('');
      setError('');
    }
  };

  if (isSuperAdminPath || (showStaffLogin && staffRole)) {
    const isSuperAdmin = staffRole === Role.SUPER_ADMIN;
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[56px] p-12 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
          {!isSuperAdminPath && (
            <button 
              onClick={resetState}
              className="text-slate-400 hover:text-slate-600 mb-10 font-black flex items-center gap-2 transition-all group"
            >
              <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to selection
            </button>
          )}
          
          <div className="mb-10">
            <div className="flex items-center gap-5 mb-3">
              <div className={`p-4 rounded-2xl ${isSuperAdmin ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20' : 'bg-cyan-600 text-white shadow-xl shadow-cyan-100'}`}>
                 {isSuperAdmin ? <ShieldAlert size={36} /> : <Logo size={36} className="bg-white" />}
              </div>
              <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">
                {isSuperAdmin ? 'Command Center' : 'Staff Auth'}
              </h2>
            </div>
            {!isSuperAdmin && <p className="text-[11px] font-black text-cyan-600 uppercase tracking-[0.3em] mb-6">{clinicName}</p>}
            {isSuperAdmin && <p className="text-[11px] font-black text-cyan-600 uppercase tracking-[0.3em] mb-6">TechnoClinic Infrastructure</p>}
            <p className="text-slate-500 font-medium text-lg leading-tight">
              {isSuperAdmin ? 'TechnoClinic Command Center Login' : `Secure authentication required for ${staffRole?.replace('_', ' ')}`}
            </p>
          </div>

          <form onSubmit={handleStaffLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] px-1">Login Identity</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={22} />
                <input 
                  autoFocus
                  required
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all font-bold text-slate-700 text-lg"
                  placeholder="Username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] px-1">Access Passphrase</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={22} />
                <input 
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all font-bold text-slate-700 text-lg"
                  placeholder="••••••••"
                />
              </div>
              {error && <p className="mt-4 text-rose-500 text-[10px] font-black uppercase tracking-widest bg-rose-50 p-4 rounded-2xl text-center border border-rose-100">{error}</p>}
            </div>

            <button 
              type="submit"
              className="w-full bg-slate-900 text-white font-black py-6 rounded-3xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/10 flex items-center justify-center gap-4 text-2xl tracking-tighter"
            >
              Verify Identity <ArrowRight size={28} />
            </button>
          </form>

          <div className="mt-12 p-8 bg-slate-50 rounded-[32px] border border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-black mb-4">Debug Access:</p>
            <div className="space-y-3 font-mono text-[11px] text-slate-600 bg-white/50 p-5 rounded-2xl border border-slate-100">
              {isSuperAdmin ? (
                <div className="flex justify-between items-center">
                  <span className="font-black text-[9px] text-slate-400">COMMAND ROOT</span>
                  <code className="text-cyan-600 font-bold">{SUPER_ADMIN_CREDS.user} / {SUPER_ADMIN_CREDS.pass}</code>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-[9px] text-slate-400">ADMIN</span>
                    <code className="text-cyan-600 font-bold">admin / admin123</code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-[9px] text-slate-400">DOCTOR</span>
                    <code className="text-cyan-600 font-bold">doctor / doctor123</code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-[9px] text-slate-400">ASST</span>
                    <code className="text-cyan-600 font-bold">assistant / asst123</code>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative">
      <button 
        onClick={onBack}
        className="absolute top-10 left-10 flex items-center gap-3 text-slate-400 hover:text-cyan-600 font-black transition-all group"
      >
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
          <ChevronLeft size={28} /> 
        </div>
        Exit Portal
      </button>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-20">
        
        <div className="flex flex-col justify-center space-y-12 p-4">
          <div className="flex items-center gap-10">
            <Logo size={120} className="shrink-0 shadow-2xl ring-[12px] ring-white" />
            <div>
              <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none mb-4">
                {clinicName}
              </h1>
              <p className="text-[13px] font-black text-cyan-600 uppercase tracking-[0.6em]">Medical Node Access</p>
            </div>
          </div>
          <div>
            <p className="text-3xl text-slate-500 font-medium max-w-lg leading-snug tracking-tight">
              Welcome to your facility's operational gateway. Select a terminal mode to initialize.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6">
             <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm text-[11px] font-black text-slate-500 uppercase tracking-widest">
                <CheckCircle size={18} className="text-emerald-500" /> End-to-End Secure
             </div>
             <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm text-[11px] font-black text-slate-500 uppercase tracking-widest">
                <CheckCircle size={18} className="text-emerald-500" /> Scalable Node
             </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-10 rounded-[56px] shadow-2xl shadow-slate-200/50 border border-white">
             <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 px-4">Public Interfaces</h3>
             <div className="space-y-5">
                <button 
                  onClick={() => onLogin(Role.PATIENT)}
                  className="w-full group p-10 bg-cyan-50 hover:bg-cyan-100 rounded-[40px] transition-all text-left flex items-center justify-between border border-cyan-100/50 shadow-sm"
                >
                  <div className="flex items-center gap-10">
                    <div className="w-24 h-24 bg-white text-cyan-600 rounded-[32px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                      <User size={48} />
                    </div>
                    <div>
                      <div className="font-black text-4xl text-cyan-950 leading-none mb-3 tracking-tighter">Registration</div>
                      <div className="text-cyan-800/60 font-black uppercase text-xs tracking-widest">Patient Check-in Unit</div>
                    </div>
                  </div>
                  <div className="w-14 h-14 bg-cyan-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all -translate-x-8 group-hover:translate-x-0">
                    <ArrowRight size={28} />
                  </div>
                </button>

                <button 
                  onClick={() => onLogin(Role.TOKEN_SCREEN)}
                  className="w-full group p-10 bg-slate-900 hover:bg-slate-800 rounded-[40px] transition-all text-left flex items-center justify-between shadow-2xl shadow-slate-900/20"
                >
                  <div className="flex items-center gap-10">
                    <div className="w-24 h-24 bg-white/10 text-white rounded-[32px] flex items-center justify-center group-hover:bg-cyan-500 transition-colors duration-500">
                      <Monitor size={48} />
                    </div>
                    <div>
                      <div className="font-black text-4xl text-white leading-none mb-3 tracking-tighter">Live Monitor</div>
                      <div className="text-white/40 font-black uppercase text-xs tracking-widest">Queue Display Screen</div>
                    </div>
                  </div>
                  <div className="w-14 h-14 bg-white text-slate-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all -translate-x-8 group-hover:translate-x-0">
                    <ArrowRight size={28} />
                  </div>
                </button>
             </div>
          </div>

          <div className="bg-white p-10 rounded-[56px] shadow-2xl shadow-slate-200/50 border border-white">
             <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 px-4">Staff Nodes</h3>
             <div className="grid grid-cols-3 gap-5">
                <StaffOption icon={<ShieldCheck size={32} />} label="Admin" onClick={() => { setStaffRole(Role.ADMIN); setShowStaffLogin(true); }} />
                <StaffOption icon={<UserRound size={32} />} label="Doctor" onClick={() => { setStaffRole(Role.DOCTOR); setShowStaffLogin(true); }} />
                <StaffOption icon={<ClipboardList size={32} />} label="Asst" onClick={() => { setStaffRole(Role.ASSISTANT); setShowStaffLogin(true); }} />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StaffOption: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center gap-5 p-10 bg-slate-50 hover:bg-cyan-600 hover:text-white rounded-[40px] transition-all duration-500 border border-slate-100 group shadow-sm active:scale-95"
  >
    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-all text-slate-600 group-hover:text-cyan-600 border border-slate-100">
      {icon}
    </div>
    <span className="font-black text-[11px] tracking-[0.2em] uppercase">{label}</span>
  </button>
);

export default Login;
