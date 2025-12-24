import React, { useState, useMemo } from 'react';
import { ClinicState, Cabin, Doctor, Assistant, VerificationStatus, DoctorClinicMapping, AssistantClinicMapping, OperationTime, DoctorType, MappingStatus } from '../types';
import { STORAGE_KEY_MAPPINGS, STORAGE_KEY_ASSISTANT_MAPPINGS, STORAGE_KEY_DOCTORS, STORAGE_KEY_ASSISTANTS, INITIAL_DOCTORS, INITIAL_ASSISTANTS, SPECIALIZATIONS } from '../constants';
import { Settings, Plus, Trash2, Building2, AlertTriangle, UserRound, ClipboardList, Clock, ShieldCheck, Search, ChevronRight, CalendarDays } from 'lucide-react';

interface Props {
  state: ClinicState;
  onReset: () => void;
  onUpdateCabins: (cabins: Cabin[]) => void;
  onUpdateDoctors: (doctors: Doctor[]) => void;
  onUpdateAssistants: (assistants: Assistant[]) => void;
  onUpdateVideos: (videoUrls: string[]) => void;
}

type Tab = 'CABINS' | 'DOCTORS' | 'ASSISTANTS' | 'SYSTEM';

const AdminDashboard: React.FC<Props> = ({ state, onReset, onUpdateCabins, onUpdateDoctors, onUpdateAssistants }) => {
  const [activeTab, setActiveTab] = useState<Tab>('CABINS');
  const [newCabinName, setNewCabinName] = useState('');

  return (
    <div className="container-fluid py-4 px-md-5">
      <header className="row align-items-center mb-5 gy-3">
        <div className="col-md-8">
          <h2 className="h2 fw-bold text-dark mb-1">Clinic Operations</h2>
          <p className="text-muted fw-medium mb-0">Configuration node for {state.tenant.name}</p>
        </div>
      </header>

      <ul className="nav nav-pills mb-4 bg-white p-2 rounded-4 shadow-sm">
        <li className="nav-item">
          <button className={`nav-link fw-bold px-4 py-2 d-flex align-items-center gap-2 ${activeTab === 'CABINS' ? 'active' : 'text-muted'}`} onClick={() => setActiveTab('CABINS')}>
            <Building2 size={18} /> Cabins
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link fw-bold px-4 py-2 d-flex align-items-center gap-2 ${activeTab === 'DOCTORS' ? 'active' : 'text-muted'}`} onClick={() => setActiveTab('DOCTORS')}>
            <UserRound size={18} /> Doctors
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link fw-bold px-4 py-2 d-flex align-items-center gap-2 ${activeTab === 'ASSISTANTS' ? 'active' : 'text-muted'}`} onClick={() => setActiveTab('ASSISTANTS')}>
            <ClipboardList size={18} /> Staff
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link fw-bold px-4 py-2 d-flex align-items-center gap-2 ${activeTab === 'SYSTEM' ? 'active' : 'text-muted'}`} onClick={() => setActiveTab('SYSTEM')}>
            <Settings size={18} /> Control
          </button>
        </li>
      </ul>

      <div className="card border-0 shadow-sm p-4 p-md-5 bg-white min-vh-50">
        {activeTab === 'CABINS' && (
          <div className="animate-fade-in">
            <h3 className="h5 fw-bold text-dark mb-4">Cabin Infrastructure</h3>
            <div className="input-group mb-5 shadow-sm rounded-3 overflow-hidden" style={{ maxWidth: '500px' }}>
              <input 
                type="text" value={newCabinName} onChange={(e) => setNewCabinName(e.target.value)}
                className="form-control border-0 bg-light py-3 px-4"
                placeholder="Cabin Name (e.g. 101)"
              />
              <button 
                onClick={() => { if(newCabinName.trim()){ onUpdateCabins([...state.cabins, {id: crypto.randomUUID(), name: newCabinName.trim()}]); setNewCabinName(''); } }} 
                className="btn btn-primary px-4 fw-bold"
              >Add</button>
            </div>
            
            <div className="row g-3">
              {state.cabins.map(cabin => (
                <div key={cabin.id} className="col-md-4 col-lg-3">
                  <div className="card bg-light border-0 p-3 d-flex flex-row align-items-center justify-content-between hover-lift">
                    <span className="fw-bold text-dark text-uppercase tracking-wider">{cabin.name}</span>
                    <button onClick={() => onUpdateCabins(state.cabins.filter(c => c.id !== cabin.id))} className="btn btn-link text-danger p-0"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'DOCTORS' && (
          <div className="animate-fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="h5 fw-bold text-dark mb-0">Registered Practitioners</h3>
              <button className="btn btn-primary btn-sm px-3 fw-bold">Register Doctor</button>
            </div>
            <div className="row g-3">
              {state.doctors.map(doc => (
                <div key={doc.id} className="col-12">
                  <div className="card bg-light border-0 p-3 d-flex flex-row align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                       <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-3"><UserRound size={24} /></div>
                       <div>
                          <div className="fw-bold text-dark">{doc.name}</div>
                          <div className="small text-muted fw-bold text-uppercase tracking-wider" style={{ fontSize: '10px' }}>{doc.specialization}</div>
                       </div>
                    </div>
                    <button className="btn btn-outline-danger btn-sm border-0"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'SYSTEM' && (
          <div className="animate-fade-in text-center py-5">
            <div className="bg-danger bg-opacity-10 text-danger p-4 rounded-circle d-inline-block mb-4">
               <AlertTriangle size={48} />
            </div>
            <h3 className="h4 fw-bold text-dark mb-2">Emergency Reset</h3>
            <p className="text-muted mx-auto mb-4" style={{ maxWidth: '400px' }}>Wiping the queue will remove all active tokens and history. This action cannot be undone.</p>
            <button 
              onClick={() => { if(window.confirm("RESET?")) onReset(); }} 
              className="btn btn-danger px-5 py-3 fw-bold text-uppercase tracking-widest"
            >Wipe Queue Logs</button>
          </div>
        )}
      </div>
      <style>{`
        .min-vh-50 { min-height: 50vh; }
        .hover-lift:hover { background: #fff !important; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
      `}</style>
    </div>
  );
};

export default AdminDashboard;