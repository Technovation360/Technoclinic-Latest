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

  useEffect(() => {
    if (!currentTenant || !tenantStorageKey) {
      setState(null);
      return;
    }

    const initSupabaseSync = async () => {
      const patients = await fetchTokens(currentTenant.id);
      
      const docMappings: DoctorClinicMapping[] = JSON.parse(localStorage.getItem(STORAGE_KEY_MAPPINGS) || '[]');
      const globalDocs: Doctor[] = JSON.parse(localStorage.getItem(STORAGE_KEY_DOCTORS) || '[]');
      const mappedDoctorIds = docMappings
        .filter(m => m.clinicId === currentTenant.id && m.status === 'ACTIVE')
        .map(m => m.doctorId);
      
      const finalDoctors = globalDocs.filter(d => mappedDoctorIds.includes(d.id));

      const asstMappings: AssistantClinicMapping[] = JSON.parse(localStorage.getItem(STORAGE_KEY_ASSISTANT_MAPPINGS) || '[]');
      const globalAssts: Assistant[] = JSON.parse(localStorage.getItem(STORAGE_KEY_ASSISTANTS) || '[]');
      const mappedAsstIds = asstMappings
        .filter(m => m.clinicId === currentTenant.id && m.status === 'ACTIVE')
        .map(m => m.assistantId);
      
      const finalAssistants = globalAssts.filter(a => mappedAsstIds.includes(a.id));

      setState({
        tenant: currentTenant,
        patients,
        cabins: INITIAL_CABINS,
        doctors: finalDoctors,
        assistants: finalAssistants,
        videoUrls: [],
        lastTokenNumber: patients.length > 0 ? Math.max(...patients.map(p => p.tokenNumber)) : 0
      });
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

  const addPatient = async (name: string, phone: string) => {
    if (!state || !currentTenant) return {} as Patient;
    const newTokenNumber = state.lastTokenNumber + 1;
    const { data, error } = await supabase
      .from('tokens')
      .insert({ name, phone, token_number: newTokenNumber, status: PatientStatus.WAITING, clinic_id: currentTenant.id })
      .select().single();

    if (error) { alert('DB Error: ' + error.message); return {} as Patient; }

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
      .update({ status, cabin_id: cabinId || null, doctor_id: doctorId || null })
      .eq('id', patientId);

    if (error) { console.error(error); return; }

    setState(prev => prev ? ({
      ...prev,
      cabins: prev.cabins.map(c => c.id === cabinId ? { ...c, currentPatientId: status === PatientStatus.IN_PROGRESS ? patientId : undefined } : c)
    }) : null);
  };

  const renderRoleContent = () => {
    if (currentUserRole === Role.SUPER_ADMIN) {
      return (
        <SuperAdminDashboard 
          onLogout={() => setCurrentUserRole(null)} 
          onSelectTenant={(t) => { setCurrentTenant(t); setIsCommandCenterPath(false); setCurrentUserRole(Role.ADMIN); }}
        />
      );
    }
    if (!state) return null;
    switch (currentUserRole) {
      case Role.PATIENT: return <PatientRegistration onRegister={addPatient} state={state} />;
      case Role.DOCTOR: return (
        <DoctorDashboard 
          state={state} 
          onAssignCabin={(doctorId, cabinId) => setState(prev => prev ? ({ ...prev, cabins: prev.cabins.map(c => { if(c.currentDoctorId === doctorId) return {...c, currentDoctorId: undefined}; if(c.id === cabinId) return {...c, currentDoctorId: doctorId}; return c; }) }) : null)}
          onNextPatient={updatePatientStatus}
        />
      );
      case Role.ADMIN: return (
        <AdminDashboard 
          state={state} 
          onReset={async () => { await supabase.from('tokens').delete().eq('clinic_id', currentTenant?.id); setState(p => p?({...p, patients: [], lastTokenNumber: 0}):null); }} 
          onUpdateCabins={(cabins) => setState(p => p ? ({ ...p, cabins }) : null)} 
          onUpdateDoctors={(doctors) => setState(p => p ? ({ ...p, doctors }) : null)}
          onUpdateAssistants={(assistants) => setState(p => p ? ({ ...p, assistants }) : null)}
          onUpdateVideos={() => {}}
        />
      );
      case Role.ASSISTANT: return <AssistantDashboard state={state} onRegister={addPatient} onUpdateStatus={updatePatientStatus} />;
      case Role.TOKEN_SCREEN: return <TokenScreen state={state} />;
      default: return null;
    }
  };

  if (!currentUserRole) {
    return (
      <Login 
        onLogin={setCurrentUserRole} 
        clinicName={isCommandCenterPath ? "Command Center" : (currentTenant?.name || "Clinic")} 
        onBack={() => { setCurrentTenant(null); setCurrentUserRole(null); setIsCommandCenterPath(true); }}
        isSuperAdminPath={isCommandCenterPath}
      />
    );
  }

  if (currentUserRole === Role.TOKEN_SCREEN) return renderRoleContent();

  return (
    <div className="d-flex vh-100 overflow-hidden">
      {currentUserRole !== Role.PATIENT && (
        <aside className={`sidebar-wrapper d-flex flex-column ${isCollapsed ? 'sidebar-collapsed' : ''}`} style={{ transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          <div className="p-4 d-flex align-items-center gap-3 border-bottom" style={{ height: '80px' }}>
            <Logo size={40} />
            {!isCollapsed && <span className="fw-bold fs-5 text-dark">TechnoClinic</span>}
          </div>
          <nav className="flex-grow-1 pt-3">
            <a href="#" className="nav-link-custom active">
              <LayoutDashboard size={20} /> {!isCollapsed && <span>Dashboard</span>}
            </a>
            <a href="#" className="nav-link-custom">
              <UserRound size={20} /> {!isCollapsed && <span>Patients</span>}
            </a>
          </nav>
          <div className="p-3 border-top position-relative">
            <button onClick={() => setCurrentUserRole(null)} className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2">
              <LogOut size={18} /> {!isCollapsed && <span>Sign Out</span>}
            </button>
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="position-absolute top-0 start-100 translate-middle btn btn-sm btn-light border rounded-circle shadow-sm">
              {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </button>
          </div>
        </aside>
      )}

      <main className="flex-grow-1 d-flex flex-column overflow-hidden">
        {currentUserRole !== Role.PATIENT && (
          <header className="bg-white border-bottom px-4 d-flex align-items-center justify-content-between" style={{ height: '80px' }}>
            <div className="d-flex align-items-center gap-2">
              <Globe size={16} className="text-primary" />
              <span className="small fw-bold text-muted text-uppercase tracking-wider">{currentUrl}</span>
            </div>
            <div className="text-end">
              <div className="small fw-bold text-dark">{currentUserRole} SESSION</div>
              <div className="small text-success fw-bold text-uppercase" style={{ fontSize: '10px' }}>Secure Connection</div>
            </div>
          </header>
        )}
        <div className="flex-grow-1 overflow-auto bg-light">
          {renderRoleContent()}
        </div>
      </main>
    </div>
  );
};

export default App;