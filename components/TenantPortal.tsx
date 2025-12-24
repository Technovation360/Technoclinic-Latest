import React, { useState, useEffect } from 'react';
import { Tenant } from '../types';
import Logo from './Logo';
import { Building2, Search, ShieldAlert, ArrowUpRight, ChevronRight, Activity } from 'lucide-react';
import { STORAGE_KEY_TENANTS, DEFAULT_TENANT } from '../constants';

interface Props {
  onSelectTenant: (tenant: Tenant) => void;
  onEnterAdmin: () => void;
}

const TenantPortal: React.FC<Props> = ({ onSelectTenant, onEnterAdmin }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadTenants = () => {
      const saved = localStorage.getItem(STORAGE_KEY_TENANTS);
      setTenants(saved ? JSON.parse(saved) : [DEFAULT_TENANT]);
    };
    loadTenants();
    window.addEventListener('storage', loadTenants);
    return () => window.removeEventListener('storage', loadTenants);
  }, []);

  const filteredTenants = tenants.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-vh-100 py-5 d-flex flex-column align-items-center position-relative overflow-hidden">
      <div className="container" style={{ maxWidth: '1100px' }}>
        <header className="text-center mb-5 animate-fade-in">
          <Logo size={100} className="mb-4 mx-auto" />
          <h1 className="display-4 fw-bold text-dark mb-2 tracking-tighter">Techno<span className="text-primary">Clinic</span></h1>
          <p className="lead text-muted mx-auto" style={{ maxWidth: '600px' }}>Select your facility node to enter the queue management system.</p>
        </header>

        <main className="card p-4 p-md-5 bg-white border-0 shadow-sm animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="row align-items-center mb-5 gy-4">
            <div className="col-md-7">
              <h2 className="h4 fw-bold mb-1 d-flex align-items-center gap-2">
                <Building2 size={24} className="text-primary" /> Facility Directory
              </h2>
              <p className="small text-muted text-uppercase fw-bold tracking-widest mb-0">Registered Hubs</p>
            </div>
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 px-3"><Search size={20} className="text-muted" /></span>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-control bg-light border-start-0"
                  placeholder="Filter nodes..."
                />
              </div>
            </div>
          </div>

          <div className="row g-4">
            {filteredTenants.length === 0 ? (
              <div className="text-center py-5">
                <div className="text-muted mb-3"><Search size={48} opacity={0.2} /></div>
                <p className="fw-bold text-muted">No matching facilities found</p>
              </div>
            ) : (
              filteredTenants.map(t => (
                <div key={t.id} className="col-md-6 col-lg-4">
                  <button 
                    onClick={() => onSelectTenant(t)}
                    className="card h-100 p-4 text-start w-100 bg-light border-0 hover-lift text-decoration-none"
                    style={{ transition: 'all 0.3s' }}
                  >
                    <div className="d-flex justify-content-between mb-4">
                      <div className="p-3 bg-white rounded-3 shadow-sm text-primary">
                        <Building2 size={32} />
                      </div>
                      <ArrowUpRight size={20} className="text-muted" />
                    </div>
                    <div>
                      <h3 className="h5 fw-bold text-dark mb-1">{t.name}</h3>
                      <div className="d-flex align-items-center gap-2">
                        <span className="small text-muted font-monospace">{t.id}</span>
                        <div className="bg-success rounded-circle" style={{ width: '6px', height: '6px' }}></div>
                      </div>
                    </div>
                  </button>
                </div>
              ))
            )}
          </div>
        </main>
        
        <footer className="mt-5 d-flex flex-column flex-md-row align-items-center justify-content-between gap-4">
          <div className="d-flex align-items-center gap-3">
            <div className="p-2 bg-white rounded-circle shadow-sm border"><Activity size={18} className="text-success" /></div>
            <span className="small fw-bold text-muted text-uppercase tracking-wider">Infrastructure: Healthy</span>
          </div>
          
          <button 
            onClick={onEnterAdmin}
            className="btn btn-dark btn-lg px-4 py-3 d-flex align-items-center gap-3 rounded-4 shadow"
          >
            <ShieldAlert size={20} className="text-primary" />
            <div className="text-start">
               <div className="small fw-bold opacity-50 lh-1 mb-1">Infrastructure</div>
               <div className="h6 mb-0 fw-bold">Command Center</div>
            </div>
          </button>
        </footer>
      </div>
      <style>{`
        .hover-lift:hover { transform: translateY(-5px); background: #fff !important; box-shadow: 0 1rem 3rem rgba(0,0,0,.08) !important; border: 1px solid rgba(13,110,253,.1) !important; }
      `}</style>
    </div>
  );
};

export default TenantPortal;