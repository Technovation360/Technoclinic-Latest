import React, { useState, useMemo } from 'react';
import { 
  ClinicState, 
  Cabin, 
  Doctor, 
  Assistant, 
  VerificationStatus, 
  DoctorClinicMapping, 
  AssistantClinicMapping, 
  OperationTime,
  DoctorType,
  MappingStatus
} from '../types';
import { 
  STORAGE_KEY_MAPPINGS, 
  STORAGE_KEY_ASSISTANT_MAPPINGS,
  STORAGE_KEY_DOCTORS,
  STORAGE_KEY_ASSISTANTS,
  INITIAL_DOCTORS,
  INITIAL_ASSISTANTS,
  SPECIALIZATIONS
} from '../constants';
import Logo from './Logo';
import { 
  Settings, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Building2, 
  AlertTriangle, 
  UserRound, 
  ClipboardList, 
  Edit2, 
  Check, 
  X,
  Lock,
  Clock,
  Briefcase,
  PlusCircle,
  AlertCircle as AlertIcon,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Phone,
  ShieldCheck,
  Search
} from 'lucide-react';

interface Props {
  state: ClinicState;
  onReset: () => void;
  onUpdateCabins: (cabins: Cabin[]) => void;
  onUpdateDoctors: (doctors: Doctor[]) => void;
  onUpdateAssistants: (assistants: Assistant[]) => void;
  onUpdateVideos: (videoUrls: string[]) => void;
}

type Tab = 'CABINS' | 'DOCTORS' | 'ASSISTANTS' | 'SYSTEM';

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TimeSelect: React.FC<{ value: string; onChange: (v: string) => void; options: string[]; width?: string }> = ({ value, onChange, options, width = "w-14" }) => (
  <select 
    value={value} 
    onChange={e => onChange(e.target.value)}
    className={`bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none ${width} text-center cursor-pointer hover:bg-slate-100 transition-all`}
  >
    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
  </select>
);

const AdminDashboard: React.FC<Props> = ({ state, onReset, onUpdateCabins, onUpdateDoctors, onUpdateAssistants, onUpdateVideos }) => {
  const [activeTab, setActiveTab] = useState<Tab>('CABINS');
  
  const [newCabinName, setNewCabinName] = useState('');

  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showAddAssistantModal, setShowAddAssistantModal] = useState(false);
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);

  // Verification State
  const [verifyingStaff, setVerifyingStaff] = useState<{ id: string, name: string, type: 'DOCTOR' | 'ASSISTANT' } | null>(null);
  const [otpValue, setOtpValue] = useState('');

  const [doctorForm, setDoctorForm] = useState({ name: '', mobile: '', specialization: '' });
  const [specSearch, setSpecSearch] = useState('');
  const [showSpecDropdown, setShowSpecDropdown] = useState(false);

  const [assistantForm, setAssistantForm] = useState({ name: '', mobile: '' });
  
  const [tempSlot, setTempSlot] = useState({
    selectedDays: [] as string[],
    startH: '10', startM: '00', startP: 'AM',
    endH: '01', endM: '00', endP: 'PM'
  });

  const [timingsBuffer, setTimingsBuffer] = useState<OperationTime[]>([]);

  const filteredSpecs = useMemo(() => {
    if (!specSearch) return SPECIALIZATIONS;
    return SPECIALIZATIONS.filter(s => s.toLowerCase().includes(specSearch.toLowerCase()));
  }, [specSearch]);

  const mappings = useMemo(() => {
    const raw = localStorage.getItem(STORAGE_KEY_MAPPINGS);
    return raw ? (JSON.parse(raw) as DoctorClinicMapping[]) : [];
  }, [state.doctors, showAddDoctorModal]);

  const assistantMappings = useMemo(() => {
    const raw = localStorage.getItem(STORAGE_KEY_ASSISTANT_MAPPINGS);
    return raw ? (JSON.parse(raw) as AssistantClinicMapping[]) : [];
  }, [state.assistants, showAddAssistantModal]);

  const handleRegisterDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorForm.name || !doctorForm.mobile || !doctorForm.specialization || timingsBuffer.length === 0) {
      if (!doctorForm.specialization) alert("Please select a specialization.");
      return;
    }
    
    const globalDocsRaw = localStorage.getItem(STORAGE_KEY_DOCTORS);
    const globalDocs: Doctor[] = globalDocsRaw ? JSON.parse(globalDocsRaw) : INITIAL_DOCTORS;
    
    let existingDoc = globalDocs.find(d => d.mobile === doctorForm.mobile);
    let finalDoc: Doctor;

    if (existingDoc) {
      finalDoc = existingDoc;
    } else {
      finalDoc = {
        id: crypto.randomUUID(),
        name: doctorForm.name,
        mobile: doctorForm.mobile,
        specialization: doctorForm.specialization,
        verificationStatus: VerificationStatus.UNVERIFIED,
        createdAt: Date.now(),
        source: state.tenant.name
      };
      localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify([...globalDocs, finalDoc]));
    }
    
    const existingMappingsRaw = localStorage.getItem(STORAGE_KEY_MAPPINGS);
    const existingMappings: DoctorClinicMapping[] = existingMappingsRaw ? JSON.parse(existingMappingsRaw) : [];
    
    const hasMapping = existingMappings.some(m => m.clinicId === state.tenant.id && m.doctorId === finalDoc.id);

    if (!hasMapping) {
      const newMapping: DoctorClinicMapping = {
          id: crypto.randomUUID(),
          clinicId: state.tenant.id,
          doctorId: finalDoc.id,
          doctorType: DoctorType.CONSULTING,
          timings: timingsBuffer,
          status: MappingStatus.ACTIVE,
          createdAt: Date.now()
      };
      localStorage.setItem(STORAGE_KEY_MAPPINGS, JSON.stringify([...existingMappings, newMapping]));
    } else if (existingDoc) {
      alert("Doctor is already assigned to this clinic.");
      return;
    }
    
    if (!state.doctors.some(d => d.id === finalDoc.id)) {
      onUpdateDoctors([...state.doctors, finalDoc]);
    }
    
    setShowAddDoctorModal(false);
    setDoctorForm({ name: '', mobile: '', specialization: '' });
    setSpecSearch('');
    setTimingsBuffer([]);

    if (finalDoc.verificationStatus === VerificationStatus.UNVERIFIED) {
      setVerifyingStaff({ id: finalDoc.id, name: finalDoc.name, type: 'DOCTOR' });
    }
  };

  const handleRegisterAssistant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantForm.name || !assistantForm.mobile || timingsBuffer.length === 0) return;
    
    const globalAsstsRaw = localStorage.getItem(STORAGE_KEY_ASSISTANTS);
    const globalAssts: Assistant[] = globalAsstsRaw ? JSON.parse(globalAsstsRaw) : INITIAL_ASSISTANTS;
    
    let existingAsst = globalAssts.find(a => a.mobile === assistantForm.mobile);
    let finalAsst: Assistant;

    if (existingAsst) {
      finalAsst = existingAsst;
    } else {
      finalAsst = {
        id: crypto.randomUUID(),
        name: assistantForm.name,
        mobile: assistantForm.mobile,
        verificationStatus: VerificationStatus.UNVERIFIED,
        createdAt: Date.now(),
        source: state.tenant.name
      };
      localStorage.setItem(STORAGE_KEY_ASSISTANTS, JSON.stringify([...globalAssts, finalAsst]));
    }
    
    const existingMappingsRaw = localStorage.getItem(STORAGE_KEY_ASSISTANT_MAPPINGS);
    const existingMappings: AssistantClinicMapping[] = existingMappingsRaw ? JSON.parse(existingMappingsRaw) : [];
    
    const hasMapping = existingMappings.some(m => m.clinicId === state.tenant.id && m.assistantId === finalAsst.id);

    if (!hasMapping) {
      const newMapping: AssistantClinicMapping = {
          id: crypto.randomUUID(),
          clinicId: state.tenant.id,
          assistantId: finalAsst.id,
          timings: timingsBuffer,
          status: MappingStatus.ACTIVE,
          createdAt: Date.now()
      };
      localStorage.setItem(STORAGE_KEY_ASSISTANT_MAPPINGS, JSON.stringify([...existingMappings, newMapping]));
    } else if (existingAsst) {
      alert("Assistant is already assigned to this clinic.");
      return;
    }
    
    if (!state.assistants.some(a => a.id === finalAsst.id)) {
      onUpdateAssistants([...state.assistants, finalAsst]);
    }

    setShowAddAssistantModal(false);
    setAssistantForm({ name: '', mobile: '' });
    setTimingsBuffer([]);

    if (finalAsst.verificationStatus === VerificationStatus.UNVERIFIED) {
      setVerifyingStaff({ id: finalAsst.id, name: finalAsst.name, type: 'ASSISTANT' });
    }
  };

  const handleOtpVerify = () => {
    if (otpValue === '1234') {
      if (!verifyingStaff) return;
      
      if (verifyingStaff.type === 'DOCTOR') {
        const globalDocsRaw = localStorage.getItem(STORAGE_KEY_DOCTORS);
        const globalDocs: Doctor[] = globalDocsRaw ? JSON.parse(globalDocsRaw) : [];
        const updatedDocs = globalDocs.map(d => 
          d.id === verifyingStaff.id ? { ...d, verificationStatus: VerificationStatus.VERIFIED } : d
        );
        localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(updatedDocs));
        onUpdateDoctors(state.doctors.map(d => 
          d.id === verifyingStaff.id ? { ...d, verificationStatus: VerificationStatus.VERIFIED } : d
        ));
      } else {
        const globalAsstsRaw = localStorage.getItem(STORAGE_KEY_ASSISTANTS);
        const globalAssts: Assistant[] = globalAsstsRaw ? JSON.parse(globalAsstsRaw) : [];
        const updatedAssts = globalAssts.map(a => 
          a.id === verifyingStaff.id ? { ...a, verificationStatus: VerificationStatus.VERIFIED } : a
        );
        localStorage.setItem(STORAGE_KEY_ASSISTANTS, JSON.stringify(updatedAssts));
        onUpdateAssistants(state.assistants.map(a => 
          a.id === verifyingStaff.id ? { ...a, verificationStatus: VerificationStatus.VERIFIED } : a
        ));
      }
      setVerifyingStaff(null);
      setOtpValue('');
    } else {
      alert("Invalid code. Use 1234 for demo.");
    }
  };

  const handleDeleteDoctor = (id: string) => {
    if (window.confirm("Remove this doctor from clinic assignments?")) {
      const existingMappings: DoctorClinicMapping[] = JSON.parse(localStorage.getItem(STORAGE_KEY_MAPPINGS) || '[]');
      const filtered = existingMappings.filter(m => !(m.clinicId === state.tenant.id && m.doctorId === id));
      localStorage.setItem(STORAGE_KEY_MAPPINGS, JSON.stringify(filtered));
      onUpdateDoctors(state.doctors.filter(d => d.id !== id));
    }
  };

  const handleDeleteAssistant = (id: string) => {
    if (window.confirm("Remove this assistant from clinic assignments?")) {
      const existingMappings: AssistantClinicMapping[] = JSON.parse(localStorage.getItem(STORAGE_KEY_ASSISTANT_MAPPINGS) || '[]');
      const filtered = existingMappings.filter(m => !(m.clinicId === state.tenant.id && m.assistantId === id));
      localStorage.setItem(STORAGE_KEY_ASSISTANT_MAPPINGS, JSON.stringify(filtered));
      onUpdateAssistants(state.assistants.filter(a => a.id !== id));
    }
  };

  const toggleDay = (day: string) => {
    setTempSlot(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day) 
        ? prev.selectedDays.filter(d => d !== day) 
        : [...prev.selectedDays, day]
    }));
  };

  const addShiftToBuffer = () => {
    if (tempSlot.selectedDays.length === 0) return alert("Please select at least one day.");
    const newTiming: OperationTime = { 
      days: tempSlot.selectedDays.join(', '), 
      startTime: `${tempSlot.startH}:${tempSlot.startM} ${tempSlot.startP}`,
      endTime: `${tempSlot.endH}:${tempSlot.endM} ${tempSlot.endP}`,
      specialty: 'Shift' 
    };
    setTimingsBuffer([...timingsBuffer, newTiming]);
    setTempSlot(prev => ({ ...prev, selectedDays: [] }));
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Logo size={48} className="shrink-0" />
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter leading-none">
              Techno<span className="text-cyan-600">Clinic</span> Admin
            </h2>
            <p className="text-slate-500 font-medium mt-1">Operational Control Center</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm text-[10px] font-black text-slate-400 uppercase tracking-widest">
           <RefreshCw size={14} className="text-cyan-500 animate-spin-slow" /> Local Sync Active
        </div>
      </header>

      <div className="flex border-b border-slate-200 overflow-x-auto bg-white rounded-t-[32px] px-2 shadow-sm">
        <TabButton icon={<Building2 size={18} />} label="Cabins" active={activeTab === 'CABINS'} onClick={() => setActiveTab('CABINS')} />
        <TabButton icon={<UserRound size={18} />} label="Doctors" active={activeTab === 'DOCTORS'} onClick={() => setActiveTab('DOCTORS')} />
        <TabButton icon={<ClipboardList size={18} />} label="Assistants" active={activeTab === 'ASSISTANTS'} onClick={() => setActiveTab('ASSISTANTS')} />
        <TabButton icon={<Settings size={18} />} label="System" active={activeTab === 'SYSTEM'} onClick={() => setActiveTab('SYSTEM')} />
      </div>

      <div className="bg-white p-8 rounded-b-[32px] border border-slate-100 border-t-0 shadow-sm min-h-[500px]">
        {activeTab === 'CABINS' && (
          <section className="animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Clinic Cabins</h3>
            <div className="flex gap-2 mb-8 bg-slate-50 p-6 rounded-[24px] border border-slate-100">
              <input 
                type="text" value={newCabinName} onChange={(e) => setNewCabinName(e.target.value)}
                className="flex-1 px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none font-bold"
                placeholder="New Cabin ID (e.g. Room 101)"
              />
              <button onClick={() => { if(newCabinName.trim()){ onUpdateCabins([...state.cabins, {id: crypto.randomUUID(), name: newCabinName.trim()}]); setNewCabinName(''); } }} className="bg-cyan-600 text-white px-10 rounded-2xl hover:bg-cyan-700 font-black uppercase text-[10px] tracking-widest transition-all">Add Cabin</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {state.cabins.map(cabin => (
                <div key={cabin.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[28px] border border-slate-100 group transition-all hover:bg-white hover:shadow-md">
                  <span className="font-black text-slate-700 uppercase tracking-tight">{cabin.name}</span>
                  <button onClick={() => { if(window.confirm("Delete?")) onUpdateCabins(state.cabins.filter(c => c.id !== cabin.id)) }} className="text-slate-300 hover:text-rose-600 p-2"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'DOCTORS' && (
          <section className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-800">Assigned Doctors</h3>
              <button onClick={() => setShowAddDoctorModal(true)} className="bg-orange-600 hover:bg-orange-500 text-white font-black px-6 py-3 rounded-2xl uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-orange-900/20"><Plus size={18} /> Register Practitioner</button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {state.doctors.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[40px] text-slate-300 font-bold uppercase text-xs tracking-widest">No assigned doctors for this clinic</div>
              ) : state.doctors.map(doc => {
                const mapping = mappings.find(m => m.doctorId === doc.id && m.clinicId === state.tenant.id);
                const isExpanded = expandedStaffId === doc.id;
                const isVerified = doc.verificationStatus === VerificationStatus.VERIFIED;
                return (
                  <div key={doc.id} className={`bg-white rounded-[32px] border shadow-sm overflow-hidden transition-all ${isVerified ? 'border-slate-100 hover:border-orange-200' : 'border-amber-200 bg-amber-50/10'}`}>
                    <div className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shrink-0 ${isVerified ? 'bg-orange-600 text-white shadow-orange-900/10' : 'bg-amber-100 text-amber-600 shadow-amber-900/5'}`}>
                          {doc.name[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                             <div className="font-black text-slate-800 text-lg uppercase tracking-tight leading-none">{doc.name}</div>
                             <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${isVerified ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                               {doc.verificationStatus}
                             </span>
                          </div>
                          <div className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] mt-1">{doc.specialization} • {doc.mobile}</div>
                          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Source: {doc.source}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                         {!isVerified && (
                           <button onClick={() => setVerifyingStaff({ id: doc.id, name: doc.name, type: 'DOCTOR' })} className="bg-amber-600 hover:bg-amber-500 text-white text-[9px] font-black px-4 py-2 rounded-xl uppercase transition-all shadow-md flex items-center gap-2">
                             <ShieldCheck size={14} /> Verify OTP
                           </button>
                         )}
                         <button 
                           onClick={() => setExpandedStaffId(isExpanded ? null : doc.id)}
                           className={`p-3 rounded-xl transition-all ${isExpanded ? 'bg-orange-600 text-white' : 'bg-slate-50 text-slate-400 hover:text-orange-600'}`}
                           title="View Shifts"
                         >
                           {isExpanded ? <ChevronUp size={18} /> : <Clock size={18} />}
                         </button>
                         <button onClick={() => handleDeleteDoctor(doc.id)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Remove Assignment"><Trash2 size={18} /></button>
                      </div>
                    </div>

                    {isExpanded && mapping && (
                      <div className="px-6 pb-6 pt-2 bg-slate-50/50 animate-in slide-in-from-top-2">
                        <div className="p-5 bg-white rounded-2xl border border-slate-100 space-y-3">
                           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                             <CalendarDays size={12} className="text-orange-500" /> Active Rotation
                           </div>
                           {mapping.timings.map((t, i) => (
                             <div key={i} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                                <span className="text-[10px] font-black text-slate-500 uppercase">{t.days}</span>
                                <span className="text-[11px] font-bold text-orange-600">{t.startTime} - {t.endTime}</span>
                             </div>
                           ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === 'ASSISTANTS' && (
          <section className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-800">Assigned Staff</h3>
              <button onClick={() => setShowAddAssistantModal(true)} className="bg-orange-600 hover:bg-orange-500 text-white font-black px-6 py-3 rounded-2xl uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-orange-900/20"><Plus size={18} /> Register Staff</button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {state.assistants.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[40px] text-slate-300 font-bold uppercase text-xs tracking-widest">No assigned assistants for this clinic</div>
              ) : state.assistants.map(asst => {
                const mapping = assistantMappings.find(m => m.assistantId === asst.id && m.clinicId === state.tenant.id);
                const isExpanded = expandedStaffId === asst.id;
                const isVerified = asst.verificationStatus === VerificationStatus.VERIFIED;
                return (
                  <div key={asst.id} className={`bg-white rounded-[32px] border shadow-sm overflow-hidden transition-all ${isVerified ? 'border-slate-100 hover:border-orange-200' : 'border-amber-200 bg-amber-50/10'}`}>
                    <div className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shrink-0 ${isVerified ? 'bg-orange-600 text-white shadow-orange-900/10' : 'bg-amber-100 text-amber-600 shadow-amber-900/5'}`}>
                          {asst.name[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                             <div className="font-black text-slate-800 text-lg uppercase tracking-tight leading-none">{asst.name}</div>
                             <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${isVerified ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                               {asst.verificationStatus}
                             </span>
                          </div>
                          <div className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] mt-1">{asst.mobile} • Operational Support</div>
                          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Source: {asst.source}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                         {!isVerified && (
                           <button onClick={() => setVerifyingStaff({ id: asst.id, name: asst.name, type: 'ASSISTANT' })} className="bg-amber-600 hover:bg-amber-500 text-white text-[9px] font-black px-4 py-2 rounded-xl uppercase transition-all shadow-md flex items-center gap-2">
                             <ShieldCheck size={14} /> Verify OTP
                           </button>
                         )}
                         <button 
                           onClick={() => setExpandedStaffId(isExpanded ? null : asst.id)}
                           className={`p-3 rounded-xl transition-all ${isExpanded ? 'bg-orange-600 text-white' : 'bg-slate-50 text-slate-400 hover:text-orange-600'}`}
                         >
                           {isExpanded ? <ChevronUp size={18} /> : <Clock size={18} />}
                         </button>
                         <button onClick={() => handleDeleteAssistant(asst.id)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Remove Assignment"><Trash2 size={18} /></button>
                      </div>
                    </div>

                    {isExpanded && mapping && (
                      <div className="px-6 pb-6 pt-2 bg-slate-50/50 animate-in slide-in-from-top-2">
                        <div className="p-5 bg-white rounded-2xl border border-slate-100 space-y-3">
                           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                             <CalendarDays size={12} className="text-orange-500" /> Operational Shifts
                           </div>
                           {mapping.timings.map((t, i) => (
                             <div key={i} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                                <span className="text-[10px] font-black text-slate-500 uppercase">{t.days}</span>
                                <span className="text-[11px] font-bold text-orange-600">{t.startTime} - {t.endTime}</span>
                             </div>
                           ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === 'SYSTEM' && (
          <div className="animate-in fade-in duration-300 space-y-8">
            <h3 className="text-lg font-bold text-slate-800">Clinic Node Configuration</h3>
            <div className="bg-rose-50 p-12 rounded-[56px] border border-rose-100 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="max-w-md text-center md:text-left">
                <h4 className="text-2xl font-black text-rose-800 mb-3 flex items-center justify-center md:justify-start gap-3"><AlertTriangle size={32} /> Security Clearance</h4>
                <p className="text-rose-700/70 font-medium">Resetting all token cycles will permanently wipe the active queue and visit logs. <strong>Facility nodes remain intact.</strong></p>
              </div>
              <button 
                onClick={() => { if(window.confirm("RESET QUEUE?")) onReset(); }} 
                className="bg-rose-600 text-white px-12 py-6 rounded-3xl font-black uppercase tracking-widest text-sm hover:bg-rose-700 shadow-xl shadow-rose-200/50 active:scale-95 transition-all"
              >
                Clear Queue Logs
              </button>
            </div>
          </div>
        )}
      </div>

      {showAddDoctorModal && (
        <AdminModal title="Register Practitioner" onClose={() => { setShowAddDoctorModal(false); setTimingsBuffer([]); }}>
          <form onSubmit={handleRegisterDoctor} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                  <input required value={doctorForm.name} onChange={e => setDoctorForm({...doctorForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-bold text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-sm" placeholder="e.g. Dr. Kirtan" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Mobile Number</label>
                  <input required type="tel" maxLength={10} value={doctorForm.mobile} onChange={e => setDoctorForm({...doctorForm, mobile: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-bold text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-sm" placeholder="10 Digit Number" />
                </div>
            </div>

            <div className="space-y-2 relative">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Specialization</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    required 
                    autoComplete="off"
                    value={specSearch || doctorForm.specialization} 
                    onFocus={() => setShowSpecDropdown(true)}
                    onBlur={() => setTimeout(() => setShowSpecDropdown(false), 200)}
                    onChange={e => {
                      setSpecSearch(e.target.value);
                      setShowSpecDropdown(true);
                      if (doctorForm.specialization) setDoctorForm({...doctorForm, specialization: ''});
                    }} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 outline-none font-bold text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-sm" 
                    placeholder="Search Specialization..." 
                  />
                  {showSpecDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[110] max-h-48 overflow-y-auto overflow-x-hidden custom-scrollbar py-2 border-t-0 animate-in slide-in-from-top-2">
                       {filteredSpecs.length === 0 ? (
                         <div className="px-4 py-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">No matching category</div>
                       ) : (
                         filteredSpecs.map(s => (
                           <button 
                             key={s} 
                             type="button"
                             onClick={() => {
                               setDoctorForm({...doctorForm, specialization: s});
                               setSpecSearch(s);
                               setShowSpecDropdown(false);
                             }}
                             className="w-full px-4 py-2 text-left hover:bg-orange-50 font-black text-slate-700 uppercase tracking-tight text-xs border-b border-slate-50 last:border-0 transition-colors flex items-center justify-between group"
                           >
                             {s}
                             <ChevronRight size={12} className="text-slate-200 group-hover:text-orange-500 transition-colors" />
                           </button>
                         ))
                       )}
                    </div>
                  )}
                </div>
            </div>
            
            <div className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-100 space-y-4 shadow-inner">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <Clock size={14} className="text-orange-500" /> Operational Shifts
                </div>
                
                <div className="flex flex-wrap gap-2">
                    {DAYS_SHORT.map(day => (
                        <button key={day} type="button" onClick={() => toggleDay(day)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${tempSlot.selectedDays.includes(day) ? 'bg-orange-600 border-orange-500 text-white shadow-xl shadow-orange-900/30' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                            {day}
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                  <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="grid grid-cols-1 divide-y divide-slate-50">
                      <div className="p-3 flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">From</span>
                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                          <TimeSelect value={tempSlot.startH} onChange={v => setTempSlot({...tempSlot, startH: v})} options={['09','10','11','12','01','02','03','04','05','06','07','08']} />
                          <span className="text-slate-300 font-bold">:</span>
                          <TimeSelect value={tempSlot.startM} onChange={v => setTempSlot({...tempSlot, startM: v})} options={['00','15','30','45']} />
                          <TimeSelect value={tempSlot.startP} onChange={v => setTempSlot({...tempSlot, startP: v})} options={['AM','PM']} />
                        </div>
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Till</span>
                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                          <TimeSelect value={tempSlot.endH} onChange={v => setTempSlot({...tempSlot, endH: v})} options={['09','10','11','12','01','02','03','04','05','06','07','08']} />
                          <span className="text-slate-300 font-bold">:</span>
                          <TimeSelect value={tempSlot.endM} onChange={v => setTempSlot({...tempSlot, endM: v})} options={['00','15','30','45']} />
                          <TimeSelect value={tempSlot.endP} onChange={v => setTempSlot({...tempSlot, endP: v})} options={['AM','PM']} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={addShiftToBuffer} className="w-10 h-10 bg-orange-600 text-white rounded-xl hover:bg-orange-500 flex items-center justify-center transition-all shadow-lg shadow-orange-900/20 active:scale-95 shrink-0 ml-1"><Plus size={20} /></button>
                </div>

                {timingsBuffer.length > 0 && (
                    <div className="space-y-2 pt-1">
                        {timingsBuffer.map((t, i) => (
                            <div key={i} className="flex justify-between items-center px-4 py-2 bg-white border border-slate-100 rounded-xl animate-in slide-in-from-left-2 shadow-sm">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.days}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-black text-orange-600">{t.startTime} - {t.endTime}</span>
                                  <button type="button" onClick={() => setTimingsBuffer(p => p.filter((_, idx) => idx !== i))} className="text-slate-200 hover:text-rose-500 transition-colors"><X size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button type="submit" className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[11px] hover:bg-orange-500 shadow-2xl shadow-orange-900/20 transition-all flex items-center justify-center gap-2 active:scale-95">
              Finalize Practitioner Assignment <ChevronRight size={18} />
            </button>
          </form>
        </AdminModal>
      )}

      {showAddAssistantModal && (
        <AdminModal title="Register Staff" onClose={() => { setShowAddAssistantModal(false); setTimingsBuffer([]); }}>
          <form onSubmit={handleRegisterAssistant} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                  <input required value={assistantForm.name} onChange={e => setAssistantForm({...assistantForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-bold text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-sm" placeholder="Full Name" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Mobile Number</label>
                  <input required type="tel" maxLength={10} value={assistantForm.mobile} onChange={e => setAssistantForm({...assistantForm, mobile: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-bold text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-sm" placeholder="10 Digit Number" />
                </div>
            </div>
            
            <div className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-100 space-y-4 shadow-inner">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <Clock size={14} className="text-orange-500" /> Operational Shifts
                </div>
                <div className="flex flex-wrap gap-2">
                    {DAYS_SHORT.map(day => (
                        <button key={day} type="button" onClick={() => toggleDay(day)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${tempSlot.selectedDays.includes(day) ? 'bg-orange-600 border-orange-500 text-white shadow-xl shadow-orange-900/30' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                            {day}
                        </button>
                    ))}
                </div>
                
                <div className="space-y-3">
                  <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="grid grid-cols-1 divide-y divide-slate-50">
                      <div className="p-3 flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">From</span>
                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                          <TimeSelect value={tempSlot.startH} onChange={v => setTempSlot({...tempSlot, startH: v})} options={['09','10','11','12','01','02','03','04','05','06','07','08']} />
                          <span className="text-slate-300 font-bold">:</span>
                          <TimeSelect value={tempSlot.startM} onChange={v => setTempSlot({...tempSlot, startM: v})} options={['00','15','30','45']} />
                          <TimeSelect value={tempSlot.startP} onChange={v => setTempSlot({...tempSlot, startP: v})} options={['AM','PM']} />
                        </div>
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Till</span>
                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                          <TimeSelect value={tempSlot.endH} onChange={v => setTempSlot({...tempSlot, endH: v})} options={['09','10','11','12','01','02','03','04','05','06','07','08']} />
                          <span className="text-slate-300 font-bold">:</span>
                          <TimeSelect value={tempSlot.endM} onChange={v => setTempSlot({...tempSlot, endM: v})} options={['00','15','30','45']} />
                          <TimeSelect value={tempSlot.endP} onChange={v => setTempSlot({...tempSlot, endP: v})} options={['AM','PM']} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={addShiftToBuffer} className="w-10 h-10 bg-orange-600 text-white rounded-xl hover:bg-orange-500 flex items-center justify-center transition-all shadow-lg shadow-orange-900/20 active:scale-95 shrink-0 ml-1"><Plus size={20} /></button>
                </div>

                {timingsBuffer.length > 0 && (
                    <div className="space-y-2 pt-1">
                        {timingsBuffer.map((t, i) => (
                            <div key={i} className="flex justify-between items-center px-4 py-2 bg-white border border-slate-100 rounded-xl animate-in slide-in-from-left-2 shadow-sm">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.days}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-black text-orange-600">{t.startTime} - {t.endTime}</span>
                                  <button type="button" onClick={() => setTimingsBuffer(p => p.filter((_, idx) => idx !== i))} className="text-slate-200 hover:text-rose-500 transition-colors"><X size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button type="submit" className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[11px] hover:bg-orange-500 shadow-2xl shadow-orange-900/20 transition-all flex items-center justify-center gap-2 active:scale-95">
              Finalize Staff Assignment <ChevronRight size={18} />
            </button>
          </form>
        </AdminModal>
      )}

      {verifyingStaff && (
        <AdminModal title="Safety Verification" onClose={() => { setVerifyingStaff(null); setOtpValue(''); }}>
          <div className="space-y-6 text-center p-2">
             <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner"><ShieldCheck size={32} /></div>
             <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Verify {verifyingStaff.name}</h3>
                <p className="text-xs text-slate-500 font-medium px-4">A security code has been transmitted. Enter <span className="text-orange-600 font-black underline">1234</span> for demonstration.</p>
             </div>
             <div className="max-w-[200px] mx-auto">
               <input 
                autoFocus 
                maxLength={4} 
                value={otpValue} 
                onChange={e => setOtpValue(e.target.value.replace(/\D/g, ''))} 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-4xl text-center font-black tracking-[0.3em] focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none text-slate-800 shadow-sm" 
               />
             </div>
             <button onClick={handleOtpVerify} className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[11px] hover:bg-orange-500 transition-all shadow-xl shadow-orange-900/20">Verify & Activate Staff</button>
          </div>
        </AdminModal>
      )}

      <style>{`
        .animate-spin-slow { animation: spin 4s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

const TabButton: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-10 py-6 border-b-4 transition-all font-black uppercase tracking-widest text-[11px] shrink-0 ${
      active ? 'border-cyan-600 text-cyan-700 bg-cyan-50/20' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
    }`}
  >
    {icon} <span>{label}</span>
  </button>
);

const AdminModal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xl animate-in fade-in duration-300">
    <div className="bg-white w-full max-w-lg rounded-[32px] border border-white p-8 relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.12)] animate-in zoom-in-95">
      <header className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-all bg-slate-50 rounded-xl active:scale-90"><X size={20} /></button>
      </header>
      <div className="max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar">
        {children}
      </div>
    </div>
  </div>
);

export default AdminDashboard;
