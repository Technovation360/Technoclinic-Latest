import React, { useEffect, useState, useMemo, useRef } from 'react';
import { ClinicState, PatientStatus } from '../types';
import { supabase } from '../lib/supabase';
import { Speaker, Volume2, VolumeX, Monitor, Video, Hash, User, AlertCircle } from 'lucide-react';
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

  // Fetch ads from Supabase
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
      if (!url) return null;
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

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Attention please. Token number ${tokenNumber}, ${patientName}, please proceed to ${cabinName}. Thank you.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioData = decodeBase64(base64Audio);
        const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
          setIsAnnouncing(false);
        };
        source.start();
      } else {
        setIsAnnouncing(false);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setIsAnnouncing(false);
    }
  };

  useEffect(() => {
    if (currentPatients.length > 0 && isAudioEnabled) {
      const topPatient = currentPatients[0];
      if (!announcedTokens.current.has(topPatient.id)) {
        announcedTokens.current.add(topPatient.id);
        const cabin = state.cabins.find(c => c.id === topPatient.cabinId);
        announcePatient(topPatient.name, topPatient.tokenNumber, cabin?.name || 'Cabin');
      }
    }
  }, [currentPatients, isAudioEnabled]);

  const toggleAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    setIsAudioEnabled(!isAudioEnabled);
  };

  return (
    <div className="h-screen bg-slate-900 text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      <div className="flex-1 flex overflow-hidden relative">
        {!isAudioEnabled && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] bg-white px-6 py-3 rounded-2xl border border-cyan-200 shadow-2xl flex items-center gap-4 animate-bounce">
            <AlertCircle className="text-cyan-500" size={24} />
            <div className="text-left">
              <p className="text-sm font-black text-slate-800 uppercase leading-none mb-1">Audio Muted</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enable for voice calls</p>
            </div>
            <button 
              onClick={toggleAudio}
              className="bg-cyan-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-cyan-700 transition-all shadow-lg"
            >
              Enable
            </button>
          </div>
        )}

        <aside className="w-[20%] h-full bg-slate-50 border-r border-slate-200 flex flex-col z-10 shadow-sm overflow-hidden text-slate-900">
          <div className="p-6 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-3 mb-2">
              <Logo size={42} className="shadow-cyan-200/50" />
              <h1 className="text-lg font-black tracking-tight text-slate-800 uppercase leading-none">Techno<br/><span className="text-cyan-600">Clinic</span></h1>
            </div>
            <div className="flex items-center justify-between text-cyan-600 font-bold uppercase tracking-[0.2em] text-[8px] mt-4">
              <span>{state.tenant.name}</span>
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
          </div>

          <div className="flex-1 flex flex-col p-4 space-y-5 overflow-hidden">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 text-center shadow-sm">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tokens</p>
                 <p className="text-3xl font-black text-emerald-600 tabular-nums leading-none">{state.lastTokenNumber}</p>
              </div>
              <div className="bg-cyan-50 p-5 rounded-2xl border border-cyan-100 text-center shadow-sm">
                 <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest mb-1">Active</p>
                 <p className="text-3xl font-black text-blue-600 tabular-nums leading-none">
                   {currentPatients.length > 0 ? currentPatients[0].tokenNumber : '---'}
                 </p>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
               <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-1.5">
                 <Hash size={12} className="text-cyan-600" /> Active Cabins
               </h2>
               <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                  {state.cabins.map(cabin => {
                    const patient = currentPatients.find(p => p.cabinId === cabin.id);
                    return (
                      <div key={cabin.id} className={`p-4 rounded-2xl border transition-all duration-500 ${patient ? 'bg-white border-cyan-200 shadow-md ring-1 ring-cyan-50' : 'bg-white/50 border-slate-100'}`}>
                        <div className="flex justify-between items-center">
                          <div className="overflow-hidden">
                            <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${patient ? 'text-cyan-600' : 'text-slate-400'}`}>
                              {cabin.name}
                            </p>
                            {patient ? (
                              <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">
                                {patient.name}
                              </p>
                            ) : (
                              <p className="text-[10px] font-bold text-slate-300 italic uppercase">Waiting</p>
                            )}
                          </div>
                          {patient && (
                            <div className="bg-cyan-600 text-white w-10 h-10 rounded-xl flex flex-col items-center justify-center font-black shrink-0 shadow-lg">
                               <span className="text-lg leading-none text-white">#{patient.tokenNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          </div>

          <div className="p-4 bg-slate-100 border-t border-slate-200 text-center relative">
            <div className="text-xl font-black tabular-nums tracking-tighter mb-0.5 text-slate-800">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
            </div>
            <div className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.15em]">
              {time.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
            <button onClick={toggleAudio} className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${isAudioEnabled ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
              {isAudioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </aside>

        <main className="relative w-[80%] h-full bg-slate-900 overflow-hidden">
          {isAnnouncing && (
            <div className="absolute inset-0 z-40 bg-white/98 backdrop-blur-3xl flex flex-col items-center justify-center p-10 text-center animate-in fade-in zoom-in-95 duration-500">
              <Logo size={100} className="mb-8 animate-bounce" />
              <h2 className="text-3xl font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Attention Required</h2>
              <div className="text-[12rem] font-black text-cyan-600 leading-none mb-8 tabular-nums tracking-tighter drop-shadow-xl">
                #{currentPatients[0]?.tokenNumber}
              </div>
              <div className="flex items-center gap-12 bg-slate-50 p-12 rounded-[56px] border border-slate-100 shadow-2xl">
                 <div className="text-left">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Patient</p>
                    <p className="text-6xl font-black text-slate-900 uppercase tracking-tight">{currentPatients[0]?.name}</p>
                 </div>
                 <div className="h-24 w-px bg-slate-200"></div>
                 <div className="text-left">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Proceed to</p>
                    <p className="text-6xl font-black text-emerald-600 uppercase tracking-tight">
                      {state.cabins.find(c => c.id === currentPatients[0]?.cabinId)?.name || 'CABIN'}
                    </p>
                 </div>
              </div>
            </div>
          )}

          <div className="absolute inset-0 z-0 bg-slate-900">
            {youtubeSrc ? (
              <iframe
                className="w-full h-full pointer-events-none scale-110 opacity-60"
                src={youtubeSrc}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title="Global Feed"
              ></iframe>
            ) : (
              <div className="w-full h-full flex items-center justify-center flex-col gap-6 text-white">
                <Logo size={140} className="opacity-10 grayscale" />
                <p className="text-white/10 font-black uppercase tracking-[0.5em] text-xl">Display Offline</p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/40"></div>
          </div>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default TokenScreen;