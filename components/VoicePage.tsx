
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { analyzeSound } from '../services/geminiService';
import { PowerIcon, SparklesIcon, WaveformIcon, BuildingIcon, WavesIcon, BrainCircuitIcon, SlidersHorizontalIcon } from './icons/Icons';

type NodeSettings = { [key: string]: string | number };
type NodeConfig = { id: string; type: string; settings: NodeSettings };
type PatchConfig = { patchName: string; nodes: NodeConfig[]; connections: string[][] };
type AudioNodeMap = Map<string, AudioNode | { input: AudioNode, output: AudioNode }>;

// --- UI Components ---
const Slider = ({ label, min, max, step, value, onChange, unit = '' }: { label: string; min: number; max: number; step: number; value: number; onChange: (value: number) => void; unit?: string; }) => (
    <div className="space-y-1">
        <label className="text-sm font-medium text-gray-400 flex justify-between">
            <span>{label}</span>
            <span className="font-mono">{value.toFixed(2)}{unit}</span>
        </label>
        <input 
            type="range" 
            min={min} max={max} step={step} value={value}
            onChange={e => onChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
    </div>
);

const Select = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) => (
    <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-400">{label}:</label>
        <select value={value} onChange={e => onChange(e.target.value)} className="bg-slate-700 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-neon-cyan">
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

const NODE_META: { [key: string]: { icon: React.FC; color: string, title: string, glow: string } } = {
    Oscillator: { icon: WaveformIcon, color: 'border-purple-500', title: 'Oscillator', glow: 'shadow-[0_0_10px_#9d00ff]' },
    Filter: { icon: SlidersHorizontalIcon, color: 'border-sky-500', title: 'Filter', glow: 'shadow-[0_0_10px_#0ea5e9]' },
    Reverb: { icon: BuildingIcon, color: 'border-blue-500', title: 'Reverb', glow: 'shadow-[0_0_10px_#3b82f6]' },
    Chorus: { icon: WavesIcon, color: 'border-green-500', title: 'Chorus', glow: 'shadow-[0_0_10px_#22c55e]' },
    Analyzer: { icon: BrainCircuitIcon, color: 'border-orange-500', title: 'AI Analyzer', glow: 'shadow-[0_0_10px_#f97316]' },
    Output: { icon: PowerIcon, color: 'border-red-500', title: 'Master Output', glow: 'shadow-[0_0_10px_#ef4444]' },
};

const NodeContainer = ({ node, children, isLive }: { node: NodeConfig, children: React.ReactNode, isLive?: boolean }) => {
    const meta = NODE_META[node.type] || { icon: 'div', color: 'border-gray-700', title: 'Unknown', glow: '' };
    const Icon = meta.icon;
    return (
        <div className={`card-bg p-4 rounded-lg border-t-4 ${meta.color} space-y-4 h-full shadow-lg transition-shadow duration-300 ${isLive ? meta.glow : 'shadow-black/50'}`}>
            <h2 className="font-bold text-white text-lg flex items-center gap-2"><Icon /> {meta.title}</h2>
            {children}
        </div>
    );
};

// --- Audio Helpers ---
const createReverbNode = async (context: AudioContext, decay: number, mix: number) => {
    const reverbTime = Math.max(0.1, decay);
    const length = context.sampleRate * reverbTime;
    const impulse = context.createBuffer(2, length, context.sampleRate);
    for (let c = 0; c < 2; c++) {
        const channelData = impulse.getChannelData(c);
        for (let i = 0; i < length; i++) {
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
        }
    }
    const convolver = context.createConvolver();
    convolver.buffer = impulse;

    const wetGain = context.createGain();
    wetGain.gain.value = mix;
    const dryGain = context.createGain();
    dryGain.gain.value = 1 - mix;
    
    const input = context.createGain();
    const output = context.createGain();

    input.connect(dryGain).connect(output);
    input.connect(convolver).connect(wetGain).connect(output);
    
    return { input, output, convolver, wetGain, dryGain };
}

const createChorusNode = (context: AudioContext, settings: NodeSettings) => {
    const input = context.createGain();
    const output = context.createGain();
    const dry = context.createGain();
    const wet = context.createGain();

    input.connect(dry).connect(output);
    
    const delay = context.createDelay(0.1);
    delay.delayTime.value = 0.03;

    const lfo = context.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = settings.rate as number;

    const depth = context.createGain();
    depth.gain.value = (settings.depth as number) * 0.01;

    lfo.connect(depth).connect(delay.delayTime);
    input.connect(delay).connect(wet).connect(output);
    lfo.start();

    return { input, output, dry, wet, lfo, depth };
}

// --- Main Soundnode Lab Component ---

const initialPatch: PatchConfig = {
  patchName: "Resonant Field",
  nodes: [
    { id: "oscillator1", type: "Oscillator", settings: { waveform: "sine", frequency: 396, volume: 0.4 } },
    { id: "filter1", type: "Filter", settings: { filterType: "bandpass", frequency: 528, Q: 2.5 } },
    { id: "reverb1", type: "Reverb", settings: { decay: 4.5, mix: 0.6 } },
    { id: "chorus1", type: "Chorus", settings: { depth: 0.6, rate: 1.8, mix: 0.5 } },
    { id: "lyraAI", type: "Analyzer", settings: {} },
    { id: "output1", type: "Output", settings: {} }
  ],
  connections: [
    ["oscillator1", "filter1"],
    ["filter1", "reverb1"],
    ["reverb1", "chorus1"],
    ["chorus1", "lyraAI"],
    ["lyraAI", "output1"]
  ]
};

export default function SoundNodeLab() {
    const [isEngineOn, setEngineOn] = useState(false);
    const [patch, setPatch] = useState<PatchConfig>(initialPatch);
    const [suggestion, setSuggestion] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const audioNodesRef = useRef<AudioNodeMap>(new Map());

    const handleSettingChange = (nodeId: string, field: string, value: number | string) => {
        setPatch(p => ({
            ...p,
            nodes: p.nodes.map(n => n.id === nodeId ? { ...n, settings: { ...n.settings, [field]: value } } : n)
        }));
    };

    // Update audio params when sliders change
    useEffect(() => {
        const audioNodes = audioNodesRef.current;
        if (!audioCtxRef.current || audioNodes.size === 0) return;
        
        patch.nodes.forEach(nodeConfig => {
            const audioNodeComponent = audioNodes.get(nodeConfig.id);
            if (!audioNodeComponent) return;

            Object.entries(nodeConfig.settings).forEach(([key, value]) => {
                const paramOwner = (audioNodeComponent as any);
                const param = (paramOwner as any)[key];
                
                if (param instanceof AudioParam) {
                    param.setTargetAtTime(value as number, audioCtxRef.current!.currentTime, 0.02);
                } else if (key === 'waveform' && paramOwner.output instanceof OscillatorNode) {
                    paramOwner.output.type = value as OscillatorType;
                } else if (key === 'volume' && paramOwner.input instanceof GainNode) {
                    paramOwner.input.gain.setTargetAtTime(value as number, audioCtxRef.current!.currentTime, 0.02);
                } else if ((key === 'mix' || key === 'decay') && 'wetGain' in paramOwner) {
                     paramOwner.dryGain.gain.setTargetAtTime(1 - (nodeConfig.settings.mix as number), audioCtxRef.current!.currentTime, 0.02);
                     paramOwner.wetGain.gain.setTargetAtTime(nodeConfig.settings.mix as number, audioCtxRef.current!.currentTime, 0.02);
                }
            });
        });

    }, [patch]);
    
    const stopAudioEngine = useCallback(() => {
        audioNodesRef.current.forEach(node => {
            if ((node as any).output instanceof OscillatorNode) (node as any).output.stop();
        });
        audioCtxRef.current?.close().then(() => {
            audioCtxRef.current = null;
            audioNodesRef.current.clear();
            setEngineOn(false);
        }).catch(console.error);
    }, []);

    const startAudioEngine = useCallback(async () => {
        if (audioCtxRef.current) return;
        try {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioCtxRef.current = context;

            for (const node of patch.nodes) {
                switch (node.type) {
                    case 'Oscillator': {
                        const osc = context.createOscillator();
                        const gain = context.createGain();
                        osc.type = node.settings.waveform as OscillatorType;
                        osc.frequency.value = node.settings.frequency as number;
                        gain.gain.value = node.settings.volume as number;
                        osc.connect(gain);
                        osc.start();
                        audioNodesRef.current.set(node.id, { input: gain, output: osc });
                        break;
                    }
                    case 'Filter': {
                        const filter = context.createBiquadFilter();
                        filter.type = node.settings.filterType as BiquadFilterType;
                        filter.frequency.value = node.settings.frequency as number;
                        filter.Q.value = node.settings.Q as number;
                        audioNodesRef.current.set(node.id, { input: filter, output: filter });
                        break;
                    }
                    case 'Reverb': {
                        const reverb = await createReverbNode(context, node.settings.decay as number, node.settings.mix as number);
                        audioNodesRef.current.set(node.id, reverb);
                        break;
                    }
                    case 'Chorus': {
                        const chorus = createChorusNode(context, node.settings);
                         audioNodesRef.current.set(node.id, chorus);
                        break;
                    }
                    case 'Analyzer':
                         const passThrough = context.createGain();
                         audioNodesRef.current.set(node.id, {input: passThrough, output: passThrough});
                         break;
                    case 'Output':
                        audioNodesRef.current.set(node.id, { input: context.destination, output: context.destination });
                        break;
                }
            }
            
            for (const [fromId, toId] of patch.connections) {
                const fromNode = audioNodesRef.current.get(fromId);
                const toNode = audioNodesRef.current.get(toId);
                if (fromNode && toNode) {
                    const source = (fromNode as any).output ?? fromNode;
                    const destination = (toNode as any).input ?? toNode;
                    source.connect(destination);
                }
            }
            setEngineOn(true);
        } catch (error) {
            console.error("Failed to start audio engine:", error);
            setSuggestion(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [patch]);

    const handleToggleEngine = () => { isEngineOn ? stopAudioEngine() : startAudioEngine(); };

    const handleGetSuggestion = async () => {
        setIsThinking(true);
        setSuggestion('');
        const context = `Current patch is "${patch.patchName}". The goal is to analyze and shape the room's acoustics. Current settings: ${JSON.stringify(patch.nodes.map(n => ({type: n.type, settings: n.settings})))}. Give me a creative idea to enhance this.`;
        const hint = await analyzeSound(context);
        setSuggestion(hint);
        setIsThinking(false);
    };
    
    const renderNodeUI = (node: NodeConfig) => {
        switch (node.type) {
            case 'Oscillator':
                return (
                    <NodeContainer key={node.id} node={node} isLive={isEngineOn}>
                        <Slider label="Volume" min={0} max={1} step={0.01} value={node.settings.volume as number} onChange={v => handleSettingChange(node.id, 'volume', v)} />
                        <Slider label="Frequency" min={20} max={1000} step={1} value={node.settings.frequency as number} onChange={v => handleSettingChange(node.id, 'frequency', v)} unit=" Hz" />
                        <Select label="Waveform" value={node.settings.waveform as string} onChange={v => handleSettingChange(node.id, 'waveform', v)} options={['sine', 'square', 'sawtooth', 'triangle']} />
                    </NodeContainer>
                );
            case 'Filter':
                return (
                    <NodeContainer key={node.id} node={node} isLive={isEngineOn}>
                        <Slider label="Frequency" min={20} max={20000} step={10} value={node.settings.frequency as number} onChange={v => handleSettingChange(node.id, 'frequency', v)} unit=" Hz" />
                        <Slider label="Q-Factor" min={0.1} max={20} step={0.1} value={node.settings.Q as number} onChange={v => handleSettingChange(node.id, 'Q', v)} />
                    </NodeContainer>
                );
            case 'Reverb':
                 return (
                    <NodeContainer key={node.id} node={node} isLive={isEngineOn}>
                        <Slider label="Decay" min={0.1} max={10} step={0.1} value={node.settings.decay as number} onChange={v => handleSettingChange(node.id, 'decay', v)} unit="s" />
                        <Slider label="Mix" min={0} max={1} step={0.01} value={node.settings.mix as number} onChange={v => handleSettingChange(node.id, 'mix', v)} />
                    </NodeContainer>
                );
            case 'Chorus':
                 return (
                    <NodeContainer key={node.id} node={node} isLive={isEngineOn}>
                        <Slider label="Rate" min={0.1} max={10} step={0.1} value={node.settings.rate as number} onChange={v => handleSettingChange(node.id, 'rate', v)} unit=" Hz" />
                        <Slider label="Depth" min={0} max={1} step={0.01} value={node.settings.depth as number} onChange={v => handleSettingChange(node.id, 'depth', v)} />
                        <Slider label="Mix" min={0} max={1} step={0.01} value={node.settings.mix as number} onChange={v => handleSettingChange(node.id, 'mix', v)} />
                    </NodeContainer>
                );
            case 'Analyzer':
                return (
                    <NodeContainer key={node.id} node={node} isLive={isEngineOn}>
                        <p className="text-gray-400 text-sm">This node provides AI-driven creative feedback. Audio passes through unchanged.</p>
                        <button onClick={handleGetSuggestion} disabled={isThinking || !isEngineOn} className="w-full mt-2 px-4 py-2 rounded-lg font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_10px_var(--neon-purple)]">
                            <SparklesIcon/> {isThinking ? 'Analyzing...' : 'Suggest Idea'}
                        </button>
                    </NodeContainer>
                );
            case 'Output':
                return (
                    <NodeContainer key={node.id} node={node} isLive={isEngineOn}>
                        <p className="text-gray-400">Signal is routed to your speakers.</p>
                         {isEngineOn ? (
                            <div className="flex items-center gap-2 font-bold neon-text-green">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-green"></span>
                                </span>
                                LIVE
                            </div>
                        ) : (
                            <div className="text-gray-500 font-bold">OFFLINE</div>
                        )}
                    </NodeContainer>
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 text-white h-full overflow-y-auto">
             <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 p-4 card-bg rounded-lg border border-neon-purple/20">
                <div>
                    <h1 className="text-xl font-bold mb-1 neon-text-cyan">🎛️ Soundnode: {patch.patchName}</h1>
                    <p className="text-sm text-gray-400">An interactive patch for analyzing and shaping sound fields.</p>
                </div>
                <button onClick={handleToggleEngine} className={`px-4 py-2 rounded-lg font-semibold text-white transition-all duration-300 flex items-center gap-2 ${isEngineOn ? 'bg-red-600 hover:bg-red-700 shadow-[0_0_10px_#ef4444]' : 'bg-cyan-600 hover:bg-cyan-700 shadow-[0_0_10px_var(--neon-cyan)]'}`}>
                    <PowerIcon className="w-5 h-5"/> {isEngineOn ? 'Power Off' : 'Power On'}
                </button>
            </div>
             <div className="card-bg p-4 rounded-lg mb-6 border border-neon-purple/20 min-h-[5em] flex items-center">
                <p>
                    <span className="font-bold neon-text-pink">🎧 Lyra's Suggestion:</span> 
                    <span className="ml-2 text-gray-300 italic">{suggestion || 'Power on the engine and ask for a creative audio shaping idea.'}</span>
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {patch.nodes.map(renderNodeUI)}
            </div>
        </div>
    );
}
