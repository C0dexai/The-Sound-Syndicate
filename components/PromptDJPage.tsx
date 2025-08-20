
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PromptDJAsset, AudioParams, MidiSequence } from '../types';
import { generateAudioParameters, generateMidiSequence } from '../services/geminiService';
import { getPromptDJAssetsDB, savePromptDJAssetDB } from '../services/dbService';
import { MusicIcon, SparklesIcon, WaveformIcon } from './icons/Icons';
import SoundMatrixMixer from './SoundMatrixMixer';

type Tab = 'audio' | 'midi';

const PromptDJPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('audio');
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [assets, setAssets] = useState<PromptDJAsset[]>([]);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const activeSoundSourcesRef = useRef<AudioNode[]>([]);

    useEffect(() => {
        const loadAssets = async () => {
            try {
                const dbAssets = await getPromptDJAssetsDB();
                // Sort by date from ID, newest first
                dbAssets.sort((a, b) => Number(b.id.split('-')[1]) - Number(a.id.split('-')[1]));
                setAssets(dbAssets);
            } catch (error) {
                console.error("Failed to load PromptDJ assets from DB", error);
            }
        };
        loadAssets();
    }, []);

    const stopAllPlayback = useCallback(() => {
        activeSoundSourcesRef.current.forEach(source => {
            if (source instanceof OscillatorNode) {
                try { source.stop(); } catch(e) { /* already stopped */ }
            }
            source.disconnect();
        });
        activeSoundSourcesRef.current = [];
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().then(() => audioContextRef.current = null);
        }
        setAssets(prev => prev.map(a => ({ ...a, isPlaying: false })));
    }, []);

    const playAudio = useCallback(async (asset: PromptDJAsset) => {
        stopAllPlayback();
        const params = asset.data as AudioParams;

        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = context;
        activeSoundSourcesRef.current = [];

        const osc = context.createOscillator();
        osc.type = params.waveform;
        osc.frequency.value = params.baseFrequency;
        
        const amp = context.createGain();
        const { attack, decay, sustain, release } = params.envelope;
        const now = context.currentTime;
        amp.gain.setValueAtTime(0, now);
        amp.gain.linearRampToValueAtTime(1, now + attack);
        amp.gain.linearRampToValueAtTime(sustain, now + attack + decay);
        amp.gain.setValueAtTime(sustain, now + params.duration - release);
        amp.gain.linearRampToValueAtTime(0, now + params.duration);
        
        let lastNode: AudioNode = osc;
        osc.connect(amp);
        lastNode = amp;

        if (params.filter) {
            const filter = context.createBiquadFilter();
            filter.type = params.filter.type;
            filter.frequency.value = params.filter.frequency;
            filter.Q.value = params.filter.q;
            lastNode.connect(filter);
            lastNode = filter;
        }

        lastNode.connect(context.destination);
        osc.start(now);
        osc.stop(now + params.duration);
        activeSoundSourcesRef.current.push(osc);

        setAssets(prev => prev.map(a => ({ ...a, isPlaying: a.id === asset.id })));

        setTimeout(() => {
            if (audioContextRef.current === context) {
               stopAllPlayback();
            }
        }, params.duration * 1000 + 50);

    }, [stopAllPlayback]);

    const playMidi = useCallback((asset: PromptDJAsset) => {
        stopAllPlayback();
        const sequence = asset.data as MidiSequence;

        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = context;
        const sources: AudioNode[] = [];
        
        const secondsPerBeat = 60.0 / sequence.bpm;
        let totalDuration = 0;

        sequence.notes.forEach(note => {
            const startTime = context.currentTime + note.start * secondsPerBeat;
            const stopTime = startTime + note.duration * secondsPerBeat;
            if (stopTime > totalDuration) {
                totalDuration = stopTime;
            }

            const osc = context.createOscillator();
            osc.type = 'sine'; // Could be parameterized
            osc.frequency.value = 440 * Math.pow(2, (note.note - 69) / 12);
            
            const amp = context.createGain();
            amp.gain.setValueAtTime(0, startTime);
            amp.gain.linearRampToValueAtTime(note.velocity / 127, startTime + 0.01);
            amp.gain.setValueAtTime(note.velocity / 127, stopTime - 0.02);
            amp.gain.linearRampToValueAtTime(0, stopTime);

            osc.connect(amp).connect(context.destination);
            osc.start(startTime);
            osc.stop(stopTime);
            sources.push(osc);
        });

        activeSoundSourcesRef.current = sources;
        setAssets(prev => prev.map(a => ({ ...a, isPlaying: a.id === asset.id })));
        
        setTimeout(() => {
            if (audioContextRef.current === context) {
               stopAllPlayback();
            }
        }, (totalDuration - context.currentTime) * 1000 + 50);

    }, [stopAllPlayback]);


    const handleGenerate = async () => {
        if (!prompt.trim() || isLoading) return;
        setIsLoading(true);
        stopAllPlayback();

        let newAssetData: AudioParams | MidiSequence | null = null;
        if (activeTab === 'audio') {
            newAssetData = await generateAudioParameters(prompt);
        } else {
            newAssetData = await generateMidiSequence(prompt);
        }

        if (newAssetData) {
            const newAsset: PromptDJAsset = {
                id: `asset-${Date.now()}`,
                prompt,
                type: activeTab,
                data: newAssetData,
                isPlaying: false,
            };
            await savePromptDJAssetDB(newAsset);
            setAssets(prev => [newAsset, ...prev]);
        } else {
            // Handle error case, maybe show a toast
            console.error("Failed to generate asset from prompt.");
        }

        setIsLoading(false);
    };

    const handlePlayAsset = (asset: PromptDJAsset) => {
        if (asset.isPlaying) {
            stopAllPlayback();
        } else {
            if (asset.type === 'audio') {
                playAudio(asset);
            } else {
                playMidi(asset);
            }
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 overflow-hidden">
            <div className="flex-grow flex flex-col md:flex-row gap-6 min-h-0">
                {/* Left Column: Composer */}
                <div className="md:w-1/3 xl:w-1/4 h-full flex flex-col card-bg border border-neon-purple/20 rounded-lg shadow-lg">
                    <div className="p-4 border-b border-neon-purple/30">
                        <h2 className="text-xl font-bold neon-text-cyan flex items-center gap-2"><MusicIcon /> PromptDJ</h2>
                        <p className="text-sm text-gray-400">Generate sound from text.</p>
                    </div>

                    <div className="p-4 flex-shrink-0">
                        <div className="flex bg-slate-900/50 rounded-lg p-1 border border-slate-700">
                            <button onClick={() => setActiveTab('audio')} className={`w-1/2 p-2 text-sm font-semibold rounded-md transition-all ${activeTab === 'audio' ? 'bg-neon-cyan text-black shadow-[0_0_10px_var(--neon-cyan)]' : 'text-gray-300'}`}>Audio</button>
                            <button onClick={() => setActiveTab('midi')} className={`w-1/2 p-2 text-sm font-semibold rounded-md transition-all ${activeTab === 'midi' ? 'bg-neon-pink text-black shadow-[0_0_10px_var(--neon-pink)]' : 'text-gray-300'}`}>MIDI</button>
                        </div>
                    </div>

                    <div className="p-4 flex-grow flex flex-col gap-4 overflow-y-auto">
                        <label htmlFor="prompt-input" className="font-bold text-white">Your Prompt</label>
                        <textarea
                            id="prompt-input"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={activeTab === 'audio' ? 'e.g., A short, sharp laser zap sound' : 'e.g., A funky, upbeat bassline in C minor'}
                            rows={6}
                            className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-neon-cyan focus:outline-none"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="p-4 border-t border-neon-purple/30">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !prompt.trim()}
                            className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-md transition hover:shadow-[0_0_10px_var(--neon-cyan)]"
                        >
                            {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <SparklesIcon />}
                            {isLoading ? 'Generating...' : `Generate ${activeTab === 'audio' ? 'Audio' : 'MIDI'}`}
                        </button>
                    </div>
                </div>

                {/* Right Column: Library */}
                <div className="flex-grow h-full flex flex-col card-bg border border-neon-purple/20 rounded-lg shadow-lg">
                     <div className="p-4 border-b border-neon-purple/30">
                        <h2 className="text-xl font-bold neon-text-pink flex items-center gap-2"><WaveformIcon /> Asset Library</h2>
                        <p className="text-sm text-gray-400">Your generated sounds and sequences.</p>
                    </div>
                    <div className="p-4 flex-grow overflow-y-auto space-y-3">
                        {assets.length === 0 && (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                <p>Your generated assets will appear here.</p>
                            </div>
                        )}
                        {assets.map(asset => (
                            <div key={asset.id} className={`p-3 rounded-lg border transition-all duration-300 ${asset.isPlaying ? 'bg-slate-700/50 border-neon-green' : 'bg-slate-900/50 border-slate-700'}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-grow">
                                        <p className={`font-bold text-white`}>{(asset.data as any).name}</p>
                                        <p className="text-xs text-gray-400 italic mt-1">"{asset.prompt}"</p>
                                        <p className="text-xs text-gray-500 mt-2">{(asset.data as any).description}</p>
                                    </div>
                                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                        <button onClick={() => handlePlayAsset(asset)} className={`w-12 h-12 flex items-center justify-center rounded-full text-white transition-colors ${asset.isPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">{ asset.isPlaying ? <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/> : <path d="M8 5v14l11-7z"/> }</svg>
                                        </button>
                                         <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${asset.type === 'audio' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-pink-500/20 text-pink-400 border-pink-500/30'}`}>{asset.type}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="flex-shrink-0">
                <SoundMatrixMixer />
            </div>
        </div>
    );
};

export default PromptDJPage;
