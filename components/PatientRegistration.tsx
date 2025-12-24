import React, { useState } from 'react';
import { Patient, ClinicState } from '../types';
import { User, Phone, CheckCircle2 } from 'lucide-react';
import Logo from './Logo';

interface Props {
  onRegister: (name: string, phone: string) => Patient;
  state: ClinicState;
}

const PatientRegistration: React.FC<Props> = ({ onRegister, state }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [registeredPatient, setRegisteredPatient] = useState<Patient | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return alert('Enter valid phone');
    const p = onRegister(name, phone);
    setRegisteredPatient(p);
  };

  if (registeredPatient) {
    return (
      <div className="container py-5 d-flex justify-content-center">
        <div className="card p-5 text-center shadow-lg border-0 animate-up" style={{ maxWidth: '440px' }}>
          <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: '80px', height: '80px' }}>
            <CheckCircle2 size={48} />
          </div>
          <h2 className="fw-bold mb-2">Check-in Complete!</h2>
          <p className="text-muted mb-4">Please take your seat in the waiting lounge.</p>
          <div className="token-callout p-5 shadow">
            <div className="small fw-bold text-uppercase opacity-75 mb-2">Token Number</div>
            <div className="display-1 fw-black">#{registeredPatient.tokenNumber}</div>
            <hr className="bg-white my-4 opacity-25" />
            <div className="h4 mb-0 fw-bold">{registeredPatient.name}</div>
          </div>
          <button onClick={() => setRegisteredPatient(null)} className="btn btn-link mt-4 fw-bold text-decoration-none">New Check-in</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="text-center mb-5 animate-up">
            <Logo size={60} className="mb-4 mx-auto" />
            <h1 className="fw-black h2 mb-1">Techno<span className="text-primary">Clinic</span></h1>
            <p className="text-muted">Fast-track clinic check-in terminal</p>
          </div>
          <div className="card p-4 p-md-5 border-0 shadow animate-up">
            <h4 className="fw-bold mb-4 text-center">Patient Registration</h4>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="small fw-bold text-muted text-uppercase mb-2">Contact Number</label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0"><Phone size={18} className="text-muted" /></span>
                  <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="form-control form-control-lg border-start-0 fs-6" placeholder="10 Digit Number" />
                </div>
              </div>
              <div className="mb-4">
                <label className="small fw-bold text-muted text-uppercase mb-2">Full Name</label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0"><User size={18} className="text-muted" /></span>
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} className="form-control form-control-lg border-start-0 fs-6" placeholder="e.g. John Doe" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-lg w-100 py-3 fw-bold text-uppercase tracking-wider">Generate Token</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientRegistration;