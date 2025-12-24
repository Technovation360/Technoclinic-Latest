import React, { useState, useEffect, useMemo } from 'react';
import { Tenant, Doctor, Assistant, VerificationStatus, OperationTime, DoctorClinicMapping, AssistantClinicMapping, DoctorType, MappingStatus } from '../types';
import { STORAGE_KEY_TENANTS, STORAGE_KEY_DOCTORS } from '../constants';
import { Plus, Building2, Search, ShieldAlert, Globe, Activity, ShieldCheck, LogOut, MapPin, ArrowUpRight } from 'lucide-react';

interface Props {
  onLogout: () => void;
  onSelectTenant: (tenant: Tenant) => void;
}

type AdminView = 'DIRECTORY' | 'NETWORK';

const SuperAdminDashboard: React.FC<Props> = ({ onLogout, onSelectTenant }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeView, setActiveView] = useState<AdminView>('DIRECTORY');
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TENANTS);
    if (saved) setTenants(JSON.parse(saved));
  }, []);

  const filteredTenants = useMemo(() => 
    tenants.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())), 
  [tenants, searchQuery]);

  return (
    <div className="vh-100 d-flex flex-column bg-light overflow-hidden">
      <header className="bg-dark text-white px-4 d-flex align-items-center justify-content-between shrink-0 shadow" style={{ height: '80px' }}>
        <div className="d-flex align-items-center gap-4">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 bg-primary rounded"><ShieldAlert size={20} /></div>
            <h1 className="h6 fw-bold mb-0 text-uppercase tracking-wider">Command Center</h1>
          </div>
          <nav className="nav nav-pills small ms-4">
            <button className={`nav-link text-uppercase tracking-widest fw-bold py-2 ${activeView === 'DIRECTORY' ? 'active bg-primary' : 'text-white-50'}`} onClick={() => setActiveView('DIRECTORY')}>Nodes</button>
            <button className={`nav-link text-uppercase tracking-widest fw-bold py-2 ${activeView === 'NETWORK' ? 'active bg-primary' : 'text-white-50'}`} onClick={() => setActiveView('NETWORK')}>Health</button>
          </nav>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="d-none d-sm-flex align-items-center gap-2 px-3 py-1 bg-success bg-opacity-25 rounded-pill">
             <div className="bg-success rounded-circle" style={{ width: '8px', height: '8px' }}></div>
             <span className="small fw-bold text-success text-uppercase">Network Online</span>
          </div>
          <button onClick={onLogout} className="btn btn-outline-danger border-0"><LogOut size={20} /></button>
        </div>
      </header>

      <main className="flex-grow-1 overflow-auto p-4 p-md-5">
        <div className="container" style={{ maxWidth: '1200px' }}>
          {activeView === 'DIRECTORY' && (
            <div className="animate-fade-in">
              <div className="row align-items-end mb-5 gy-4">
                <div className="col-md-7">
                  <h2 className="display-6 fw-bold text-dark mb-1">Clinic Infrastructure</h2>
                  <p className="text-muted fw-medium">Monitor and manage global facility nodes.</p>
                </div>
                <div className="col-md-5">
                  <div className="d-flex gap-2">
                    <div className="input-group">
                      <span className="input-group-text bg-white"><Search size={18} className="text-muted" /></span>
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter directory..."
                        className="form-control"
                      />
                    </div>
                    <button className="btn btn-primary d-flex align-items-center gap-2 px-4"><Plus size={18} /> New</button>
                  </div>
                </div>
              </div>

              <div className="row g-4">
                {filteredTenants.map(tenant => (
                  <div key={tenant.id} className="col-md-6 col-lg-4">
                    <div className="card h-100 p-4 border-0 shadow-sm hover-shadow transition-all" style={{ cursor: 'pointer' }} onClick={() => onSelectTenant(tenant)}>
                      <div className="d-flex justify-content-between align-items-start mb-4">
                        <div className="p-3 bg-light rounded-4 text-primary"><Building2 size={28} /></div>
                        <ArrowUpRight size={18} className="text-muted" />
                      </div>
                      <div className="mb-4">
                        <h3 className="h5 fw-bold text-dark mb-1">{tenant.name}</h3>
                        <div className="small text-muted d-flex align-items-center gap-1"><MapPin size={12} /> {tenant.city}, {tenant.state}</div>
                      </div>
                      <div className="mt-auto pt-4 border-top d-flex align-items-center justify-content-between">
                         <div className="small fw-bold text-primary text-uppercase tracking-widest">Manage Node</div>
                         <div className="badge bg-success-subtle text-success border border-success border-opacity-25 rounded-pill">Active</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'NETWORK' && (
            <div className="animate-fade-in">
              <div className="row g-4 mb-5">
                 <div className="col-md-4"><StatCard icon={<Globe size={24}/>} label="Global Nodes" value="3" color="primary" /></div>
                 <div className="col-md-4"><StatCard icon={<Activity size={24}/>} label="Avg. Latency" value="24ms" color="success" /></div>
                 <div className="col-md-4"><StatCard icon={<ShieldCheck size={24}/>} label="Integrity" value="100%" color="dark" /></div>
              </div>
              <div className="card border-0 shadow-sm overflow-hidden">
                 <div className="card-header bg-light border-bottom p-3 fw-bold text-uppercase small tracking-widest text-muted">System Events</div>
                 <div className="list-group list-group-flush">
                    <LogItem title="Facility Sync Success" node="Hub 01" time="2m ago" />
                    <LogItem title="Security Token Refresh" node="Command" time="15m ago" />
                 </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <style>{`
        .hover-shadow:hover { box-shadow: 0 1rem 3rem rgba(0,0,0,.1) !important; transform: translateY(-3px); }
      `}</style>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string }> = ({ icon, label, value, color }) => (
  <div className="card border-0 shadow-sm p-4">
    <div className={`text-${color} mb-3`}>{icon}</div>
    <div className="small fw-bold text-muted text-uppercase tracking-widest mb-1">{label}</div>
    <div className="h2 fw-bold text-dark mb-0">{value}</div>
  </div>
);

const LogItem: React.FC<{ title: string; node: string; time: string }> = ({ title, node, time }) => (
  <div className="list-group-item p-3 d-flex align-items-center justify-content-between">
    <div className="d-flex align-items-center gap-3">
       <div className="bg-success rounded-circle" style={{ width: '8px', height: '8px' }}></div>
       <div>
          <div className="fw-bold text-dark small">{title}</div>
          <div className="text-muted text-uppercase fw-bold" style={{ fontSize: '10px' }}>{node}</div>
       </div>
    </div>
    <span className="small text-muted fw-bold">{time}</span>
  </div>
);

export default SuperAdminDashboard;