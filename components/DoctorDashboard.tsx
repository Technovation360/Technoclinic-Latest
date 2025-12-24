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
      <div className="container py-5">
        <header className="mb-5 text-center">
          <h2 className="display-6 fw-bold text-dark mb-2">Welcome, {currentDoctor.name}</h2>
          <p className="text-primary fw-bold text-uppercase tracking-widest small">{currentDoctor.specialization}</p>
        </header>

        <div className="card shadow-soft p-4 p-md-5 text-center mx-auto" style={{ maxWidth: '800px' }}>
          <div className="bg-primary bg-opacity-10 text-primary rounded-4 d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: '64px', height: '64px' }}>
            <MapPin size={32} />
          </div>
          <h3 className="h4 fw-bold text-dark mb-2">Cabin Assignment</h3>
          <p className="text-muted mb-5 mx-auto" style={{ maxWidth: '400px' }}>Select an available cabin to start your session.</p>
          
          <div className="row g-3">
            {state.cabins.map(cabin => {
              const isOccupied = !!cabin.currentDoctorId;
              return (
                <div key={cabin.id} className="col-6 col-md-3">
                  <button
                    disabled={isOccupied}
                    onClick={() => onAssignCabin(currentDoctor.id, cabin.id)}
                    className={`card h-100 p-4 d-flex flex-column align-items-center gap-3 border-2 transition-all ${
                      isOccupied 
                        ? 'bg-light border-light-subtle opacity-50 cursor-not-allowed' 
                        : 'bg-white border-light-subtle hover-border-primary hover-bg-primary-subtle text-dark shadow-sm'
                    }`}
                  >
                    <MapPin size={24} className={isOccupied ? 'text-muted' : 'text-primary'} />
                    <span className="small fw-bold text-uppercase tracking-wider">{cabin.name}</span>
                    {isOccupied && <span className="fw-bold text-muted text-uppercase" style={{ fontSize: '9px' }}>In Use</span>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row g-4">
        <div className="col-lg-8">
          <header className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-end gap-3 mb-4">
            <div>
              <h2 className="display-6 fw-bold text-dark mb-1">{currentDoctor.name}</h2>
              <div className="d-flex align-items-center gap-2 text-primary fw-bold text-uppercase tracking-widest small">
                <MapPin size={14} /> Currently in {activeCabin.name}
              </div>
            </div>
            <button 
              onClick={() => onAssignCabin(currentDoctor.id, null)}
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 fw-bold text-uppercase tracking-wider rounded-3"
            >
              <LogOut size={16} /> Exit Cabin
            </button>
          </header>

          <div className="card shadow border-0 rounded-5 overflow-hidden">
            <div className="card-header bg-primary text-white p-4 p-md-5 border-0">
              <p className="small fw-bold opacity-75 text-uppercase tracking-widest mb-3">Current Session</p>
              {currentPatient ? (
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h4 className="display-4 fw-bold tracking-tight mb-2">{currentPatient.name}</h4>
                    <p className="h4 fw-bold opacity-75">Token #{currentPatient.tokenNumber}</p>
                  </div>
                  <div className="bg-white bg-opacity-10 rounded-4 d-flex align-items-center justify-content-center backdrop-blur-sm border border-white border-opacity-25" style={{ width: '96px', height: '96px' }}>
                    <User size={48} />
                  </div>
                </div>
              ) : (
                <div className="h4 fw-bold text-white text-opacity-25 fst-italic py-4">Waiting to call next patient...</div>
              )}
            </div>
            
            <div className="card-body p-4 p-md-5 d-flex flex-column flex-sm-row gap-3">
              {currentPatient ? (
                <>
                  <button 
                    onClick={handleComplete}
                    className="btn btn-success flex-grow-1 py-4 px-4 fw-bold text-uppercase tracking-wider shadow-sm d-flex align-items-center justify-content-center gap-3"
                  >
                    <CheckCircle size={20} /> Complete
                  </button>
                  <button 
                    onClick={handleNext}
                    className="btn btn-primary bg-opacity-10 text-primary border-primary border-opacity-25 flex-grow-1 py-4 px-4 fw-bold text-uppercase tracking-wider d-flex align-items-center justify-content-center gap-3"
                  >
                    <Play size={20} /> Call Next
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleNext}
                  disabled={waitingQueue.length === 0}
                  className="btn btn-primary w-100 py-5 rounded-4 fw-bold shadow-lg d-flex align-items-center justify-content-center gap-4 display-6 text-uppercase tracking-widest"
                >
                  <Play size={32} /> Start Next
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <h3 className="small fw-bold text-muted text-uppercase tracking-widest d-flex align-items-center gap-3 mb-4">
            Waiting Lounge <span className="badge bg-primary rounded-pill px-3 py-1 fw-bold">{waitingQueue.length}</span>
          </h3>
          <div className="d-grid gap-3 custom-scrollbar overflow-auto pe-2" style={{ maxHeight: 'calc(100vh - 180px)' }}>
            {waitingQueue.length === 0 ? (
              <div className="card bg-light border-0 p-5 rounded-5 text-center text-muted fw-bold text-uppercase tracking-widest small">
                Lounge Empty
              </div>
            ) : (
              waitingQueue.map(p => (
                <div key={p.id} className="card p-3 border-light-subtle shadow-sm d-flex flex-row align-items-center gap-3 hover-border-primary transition-all rounded-4">
                  <div className="bg-light rounded-3 d-flex flex-column align-items-center justify-content-center fw-bold text-dark shadow-sm" style={{ width: '56px', height: '56px' }}>
                    <span className="fw-bold text-muted text-uppercase mb-0" style={{ fontSize: '8px' }}>TKN</span>
                    <span className="h5 fw-bold mb-0">#{p.tokenNumber}</span>
                  </div>
                  <div className="overflow-hidden">
                    <div className="fw-bold text-dark text-uppercase text-truncate">{p.name}</div>
                    <div className="small fw-bold text-muted">{p.phone}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;