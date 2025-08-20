
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PowerIcon, BrainCircuitIcon } from './icons/Icons';

// A reusable Knob component
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
        const newValue = initialValue.current + (deltaY / 150) * range; // 150 pixels of drag for full range
        const clampedValue = Math.max(min, Math.min(max, newValue));
        onChange(clampedValue);
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    const rotation = ((value - min) / (max - min)) * 270 - 135;

    return (
        <div className="flex flex-col items-center justify-start gap-1 w-24 h-28 text-center">
            <div
                ref={knobRef}
                onMouseDown={handleMouseDown}
                className="relative rounded-full bg-slate-900 border-2 border-slate-700 cursor-ns-resize select-none"
                style={{ width: size, height: size }}
            >
                <div
                    className="absolute top-1/2 left-1/2 w-1 h-1/2 bg-neon-cyan rounded-full origin-top-left shadow-[0_0_4px_var(--neon-cyan)]"
                    style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
                />
            </div>
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">{label}</label>
            <span className="text-xs font-mono text-neon-cyan">{valueFormat(value)}</span>
        </div>
    );
};


const SoundMatrixMixer: React.FC = () => {
    const [isOn, setIsOn] = useState(false);
    const [params, setParams] = useState({
        bpm: 120,
        kickMix: 0.9,
        snareMix: 0.7,
        hatMix: 0.5,
        bassWave: 0, // 0:sine, 1:square, 2:saw
        bassCutoff: 350,
        bassDecay: 0.3,
        padSwell: 1.5,
        padFilter: 2000,
        padReverb: 0.6,
        masterVolume: 0.6,
        masterPunch: 4, // Compressor ratio
    });

    const audioCtxRef = useRef<AudioContext | null>(null);
    const nodesRef = useRef<any>({});
    const stepRef = useRef(0);
    const lastStepTimeRef = useRef(0);
    const animationFrameRef = useRef<number | null>(null);

    const handleParamChange = (param: keyof typeof params, value: number) => {
        setParams(p => ({ ...p, [param]: value }));
    };

    // Main audio engine scheduler
    const scheduler = useCallback((timestamp: number) => {
        const secondsPerBeat = 60.0 / params.bpm;
        if (timestamp > lastStepTimeRef.current + secondsPerBeat * 1000) {
            const context = audioCtxRef.current;
            const audioNodes = nodesRef.current;
            if (!context || !audioNodes.kick) return;

            const time = context.currentTime;

            // Kick
            if (stepRef.current % 4 === 0 && params.kickMix > 0) {
                audioNodes.kick.osc.frequency.setValueAtTime(150, time);
                audioNodes.kick.osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
                audioNodes.kick.gain.gain.setValueAtTime(params.kickMix, time);
                audioNodes.kick.gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
            }
            // Snare
            if (stepRef.current % 4 === 2 && params.snareMix > 0) {
                audioNodes.snare.gain.gain.setValueAtTime(params.snareMix, time);
                audioNodes.snare.gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
            }
            // Hi-hat
            if (stepRef.current % 2 === 1 && params.hatMix > 0) {
                 audioNodes.hat.gain.gain.setValueAtTime(params.hatMix * 0.5, time);
                 audioNodes.hat.gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
            }

            // Bassline
            if (stepRef.current % 4 === 0) {
                audioNodes.bass.gain.gain.setValueAtTime(1, time);
                audioNodes.bass.gain.gain.exponentialRampToValueAtTime(0.001, time + params.bassDecay);
            }

            stepRef.current = (stepRef.current + 1) % 16;
            lastStepTimeRef.current = timestamp;
        }
        animationFrameRef.current = requestAnimationFrame(scheduler);
    }, [params]);


    const stopEngine = useCallback(() => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        audioCtxRef.current?.close().then(() => {
            audioCtxRef.current = null;
            nodesRef.current = {};
            setIsOn(false);
        });
    }, []);

    const startEngine = useCallback(async () => {
        if (audioCtxRef.current) return;
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = context;

        // --- Master Output ---
        const masterVolume = context.createGain();
        masterVolume.gain.value = params.masterVolume;
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -20;
        compressor.knee.value = 30;
        compressor.ratio.value = params.masterPunch;
        compressor.attack.value = 0;
        compressor.release.value = 0.25;
        masterVolume.connect(compressor).connect(context.destination);
        
        // --- Pad ---
        const padOsc1 = context.createOscillator();
        const padOsc2 = context.createOscillator();
        padOsc1.type = 'sawtooth';
        padOsc2.type = 'sawtooth';
        padOsc1.frequency.value = 110;
        padOsc2.frequency.value = 110.5; // Detune
        const padFilter = context.createBiquadFilter();
        padFilter.type = 'lowpass';
        padFilter.frequency.value = params.padFilter;
        const padGain = context.createGain();
        padGain.gain.setValueAtTime(0, context.currentTime);
        padGain.gain.linearRampToValueAtTime(0.2, context.currentTime + params.padSwell);
        padOsc1.connect(padFilter);
        padOsc2.connect(padFilter);
        padFilter.connect(padGain);
        // Reverb for Pad
        const convolver = context.createConvolver();
        const impulse = context.createBuffer(2, context.sampleRate * 2, context.sampleRate);
        for(let i=0; i < impulse.getChannelData(0).length; i++) {
            impulse.getChannelData(0)[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulse.length, 3);
            impulse.getChannelData(1)[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulse.length, 3);
        }
        convolver.buffer = impulse;
        const wetGain = context.createGain();
        wetGain.gain.value = params.padReverb;
        const dryGain = context.createGain();
        dryGain.gain.value = 1 - params.padReverb;
        padGain.connect(convolver).connect(wetGain).connect(masterVolume);
        padGain.connect(dryGain).connect(masterVolume);
        padOsc1.start(); padOsc2.start();

        // --- Rhythm Section ---
        const kickOsc = context.createOscillator(); kickOsc.start();
        const kickGain = context.createGain(); kickGain.gain.value = 0;
        kickOsc.connect(kickGain).connect(masterVolume);

        const noiseBufferSize = context.sampleRate * 2;
        const noiseBuffer = context.createBuffer(1, noiseBufferSize, context.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBufferSize; i++) output[i] = Math.random() * 2 - 1;

        const snareSource = context.createBufferSource(); snareSource.buffer = noiseBuffer; snareSource.loop = true;
        const snareFilter = context.createBiquadFilter(); snareFilter.type = 'bandpass'; snareFilter.frequency.value = 1500;
        const snareGain = context.createGain(); snareGain.gain.value = 0;
        snareSource.connect(snareFilter).connect(snareGain).connect(masterVolume);
        snareSource.start();

        const hatSource = context.createBufferSource(); hatSource.buffer = noiseBuffer; hatSource.loop = true;
        const hatFilter = context.createBiquadFilter(); hatFilter.type = 'highpass'; hatFilter.frequency.value = 7000;
        const hatGain = context.createGain(); hatGain.gain.value = 0;
        hatSource.connect(hatFilter).connect(hatGain).connect(masterVolume);
        hatSource.start();

        // --- Bass ---
        const bassOsc = context.createOscillator(); bassOsc.frequency.value = 55;
        const bassFilter = context.createBiquadFilter(); bassFilter.type = 'lowpass'; bassFilter.frequency.value = params.bassCutoff;
        const bassGain = context.createGain(); bassGain.gain.value = 0;
        bassOsc.connect(bassFilter).connect(bassGain).connect(masterVolume);
        bassOsc.start();

        nodesRef.current = {
            master: { volume: masterVolume, compressor },
            pad: { osc1: padOsc1, osc2: padOsc2, filter: padFilter, gain: padGain, reverb: {convolver, wet: wetGain, dry: dryGain} },
            kick: { osc: kickOsc, gain: kickGain },
            snare: { source: snareSource, filter: snareFilter, gain: snareGain },
            hat: { source: hatSource, filter: hatFilter, gain: hatGain },
            bass: { osc: bassOsc, filter: bassFilter, gain: bassGain }
        };
        setIsOn(true);
    }, [params]);

    // Update audio params from state changes
    useEffect(() => {
        if (!isOn || !audioCtxRef.current) return;
        const audioNodes = nodesRef.current;
        const time = audioCtxRef.current.currentTime;
        const bassWaves: OscillatorType[] = ['sine', 'square', 'sawtooth'];

        if (audioNodes.master) {
            audioNodes.master.volume.gain.setTargetAtTime(params.masterVolume, time, 0.02);
            audioNodes.master.compressor.ratio.setTargetAtTime(params.masterPunch, time, 0.02);
        }
        if (audioNodes.pad) {
            audioNodes.pad.filter.frequency.setTargetAtTime(params.padFilter, time, 0.05);
            audioNodes.pad.reverb.wet.gain.setTargetAtTime(params.padReverb, time, 0.05);
            audioNodes.pad.reverb.dry.gain.setTargetAtTime(1 - params.padReverb, time, 0.05);
        }
        if (audioNodes.bass) {
            audioNodes.bass.osc.type = bassWaves[Math.round(params.bassWave)];
            audioNodes.bass.filter.frequency.setTargetAtTime(params.bassCutoff, time, 0.02);
        }
    }, [params, isOn]);

    useEffect(() => {
        if (isOn) {
            stepRef.current = 0;
            lastStepTimeRef.current = performance.now();
            animationFrameRef.current = requestAnimationFrame(scheduler);
        } else {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isOn, scheduler]);


    return (
        <div className="card-bg border border-neon-purple/20 rounded-lg shadow-lg p-4">
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold neon-text-pink flex items-center gap-2"><BrainCircuitIcon /> Sonic Matrix</h2>
                <button onClick={() => isOn ? stopEngine() : startEngine()} className={`px-4 py-2 rounded-lg font-semibold text-white transition-all duration-300 flex items-center gap-2 ${isOn ? 'bg-red-600 hover:bg-red-700 shadow-[0_0_10px_#ef4444]' : 'bg-cyan-600 hover:bg-cyan-700 shadow-[0_0_10px_var(--neon-cyan)]'}`}>
                    <PowerIcon className="w-5 h-5"/> {isOn ? 'Power Off' : 'Power On'}
                </button>
            </div>
            <div className="flex flex-wrap justify-center md:justify-around gap-2">
                <div className="p-2 card-bg border border-slate-700 rounded-lg">
                    <h3 className="text-center font-bold neon-text-cyan text-sm mb-2">RHYTHM ENGINE (BEATS)</h3>
                    <div className="flex gap-2">
                        <Knob label="BPM" value={params.bpm} min={60} max={180} onChange={v => handleParamChange('bpm', v)} valueFormat={v => v.toFixed(0)} />
                        <Knob label="KICK" value={params.kickMix} onChange={v => handleParamChange('kickMix', v)} />
                        <Knob label="SNARE" value={params.snareMix} onChange={v => handleParamChange('snareMix', v)} />
                        <Knob label="HAT" value={params.hatMix} onChange={v => handleParamChange('hatMix', v)} />
                    </div>
                </div>
                <div className="p-2 card-bg border border-slate-700 rounded-lg">
                    <h3 className="text-center font-bold neon-text-cyan text-sm mb-2">BASSLINE (GROOVE)</h3>
                    <div className="flex gap-2">
                         <Knob label="WAVE" value={params.bassWave} min={0} max={2} onChange={v => handleParamChange('bassWave', v)} valueFormat={v => ['SIN', 'SQU', 'SAW'][Math.round(v)]} />
                         <Knob label="CUTOFF" value={params.bassCutoff} min={100} max={2000} onChange={v => handleParamChange('bassCutoff', v)} valueFormat={v => v.toFixed(0) + 'hz'} />
                         <Knob label="DECAY" value={params.bassDecay} min={0.1} max={1} onChange={v => handleParamChange('bassDecay', v)} />
                    </div>
                </div>
                <div className="p-2 card-bg border border-slate-700 rounded-lg">
                    <h3 className="text-center font-bold neon-text-cyan text-sm mb-2">AMBIENT PAD (TEXTURE)</h3>
                    <div className="flex gap-2">
                         <Knob label="SWELL" value={params.padSwell} min={0.1} max={4} onChange={v => handleParamChange('padSwell', v)} valueFormat={v => v.toFixed(1) + 's'} />
                         <Knob label="FILTER" value={params.padFilter} min={200} max={8000} onChange={v => handleParamChange('padFilter', v)} valueFormat={v => (v/1000).toFixed(1) + 'k'} />
                         <Knob label="REVERB" value={params.padReverb} onChange={v => handleParamChange('padReverb', v)} />
                    </div>
                </div>
                 <div className="p-2 card-bg border border-slate-700 rounded-lg">
                    <h3 className="text-center font-bold neon-text-cyan text-sm mb-2">MASTER (MIX)</h3>
                    <div className="flex gap-2">
                         <Knob label="VOLUME" value={params.masterVolume} onChange={v => handleParamChange('masterVolume', v)} />
                         <Knob label="PUNCH" value={params.masterPunch} min={1} max={20} onChange={v => handleParamChange('masterPunch', v)} valueFormat={v => v.toFixed(1) + ':1'} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SoundMatrixMixer;
