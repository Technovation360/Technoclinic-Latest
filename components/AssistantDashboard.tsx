import React, { useState } from 'react';
import { ClinicState, Patient, PatientStatus } from '../types';
import { Plus, Filter, XCircle, Search } from 'lucide-react';

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
    <div className="container-fluid py-4 px-md-5">
      <header className="row align-items-end mb-5 gy-3">
        <div className="col-md-8">
          <h2 className="h2 fw-bold text-dark mb-1">Queue Management</h2>
          <p className="text-muted fw-medium mb-0">Coordinating patient flow for {state.tenant.name}</p>
        </div>
        <div className="col-md-4 text-md-end">
          <div className="d-inline-flex align-items-center gap-2 bg-primary bg-opacity-10 text-primary px-4 py-2 rounded-pill fw-bold small">
            <span className="text-uppercase tracking-wider">Total Hub Load:</span>
            <span>{state.lastTokenNumber} Tokens</span>
          </div>
        </div>
      </header>

      <div className="row g-4">
        {/* Registration Form */}
        <div className="col-lg-4">
          <div className="card h-100 border-0 shadow-sm p-4">
            <h3 className="h6 fw-bold text-muted text-uppercase tracking-wider mb-4 d-flex align-items-center gap-2">
              <Plus size={18} className="text-primary" /> New Registration
            </h3>
            <form onSubmit={handleManualRegister} className="d-grid gap-3">
              <div>
                <label className="small fw-bold text-muted text-uppercase tracking-wider mb-2 d-block">Patient Name</label>
                <input 
                  required
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-control"
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label className="small fw-bold text-muted text-uppercase tracking-wider mb-2 d-block">Phone Number</label>
                <input 
                  required
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-control"
                  placeholder="Contact Number"
                />
              </div>
              <button 
                type="submit"
                className="btn btn-primary btn-lg mt-3 py-3 text-uppercase tracking-widest small fw-bold"
              >
                Add to Queue
              </button>
            </form>
          </div>
        </div>

        {/* Queue Table */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm overflow-hidden">
            <div className="card-header bg-white border-bottom p-4">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
                <div className="d-flex align-items-center gap-2">
                  <Filter size={18} className="text-muted me-1" />
                  <div className="btn-group btn-group-sm">
                    {['ALL', PatientStatus.WAITING, PatientStatus.IN_PROGRESS, PatientStatus.COMPLETED].map(opt => (
                      <button
                        key={opt}
                        onClick={() => setFilter(opt as any)}
                        className={`btn px-3 text-uppercase tracking-widest fw-bold ${filter === opt ? 'btn-primary' : 'btn-light text-muted'}`}
                      >
                        {opt === 'ALL' ? 'Total' : opt.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="table-responsive" style={{ maxHeight: '600px' }}>
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light sticky-top">
                  <tr className="small text-muted text-uppercase fw-bold tracking-wider">
                    <th className="px-4 py-3">Token</th>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-end">Action</th>
                  </tr>
                </thead>
                <tbody className="border-top-0">
                  {filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-5">
                        <p className="text-muted fw-bold text-uppercase small tracking-widest mb-0">No entries in this view</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map(p => (
                      <tr key={p.id}>
                        <td className="px-4">
                          <div className="bg-light rounded-3 d-flex align-items-center justify-content-center fw-bold text-dark" style={{ width: '40px', height: '40px' }}>
                            #{p.tokenNumber}
                          </div>
                        </td>
                        <td className="px-4">
                          <div className="fw-bold text-dark h6 mb-0">{p.name}</div>
                          <div className="small text-muted">{p.phone}</div>
                        </td>
                        <td className="px-4">
                          <span className={`badge rounded-pill px-3 py-2 fw-bold text-uppercase tracking-wider ${
                            p.status === PatientStatus.WAITING ? 'bg-warning text-dark' :
                            p.status === PatientStatus.IN_PROGRESS ? 'bg-primary' :
                            'bg-success'
                          }`} style={{ fontSize: '10px' }}>
                            {p.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 text-end">
                          {p.status === PatientStatus.WAITING && (
                            <button 
                              onClick={() => onUpdateStatus(p.id, PatientStatus.CANCELLED)}
                              className="btn btn-outline-danger border-0 p-2 rounded-3"
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
    </div>
  );
};

export default AssistantDashboard;