import React, { useState, useEffect, useMemo } from 'react';
import { Tenant, Doctor, Assistant, VerificationStatus, OperationTime, DoctorClinicMapping, AssistantClinicMapping, DoctorType, MappingStatus } from '../types';
import { supabase } from '../lib/supabase';
import { 
  STORAGE_KEY_TENANTS, 
  STORAGE_KEY_DOCTORS, 
  STORAGE_KEY_ASSISTANTS, 
  STORAGE_KEY_MAPPINGS, 
  STORAGE_KEY_ASSISTANT_MAPPINGS,
  SPECIALIZATIONS
} from '../constants';
import { 
  Plus, 
  Trash2, 
  Building2, 
  Search, 
  LogOut, 
  X,
  ShieldAlert,
  ExternalLink,
  Users,
  UserRound,
  ClipboardList,
  Layers,
  Edit2,
  Clock,
  PlusCircle,
  Stethoscope,
  Briefcase,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  UserPlus,
  AlertCircle as AlertIcon,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Mail,
  Info,
  Video,
  ArrowRightCircle,
  ChevronRight,
  Globe,
  Trash
} from 'lucide-react';

interface Props {
  onLogout: () => void;
  onSelectTenant: (tenant: Tenant) => void;
}

type AdminView = 'DIRECTORY' | 'ADVERTISERS' | 'VIDEO_ADS';
type DirectoryTab = 'CLINICS' | 'DOCTORS' | 'ASSISTANTS';

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TimeSelect: React.FC<{ value: string; onChange: (v: string) => void; options: string[]; width?: string }> = ({ value, onChange, options, width = "w-14" }) => (
  <select 
    value={value} 
    onChange={e => onChange(e.target.value)}
    className={`bg-slate-900 border border-slate-800 rounded-lg px-1 py-1.5 text-[10px] font-bold text-white outline-none focus:ring-1 focus:ring-cyan-500 appearance-none ${width} text-center cursor-pointer hover:bg-slate-800 transition-colors`}
  >
    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
  </select>
);

const SuperAdminDashboard: React.FC<Props> = ({ onLogout, onSelectTenant }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [globalDoctors, setGlobalDoctors] = useState<Doctor[]>([]);
  const [globalAssistants, setGlobalAssistants] = useState<Assistant[]>([]);
  const [mappings, setMappings] = useState<DoctorClinicMapping[]>([]);
  const [assistantMappings, setAssistantMappings] = useState<AssistantClinicMapping[]>([]);
  const [ads, setAds] = useState<{id: string, url: string, clinic_id: string}[]>([]);
  
  const [activeView, setActiveView] = useState<AdminView>('DIRECTORY');
  const [activeDirTab, setActiveDirTab] = useState<DirectoryTab>('CLINICS');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedClinicId, setExpandedClinicId] = useState<string | null>(null);

  // Modals state
  const [showClinicModal, setShowClinicModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showAssistantModal, setShowAssistantModal] = useState(false);
  const [showEditFacilityModal, setShowEditFacilityModal] = useState<Tenant | null>(null);
  const [showMappingModal, setShowMappingModal] = useState<Tenant | null>(null);
  const [showAsstMappingModal, setShowAsstMappingModal] = useState<Tenant | null>(null);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  
  // Verification state
  const [verifyingPerson, setVerifyingPerson] = useState<{ id: string, mobile: string, name: string, type: 'DOCTOR' | 'ASSISTANT' } | null>(null);
  const [otpValue, setOtpValue] = useState('');

  // Form states (Create/Edit)
  const [clinicForm, setClinicForm] = useState({ 
    name: '', address: '', phone: '', email: '', city: '', state: '', pincode: '' 
  });
  
  const [editFacilityForm, setEditFacilityForm] = useState({ 
    name: '', address: '', phone: '', email: '', city: '', state: '', pincode: '' 
  });

  const [doctorForm, setDoctorForm] = useState({
    name: '', mobile: '', email: '', specialization: ''
  });
  const [doctorSpecSearch, setDoctorSpecSearch] = useState('');
  const [showDoctorSpecDropdown, setShowDoctorSpecDropdown] = useState(false);

  const [assistantForm, setAssistantForm] = useState({
    name: '', mobile: '', email: ''
  });

  // Mapping Form State
  const [mappingForm, setMappingForm] = useState({
    doctorId: '',
    doctorType: DoctorType.CONSULTING,
    timings: [] as OperationTime[]
  });

  const [asstMappingForm, setAsstMappingForm] = useState({
    assistantId: '',
    timings: [] as OperationTime[]
  });

  // Search results for mappings
  const [personSearch, setPersonSearch] = useState('');

  // Temp shift editor state
  const [tempSlot, setTempSlot] = useState({
    selectedDays: [] as string[],
    startH: '10',
    startM: '00',
    startP: 'AM',
    endH: '01',
    endM: '00',
    endP: 'PM'
  });

  useEffect(() => {
    const savedTenants = localStorage.getItem(STORAGE_KEY_TENANTS);
    if (savedTenants) setTenants(JSON.parse(savedTenants));

    const savedDocs = localStorage.getItem(STORAGE_KEY_DOCTORS);
    if (savedDocs) setGlobalDoctors(JSON.parse(savedDocs));

    const savedAssts = localStorage.getItem(STORAGE_KEY_ASSISTANTS);
    if (savedAssts) setGlobalAssistants(JSON.parse(savedAssts));

    const savedMappings = localStorage.getItem(STORAGE_KEY_MAPPINGS);
    if (savedMappings) setMappings(JSON.parse(savedMappings));

    const savedAsstMappings = localStorage.getItem(STORAGE_KEY_ASSISTANT_MAPPINGS);
    if (savedAsstMappings) setAssistantMappings(JSON.parse(savedAsstMappings));
    
    fetchAds();
  }, []);

  const fetchAds = async () => {
    const { data } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
    if (data) setAds(data);
  };

  const handleAddAd = async () => {
    if (!newVideoUrl.trim()) return;
    const { error } = await supabase.from('ads').insert({ url: newVideoUrl, clinic_id: 'GLOBAL' });
    if (!error) {
      setNewVideoUrl('');
      fetchAds();
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!window.confirm("Remove this advertisement?")) return;
    const { error } = await supabase.from('ads').delete().eq('id', id);
    if (!error) fetchAds();
  };

  const saveTenants = (updated: Tenant[]) => {
    setTenants(updated);
    localStorage.setItem(STORAGE_KEY_TENANTS, JSON.stringify(updated));
  };

  const saveDoctors = (updated: Doctor[]) => {
    setGlobalDoctors(updated);
    localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(updated));
  };

  const saveAssistants = (updated: Assistant[]) => {
    setGlobalAssistants(updated);
    localStorage.setItem(STORAGE_KEY_ASSISTANTS, JSON.stringify(updated));
  };

  const saveMappings = (updated: DoctorClinicMapping[]) => {
    setMappings(updated);
    localStorage.setItem(STORAGE_KEY_MAPPINGS, JSON.stringify(updated));
  };

  const saveAssistantMappings = (updated: AssistantClinicMapping[]) => {
    setAssistantMappings(updated);
    localStorage.setItem(STORAGE_KEY_ASSISTANT_MAPPINGS, JSON.stringify(updated));
  };

  const handleClinicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = clinicForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const tenant: Tenant = {
      id: slug, 
      ...clinicForm,
      specialties: [],
      operationTimings: [],
      isTokenBased: true,
      isAppointmentBased: false,
      createdAt: Date.now(),
      allowMediaAccess: true
    };
    saveTenants([...tenants, tenant]);
    setShowClinicModal(false);
    setClinicForm({ name: '', address: '', phone: '', email: '', city: '', state: '', pincode: '' });
  };

  const handleEditFacilitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditFacilityModal) return;
    const updated = tenants.map(t => t.id === showEditFacilityModal.id ? { ...t, ...editFacilityForm } : t);
    saveTenants(updated);
    setShowEditFacilityModal(null);
  };

  const handleOpenEditFacility = (tenant: Tenant) => {
    setEditFacilityForm({
      name: tenant.name,
      address: tenant.address,
      city: tenant.city,
      state: tenant.state,
      pincode: tenant.pincode,
      phone: tenant.phone || '',
      email: tenant.email || ''
    });
    setShowEditFacilityModal(tenant);
  };

  const handleDoctorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mobileDigits = doctorForm.mobile.replace(/\D/g, '');
    if (mobileDigits.length < 10) return alert('Invalid Mobile');
    
    if (globalDoctors.some(d => d.mobile === mobileDigits)) {
      alert("Doctor with this mobile number already exists in global registry.");
      return;
    }

    if (!doctorForm.specialization) {
      alert("Please select a specialization.");
      return;
    }
    
    const newDoctor: Doctor = {
      id: crypto.randomUUID(),
      name: doctorForm.name,
      mobile: mobileDigits,
      email: doctorForm.email,
      specialization: doctorForm.specialization,
      verificationStatus: VerificationStatus.UNVERIFIED,
      createdAt: Date.now(),
      source: 'Command Center'
    };
    saveDoctors([...globalDoctors, newDoctor]);
    setShowDoctorModal(false);
    setDoctorForm({ name: '', mobile: '', email: '', specialization: '' });
    setDoctorSpecSearch('');
    setVerifyingPerson({ id: newDoctor.id, mobile: newDoctor.mobile, name: newDoctor.name, type: 'DOCTOR' });
  };

  const handleAssistantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mobileDigits = assistantForm.mobile.replace(/\D/g, '');
    if (mobileDigits.length < 10) return alert('Invalid Mobile');
    
    if (globalAssistants.some(a => a.mobile === mobileDigits)) {
      alert("Assistant with this mobile number already exists in global registry.");
      return;
    }
    
    const newAssistant: Assistant = {
      id: crypto.randomUUID(),
      name: assistantForm.name,
      mobile: mobileDigits,
      email: assistantForm.email,
      verificationStatus: VerificationStatus.UNVERIFIED,
      createdAt: Date.now(),
      source: 'Command Center'
    };
    saveAssistants([...globalAssistants, newAssistant]);
    setShowAssistantModal(false);
    setAssistantForm({ name: '', mobile: '', email: '' });
    setVerifyingPerson({ id: newAssistant.id, mobile: newAssistant.mobile, name: newAssistant.name, type: 'ASSISTANT' });
  };

  const handleOtpVerify = () => {
    if (otpValue === '1234') {
      if (!verifyingPerson) return;
      if (verifyingPerson.type === 'DOCTOR') {
        const updated = globalDoctors.map(d => d.id === verifyingPerson.id ? { ...d, verificationStatus: VerificationStatus.VERIFIED } : d);
        saveDoctors(updated);
      } else {
        const updated = globalAssistants.map(a => a.id === verifyingPerson.id ? { ...a, verificationStatus: VerificationStatus.VERIFIED } : a);
        saveAssistants(updated);
      }
      setVerifyingPerson(null);
      setOtpValue('');
    } else {
      alert("Invalid OTP code. Use 1234.");
    }
  };

  const openMapping = (tenant: Tenant) => {
    setShowMappingModal(tenant);
    setPersonSearch('');
    setMappingForm({ doctorId: '', doctorType: DoctorType.CONSULTING, timings: [] });
    setTempSlot({ selectedDays: [], startH: '10', startM: '00', startP: 'AM', endH: '01', endM: '00', endP: 'PM' });
  };

  const openAsstMapping = (tenant: Tenant) => {
    setShowAsstMappingModal(tenant);
    setPersonSearch('');
    setAsstMappingForm({ assistantId: '', timings: [] });
    setTempSlot({ selectedDays: [], startH: '10', startM: '00', startP: 'AM', endH: '01', endM: '00', endP: 'PM' });
  };

  const handleAddMapping = () => {
    if (!showMappingModal || !mappingForm.doctorId) return;
    if (mappings.some(m => m.clinicId === showMappingModal.id && m.doctorId === mappingForm.doctorId)) return alert("Already mapped.");

    const newMapping: DoctorClinicMapping = {
      id: crypto.randomUUID(),
      clinicId: showMappingModal.id,
      doctorId: mappingForm.doctorId,
      doctorType: DoctorType.CONSULTING,
      timings: mappingForm.timings,
      status: MappingStatus.ACTIVE,
      createdAt: Date.now()
    };
    saveMappings([...mappings, newMapping]);
    setMappingForm({ doctorId: '', doctorType: DoctorType.CONSULTING, timings: [] });
    setShowMappingModal(null);
  };

  const handleAddAssistantMapping = () => {
    if (!showAsstMappingModal || !asstMappingForm.assistantId) return;
    if (assistantMappings.some(m => m.clinicId === showAsstMappingModal.id && m.assistantId === asstMappingForm.assistantId)) return alert("Already mapped.");

    const newMapping: AssistantClinicMapping = {
      id: crypto.randomUUID(),
      clinicId: showAsstMappingModal.id,
      assistantId: asstMappingForm.assistantId,
      timings: asstMappingForm.timings,
      status: MappingStatus.ACTIVE,
      createdAt: Date.now()
    };
    saveAssistantMappings([...assistantMappings, newMapping]);
    setAsstMappingForm({ assistantId: '', timings: [] });
    setShowAsstMappingModal(null);
  };

  const removeMapping = (id: string) => {
    if (window.confirm("Remove mapping?")) saveMappings(mappings.filter(m => m.id !== id));
  };

  const removeAssistantMapping = (id: string) => {
    if (window.confirm("Remove mapping?")) saveAssistantMappings(assistantMappings.filter(m => m.id !== id));
  };

  const toggleDay = (day: string) => {
    setTempSlot(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day) 
        ? prev.selectedDays.filter(d => d !== day) 
        : [...prev.selectedDays, day]
    }));
  };

  const addSlotToMapping = (type: 'DOCTOR' | 'ASSISTANT') => {
    if (tempSlot.selectedDays.length === 0) {
      alert("Please select at least one day (Mon-Sun) before adding a shift.");
      return;
    }
    const startTimeStr = `${tempSlot.startH}:${tempSlot.startM} ${tempSlot.startP}`;
    const endTimeStr = `${tempSlot.endH}:${tempSlot.endM} ${tempSlot.endP}`;

    const newTiming: OperationTime = { 
      days: tempSlot.selectedDays.join(', '), 
      startTime: startTimeStr,
      endTime: endTimeStr,
      specialty: 'Shift' 
    };
    if (type === 'DOCTOR') {
      setMappingForm(prev => ({ ...prev, timings: [...prev.timings, newTiming] }));
    } else {
      setAsstMappingForm(prev => ({ ...prev, timings: [...prev.timings, newTiming] }));
    }
    setTempSlot(prev => ({ ...prev, selectedDays: [] }));
  };

  const toggleExpandClinic = (id: string) => {
    setExpandedClinicId(expandedClinicId === id ? null : id);
  };

  const filteredTenants = tenants.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredDoctors = globalDoctors.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.mobile.includes(searchQuery));
  const filteredAssistants = globalAssistants.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.mobile.includes(searchQuery));

  const filteredDoctorSpecs = useMemo(() => {
    if (!doctorSpecSearch) return SPECIALIZATIONS;
    return SPECIALIZATIONS.filter(s => s.toLowerCase().includes(doctorSpecSearch.toLowerCase()));
  }, [doctorSpecSearch]);

  const searchResults = useMemo(() => {
    if (!personSearch || personSearch.length < 2) return [];
    if (showMappingModal) return globalDoctors.filter(d => d.name.toLowerCase().includes(personSearch.toLowerCase()) || d.mobile.includes(personSearch)).slice(0, 5);
    if (showAsstMappingModal) return globalAssistants.filter(a => a.name.toLowerCase().includes(personSearch.toLowerCase()) || a.mobile.includes(personSearch)).slice(0, 5);
    return [];
  }, [personSearch, globalDoctors, globalAssistants, showMappingModal, showAsstMappingModal]);

  return (
    <div className="h-full bg-slate-950 text-slate-100 flex overflow-hidden font-sans">
      <aside className="w-72 bg-[#020617] border-r border-slate-900 flex flex-col z-30">
        <div className="p-8 border-b border-slate-900 flex items-center gap-4">
          <div className="p-2.5 bg-cyan-600 rounded-xl shadow-lg shadow-cyan-900/40">
            <ShieldAlert size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-white leading-none">Command Center</h2>
            <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-[0.2em] mt-1">Infrastructure</p>
          </div>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          <NavButton active={activeView === 'DIRECTORY'} icon={<Layers size={20} />} label="Directory" onClick={() => setActiveView('DIRECTORY')} />
          <NavButton active={activeView === 'ADVERTISERS'} icon={<Users size={20} />} label="Advertisers" onClick={() => setActiveView('ADVERTISERS')} />
          <NavButton active={activeView === 'VIDEO_ADS'} icon={<Video size={20} />} label="Video Ads" onClick={() => setActiveView('VIDEO_ADS')} />
        </nav>
        <div className="p-6 border-t border-slate-900">
           <button onClick={onLogout} className="w-full flex items-center gap-4 p-4 rounded-2xl text-slate-500 hover:text-rose-500 transition-all font-black uppercase text-[10px] tracking-widest">
             <LogOut size={18} /> Logout Command
           </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden bg-[#020617]">
        <header className="px-10 py-10 flex items-center justify-between border-b border-slate-900/50">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">
            {activeView === 'DIRECTORY' ? 'Clinic Directory' : activeView === 'ADVERTISERS' ? 'Brand Partnerships' : 'Media Operations'}
          </h1>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search registry..."
              className="bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-6 py-3.5 text-xs focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 w-80"
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {activeView === 'DIRECTORY' && (
            <div className="space-y-12">
              <div className="inline-flex bg-slate-900/40 p-1.5 rounded-[24px] border border-slate-900">
                <button onClick={() => setActiveDirTab('CLINICS')} className={`flex items-center gap-2.5 px-8 py-3.5 rounded-[18px] font-black uppercase text-[10px] tracking-widest transition-all ${activeDirTab === 'CLINICS' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                  <Building2 size={16} /> Clinics
                </button>
                <button onClick={() => setActiveDirTab('DOCTORS')} className={`flex items-center gap-2.5 px-8 py-3.5 rounded-[18px] font-black uppercase text-[10px] tracking-widest transition-all ${activeDirTab === 'DOCTORS' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                  <UserRound size={16} /> Doctors
                </button>
                <button onClick={() => setActiveDirTab('ASSISTANTS')} className={`flex items-center gap-2.5 px-8 py-3.5 rounded-[18px] font-black uppercase text-[10px] tracking-widest transition-all ${activeDirTab === 'ASSISTANTS' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                  <ClipboardList size={16} /> Assistants
                </button>
              </div>

              <div className="bg-slate-900/20 border border-slate-900 rounded-[32px] overflow-hidden shadow-2xl">
                {activeDirTab === 'CLINICS' && (
                  <>
                    <div className="p-8 border-b border-slate-900 flex justify-between items-center bg-slate-900/10">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Facility Nodes</h3>
                      <button onClick={() => setShowClinicModal(true)} className="bg-cyan-600 hover:bg-cyan-500 text-white font-black px-6 py-3 rounded-2xl transition-all uppercase text-[10px] tracking-widest flex items-center gap-2"><Plus size={18} /> New Clinic</button>
                    </div>
                    <table className="w-full text-left">
                      <thead className="bg-slate-900/30 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        <tr>
                          <th className="px-10 py-6 w-12 text-center"></th>
                          <th className="px-10 py-6">Clinic Node</th>
                          <th className="px-10 py-6 text-center">Status</th>
                          <th className="px-10 py-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/50 text-slate-300">
                        {filteredTenants.map(t => (
                          <React.Fragment key={t.id}>
                            <tr className="hover:bg-slate-800/10 transition-colors group">
                              <td className="px-4 py-8 text-center">
                                <button onClick={() => toggleExpandClinic(t.id)} className={`p-2 rounded-xl transition-all ${expandedClinicId === t.id ? 'bg-cyan-600/20 text-cyan-500' : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800'}`}>
                                  {expandedClinicId === t.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                              </td>
                              <td className="px-10 py-8">
                                <div className="font-black text-white text-lg uppercase tracking-tight">{t.name}</div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-wider">{t.city}, {t.state}</div>
                              </td>
                              <td className="px-10 py-8 text-center"><span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-3 py-1 rounded-full uppercase border border-emerald-500/20">Active</span></td>
                              <td className="px-10 py-8 text-right">
                                <div className="flex justify-end items-center gap-3">
                                  <button onClick={() => handleOpenEditFacility(t)} className="p-2.5 bg-slate-800/50 text-emerald-500 rounded-xl hover:bg-emerald-600 hover:text-white transition-all border border-slate-800" title="Edit Facility"><Edit2 size={16} /></button>
                                  <button onClick={() => openMapping(t)} className="p-2.5 bg-slate-800/50 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-slate-800" title="Map Doctors"><Stethoscope size={16} /></button>
                                  <button onClick={() => openAsstMapping(t)} className="p-2.5 bg-slate-800/50 text-amber-500 rounded-xl hover:bg-amber-600 hover:text-white transition-all border border-slate-800" title="Map Assistants"><UserPlus size={16} /></button>
                                  <button onClick={() => onSelectTenant(t)} className="p-2.5 bg-slate-800/50 text-white rounded-xl hover:bg-cyan-600 transition-all border border-slate-800"><ExternalLink size={16} /></button>
                                </div>
                              </td>
                            </tr>
                            {expandedClinicId === t.id && (
                              <tr className="bg-slate-900/30 animate-in slide-in-from-top-4 duration-300">
                                <td colSpan={4} className="px-10 py-12">
                                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                                    <div className="space-y-6">
                                      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                                        <div className="p-2 bg-cyan-600/10 text-cyan-500 rounded-lg"><Info size={16} /></div>
                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Intelligence</h4>
                                      </div>
                                      <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                          <MapPin size={16} className="text-slate-600 mt-1" />
                                          <p className="text-xs font-bold text-slate-300 leading-relaxed">{t.address}, {t.city}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <Phone size={16} className="text-slate-600" />
                                          <p className="text-xs font-bold text-slate-300">{t.phone || 'N/A'}</p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="space-y-6">
                                      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                                        <div className="p-2 bg-blue-600/10 text-blue-500 rounded-lg"><Stethoscope size={16} /></div>
                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Practitioners</h4>
                                      </div>
                                      <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                                        {mappings.filter(m => m.clinicId === t.id).map(m => {
                                          const doc = globalDoctors.find(d => d.id === m.doctorId);
                                          return <div key={m.id} className="text-xs font-bold text-slate-300 bg-slate-800/30 p-3 rounded-xl border border-slate-800">{doc?.name}</div>
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
                {activeDirTab === 'DOCTORS' && (
                  <>
                    <div className="p-8 border-b border-slate-900 flex justify-between items-center bg-slate-900/10">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Doctor Registry</h3>
                      <button onClick={() => setShowDoctorModal(true)} className="bg-cyan-600 hover:bg-cyan-500 text-white font-black px-6 py-3 rounded-2xl uppercase text-[10px] tracking-widest flex items-center gap-2"><Plus size={18} /> New Doctor</button>
                    </div>
                    <table className="w-full text-left">
                      <thead className="bg-slate-900/30 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        <tr>
                          <th className="px-10 py-6">Practioner Name</th>
                          <th className="px-10 py-6">Mobile</th>
                          <th className="px-10 py-6">Specialization</th>
                          <th className="px-10 py-6">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/50 text-slate-300">
                        {filteredDoctors.map(d => (
                          <tr key={d.id} className="hover:bg-slate-800/10">
                            <td className="px-10 py-8 font-black text-white uppercase text-lg">{d.name}</td>
                            <td className="px-10 py-8 font-mono text-slate-500 text-sm tracking-widest">{d.mobile}</td>
                            <td className="px-10 py-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d.specialization}</td>
                            <td className="px-10 py-8"><span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${d.verificationStatus === VerificationStatus.VERIFIED ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>{d.verificationStatus}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            </div>
          )}

          {activeView === 'VIDEO_ADS' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="bg-slate-900/40 border border-slate-800 rounded-[32px] p-8">
                 <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tight">Global Broadcast Feed</h3>
                 <div className="flex gap-4">
                    <div className="relative flex-1">
                       <Video className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                       <input 
                         type="text" value={newVideoUrl} onChange={e => setNewVideoUrl(e.target.value)}
                         placeholder="Paste YouTube Video URL (e.g. https://youtube.com/watch?v=...)"
                         className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-sm focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200"
                       />
                    </div>
                    <button onClick={handleAddAd} className="bg-cyan-600 hover:bg-cyan-500 text-white font-black px-10 py-4 rounded-2xl transition-all uppercase text-[10px] tracking-widest shadow-lg shadow-cyan-900/20">Add Video</button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {ads.map(ad => (
                    <div key={ad.id} className="bg-slate-900/20 border border-slate-800 rounded-[32px] overflow-hidden group hover:border-cyan-500/30 transition-all">
                       <div className="aspect-video bg-black relative">
                          <iframe 
                            className="w-full h-full opacity-60 group-hover:opacity-100 transition-opacity"
                            src={`https://www.youtube.com/embed/${ad.url.includes('v=') ? ad.url.split('v=')[1].split('&')[0] : ad.url.split('/').pop()}?controls=0&mute=1`}
                            frameBorder="0"
                          ></iframe>
                          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950 to-transparent"></div>
                       </div>
                       <div className="p-6 flex items-center justify-between">
                          <div className="overflow-hidden">
                             <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-1">{ad.clinic_id}</p>
                             <p className="text-xs font-bold text-slate-400 truncate">{ad.url}</p>
                          </div>
                          <button onClick={() => handleDeleteAd(ad.id)} className="p-3 text-slate-700 hover:text-rose-500 transition-colors"><Trash size={18} /></button>
                       </div>
                    </div>
                 ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Register Doctor Modal */}
      {showDoctorModal && (
        <Modal title="Register Global Doctor" onClose={() => setShowDoctorModal(false)}>
          <form onSubmit={handleDoctorSubmit} className="space-y-4">
            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Full Name</label><input required type="text" value={doctorForm.name} onChange={e => setDoctorForm({...doctorForm, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-blue-500 text-sm font-bold text-white" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Mobile</label><input required type="tel" maxLength={10} value={doctorForm.mobile} onChange={e => setDoctorForm({...doctorForm, mobile: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 outline-none text-sm font-bold text-white" /></div>
              <div className="space-y-1.5 relative">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Specialization</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input 
                    required autoComplete="off"
                    value={doctorSpecSearch || doctorForm.specialization} 
                    onFocus={() => setShowDoctorSpecDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDoctorSpecDropdown(false), 200)}
                    onChange={e => {
                      setDoctorSpecSearch(e.target.value);
                      setShowDoctorSpecDropdown(true);
                      if (doctorForm.specialization) setDoctorForm({...doctorForm, specialization: ''});
                    }} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-1 focus:ring-blue-500 text-sm font-bold text-white shadow-sm" 
                    placeholder="Search..." 
                  />
                  {showDoctorSpecDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[110] max-h-48 overflow-y-auto overflow-x-hidden custom-scrollbar py-2 border-t-0 animate-in slide-in-from-top-2">
                       {filteredDoctorSpecs.map(s => (
                         <button key={s} type="button" onClick={() => { setDoctorForm({...doctorForm, specialization: s}); setDoctorSpecSearch(s); setShowDoctorSpecDropdown(false); }} className="w-full px-4 py-2 text-left hover:bg-slate-800 font-black text-slate-300 uppercase tracking-tight text-xs border-b border-slate-800/50 last:border-0 flex items-center justify-between group">
                           {s} <ChevronRight size={12} className="text-slate-600 group-hover:text-blue-500 transition-colors" />
                         </button>
                       ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-xl uppercase tracking-widest text-[11px] hover:bg-blue-500 transition-all flex items-center justify-center gap-2 mt-2">Initialize Practitioner <ArrowRight size={16} /></button>
          </form>
        </Modal>
      )}

      {/* Mapping Modal Doctor */}
      {showMappingModal && (
        <Modal title={`Map Doctors: ${showMappingModal.name}`} onClose={() => setShowMappingModal(null)}>
           <div className="space-y-8 max-h-[80vh] overflow-y-auto pr-1 custom-scrollbar">
              <section className="bg-slate-900/30 p-6 rounded-[32px] border border-slate-800 space-y-4">
                <div className="space-y-1 relative">
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">Search Doctor</label>
                  {!mappingForm.doctorId ? (
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                      <input type="text" placeholder="Type name or phone..." value={personSearch} onChange={e => setPersonSearch(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 outline-none text-sm font-bold text-white" />
                      {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                           {searchResults.map((d: any) => (
                             <button key={d.id} onClick={() => { setMappingForm({...mappingForm, doctorId: d.id}); setPersonSearch(''); }} className="w-full px-4 py-3 text-left hover:bg-slate-800 border-b border-slate-800 last:border-0 flex items-center justify-between group">
                                <div><p className="font-black text-white uppercase tracking-tight text-xs">{d.name}</p><p className="text-[9px] font-bold text-slate-500">{d.mobile} • {d.specialization}</p></div>
                                <UserCheck size={16} className="text-blue-500" />
                             </button>
                           ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 ring-1 ring-blue-500/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600/10 text-blue-500 rounded-lg"><UserRound size={16} /></div>
                        <p className="font-black text-white uppercase tracking-tight text-xs">{globalDoctors.find(d => d.id === mappingForm.doctorId)?.name}</p>
                      </div>
                      <button onClick={() => setMappingForm({...mappingForm, doctorId: ''})} className="text-[9px] font-black text-rose-500 hover:underline uppercase px-2 py-1">Change</button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                   <div className="flex flex-wrap gap-1.5">
                      {DAYS_SHORT.map(day => (
                        <button key={day} onClick={() => toggleDay(day)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${tempSlot.selectedDays.includes(day) ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-900/40' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'}`}>
                          {day}
                        </button>
                      ))}
                   </div>
                   <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                         <span className="text-[8px] font-black text-slate-500 uppercase">From</span>
                         <div className="flex gap-1">
                            <TimeSelect value={tempSlot.startH} onChange={v => setTempSlot({...tempSlot, startH: v})} options={['09','10','11','12','01','02','03','04','05','06','07','08']} />
                            <TimeSelect value={tempSlot.startM} onChange={v => setTempSlot({...tempSlot, startM: v})} options={['00','15','30','45']} />
                            <TimeSelect value={tempSlot.startP} onChange={v => setTempSlot({...tempSlot, startP: v})} options={['AM','PM']} width="w-16" />
                         </div>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-[8px] font-black text-slate-500 uppercase">Till</span>
                         <div className="flex gap-1">
                            <TimeSelect value={tempSlot.endH} onChange={v => setTempSlot({...tempSlot, endH: v})} options={['09','10','11','12','01','02','03','04','05','06','07','08']} />
                            <TimeSelect value={tempSlot.endM} onChange={v => setTempSlot({...tempSlot, endM: v})} options={['00','15','30','45']} />
                            <TimeSelect value={tempSlot.endP} onChange={v => setTempSlot({...tempSlot, endP: v})} options={['AM','PM']} width="w-16" />
                         </div>
                      </div>
                      <button onClick={() => addSlotToMapping('DOCTOR')} className="w-full bg-slate-800 hover:bg-slate-700 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-cyan-500">Add Shift</button>
                   </div>
                   {mappingForm.timings.map((t, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg border border-slate-800">
                         <div className="flex items-center gap-2">
                           <span className="text-[8px] font-black text-cyan-600 uppercase bg-cyan-600/10 px-1.5 py-0.5 rounded">{t.days}</span>
                           <span className="text-[9px] font-bold text-slate-200">{t.startTime} - {t.endTime}</span>
                         </div>
                         <button onClick={() => setMappingForm(prev => ({...prev, timings: prev.timings.filter((_, idx) => idx !== i)}))} className="text-slate-700 hover:text-rose-500 p-0.5"><X size={12} /></button>
                      </div>
                   ))}
                </div>
                <button onClick={handleAddMapping} disabled={!mappingForm.doctorId || mappingForm.timings.length === 0} className={`w-full font-black py-4 rounded-xl uppercase tracking-widest text-[11px] transition-all ${(!mappingForm.doctorId || mappingForm.timings.length === 0) ? 'bg-slate-900 text-slate-700 cursor-not-allowed' : 'bg-blue-600 text-white shadow-xl shadow-blue-900/20'}`}>Map Practitioner</button>
              </section>
           </div>
        </Modal>
      )}

      {verifyingPerson && (
        <Modal title="Safety Verification" onClose={() => setVerifyingPerson(null)}>
          <div className="space-y-6 text-center">
             <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto"><ShieldCheck size={32} /></div>
             <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Verify {verifyingPerson.name}</h3>
                <p className="text-[10px] text-slate-500 font-medium">Enter <span className="underline">1234</span> for demo verification.</p>
             </div>
             <input autoFocus maxLength={4} value={otpValue} onChange={e => setOtpValue(e.target.value.replace(/\D/g, ''))} className="w-48 mx-auto bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-4xl text-center font-black tracking-[0.4em] focus:ring-1 focus:ring-emerald-500 outline-none text-white" />
             <button onClick={handleOtpVerify} className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[11px] hover:bg-emerald-500 transition-all">Verify & Activate</button>
          </div>
        </Modal>
      )}

      {showClinicModal && (
        <Modal title="Initialize Clinic Node" onClose={() => setShowClinicModal(false)}>
          <form onSubmit={handleClinicSubmit} className="space-y-4">
            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Facility Name</label><input required value={clinicForm.name} onChange={e => setClinicForm({...clinicForm, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-cyan-500" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">City</label><input required value={clinicForm.city} onChange={e => setClinicForm({...clinicForm, city: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none" /></div>
              <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">State</label><input required value={clinicForm.state} onChange={e => setClinicForm({...clinicForm, state: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none" /></div>
            </div>
            <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 rounded-xl uppercase tracking-widest text-[11px] transition-all mt-4">Initialize Facility</button>
          </form>
        </Modal>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 font-black uppercase text-[10px] tracking-widest ${active ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
    {icon} <span>{label}</span>
  </button>
);

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-300">
    <div className="bg-[#0f172a] w-full max-w-lg rounded-[32px] border border-slate-800 p-8 relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95">
      <header className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-white">{title}</h2>
          <button onClick={onClose} className="p-2 text-slate-600 hover:text-white transition-colors bg-slate-900/50 rounded-xl"><X size={20} /></button>
      </header>
      {children}
    </div>
  </div>
);

export default SuperAdminDashboard;