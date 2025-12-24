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
  Globe,
  Settings
} from 'lucide-react';

const App: React.FC = () => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCommandCenterPath, setIsCommandCenterPath] = useState(true);
  
  const currentUrl = useMemo(() => {
    if (isCommandCenterPath) return "hq.technoclinic.io";
    if (currentTenant) return `${currentTenant.id}.technoclinic.io`;
    return "technoclinic.io";
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

  const fetchTokens = useCallback(async (clinicId: string) => {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('token_number', { ascending: true });

    if (error) {
      console.error('DATABASE ERROR:', error.message || 'Unknown error fetching tokens', error);
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

  const addPatient = async (name: string, phone: string): Promise<Patient> => {
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
      console.error('Error adding patient:', error.message || error);
      alert('Failed to register patient in database. Please contact support.');
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
      console.error('Error updating patient status:', error.message || error);
      return;
    }

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
            onAssignCabin={(doctorId, cabinId) => setState(prev => prev ? ({
              ...prev,
              cabins: prev.cabins.map(c => {
                if (c.currentDoctorId === doctorId) return { ...c, currentDoctorId: undefined };
                if (c.id === cabinId) return { ...c, currentDoctorId: doctorId };
                return c;
              })
            }) : null)}
            onNextPatient={updatePatientStatus}
          />
        );
      case Role.ADMIN:
        return (
          <AdminDashboard 
            state={state} 
            onReset={async () => {
              if (!currentTenant) return;
              await supabase.from('tokens').delete().eq('clinic_id', currentTenant.id);
              setState(prev => prev ? ({...prev, patients: [], lastTokenNumber: 0}) : null);
            }} 
            onUpdateCabins={(cabins) => setState(p => p ? ({ ...p, cabins }) : null)} 
            onUpdateDoctors={(doctors) => setState(p => p ? ({ ...p, doctors }) : null)}
            onUpdateAssistants={(assistants) => setState(p => p ? ({ ...p, assistants }) : null)}
            onUpdateVideos={() => {}}
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
        clinicName={isCommandCenterPath ? "Global Command" : (currentTenant?.name || "Clinic")} 
        onBack={exitToCommandCenter}
        isSuperAdminPath={isCommandCenterPath}
      />
    );
  }

  if (currentUserRole === Role.TOKEN_SCREEN) {
    return (
      <div className="vh-100 bg-light position-relative">
        <button 
          onClick={handleLogout}
          className="position-fixed bottom-0 end-0 m-4 z-3 btn btn-light border shadow-sm opacity-50 hover-opacity-100 rounded-circle p-3"
          style={{ transition: 'opacity 0.2s' }}
        >
          <LogOut size={24} />
        </button>
        {renderRoleContent()}
      </div>
    );
  }

  return (
    <div className="d-flex vh-100 bg-light overflow-hidden">
      {currentUserRole !== Role.PATIENT && currentUserRole !== Role.SUPER_ADMIN && (
        <aside 
          className="bg-white border-end d-flex flex-column transition-all" 
          style={{ width: isCollapsed ? '80px' : '260px', transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          <div className="p-4 border-bottom d-flex align-items-center gap-3 overflow-hidden" style={{ height: '80px' }}>
            <Logo size={32} />
            {!isCollapsed && <span className="fw-bold text-dark fs-5 text-nowrap">TechnoClinic</span>}
          </div>
          
          <nav className="flex-grow-1 p-3 overflow-auto">
            <NavItem 
              active={true} 
              icon={<LayoutDashboard size={20} />} 
              label="Dashboard" 
              isCollapsed={isCollapsed} 
            />
            <NavItem 
              active={false} 
              icon={<Settings size={20} />} 
              label="Settings" 
              isCollapsed={isCollapsed} 
            />
          </nav>

          <div className="p-3 border-top position-relative">
            <button 
              onClick={handleLogout}
              className="btn btn-outline-danger w-100 d-flex align-items-center gap-3 border-0 py-3 text-start"
            >
              <LogOut size={20} />
              {!isCollapsed && <span>Sign Out</span>}
            </button>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="position-absolute top-0 start-100 translate-middle btn btn-white border shadow-sm rounded-circle p-1 d-flex align-items-center justify-content-center"
              style={{ width: '24px', height: '24px', zIndex: 10 }}
            >
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>
        </aside>
      )}

      <main className="flex-grow-1 d-flex flex-column overflow-hidden">
        {currentUserRole !== Role.PATIENT && currentUserRole !== Role.SUPER_ADMIN && (
          <header className="bg-white border-bottom px-4 d-flex align-items-center justify-content-between" style={{ height: '80px' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="p-2 bg-primary bg-opacity-10 rounded">
                <Globe size={18} className="text-primary" />
              </div>
              <div className="small fw-bold text-muted text-uppercase tracking-wider d-none d-sm-block">{currentUrl}</div>
            </div>
            <div className="text-end">
              <div className="small fw-bold text-dark lh-1 mb-1">{currentUserRole}</div>
              <div className="text-success small fw-bold text-uppercase tracking-wider" style={{ fontSize: '10px' }}>Active Session</div>
            </div>
          </header>
        )}
        <div className="flex-grow-1 overflow-auto">
          {renderRoleContent()}
        </div>
      </main>
    </div>
  );
};

const NavItem: React.FC<{ active: boolean; icon: React.ReactNode; label: string; isCollapsed: boolean }> = ({ active, icon, label, isCollapsed }) => (
  <div 
    className={`d-flex align-items-center gap-3 p-3 rounded-3 cursor-pointer mb-1 ${active ? 'bg-primary bg-opacity-10 text-primary fw-semibold' : 'text-muted hover-bg-light'}`}
    style={{ cursor: 'pointer' }}
  >
    <span className={active ? 'text-primary' : ''}>{icon}</span>
    {!isCollapsed && <span className="small text-nowrap">{label}</span>}
  </div>
);

export default App;