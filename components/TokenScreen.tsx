import React, { useEffect, useState, useMemo } from 'react';
import { ClinicState, PatientStatus } from '../types';
import { Monitor, Volume2, VolumeX, Hash, Clock } from 'lucide-react';
import Logo from './Logo';

interface Props {
  state: ClinicState;
}

const TokenScreen: React.FC<Props> = ({ state }) => {
  const [time, setTime] = useState(new Date());
  const [isAudio, setIsAudio] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const currentPatients = useMemo(() => 
    state.patients.filter(p => p.status === PatientStatus.IN_PROGRESS).sort((a,b) => b.registeredAt - a.registeredAt),
    [state.patients]
  );

  return (
    <div className="vh-100 bg-dark d-flex flex-column overflow-hidden text-white font-sans">
      <div className="d-flex flex-grow-1 overflow-hidden">
        {/* Left Side: Queue List */}
        <aside className="bg-white text-dark d-flex flex-column border-end shadow" style={{ width: '400px', zIndex: 10 }}>
          <div className="p-4 border-bottom d-flex align-items-center gap-3">
            <Logo size={48} />
            <div>
              <h1 className="h4 fw-black mb-0">Techno<span className="text-primary">Clinic</span></h1>
              <div className="small text-primary fw-bold text-uppercase" style={{ fontSize: '10px' }}>Waiting Lounge</div>
            </div>
          </div>
          <div className="flex-grow-1 p-4 overflow-auto custom-scrollbar">
            <h6 className="small fw-bold text-muted text-uppercase tracking-widest mb-4">Cabin Status</h6>
            <div className="d-grid gap-3">
              {state.cabins.map(cabin => {
                const patient = currentPatients.find(p => p.cabinId === cabin.id);
                return (
                  <div key={cabin.id} className={`card p-4 border-0 shadow-sm transition-all ${patient ? 'bg-primary bg-opacity-10' : 'bg-light'}`}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="small fw-bold text-muted text-uppercase mb-1" style={{ fontSize: '9px' }}>{cabin.name}</div>
                        <div className={`fw-bold text-uppercase ${patient ? 'text-primary' : 'text-secondary'}`}>
                          {patient ? patient.name : 'Ready'}
                        </div>
                      </div>
                      {patient && (
                        <div className="bg-primary text-white rounded-3 px-3 py-2 fw-black fs-4">#{patient.tokenNumber}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="p-4 bg-light border-top d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3 text-muted">
              <Clock size={20} />
              <div className="h5 fw-bold mb-0">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <button onClick={() => setIsAudio(!isAudio)} className={`btn btn-sm rounded-circle ${isAudio ? 'btn-outline-primary' : 'btn-outline-danger'}`}>
              {isAudio ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </aside>

        {/* Right Side: Visual Feed & Active Call */}
        <main className="flex-grow-1 position-relative bg-black d-flex flex-column">
          <div className="flex-grow-1 d-flex align-items-center justify-content-center opacity-50">
             <div className="text-center">
                <Monitor size={100} className="text-white opacity-10 mb-4" />
                <div className="display-4 fw-black text-white opacity-10 text-uppercase tracking-widest">Broadcast Feed</div>
             </div>
          </div>

          {/* Active Banner */}
          {currentPatients.length > 0 && (
            <div className="position-absolute bottom-0 start-0 end-0 p-5 bg-primary bg-gradient shadow-lg animate-up" style={{ borderRadius: '3rem 3rem 0 0' }}>
               <div className="container">
                 <div className="row align-items-center">
                    <div className="col-auto">
                       <div className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center display-1 fw-black shadow" style={{ width: '180px', height: '180px' }}>
                          #{currentPatients[0].tokenNumber}
                       </div>
                    </div>
                    <div className="col ps-5">
                       <div className="text-white text-uppercase small fw-black tracking-widest mb-2 opacity-75">Now Consulting</div>
                       <div className="display-3 fw-black text-white text-uppercase lh-1 mb-2">{currentPatients[0].name}</div>
                       <div className="h3 text-white-50 fw-bold">PROCEED TO {state.cabins.find(c => c.id === currentPatients[0].cabinId)?.name.toUpperCase()}</div>
                    </div>
                 </div>
               </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TokenScreen;