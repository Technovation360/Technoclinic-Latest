
import React, { useMemo } from 'react';
import { ClinicState, PatientStatus } from '../types';
import { Play, CheckCircle, LogOut, User, MapPin, Users } from 'lucide-react';

interface Props {
  state: ClinicState;
  onAssignCabin: (doctorId: string, cabinId: string | null) => void;
  onNextPatient: (patientId: string, status: PatientStatus, cabinId?: string, doctorId?: string) => void;
}

const DoctorDashboard: React.FC<Props> = ({ state, onAssignCabin, onNextPatient }) => {
  const currentDoctor = state.doctors[0];
  const activeCabin = state.cabins.find(c => c.currentDoctorId === currentDoctor.id);
  const currentPatient = state.patients.find(p => p.id === activeCabin?.currentPatientId);
  
  const waitingQueue = useMemo(() => 
    state.patients.filter(p => p.status === PatientStatus.WAITING).sort((a, b) => a.tokenNumber - b.tokenNumber),
    [state.patients]
  );

  const handleNext = () => {
    if (!activeCabin) return;
    if (currentPatient) {
      onNextPatient(currentPatient.id, PatientStatus.COMPLETED, activeCabin.id, currentDoctor.id);
    }
    if (waitingQueue.length > 0) {
      const next = waitingQueue[0];
      onNextPatient(next.id, PatientStatus.IN_PROGRESS, activeCabin.id, currentDoctor.id);
    }
  };

  const handleComplete = () => {
    if (!activeCabin || !currentPatient) return;
    onNextPatient(currentPatient.id, PatientStatus.COMPLETED, activeCabin.id, currentDoctor.id);
  };

  if (!activeCabin) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <header className="mb-10 text-center">
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Welcome, {currentDoctor.name}</h2>
          <p className="text-cyan-600 font-bold uppercase tracking-widest text-xs mt-2">{currentDoctor.specialization}</p>
        </header>

        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl text-center">
          <div className="w-16 h-16 bg-cyan-100 text-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MapPin size={32} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">Cabin Assignment</h3>
          <p className="text-slate-500 mb-10 max-w-sm mx-auto">Select an available cabin to start your session.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {state.cabins.map(cabin => {
              const isOccupied = !!cabin.currentDoctorId;
              return (
                <button
                  key={cabin.id}
                  disabled={isOccupied}
                  onClick={() => onAssignCabin(currentDoctor.id, cabin.id)}
                  className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 ${
                    isOccupied 
                      ? 'border-slate-50 bg-slate-50 cursor-not-allowed opacity-40' 
                      : 'border-slate-100 hover:border-cyan-500 hover:bg-cyan-50 text-slate-700 shadow-sm'
                  }`}
                >
                  <MapPin size={24} className={isOccupied ? 'text-slate-300' : 'text-cyan-600'} />
                  <span className="font-bold uppercase text-sm tracking-wide">{cabin.name}</span>
                  {isOccupied && <span className="text-[10px] uppercase font-black text-slate-400">In Use</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <header className="flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">{currentDoctor.name}</h2>
            <div className="flex items-center gap-2 text-cyan-600 font-bold uppercase tracking-widest text-xs mt-1">
              <MapPin size={14} /> Currently in {activeCabin.name}
            </div>
          </div>
          <button 
            onClick={() => onAssignCabin(currentDoctor.id, null)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-500 border border-slate-200 rounded-xl hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all font-bold text-xs uppercase"
          >
            <LogOut size={16} /> Exit Cabin
          </button>
        </header>

        <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden">
          <div className="p-10 bg-gradient-to-br from-cyan-600 to-blue-700 text-white">
            <h3 className="text-xs font-black opacity-80 uppercase tracking-[0.3em] mb-4">Current Session</h3>
            {currentPatient ? (
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-6xl font-black tracking-tighter mb-2">{currentPatient.name}</h4>
                  <p className="text-cyan-100 text-xl font-bold">Token #{currentPatient.tokenNumber}</p>
                </div>
                <div className="w-24 h-24 bg-white/10 rounded-[32px] flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
                  <User size={48} />
                </div>
              </div>
            ) : (
              <div className="text-4xl font-black italic opacity-40 py-4">Waiting to call next...</div>
            )}
          </div>
          
          <div className="p-10 flex gap-6 bg-white">
            {currentPatient ? (
              <>
                <button 
                  onClick={handleComplete}
                  className="flex-1 bg-emerald-600 text-white py-5 px-8 rounded-2xl font-black hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-100 uppercase tracking-widest text-sm"
                >
                  <CheckCircle size={20} /> Complete
                </button>
                <button 
                  onClick={handleNext}
                  className="flex-1 bg-cyan-50 text-cyan-700 py-5 px-8 rounded-2xl font-black hover:bg-cyan-100 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                >
                  <Play size={20} /> Call Next
                </button>
              </>
            ) : (
              <button 
                onClick={handleNext}
                disabled={waitingQueue.length === 0}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-8 rounded-[32px] font-black hover:from-cyan-700 hover:to-blue-700 disabled:from-slate-200 disabled:to-slate-200 disabled:cursor-not-allowed transition-all shadow-xl shadow-cyan-100 flex items-center justify-center gap-4 text-2xl uppercase tracking-[0.2em]"
              >
                <Play size={32} /> Start Next Consultation
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
          Waiting Lounge <span className="bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-[10px] font-black">{waitingQueue.length}</span>
        </h3>
        <div className="space-y-4 max-h-[calc(100vh-160px)] overflow-y-auto pr-2 custom-scrollbar">
          {waitingQueue.length === 0 ? (
            <div className="p-12 border-2 border-dashed border-slate-100 rounded-[40px] text-center text-slate-300 font-bold uppercase text-xs tracking-widest">
              Lounge Empty
            </div>
          ) : (
            waitingQueue.map(p => (
              <div key={p.id} className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 group hover:border-cyan-200 transition-all">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex flex-col items-center justify-center font-black text-slate-800 group-hover:bg-cyan-600 group-hover:text-white transition-all shadow-inner">
                  <span className="text-[8px] uppercase opacity-60 leading-none mb-0.5 font-black">TKN</span>
                  <span className="text-xl leading-none">#{p.tokenNumber}</span>
                </div>
                <div>
                  <div className="font-black text-slate-800 uppercase text-sm tracking-tight">{p.name}</div>
                  <div className="text-[10px] font-bold text-slate-400 mt-0.5">{p.phone}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
