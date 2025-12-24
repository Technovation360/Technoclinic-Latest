
import React, { useState, useEffect } from 'react';
import { Tenant } from '../types';
import Logo from './Logo';
import { 
  Building2, 
  Search, 
  ShieldAlert,
  ArrowUpRight,
  ChevronRight,
  Activity
} from 'lucide-react';
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
      if (saved) {
        setTenants(JSON.parse(saved));
      } else {
        setTenants([DEFAULT_TENANT]);
      }
    };
    
    loadTenants();
    window.addEventListener('storage', loadTenants);
    return () => window.removeEventListener('storage', loadTenants);
  }, []);

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-cyan-100/20 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 -z-10 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-blue-100/20 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 -z-10"></div>

      <div className="max-w-6xl w-full flex flex-col items-center">
        <header className="flex flex-col items-center text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
          <Logo size={110} className="mb-10 shadow-2xl hover:scale-105 transition-transform cursor-pointer ring-8 ring-white" />
          <h1 className="text-7xl font-black text-slate-900 tracking-tighter mb-4 leading-none">
            Techno<span className="text-cyan-600">Clinic</span>
          </h1>
          <p className="text-xl text-slate-500 font-medium max-w-2xl">
            The intelligent clinic queue network. Please select your facility node to proceed with management or check-in.
          </p>
        </header>

        <main className="bg-white rounded-[64px] shadow-2xl shadow-slate-200/60 border border-white p-10 md:p-16 w-full relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 mb-14 pb-14 border-b border-slate-100">
            <div>
              <h2 className="text-4xl font-black text-slate-800 flex items-center gap-4 mb-2 tracking-tight">
                <Building2 className="text-cyan-600" size={40} /> Facility Directory
              </h2>
              <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] ml-1">Search active medical nodes</p>
            </div>
            <div className="relative w-full md:w-[400px]">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={26} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
                className="w-full bg-slate-50 border border-slate-100 rounded-[32px] pl-16 pr-8 py-6 focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none font-bold text-slate-700 text-xl transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredTenants.length === 0 ? (
              <div className="col-span-full py-28 text-center flex flex-col items-center">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 border border-slate-100">
                   <Search size={40} className="text-slate-200" />
                </div>
                <p className="text-xl font-black uppercase tracking-[0.2em] text-slate-300">No facilities registered</p>
              </div>
            ) : (
              filteredTenants.map(t => (
                <button 
                  key={t.id}
                  onClick={() => onSelectTenant(t)}
                  className="group bg-slate-50 hover:bg-white hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] hover:-translate-y-3 rounded-[48px] p-10 transition-all duration-500 border border-slate-100 text-left flex flex-col justify-between h-72 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-cyan-600 shadow-sm group-hover:bg-cyan-600 group-hover:text-white transition-all duration-500 border border-slate-100">
                      <Building2 size={40} />
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-slate-200 group-hover:text-cyan-600 transition-colors shadow-sm">
                      <ArrowUpRight size={28} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-2 group-hover:text-cyan-700 transition-colors">{t.name}</h3>
                    <div className="flex items-center gap-3">
                       <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">{t.id}</p>
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-8 right-10 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-6 transition-all duration-500 flex items-center gap-2 text-cyan-600 font-black text-sm uppercase tracking-widest">
                    Enter Portal <ChevronRight size={18} />
                  </div>
                </button>
              ))
            )}
          </div>
        </main>
        
        <footer className="mt-20 flex flex-col md:flex-row items-center justify-between gap-12 px-12 w-full">
          <div className="flex items-center gap-10">
             <div className="flex flex-col">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] mb-3">System Status</p>
                <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
                   <Activity size={18} className="text-emerald-500" />
                   <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Infrastructure Healthy</span>
                </div>
             </div>
          </div>
          
          <button 
            onClick={onEnterAdmin}
            className="group flex items-center gap-5 px-10 py-6 bg-slate-900 text-white rounded-[32px] hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/20 active:scale-95"
          >
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-cyan-500 transition-colors">
              <ShieldAlert size={22} />
            </div>
            <div className="text-left">
               <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] leading-none mb-1.5">Administrative</p>
               <p className="text-lg font-black uppercase tracking-widest leading-none">Command Center Login</p>
            </div>
          </button>
        </footer>
      </div>

      <style>{`
        body { background-color: #f8fafc; overflow-x: hidden; }
      `}</style>
    </div>
  );
};

export default TenantPortal;
