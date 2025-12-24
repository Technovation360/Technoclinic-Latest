import React, { useState } from 'react';
import { Role } from '../types';
import { SUPER_ADMIN_CREDS } from '../constants';
import Logo from './Logo';
import { Monitor, User, Lock, ArrowRight, ShieldAlert, UserRound, ClipboardList, ChevronLeft } from 'lucide-react';

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

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (staffRole === Role.SUPER_ADMIN) {
      if (username === SUPER_ADMIN_CREDS.user && password === SUPER_ADMIN_CREDS.pass) {
        onLogin(Role.SUPER_ADMIN);
        return;
      }
    }
    const creds: any = {
      [Role.ADMIN]: { user: 'admin', pass: 'admin123' },
      [Role.DOCTOR]: { user: 'doctor', pass: 'doctor123' },
      [Role.ASSISTANT]: { user: 'assistant', pass: 'asst123' }
    };
    if (staffRole && creds[staffRole]) {
      if (username === creds[staffRole].user && password === creds[staffRole].pass) {
        onLogin(staffRole);
      } else {
        setError('Invalid credentials');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  if (showStaffLogin && staffRole) {
    return (
      <div className="container min-vh-100 d-flex align-items-center justify-content-center">
        <div className="card shadow-lg p-5 w-100 animate-up" style={{ maxWidth: '450px' }}>
          {!isSuperAdminPath && (
            <button onClick={() => setShowStaffLogin(false)} className="btn btn-link p-0 text-muted mb-4 d-flex align-items-center gap-2 text-decoration-none">
              <ChevronLeft size={16} /> Back
            </button>
          )}
          <div className="text-center mb-4">
            <div className={`p-3 rounded-4 d-inline-block mb-3 ${staffRole === Role.SUPER_ADMIN ? 'bg-dark' : 'bg-primary'}`}>
              <Logo size={40} className="bg-white" />
            </div>
            <h2 className="fw-bold">{staffRole === Role.SUPER_ADMIN ? 'Command Center' : 'Staff Access'}</h2>
            <p className="text-muted small">{clinicName}</p>
          </div>
          <form onSubmit={handleStaffLogin}>
            <div className="mb-3">
              <label className="small fw-bold text-muted text-uppercase mb-2">Username</label>
              <input required type="text" value={username} onChange={e => setUsername(e.target.value)} className="form-control form-control-lg fs-6" placeholder="admin" />
            </div>
            <div className="mb-4">
              <label className="small fw-bold text-muted text-uppercase mb-2">Password</label>
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="form-control form-control-lg fs-6" placeholder="••••••••" />
              {error && <div className="text-danger small mt-2 fw-bold">{error}</div>}
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-100 py-3 d-flex align-items-center justify-content-center gap-2">
              Sign In <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid min-vh-100 bg-white d-flex align-items-center justify-content-center">
      <div className="row w-100 max-w-1200 justify-content-center g-5">
        <div className="col-lg-5 d-flex flex-column justify-content-center text-center text-lg-start">
          <Logo size={100} className="mb-4 mx-auto mx-lg-0" />
          <h1 className="display-4 fw-black text-dark tracking-tighter mb-3">Techno<span className="text-primary">Clinic</span></h1>
          <p className="lead text-muted mb-5">Select a terminal to initialize access to the clinic node.</p>
          <div className="d-flex flex-wrap justify-content-center justify-content-lg-start gap-3">
             <div className="badge bg-light text-dark border p-3 rounded-4 small">Secure 256-bit AES</div>
             <div className="badge bg-light text-dark border p-3 rounded-4 small">HIPAA Compliant</div>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm p-4 bg-light rounded-5 mb-4">
            <h6 className="small fw-bold text-muted text-uppercase mb-4 px-2">Public Terminals</h6>
            <div className="row g-3">
              <div className="col-sm-6">
                <div onClick={() => onLogin(Role.PATIENT)} className="card p-4 border shadow-sm text-center h-100 cursor-pointer hover-shadow" style={{ cursor: 'pointer' }}>
                  <User className="text-primary mx-auto mb-3" size={32} />
                  <div className="fw-bold">Registration</div>
                  <div className="small text-muted">Patient Desk</div>
                </div>
              </div>
              <div className="col-sm-6">
                <div onClick={() => onLogin(Role.TOKEN_SCREEN)} className="card p-4 border shadow-sm text-center h-100 cursor-pointer hover-shadow" style={{ cursor: 'pointer' }}>
                  <Monitor className="text-primary mx-auto mb-3" size={32} />
                  <div className="fw-bold">Display</div>
                  <div className="small text-muted">Waiting Lounge</div>
                </div>
              </div>
            </div>
          </div>
          <div className="card border-0 shadow-sm p-4 bg-white rounded-5">
            <h6 className="small fw-bold text-muted text-uppercase mb-4 px-2">Facility Staff</h6>
            <div className="row g-2 text-center">
              <div className="col-4">
                <button onClick={() => { setStaffRole(Role.ADMIN); setShowStaffLogin(true); }} className="btn btn-light w-100 py-3 rounded-4 border-0">
                  <ShieldAlert size={20} className="mb-2 text-primary" />
                  <div className="small fw-bold text-uppercase" style={{ fontSize: '9px' }}>Admin</div>
                </button>
              </div>
              <div className="col-4">
                <button onClick={() => { setStaffRole(Role.DOCTOR); setShowStaffLogin(true); }} className="btn btn-light w-100 py-3 rounded-4 border-0">
                  <UserRound size={20} className="mb-2 text-primary" />
                  <div className="small fw-bold text-uppercase" style={{ fontSize: '9px' }}>Doctor</div>
                </button>
              </div>
              <div className="col-4">
                <button onClick={() => { setStaffRole(Role.ASSISTANT); setShowStaffLogin(true); }} className="btn btn-light w-100 py-3 rounded-4 border-0">
                  <ClipboardList size={20} className="mb-2 text-primary" />
                  <div className="small fw-bold text-uppercase" style={{ fontSize: '9px' }}>Assistant</div>
                </button>
              </div>
            </div>
          </div>
          <div className="text-center mt-4">
            <button onClick={onBack} className="btn btn-link text-muted small text-decoration-none fw-bold">System Command</button>
          </div>
        </div>
      </div>
      <style>{`
        .hover-shadow:hover { border-color: var(--bs-primary) !important; transform: translateY(-5px); transition: all 0.2s; }
      `}</style>
    </div>
  );
};

export default Login;