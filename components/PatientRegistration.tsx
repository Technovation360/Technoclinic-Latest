
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

  // Find history based on phone number
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

    // Auto-fill logic: if we find a previous record for this exact phone, fill name
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
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-xl border border-slate-100 text-center animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Registration Done!</h2>
        <p className="text-slate-500 mb-8">Please wait in the lounge for your call.</p>
        
        <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-3xl p-10 text-white shadow-xl">
          <p className="text-cyan-100 uppercase tracking-widest text-[10px] font-bold mb-2">Token Number</p>
          <div className="text-8xl font-black mb-6 drop-shadow-md">{registeredPatient.tokenNumber}</div>
          <div className="h-px bg-white/20 w-full mb-6"></div>
          <p className="text-xl font-bold truncate">{registeredPatient.name}</p>
        </div>

        <button 
          onClick={() => {
            setRegisteredPatient(null);
            setName('');
            setPhone('');
            setPhoneError('');
            setShowHistory(false);
          }}
          className="mt-8 text-cyan-600 font-bold hover:underline uppercase text-xs tracking-widest"
        >
          Register another patient
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-6 pb-20">
      <div className="flex flex-col items-center mb-10">
        <div className="flex items-center gap-4 mb-6">
          <Logo size={48} className="shrink-0" />
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter leading-none">
            Techno<span className="text-cyan-600">Clinic</span>
          </h1>
        </div>
        <p className="text-slate-500 font-medium text-center">Enter your details to generate a token</p>
      </div>

      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 relative overflow-hidden">
          <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-700 uppercase tracking-tight">Clinic Check-in</h2>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Phone Number</label>
              <div className="relative">
                <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${phoneError ? 'text-rose-400' : 'text-slate-400'}`} size={20} />
                <input 
                  required
                  type="tel" 
                  maxLength={10}
                  value={phone}
                  onChange={handlePhoneChange}
                  className={`w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl focus:ring-2 outline-none transition-all font-bold ${phoneError ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-cyan-500'}`}
                  placeholder="10 Digit Number"
                />
              </div>
              {phoneError && (
                <p className="mt-2 text-[10px] text-rose-500 font-black uppercase tracking-widest flex items-center gap-1.5 px-1 animate-in slide-in-from-top-1">
                  <AlertCircle size={12} /> {phoneError}
                </p>
              )}
            </div>

            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  required
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-bold"
                  placeholder="e.g. John Doe"
                />
              </div>
              {patientHistory.length > 0 && !name && (
                <p className="mt-2 text-[10px] text-cyan-600 font-bold uppercase tracking-wider px-1">
                  Found existing patient record
                </p>
              )}
            </div>
          </div>

          <button 
            type="submit"
            className="w-full mt-8 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black py-5 rounded-2xl hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg shadow-cyan-100 flex items-center justify-center gap-2 text-lg uppercase tracking-wider"
          >
            Generate Token
          </button>
        </form>

        {/* Patient History Section */}
        {patientHistory.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-cyan-200 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center">
                  <History size={20} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Visit History</p>
                  <p className="text-sm font-bold text-slate-700">{patientHistory.length} Previous Visits</p>
                </div>
              </div>
              <ArrowRight size={20} className={`text-slate-300 transition-transform duration-300 ${showHistory ? 'rotate-90' : ''}`} />
            </button>

            {showHistory && (
              <div className="mt-3 space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {patientHistory.map((h, i) => (
                  <div key={h.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex flex-col items-center justify-center shadow-sm border border-slate-100">
                         <span className="text-[7px] font-black text-slate-400 uppercase leading-none mb-0.5">TKN</span>
                         <span className="text-lg font-black text-slate-800 leading-none">#{h.tokenNumber}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar size={12} className="text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{formatDate(h.registeredAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-slate-400" />
                          <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${
                            h.status === PatientStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            h.status === PatientStatus.CANCELLED ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
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

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default PatientRegistration;
