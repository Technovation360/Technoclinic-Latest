
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { ClinicState, PatientStatus } from '../types';
import { supabase } from '../lib/supabase';
import { Speaker, Volume2, VolumeX, Monitor, Video, Hash, User, AlertCircle, Clock, Calendar } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import Logo from './Logo';

interface Props {
  state: ClinicState;
}

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const TokenScreen: React.FC<Props> = ({ state }) => {
  const [time, setTime] = useState(new Date());
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const announcedTokens = useRef<Set<string>>(new Set());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchAds = async () => {
      const { data } = await supabase
        .from('ads')
        .select('url')
        .or(`clinic_id.eq.${state.tenant.id},clinic_id.eq.GLOBAL`);
      
      if (data) {
        setVideoUrls(data.map(d => d.url));
      }
    };
    fetchAds();
  }, [state.tenant.id]);

  const currentPatients = useMemo(() => 
    state.patients
      .filter(p => p.status === PatientStatus.IN_PROGRESS)
      .sort((a, b) => b.registeredAt - a.registeredAt),
    [state.patients]
  );

  const videoIds = useMemo(() => {
    if (videoUrls.length === 0) return ['9No-FiE9ywg'];
    const extractId = (url: string) => {
      const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[7].length === 11) ? match[7] : null;
    };
    const ids = videoUrls.map(url => extractId(url)).filter(Boolean) as string[];
    return ids.length > 0 ? ids : ['9No-FiE9ywg'];
  }, [videoUrls]);

  const youtubeSrc = useMemo(() => {
    const firstId = videoIds[0];
    const playlist = videoIds.join(',');
    return `https://www.youtube.com/embed/${firstId}?autoplay=1&mute=1&loop=1&playlist=${playlist}&controls=0&showinfo=0&rel=0&iv_load_policy=3&enablejsapi=1`;
  }, [videoIds]);

  const announcePatient = async (patientName: string, tokenNumber: number, cabinName: string) => {
    if (!isAudioEnabled) return;
    try {
      setIsAnnouncing(true);
      if (!audioContextRef.current) audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Attention please. Token number ${tokenNumber}, ${patientName}, please proceed to ${cabinName}.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioData = decodeBase64(base64Audio);
        const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsAnnouncing(false);
        source.start();
      } else setIsAnnouncing(false);
    } catch (e) { setIsAnnouncing(false); }
  };

  useEffect(() => {
    if (currentPatients.length > 0 && isAudioEnabled) {
      const topPatient = currentPatients[0];
      if (!announcedTokens.current.has(topPatient.id)) {
        announcedTokens.current.add(topPatient.id);
        const cabin = state.cabins.find(c => c.id === topPatient.cabinId);
        announcePatient(topPatient.name, topPatient.tokenNumber, cabin?.name || 'Consultation Room');
      }
    }
  }, [currentPatients, isAudioEnabled]);

  return (
    <div className="h-screen bg-[#FDFDFD] text-slate-900 flex flex-col overflow-hidden font-sans select-none">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Queue Status */}
        <aside className="w-[450px] h-full bg-white border-r border-slate-100 flex flex-col z-20 shadow-[20px_0_50px_rgba(0,0,0,0.02)]">
          <div className="p-10 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100">
                <Logo size={36} className="bg-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-none">TechnoClinic</h1>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-2">{state.tenant.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Live</span>
            </div>
          </div>

          <div className="flex-1 p-10 space-y-10 overflow-y-auto custom-scrollbar">
            {/* Active Highlight */}
            <div className="space-y-4">
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1">Currently Serving</h2>
              {currentPatients.length > 0 ? (
                <div className="bg-indigo-600 text-white rounded-[40px] p-8 shadow-2xl shadow-indigo-200 animate-in fade-in slide-in-from-top-2">
                   <div className="flex items-start justify-between mb-6">
                      <div>
                        <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mb-1">Current Call</p>
                        <h3 className="text-3xl font-extrabold tracking-tight leading-none uppercase">{currentPatients[0].name}</h3>
                      </div>
                      <Hash size={32} className="text-white/20" />
                   </div>
                   <div className="flex items-end justify-between">
                      <div className="text-7xl font-black tabular-nums">#{currentPatients[0].tokenNumber}</div>
                      <div className="text-right">
                         <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mb-1">Proceed to</p>
                         <p className="text-xl font-bold uppercase">{state.cabins.find(c => c.id === currentPatients[0].cabinId)?.name || 'Consultation'}</p>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-[40px] p-12 text-center">
                   <p className="text-sm font-semibold text-slate-400">Please wait for your token call...</p>
                </div>
              )}
            </div>

            {/* Other Cabins List */}
            <div className="space-y-4">
               <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1">Cabin Status</h2>
               <div className="space-y-3">
                  {state.cabins.map(cabin => {
                    const patient = currentPatients.find(p => p.cabinId === cabin.id);
                    return (
                      <div key={cabin.id} className={`p-6 rounded-3xl border transition-all ${patient ? 'bg-white border-indigo-100 shadow-sm' : 'bg-slate-50/50 border-slate-100 opacity-60'}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{cabin.name}</p>
                            <p className={`font-bold ${patient ? 'text-slate-900 uppercase' : 'text-slate-300 italic'}`}>
                              {patient ? patient.name : 'Ready'}
                            </p>
                          </div>
                          {patient && (
                            <div className="bg-indigo-50 text-indigo-600 px-4 py-2.5 rounded-2xl font-black text-xl">
                              #{patient.tokenNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          </div>

          <div className="p-10 border-t border-slate-50 flex items-center justify-between">
             <div className="flex items-center gap-3 text-slate-400">
                <Clock size={20} />
                <span className="text-xl font-bold text-slate-900">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
             </div>
             <button 
               onClick={() => setIsAudioEnabled(!isAudioEnabled)}
               className={`p-3 rounded-2xl transition-all ${isAudioEnabled ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600 animate-pulse'}`}
             >
               {isAudioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
             </button>
          </div>
        </aside>

        {/* Right Area: Broadcast & Alerts */}
        <main className="flex-1 relative bg-slate-900 overflow-hidden">
          {isAnnouncing && (
            <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center p-20 animate-in fade-in duration-300">
               <div className="mb-10">
                  <Logo size={120} />
               </div>
               <h2 className="text-3xl font-bold text-slate-400 uppercase tracking-[0.5em] mb-4">Now Calling</h2>
               <div className="text-[20rem] font-black text-indigo-600 leading-none mb-10 tabular-nums">
                 #{currentPatients[0]?.tokenNumber}
               </div>
               <div className="bg-indigo-50 px-16 py-10 rounded-[64px] border border-indigo-100 flex items-center gap-12 max-w-4xl w-full">
                  <div className="flex-1">
                    <p className="text-[12px] font-bold text-indigo-400 uppercase tracking-[0.3em] mb-4">Proceed immediately to</p>
                    <p className="text-6xl font-black text-indigo-900 uppercase tracking-tight">
                      {state.cabins.find(c => c.id === currentPatients[0]?.cabinId)?.name || 'Consultation'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-bold text-indigo-400 uppercase tracking-[0.3em] mb-4">Patient Name</p>
                    <p className="text-4xl font-bold text-indigo-600 uppercase">{currentPatients[0]?.name}</p>
                  </div>
               </div>
            </div>
          )}

          <div className="w-full h-full relative z-0">
             <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                <iframe
                  className="w-full h-full pointer-events-none scale-110 opacity-60"
                  src={youtubeSrc}
                  frameBorder="0"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                ></iframe>
             </div>
             <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TokenScreen;
