
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PowerIcon } from './icons/Icons';

// --- Reusable UI Components ---

const Knob = ({ label, value, min = 0, max = 1, onChange, size = 60, valueFormat = (v: number) => v.toFixed(2) }) => {
    const knobRef = useRef<HTMLDivElement>(null);
    const initialDragY = useRef(0);
    const initialValue = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        initialDragY.current = e.clientY;
        initialValue.current = value;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        const deltaY = initialDragY.current - e.clientY;
        const range = max - min;
        const newValue = initialValue.current + (deltaY / 150) * range;
        const clampedValue = Math.max(min, Math.min(max, newValue));
        onChange(clampedValue);
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    const rotation = ((value - min) / (max - min)) * 270 - 135;

    return (
        <div className="flex flex-col items-center justify-start gap-1 w-20 h-24 text-center">
            <div ref={knobRef} onMouseDown={handleMouseDown}
                className="relative rounded-full bg-slate-900 border-2 border-slate-700 cursor-ns-resize select-none"
                style={{ width: size, height: size }}>
                <div className="absolute top-1/2 left-1/2 w-1 h-1/2 bg-neon-cyan rounded-full origin-top-left shadow-[0_0_4px_var(--neon-cyan)]"
                    style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }} />
            </div>
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">{label}</label>
            <span className="text-xs font-mono text-neon-cyan">{valueFormat(value)}</span>
        </div>
    );
};

const WideSpectrumAnalyzer = ({ analyserNode, isPowerOn }: { analyserNode: AnalyserNode | null, isPowerOn: boolean }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!isPowerOn || !analyserNode || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId: number;

        const renderFrame = () => {
            if (!ctx) return;
            const bufferLength = analyserNode.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyserNode.getByteFrequencyData(dataArray);

            ctx.fillStyle = 'rgba(13, 13, 26, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i];
                const hue = 180 + (barHeight / 255) * 60; // From cyan to green
                ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
                ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
                x += barWidth + 1;
            }
            animationFrameId = requestAnimationFrame(renderFrame);
        };
        renderFrame();
        return () => cancelAnimationFrame(animationFrameId);
    }, [isPowerOn, analyserNode]);

    return (
        <div className="w-full h-24 card-bg border-b-2 border-neon-cyan/30 rounded-t-lg p-2 shadow-inner-strong">
            <canvas ref={canvasRef} width="1000" height="80" className="w-full h-full"></canvas>
        </div>
    );
};

const Deck = ({ deckId, onFileChange, onPlayPause, onBpmChange, isPlaying, isPowerOn, trackName, bpm }: { deckId: string, onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void, onPlayPause: () => void, onBpmChange: (e: React.ChangeEvent<HTMLInputElement>) => void, isPlaying: boolean, isPowerOn: boolean, trackName: string, bpm: number }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    return (
        <div className="w-full md:w-1/4 flex-grow flex flex-col items-center justify-between p-4 card-bg rounded-lg border border-neon-purple/20 gap-4">
            <div className="w-full text-center">
                <p className="font-bold text-xl neon-text-pink">DECK {deckId}</p>
                <p className="h-6 text-xs text-gray-300 truncate">{trackName || 'NO TRACK LOADED'}</p>
            </div>
            <div className="relative w-48 h-48 my-4">
                <svg viewBox="0 0 100 100" className={`w-full h-full absolute top-0 left-0 ${isPlaying && isPowerOn ? 'animate-spin-slow' : ''}`}>
                    <circle cx="50" cy="50" r="48" fill="none" stroke="url(#grad)" strokeWidth="4"/>
                    <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{stopColor: 'var(--neon-cyan)', stopOpacity:1}} />
                            <stop offset="100%" style={{stopColor: 'var(--neon-pink)', stopOpacity:1}} />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-40 h-40 rounded-full bg-slate-900 shadow-inner-strong flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-slate-700"></div>
                    </div>
                </div>
            </div>
            <div className="w-full flex flex-col gap-3">
                 <div className="flex items-center gap-2">
                    <label className="text-sm font-bold text-gray-300">BPM:</label>
                    <input type="number" value={bpm} onChange={onBpmChange} className="w-20 bg-slate-900 border border-slate-700 rounded p-1 text-center font-mono" />
                </div>
                <div className="flex items-center justify-around w-full gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold">LOAD</button>
                    <button onClick={onPlayPause} disabled={!trackName} className={`flex-1 py-2 rounded text-sm font-bold ${isPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'} disabled:bg-gray-600`}>
                        {isPlaying ? 'PAUSE' : 'PLAY'}
                    </button>
                </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={onFileChange} accept=".mp3" className="hidden" />
        </div>
    );
};

// --- Main DJ Mixer Page Component ---

interface DeckChannelNodes {
    source: AudioBufferSourceNode | null;
    low: BiquadFilterNode;
    mid: BiquadFilterNode;
    high: BiquadFilterNode;
    vol: GainNode;
    crossfadeGain: GainNode;
}

export default function DJMixerPage() {
    const [isPowerOn, setIsPowerOn] = useState(false);
    const [deckA, setDeckA] = useState({ file: null, buffer: null as AudioBuffer | null, isPlaying: false, name: '', bpm: 120 });
    const [deckB, setDeckB] = useState({ file: null, buffer: null as AudioBuffer | null, isPlaying: false, name: '', bpm: 120 });
    const [mixer, setMixer] = useState({
        crossfader: 0,
        volA: 0.75, volB: 0.75,
        eqA: { low: 0, mid: 0, high: 0 },
        eqB: { low: 0, mid: 0, high: 0 },
    });
    const [masterAnalyser, setMasterAnalyser] = useState<AnalyserNode | null>(null);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const nodesRef = useRef<{ a: Partial<DeckChannelNodes>, b: Partial<DeckChannelNodes> }>({ a: {}, b: {} });

    const createAudioGraph = useCallback((context: AudioContext) => {
        const masterGain = context.createGain();
        const analyser = context.createAnalyser();
        analyser.fftSize = 2048;
        masterGain.connect(analyser).connect(context.destination);
        setMasterAnalyser(analyser);

        (['a', 'b'] as const).forEach(deckId => {
            const channel: Partial<DeckChannelNodes> = {};
            channel.source = null; // will be created on play
            channel.low = context.createBiquadFilter();
            channel.low.type = 'lowshelf';
            channel.low.frequency.value = 320;
            channel.mid = context.createBiquadFilter();
            channel.mid.type = 'peaking';
            channel.mid.frequency.value = 1000;
            channel.mid.Q.value = 0.7;
            channel.high = context.createBiquadFilter();
            channel.high.type = 'highshelf';
            channel.high.frequency.value = 3200;
            channel.vol = context.createGain();
            channel.crossfadeGain = context.createGain();

            channel.low.connect(channel.mid);
            channel.mid.connect(channel.high);
            channel.high.connect(channel.vol);
            channel.vol.connect(channel.crossfadeGain);
            channel.crossfadeGain.connect(masterGain);
            nodesRef.current[deckId] = channel;
        });
    }, []);
    
    const handlePowerToggle = () => {
        if (isPowerOn) {
            audioCtxRef.current?.close().then(() => {
                audioCtxRef.current = null;
                setMasterAnalyser(null);
                setDeckA(d => ({ ...d, isPlaying: false }));
                setDeckB(d => ({ ...d, isPlaying: false }));
                setIsPowerOn(false);
            });
        } else {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioCtxRef.current = context;
            createAudioGraph(context);
            setIsPowerOn(true);
        }
    };
    
    const handleFileChange = (deckId: 'a' | 'b', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !isPowerOn || !audioCtxRef.current) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            audioCtxRef.current!.decodeAudioData(ev.target!.result as ArrayBuffer, (buffer) => {
                const updater = deckId === 'a' ? setDeckA : setDeckB;
                updater(d => ({ ...d, file, buffer, name: file.name }));
            });
        };
        reader.readAsArrayBuffer(file);
    };

    const playPause = (deckId: 'a' | 'b') => {
        if (!isPowerOn || !audioCtxRef.current) return;
        const deck = deckId === 'a' ? deckA : deckB;
        const setDeck = deckId === 'a' ? setDeckA : setDeckB;
        const nodes = nodesRef.current[deckId];
        
        if (deck.isPlaying) {
            nodes.source?.stop();
            nodes.source = null;
            setDeck(d => ({ ...d, isPlaying: false }));
        } else if (deck.buffer) {
            nodes.source = audioCtxRef.current.createBufferSource();
            nodes.source.buffer = deck.buffer;
            nodes.source.connect(nodes.low!);
            nodes.source.start(0);
            nodes.source.onended = () => {
                setDeck(d => ({...d, isPlaying: false }));
                if (nodesRef.current[deckId]) {
                    nodesRef.current[deckId]!.source = null;
                }
            }
            setDeck(d => ({...d, isPlaying: true }));
        }
    };
    
    const handleMixerChange = (param: keyof typeof mixer, value: any) => {
        setMixer(m => ({ ...m, [param]: value }));
    };

    const handleEqChange = (deckId: 'a' | 'b', band: 'low' | 'mid' | 'high', value: number) => {
        const deckKey = `eq${deckId.toUpperCase()}` as 'eqA' | 'eqB';
        setMixer(m => ({...m, [deckKey]: {...m[deckKey], [band]: value }}));
    };
    
    const handleSyncBpm = (from: 'a' | 'b', to: 'a' | 'b') => {
        const fromDeck = from === 'a' ? deckA : deckB;
        const setToDeck = to === 'a' ? setDeckA : setDeckB;
        setToDeck(d => ({...d, bpm: fromDeck.bpm}));
    }

    // Update audio params on state change
    useEffect(() => {
        if (!isPowerOn || !audioCtxRef.current) return;
        const nodes = nodesRef.current;
        const time = audioCtxRef.current.currentTime;
        
        // Volumes
        nodes.a.vol?.gain.setTargetAtTime(mixer.volA, time, 0.01);
        nodes.b.vol?.gain.setTargetAtTime(mixer.volB, time, 0.01);

        // Crossfader (Equal Power)
        const xf = mixer.crossfader;
        nodes.a.crossfadeGain?.gain.setTargetAtTime(Math.sqrt(0.5 * (1 - xf)), time, 0.01);
        nodes.b.crossfadeGain?.gain.setTargetAtTime(Math.sqrt(0.5 * (1 + xf)), time, 0.01);
        
        // EQs
        (Object.keys(mixer.eqA) as Array<keyof typeof mixer.eqA>).forEach((band) => {
            nodes.a[band]?.gain.setTargetAtTime(mixer.eqA[band], time, 0.01)
        });
        (Object.keys(mixer.eqB) as Array<keyof typeof mixer.eqB>).forEach((band) => {
            nodes.b[band]?.gain.setTargetAtTime(mixer.eqB[band], time, 0.01)
        });

    }, [mixer, isPowerOn]);

    return (
        <div className="flex-grow flex flex-col bg-slate-900/50 border border-gray-700 rounded-lg shadow-2xl overflow-hidden h-full">
            <style>{`
                .animate-spin-slow { animation: spin 5s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .shadow-inner-strong { box-shadow: inset 0 4px 15px rgba(0,0,0,0.5); }
                input[type=range].vertical { -webkit-appearance: slider-vertical; }
            `}</style>
            <WideSpectrumAnalyzer analyserNode={masterAnalyser} isPowerOn={isPowerOn} />
            <div className="flex-grow flex flex-col md:flex-row gap-4 p-4 min-h-0">
                <Deck deckId="A" onFileChange={(e) => handleFileChange('a', e)} onPlayPause={() => playPause('a')} isPlaying={deckA.isPlaying} isPowerOn={isPowerOn} trackName={deckA.name} bpm={deckA.bpm} onBpmChange={(e) => setDeckA({...deckA, bpm: parseInt(e.target.value)})} />

                {/* --- Mixer --- */}
                <div className="w-full md:w-1/2 flex-grow flex flex-col p-4 card-bg rounded-lg border border-neon-cyan/20 justify-between">
                    <div className="flex justify-center items-start gap-4">
                        {/* Channel A */}
                        <div className="flex flex-col items-center gap-2">
                            <p className="font-bold text-lg neon-text-pink">A</p>
                            <Knob label="HIGH" value={mixer.eqA.high} min={-24} max={12} onChange={v => handleEqChange('a', 'high', v)} valueFormat={v => v.toFixed(1) + 'db'}/>
                            <Knob label="MID" value={mixer.eqA.mid} min={-24} max={12} onChange={v => handleEqChange('a', 'mid', v)} valueFormat={v => v.toFixed(1) + 'db'}/>
                            <Knob label="LOW" value={mixer.eqA.low} min={-24} max={12} onChange={v => handleEqChange('a', 'low', v)} valueFormat={v => v.toFixed(1) + 'db'}/>
                            <input type="range" min="0" max="1" step="0.01" value={mixer.volA} onChange={(e) => handleMixerChange('volA', parseFloat(e.target.value))} className="vertical w-4 h-32 mt-4"/>
                             <button onClick={() => handleSyncBpm('b', 'a')} className="mt-4 text-xs bg-slate-600 hover:bg-slate-500 rounded px-2 py-1">SYNC</button>
                        </div>
                        {/* Power */}
                        <div className="flex flex-col items-center pt-8">
                             <button onClick={handlePowerToggle} className={`p-4 rounded-full transition-all ${isPowerOn ? 'bg-neon-cyan text-black shadow-[0_0_15px_var(--neon-cyan)]' : 'bg-slate-700 text-gray-400'}`}>
                                <PowerIcon />
                             </button>
                        </div>
                         {/* Channel B */}
                        <div className="flex flex-col items-center gap-2">
                            <p className="font-bold text-lg neon-text-pink">B</p>
                            <Knob label="HIGH" value={mixer.eqB.high} min={-24} max={12} onChange={v => handleEqChange('b', 'high', v)} valueFormat={v => v.toFixed(1) + 'db'}/>
                            <Knob label="MID" value={mixer.eqB.mid} min={-24} max={12} onChange={v => handleEqChange('b', 'mid', v)} valueFormat={v => v.toFixed(1) + 'db'}/>
                            <Knob label="LOW" value={mixer.eqB.low} min={-24} max={12} onChange={v => handleEqChange('b', 'low', v)} valueFormat={v => v.toFixed(1) + 'db'}/>
                            <input type="range" min="0" max="1" step="0.01" value={mixer.volB} onChange={(e) => handleMixerChange('volB', parseFloat(e.target.value))} className="vertical w-4 h-32 mt-4"/>
                            <button onClick={() => handleSyncBpm('a', 'b')} className="mt-4 text-xs bg-slate-600 hover:bg-slate-500 rounded px-2 py-1">SYNC</button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        <span className="font-bold text-sm neon-text-pink">A</span>
                        <input type="range" min="-1" max="1" step="0.01" value={mixer.crossfader} onChange={(e) => handleMixerChange('crossfader', parseFloat(e.target.value))} className="w-full"/>
                        <span className="font-bold text-sm neon-text-pink">B</span>
                    </div>
                </div>

                <Deck deckId="B" onFileChange={(e) => handleFileChange('b', e)} onPlayPause={() => playPause('b')} isPlaying={deckB.isPlaying} isPowerOn={isPowerOn} trackName={deckB.name} bpm={deckB.bpm} onBpmChange={(e) => setDeckB({...deckB, bpm: parseInt(e.target.value)})}/>
            </div>
        </div>
    );
}
