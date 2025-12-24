
import React, { useState } from 'react';
import { ClinicState, Patient, PatientStatus } from '../types';
import { Plus, Filter, XCircle } from 'lucide-react';

interface Props {
  state: ClinicState;
  onRegister: (name: string, phone: string) => Patient;
  onUpdateStatus: (id: string, status: PatientStatus) => void;
}

const AssistantDashboard: React.FC<Props> = ({ state, onRegister, onUpdateStatus }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [filter, setFilter] = useState<PatientStatus | 'ALL'>('ALL');

  const handleManualRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    onRegister(name, phone);
    setName('');
    setPhone('');
  };

  const filteredPatients = state.patients.filter(p => filter === 'ALL' || p.status === filter).reverse();

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Assistant Panel</h2>
          <p className="text-slate-500 font-medium">Queue coordination & registration</p>
        </div>
        <div className="bg-cyan-50 text-cyan-700 px-6 py-2.5 rounded-2xl flex items-center gap-3 font-black border border-cyan-100 shadow-sm uppercase text-xs tracking-widest">
          Active Tokens: {state.lastTokenNumber}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
            <Plus size={16} className="text-cyan-600" /> New Registration
          </h3>
          <form onSubmit={handleManualRegister} className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">Patient Name</label>
              <input 
                required
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-bold"
                placeholder="Full Name"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">Phone Number</label>
              <input 
                required
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-bold"
                placeholder="Contact No."
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black py-5 rounded-2xl hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg shadow-cyan-100 uppercase tracking-widest text-sm"
            >
              Add to Queue
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between gap-4 overflow-x-auto bg-slate-50/30">
            <div className="flex items-center gap-2 min-w-max">
              <Filter size={16} className="text-slate-400 mr-2" />
              {[
                { label: 'All', val: 'ALL' },
                { label: 'Waiting', val: PatientStatus.WAITING },
                { label: 'Consulting', val: PatientStatus.IN_PROGRESS },
                { label: 'Done', val: PatientStatus.COMPLETED }
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setFilter(opt.val as any)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    filter === opt.val ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-100' : 'text-slate-400 hover:bg-white hover:text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-[9px] uppercase font-black tracking-[0.2em] border-b border-slate-50">
                  <th className="px-8 py-5">Token</th>
                  <th className="px-8 py-5">Patient</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-slate-300 font-bold uppercase text-[10px] tracking-[0.3em]">No Patients Found</td>
                  </tr>
                ) : (
                  filteredPatients.map(p => (
                    <tr key={p.id} className="hover:bg-cyan-50/20 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-black text-slate-800 group-hover:bg-cyan-100 transition-colors">#{p.tokenNumber}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="font-black text-slate-800 uppercase text-sm tracking-tight">{p.name}</div>
                        <div className="text-[10px] font-bold text-slate-400">{p.phone}</div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          p.status === PatientStatus.WAITING ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          p.status === PatientStatus.IN_PROGRESS ? 'bg-cyan-50 text-cyan-700 border-cyan-100' :
                          'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                          {p.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        {p.status === PatientStatus.WAITING && (
                          <button 
                            onClick={() => onUpdateStatus(p.id, PatientStatus.CANCELLED)}
                            className="p-2 text-slate-300 hover:text-rose-600 rounded-xl transition-all"
                            title="Cancel Token"
                          >
                            <XCircle size={20} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantDashboard;
