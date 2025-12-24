import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Role, Patient, Cabin, Doctor, ClinicState, PatientStatus, Assistant, Tenant, DoctorClinicMapping, AssistantClinicMapping } from './types';
import { 
  INITIAL_DOCTORS, 
  INITIAL_CABINS, 
  INITIAL_ASSISTANTS, 
  APP_STORAGE_KEY, 
  STORAGE_KEY_TENANTS,
  STORAGE_KEY_DOCTORS,
  STORAGE_KEY_ASSISTANTS,
  STORAGE_KEY_MAPPINGS,
  STORAGE_KEY_ASSISTANT_MAPPINGS,
  INITIAL_TENANTS 
} from './constants';
import { supabase } from './lib/supabase';
import PatientRegistration from './components/PatientRegistration';
import DoctorDashboard from './components/DoctorDashboard';
import AdminDashboard from './components/AdminDashboard';
import AssistantDashboard from './components/AssistantDashboard';
import TokenScreen from './components/TokenScreen';
import Login from './components/Login';
import Logo from './components/Logo';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import { 
  LayoutDashboard, 
  UserRound, 
  ClipboardList, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Building2,
  Globe
} from 'lucide-react';

const App: React.FC = () => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCommandCenterPath, setIsCommandCenterPath] = useState(true);
  
  const currentUrl = useMemo(() => {
    if (isCommandCenterPath) return "clinic.technovation360.in/command-center";
    if (currentTenant) return `clinic.technovation360.in/${currentTenant.id}`;
    return "clinic.technovation360.in/";
  }, [currentTenant, isCommandCenterPath]);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY_TENANTS)) {
      localStorage.setItem(STORAGE_KEY_TENANTS, JSON.stringify(INITIAL_TENANTS));
    }
    if (!localStorage.getItem(STORAGE_KEY_DOCTORS)) {
      localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(INITIAL_DOCTORS));
    }
    if (!localStorage.getItem(STORAGE_KEY_ASSISTANTS)) {
      localStorage.setItem(STORAGE_KEY_ASSISTANTS, JSON.stringify(INITIAL_ASSISTANTS));
    }
  }, []);

  const tenantStorageKey = useMemo(() => 
    currentTenant ? `${APP_STORAGE_KEY}_${currentTenant.id}` : null
  , [currentTenant]);

  const [state, setState] = useState<ClinicState | null>(null);

  // Helper to fetch tokens from Supabase
  const fetchTokens = useCallback(async (clinicId: string) => {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('token_number', { ascending: true });

    if (error) {
      console.error('Error fetching tokens:', error);
      return [];
    }

    return (data || []).map(d => ({
      id: d.id,
      tokenNumber: d.token_number,
      name: d.name,
      phone: d.phone,
      status: d.status as PatientStatus,
      cabinId: d.cabin_id,
      doctorId: d.doctor_id,
      registeredAt: new Date(d.created_at).getTime()
    }));
  }, []);

  // Load state when tenant changes and setup Realtime subscription
  useEffect(() => {
    if (!currentTenant || !tenantStorageKey) {
      setState(null);
      return;
    }

    const saved = localStorage.getItem(tenantStorageKey);
    const parsed = saved ? JSON.parse(saved) : null;
    
    const globalDocsRaw = localStorage.getItem(STORAGE_KEY_DOCTORS);
    const globalAsstsRaw = localStorage.getItem(STORAGE_KEY_ASSISTANTS);
    const docMappingsRaw = localStorage.getItem(STORAGE_KEY_MAPPINGS);
    const asstMappingsRaw = localStorage.getItem(STORAGE_KEY_ASSISTANT_MAPPINGS);

    const globalDocs: Doctor[] = globalDocsRaw ? JSON.parse(globalDocsRaw) : INITIAL_DOCTORS;
    const globalAssts: Assistant[] = globalAsstsRaw ? JSON.parse(globalAsstsRaw) : INITIAL_ASSISTANTS;
    const docMappings: DoctorClinicMapping[] = docMappingsRaw ? JSON.parse(docMappingsRaw) : [];
    const asstMappings: AssistantClinicMapping[] = asstMappingsRaw ? JSON.parse(asstMappingsRaw) : [];

    const mappedDoctorIds = docMappings
      .filter(m => m.clinicId === currentTenant.id && m.status === 'ACTIVE')
      .map(m => m.doctorId);
    
    const finalDoctors = globalDocs.filter(d => mappedDoctorIds.includes(d.id));

    const mappedAsstIds = asstMappings
      .filter(m => m.clinicId === currentTenant.id && m.status === 'ACTIVE')
      .map(m => m.assistantId);
    
    const finalAssistants = globalAssts.filter(a => mappedAsstIds.includes(a.id));

    const initSupabaseSync = async () => {
      const patients = await fetchTokens(currentTenant.id);
      const defaultState: ClinicState = {
        tenant: currentTenant,
        patients,
        cabins: INITIAL_CABINS,
        doctors: finalDoctors,
        assistants: finalAssistants,
        videoUrls: [],
        lastTokenNumber: patients.length > 0 ? Math.max(...patients.map(p => p.tokenNumber)) : 0
      };

      setState(parsed ? { 
        ...defaultState, 
        ...parsed, 
        tenant: currentTenant,
        doctors: finalDoctors,
        assistants: finalAssistants,
        patients
      } : defaultState);
    };

    initSupabaseSync();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`tokens_${currentTenant.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tokens', filter: `clinic_id=eq.${currentTenant.id}` }, async () => {
        const patients = await fetchTokens(currentTenant.id);
        setState(prev => prev ? ({
          ...prev,
          patients,
          lastTokenNumber: patients.length > 0 ? Math.max(...patients.map(p => p.tokenNumber)) : 0
        }) : null);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentTenant, tenantStorageKey, fetchTokens]);

  // Persistent non-database state (cabins)
  useEffect(() => {
    if (state && tenantStorageKey) {
      const { patients, ...otherState } = state; // Don't save patients array locally anymore
      localStorage.setItem(tenantStorageKey, JSON.stringify(otherState));
    }
  }, [state, tenantStorageKey]);

  const addPatient = async (name: string, phone: string) => {
    if (!state || !currentTenant) return {} as Patient;
    
    const newTokenNumber = state.lastTokenNumber + 1;
    const { data, error } = await supabase
      .from('tokens')
      .insert({
        name,
        phone,
        token_number: newTokenNumber,
        status: PatientStatus.WAITING,
        clinic_id: currentTenant.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding patient:', error);
      alert('Failed to register patient in database.');
      return {} as Patient;
    }

    return {
      id: data.id,
      tokenNumber: data.token_number,
      name: data.name,
      phone: data.phone,
      status: data.status as PatientStatus,
      registeredAt: new Date(data.created_at).getTime()
    };
  };

  const updatePatientStatus = async (patientId: string, status: PatientStatus, cabinId?: string, doctorId?: string) => {
    if (!currentTenant) return;

    const { error } = await supabase
      .from('tokens')
      .update({
        status,
        cabin_id: cabinId || null,
        doctor_id: doctorId || null
      })
      .eq('id', patientId);

    if (error) {
      console.error('Error updating patient status:', error);
      return;
    }

    // Local UI update for cabins occupancy
    setState(prev => prev ? ({
      ...prev,
      cabins: prev.cabins.map(c => {
        if (c.id === cabinId) {
          return { ...c, currentPatientId: status === PatientStatus.IN_PROGRESS ? patientId : undefined };
        }
        return c;
      })
    }) : null);
  };

  const assignDoctorToCabin = (doctorId: string, cabinId: string | null) => {
    setState(prev => prev ? ({
      ...prev,
      cabins: prev.cabins.map(c => {
        if (c.currentDoctorId === doctorId) return { ...c, currentDoctorId: undefined };
        if (c.id === cabinId) return { ...c, currentDoctorId: doctorId };
        return c;
      })
    }) : null);
  };

  const resetAll = async () => {
    if (!currentTenant) return;
    const { error } = await supabase
      .from('tokens')
      .delete()
      .eq('clinic_id', currentTenant.id);

    if (error) {
      console.error('Error resetting tokens:', error);
      return;
    }

    setState(prev => prev ? ({
      ...prev,
      patients: [],
      lastTokenNumber: 0,
    }) : null);
  };

  const handleLogout = () => {
    setCurrentUserRole(null);
  };

  const exitToCommandCenter = () => {
    setCurrentTenant(null);
    setCurrentUserRole(null);
    setIsCommandCenterPath(true);
    setState(null);
  };

  const renderRoleContent = () => {
    if (currentUserRole === Role.SUPER_ADMIN) {
      return (
        <SuperAdminDashboard 
          onLogout={handleLogout} 
          onSelectTenant={(t) => {
            setCurrentTenant(t);
            setIsCommandCenterPath(false);
            setCurrentUserRole(Role.ADMIN); 
          }}
        />
      );
    }

    if (!state) return null;

    switch (currentUserRole) {
      case Role.PATIENT:
        return <PatientRegistration onRegister={addPatient} state={state} />;
      case Role.DOCTOR:
        return (
          <DoctorDashboard 
            state={state} 
            onAssignCabin={assignDoctorToCabin}
            onNextPatient={updatePatientStatus}
          />
        );
      case Role.ADMIN:
        return (
          <AdminDashboard 
            state={state} 
            onReset={resetAll} 
            onUpdateCabins={(cabins) => setState(p => p ? ({ ...p, cabins }) : null)} 
            onUpdateDoctors={(doctors) => setState(p => p ? ({ ...p, doctors }) : null)}
            onUpdateAssistants={(assistants) => setState(p => p ? ({ ...p, assistants }) : null)}
            onUpdateVideos={() => {}} // Controlled by Super Admin now
          />
        );
      case Role.ASSISTANT:
        return <AssistantDashboard state={state} onRegister={addPatient} onUpdateStatus={updatePatientStatus} />;
      case Role.TOKEN_SCREEN:
        return <TokenScreen state={state} />;
      default:
        return null;
    }
  };

  if (!currentUserRole) {
    return (
      <Login 
        onLogin={setCurrentUserRole} 
        clinicName={isCommandCenterPath ? "Command Center" : (currentTenant?.name || "Clinic")} 
        onBack={exitToCommandCenter}
        isSuperAdminPath={isCommandCenterPath}
      />
    );
  }

  if (currentUserRole === Role.TOKEN_SCREEN) {
    return (
      <div className="relative h-screen">
        <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-600/20 z-50 flex items-center justify-center">
            <div className="bg-slate-900/40 text-[8px] font-bold text-white px-2 py-0.5 rounded-b-lg backdrop-blur-sm uppercase tracking-widest">{currentUrl}</div>
        </div>
        <button 
          onClick={handleLogout}
          className="fixed bottom-4 right-4 z-50 p-3 bg-slate-800/20 hover:bg-slate-800 text-slate-500 hover:text-white rounded-full transition-all border border-slate-700/50 opacity-0 hover:opacity-100"
          title="Logout Screen"
        >
          <LogOut size={20} />
        </button>
        {renderRoleContent()}
      </div>
    );
  }

  if (currentUserRole === Role.SUPER_ADMIN) {
    return (
      <div className="flex flex-col h-screen bg-slate-950">
        <div className="bg-slate-900 px-6 py-2 border-b border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            <div className="flex items-center gap-2"><Globe size={12}/> {currentUrl}</div>
            <div className="flex items-center gap-4">
                <span>Infrastructure: Operational</span>
                <span className="text-cyan-500">Master Mode</span>
            </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {renderRoleContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {currentUserRole !== Role.PATIENT && (
        <aside 
          className={`${
            isCollapsed ? 'w-20' : 'w-20 md:w-64'
          } bg-white border-r border-slate-200 flex flex-col shadow-sm transition-all duration-300 relative`}
        >
          <div className="p-4 md:p-6 border-b border-slate-100 flex items-center gap-3 h-24">
            <Logo size={40} className="shrink-0" />
            {!isCollapsed && (
              <div className="hidden md:block overflow-hidden">
                <h1 className="font-black text-lg text-slate-800 tracking-tight whitespace-nowrap leading-none">
                  {currentTenant?.name}
                </h1>
                <p className="text-[10px] text-cyan-600 font-bold uppercase tracking-widest mt-1">TechnoClinic</p>
              </div>
            )}
          </div>
          
          <nav className="flex-1 p-3 flex flex-col gap-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
              Menu
            </div>
            
            <RoleButton 
              active={true} 
              icon={
                currentUserRole === Role.ADMIN ? <LayoutDashboard size={20} /> :
                currentUserRole === Role.DOCTOR ? <UserRound size={20} /> :
                <ClipboardList size={20} />
              } 
              label={`${currentUserRole.charAt(0) + currentUserRole.slice(1).toLowerCase()} Portal`} 
              isCollapsed={isCollapsed} 
            />

            <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-2">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-slate-500 hover:bg-slate-50 font-medium"
                title={isCollapsed ? 'Sign Out' : ''}
              >
                <LogOut size={20} />
                {!isCollapsed && <span className="hidden md:block">Sign Out</span>}
              </button>
              <button 
                onClick={exitToCommandCenter}
                className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 font-medium"
                title={isCollapsed ? 'Switch Facility' : ''}
              >
                <Building2 size={20} />
                {!isCollapsed && <span className="hidden md:block">Command Center</span>}
              </button>
            </div>
          </nav>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-10 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-cyan-600 shadow-sm z-10 transition-colors hidden md:flex"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </aside>
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-slate-100 px-6 py-2 flex items-center justify-between text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">
            <div className="flex items-center gap-2"><Globe size={10} className="text-slate-200" /> {currentUrl}</div>
            <div>{currentUserRole} SESSION</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {renderRoleContent()}
        </div>
      </main>
    </div>
  );
};

const RoleButton: React.FC<{ active: boolean; icon: React.ReactNode; label: string; isCollapsed: boolean }> = ({ active, icon, label, isCollapsed }) => (
  <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${active ? 'bg-cyan-50 text-cyan-800 font-semibold border border-cyan-100' : 'text-slate-500'}`}>
    <span className={`${active ? 'text-cyan-600' : ''}`}>{icon}</span>
    {!isCollapsed && <span className="hidden md:block whitespace-nowrap overflow-hidden">{label}</span>}
  </div>
);

export default App;