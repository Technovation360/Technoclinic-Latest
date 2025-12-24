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
  ShieldAlert,
  Loader2,
  Building2
} from 'lucide-react';

interface Props {
  onLogin: (role: Role) => void;
  clinicName: string;
  onBack: () => void;
  isSuperAdminPath?: boolean;
}

const Login: React.FC<Props> = ({ onLogin, clinicName, onBack, isSuperAdminPath }) => {
  const [showStaffLogin, setShowStaffLogin] = useState(isSuperAdminPath ? true : false);
  const [staffRole, setStaffRole] = useState<Role | null>(isSuperAdminPath ? Role.SUPER_ADMIN : null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
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
      setIsLoading(false);
    }, 800);
  };

  const resetState = () => {
    if (!isSuperAdminPath) {
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
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center p-3">
        <div className="card shadow-soft p-4 p-md-5 w-100" style={{ maxWidth: '440px' }}>
          {!isSuperAdminPath && (
            <button 
              onClick={resetState}
              className="btn btn-link p-0 text-muted text-decoration-none mb-4 d-flex align-items-center gap-2 fw-semibold"
            >
              <ChevronLeft size={16} /> Back
            </button>
          )}
          
          <div className="text-center mb-4">
            <div className="d-inline-block mb-3">
              <div className={`p-3 rounded-4 shadow-sm ${isSuperAdmin ? 'bg-dark text-white' : 'bg-primary text-white'}`}>
                 {isSuperAdmin ? <ShieldAlert size={28} /> : <Logo size={28} className="bg-white" />}
              </div>
            </div>
            <h2 className="h4 fw-bold text-dark mb-1">
              {isSuperAdmin ? 'Command Center' : 'Staff Access'}
            </h2>
            <p className="text-muted small fw-medium">
              {isSuperAdmin ? 'Infrastructure Management' : clinicName}
            </p>
          </div>

          <form onSubmit={handleStaffLogin} className="d-grid gap-3">
            <div className="form-group">
              <label className="small fw-bold text-muted text-uppercase tracking-wider mb-1 px-1">Identity</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 rounded-start-4 px-3 text-muted">
                  <User size={18} />
                </span>
                <input 
                  autoFocus required type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  className="form-control bg-light border-start-0 rounded-end-4"
                  placeholder="Username"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="small fw-bold text-muted text-uppercase tracking-wider mb-1 px-1">Passphrase</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 rounded-start-4 px-3 text-muted">
                  <Lock size={18} />
                </span>
                <input 
                  required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="form-control bg-light border-start-0 rounded-end-4"
                  placeholder="••••••••"
                />
              </div>
              {error && <div className="mt-2 text-danger small fw-semibold text-center py-2 bg-danger bg-opacity-10 rounded-3 border border-danger border-opacity-25">{error}</div>}
            </div>

            <button 
              type="submit" disabled={isLoading}
              className={`btn ${isSuperAdmin ? 'btn-dark' : 'btn-primary'} py-3 d-flex align-items-center justify-content-center gap-2 shadow-sm rounded-4`}
            >
              {isLoading ? <Loader2 size={20} className="spinner-border spinner-border-sm border-0" /> : 'Sign In'} 
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-5 pt-4 border-top text-center">
             <div className="small fw-bold text-muted text-uppercase tracking-widest d-flex align-items-center justify-content-center gap-2">
                <ShieldCheck size={12} className="text-success" /> Secure Encryption Active
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-white d-flex flex-column align-items-center justify-content-center p-3 position-relative overflow-hidden">
      <div className="position-absolute top-0 end-0 bg-primary bg-opacity-10 blur-5 rounded-circle" style={{ width: '40vw', height: '40vw', filter: 'blur(80px)', zIndex: -1, transform: 'translate(30%, -30%)' }}></div>
      
      <div className="container" style={{ maxWidth: '1000px' }}>
        <div className="row g-5 align-items-center">
          <div className="col-lg-6">
            <div className="mb-4">
              <div className="d-inline-block p-3 bg-primary rounded-4 shadow shadow-primary-subtle mb-4">
                 <Logo size={48} className="bg-white" />
              </div>
              <h1 className="display-4 fw-bold text-dark lh-sm">
                Welcome to<br/>{clinicName}
              </h1>
              <p className="lead text-muted fw-medium mt-3">
                Experience modern healthcare management. Choose your access portal to continue.
              </p>
            </div>
            
            <div className="d-flex flex-wrap gap-2">
              <div className="badge bg-success-subtle text-success border border-success border-opacity-25 py-2 px-3 rounded-3 d-flex align-items-center gap-2">
                <CheckCircle size={14} /> HIPAA Compliant
              </div>
              <div className="badge bg-primary-subtle text-primary border border-primary border-opacity-25 py-2 px-3 rounded-3 d-flex align-items-center gap-2">
                <ShieldCheck size={14} /> Network Verified
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card bg-light border-0 p-4 p-md-5 rounded-5 mb-4 shadow-sm">
               <h3 className="small fw-bold text-muted text-uppercase tracking-wider mb-4 px-2">Patient Services</h3>
               <div className="row g-3">
                  <div className="col-sm-6">
                    <LoginOption 
                      onClick={() => onLogin(Role.PATIENT)} 
                      icon={<User size={28} />} 
                      title="Check-in" 
                      desc="Front Desk"
                      theme="primary"
                    />
                  </div>
                  <div className="col-sm-6">
                    <LoginOption 
                      onClick={() => onLogin(Role.TOKEN_SCREEN)} 
                      icon={<Monitor size={28} />} 
                      title="Monitor" 
                      desc="Live Queue"
                      theme="white"
                    />
                  </div>
               </div>
            </div>

            <div className="card bg-white border border-light-subtle p-4 p-md-5 rounded-5 shadow-sm">
               <h3 className="small fw-bold text-muted text-uppercase tracking-wider mb-4 px-2">Facility Staff</h3>
               <div className="row g-2">
                  <div className="col-4">
                    <StaffOption icon={<ShieldCheck size={20} />} label="Admin" onClick={() => { setStaffRole(Role.ADMIN); setShowStaffLogin(true); }} />
                  </div>
                  <div className="col-4">
                    <StaffOption icon={<UserRound size={20} />} label="Doctor" onClick={() => { setStaffRole(Role.DOCTOR); setShowStaffLogin(true); }} />
                  </div>
                  <div className="col-4">
                    <StaffOption icon={<ClipboardList size={20} />} label="Assistant" onClick={() => { setStaffRole(Role.ASSISTANT); setShowStaffLogin(true); }} />
                  </div>
               </div>
            </div>
            
            <div className="text-center pt-4">
              <button 
                onClick={onBack}
                className="btn btn-link text-muted fw-bold text-decoration-none small text-uppercase tracking-widest d-flex align-items-center gap-2 mx-auto"
              >
                <Building2 size={14} /> System Command
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginOption: React.FC<{ onClick: () => void; icon: React.ReactNode; title: string; desc: string; theme: string }> = ({ onClick, icon, title, desc, theme }) => (
  <button 
    onClick={onClick}
    className={`card h-100 p-4 text-start border shadow-sm rounded-4 transition-all w-100 ${
      theme === 'primary' ? 'bg-primary text-white border-primary' : 'bg-white text-dark border-light-subtle'
    }`}
    style={{ transition: 'transform 0.2s' }}
  >
    <div className={`rounded-3 d-flex align-items-center justify-content-center mb-3 ${
      theme === 'primary' ? 'bg-white bg-opacity-25' : 'bg-light text-primary'
    }`} style={{ width: '48px', height: '48px' }}>
      {icon}
    </div>
    <div className="fw-bold h5 mb-1">{title}</div>
    <div className={`small fw-bold text-uppercase tracking-wider opacity-75`}>{desc}</div>
  </button>
);

const StaffOption: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="btn btn-light w-100 p-3 rounded-4 d-flex flex-column align-items-center gap-2 border-0"
  >
    <div className="bg-white rounded-3 d-flex align-items-center justify-content-center text-muted shadow-sm" style={{ width: '40px', height: '40px' }}>
      {icon}
    </div>
    <span className="fw-bold text-uppercase tracking-wider text-muted" style={{ fontSize: '9px' }}>{label}</span>
  </button>
);

export default Login;