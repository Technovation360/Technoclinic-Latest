import React, { useState, useMemo } from 'react';
import { Patient, ClinicState, PatientStatus } from '../types';
import { User, Phone, CheckCircle2, History, ArrowRight, Calendar, Hash, Clock, AlertCircle } from 'lucide-react';
import Logo from './Logo';

interface Props {
  onRegister: (name: string, phone: string) => Patient;
  state: ClinicState;
}

const PatientRegistration: React.FC<Props> = ({ onRegister, state }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState<Patient | null>(null);

  const patientHistory = useMemo(() => {
    if (!phone || phone.length < 3) return [];
    return state.patients
      .filter(p => p.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''))
      .sort((a, b) => b.registeredAt - a.registeredAt);
  }, [phone, state.patients]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setPhoneError('Please enter a valid 10-digit phone number.');
      return;
    }

    if (!name || !phone) return;
    const p = onRegister(name, phone);
    setRegisteredPatient(p);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setPhone(val);
    
    if (val.length === 10) setPhoneError('');

    const match = state.patients.find(p => p.phone.replace(/\D/g, '') === val);
    if (match && !name) {
      setName(match.name);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
  };

  if (registeredPatient) {
    return (
      <div className="container py-5">
        <div className="card shadow-soft p-4 p-md-5 mx-auto text-center" style={{ maxWidth: '440px' }}>
          <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: '80px', height: '80px' }}>
            <CheckCircle2 size={48} />
          </div>
          <h2 className="h3 fw-bold text-dark mb-2">Registration Done!</h2>
          <p className="text-muted mb-4">Please wait in the lounge for your call.</p>
          
          <div className="card bg-primary text-white border-0 p-4 p-md-5 rounded-5 shadow">
            <p className="small fw-bold text-uppercase tracking-widest mb-2 opacity-75">Token Number</p>
            <div className="display-1 fw-bold mb-4">#{registeredPatient.tokenNumber}</div>
            <hr className="border-white opacity-25 mb-4" />
            <p className="h4 fw-bold text-truncate">{registeredPatient.name}</p>
          </div>

          <button 
            onClick={() => {
              setRegisteredPatient(null);
              setName('');
              setPhone('');
              setPhoneError('');
              setShowHistory(false);
            }}
            className="btn btn-link mt-4 text-primary fw-bold text-decoration-none text-uppercase tracking-wider small"
          >
            Register another patient
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5" style={{ maxWidth: '480px' }}>
      <div className="text-center mb-5">
        <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
          <Logo size={48} />
          <h1 className="h2 fw-bold text-dark mb-0">
            Techno<span className="text-primary">Clinic</span>
          </h1>
        </div>
        <p className="text-muted fw-medium">Enter your details to generate a token</p>
      </div>

      <div className="d-grid gap-4">
        <form onSubmit={handleSubmit} className="card shadow-soft p-4 p-md-5 border-0">
          <div className="text-center mb-4">
              <h2 className="h5 fw-bold text-dark text-uppercase tracking-tight">Clinic Check-in</h2>
          </div>
          
          <div className="d-grid gap-4">
            <div className="form-group">
              <label className="small fw-bold text-muted text-uppercase tracking-wider mb-2 px-1">Phone Number</label>
              <div className="input-group">
                <span className={`input-group-text bg-light border-end-0 rounded-start-4 px-3 ${phoneError ? 'text-danger' : 'text-muted'}`}>
                  <Phone size={20} />
                </span>
                <input 
                  required
                  type="tel" 
                  maxLength={10}
                  value={phone}
                  onChange={handlePhoneChange}
                  className={`form-control bg-light border-start-0 rounded-end-4 fw-bold ${phoneError ? 'is-invalid border-danger' : 'border-light-subtle'}`}
                  placeholder="10 Digit Number"
                />
              </div>
              {phoneError && (
                <div className="invalid-feedback d-flex align-items-center gap-2 mt-2 px-1 fw-bold text-uppercase" style={{ fontSize: '10px' }}>
                  <AlertCircle size={12} /> {phoneError}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="small fw-bold text-muted text-uppercase tracking-wider mb-2 px-1">Full Name</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 rounded-start-4 px-3 text-muted">
                  <User size={20} />
                </span>
                <input 
                  required
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-control bg-light border-start-0 rounded-end-4 fw-bold border-light-subtle"
                  placeholder="e.g. John Doe"
                />
              </div>
              {patientHistory.length > 0 && !name && (
                <p className="small text-primary fw-bold text-uppercase tracking-wider mt-2 px-1" style={{ fontSize: '10px' }}>
                  Found existing patient record
                </p>
              )}
            </div>
          </div>

          <button 
            type="submit"
            className="btn btn-primary w-100 mt-4 py-3 rounded-4 shadow-sm fw-bold text-uppercase tracking-wider"
          >
            Generate Token
          </button>
        </form>

        {patientHistory.length > 0 && (
          <div className="d-grid gap-2">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="btn btn-white w-100 d-flex align-items-center justify-content-between p-3 border rounded-4 shadow-sm"
              type="button"
            >
              <div className="d-flex align-items-center gap-3">
                <div className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <History size={20} />
                </div>
                <div className="text-start">
                  <p className="text-muted fw-bold text-uppercase tracking-widest mb-1" style={{ fontSize: '10px' }}>Visit History</p>
                  <p className="small fw-bold text-dark mb-0">{patientHistory.length} Previous Visits</p>
                </div>
              </div>
              <ArrowRight size={20} className={`text-muted transition-all ${showHistory ? 'rotate-90' : ''}`} />
            </button>

            {showHistory && (
              <div className="d-grid gap-2 mt-2 custom-scrollbar overflow-auto pe-1" style={{ maxHeight: '240px' }}>
                {patientHistory.map((h, i) => (
                  <div key={h.id} className="card bg-light border-0 p-3 rounded-4 d-flex flex-row align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-white rounded-3 d-flex flex-column align-items-center justify-content-center shadow-sm" style={{ width: '48px', height: '48px' }}>
                         <span className="text-muted fw-bold text-uppercase mb-0" style={{ fontSize: '8px' }}>TKN</span>
                         <span className="h6 fw-bold text-dark mb-0">#{h.tokenNumber}</span>
                      </div>
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <Calendar size={12} className="text-muted" />
                          <span className="small fw-bold text-muted text-uppercase" style={{ fontSize: '10px' }}>{formatDate(h.registeredAt)}</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <Clock size={12} className="text-muted" />
                          <span className={`badge border-0 rounded-pill px-2 py-1 text-uppercase ${
                            h.status === PatientStatus.COMPLETED ? 'bg-success bg-opacity-10 text-success' :
                            h.status === PatientStatus.CANCELLED ? 'bg-danger bg-opacity-10 text-danger' :
                            'bg-warning bg-opacity-10 text-warning'
                          }`} style={{ fontSize: '8px' }}>
                            {h.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientRegistration;