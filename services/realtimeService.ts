import { Agent } from '../agents';

const OPENAI_API_KEY = process.env.API_KEY; 

export type SessionState = 'idle' | 'connecting' | 'running' | 'ending' | 'ended' | 'error';

interface RealtimeServiceCallbacks {
  onStateChange: (state: SessionState) => void;
  onUserTranscript: (transcript: string) => void;
  onAgentTranscript: (transcript: string) => void;
  onAgentSpeaking: (isSpeaking: boolean) => void;
}

const TARGET_SAMPLE_RATE = 24000;

// This will be loaded into an AudioWorklet
const processorCode = `
class ResampleProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.inputSampleRate = options.processorOptions.inputSampleRate;
    this.outputSampleRate = options.processorOptions.outputSampleRate;
    this.resampleRatio = this.inputSampleRate / this.outputSampleRate;
    this.buffer = null;
  }

  static get parameterDescriptors() {
    return [];
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const inputData = input[0];
      const newBuffer = this.buffer ? new Float32Array(this.buffer.length + inputData.length) : inputData;
      if (this.buffer) {
        newBuffer.set(this.buffer, 0);
        newBuffer.set(inputData, this.buffer.length);
      }
      this.buffer = newBuffer;
      
      const outputLength = Math.floor(this.buffer.length / this.resampleRatio);
      if (outputLength > 0) {
        const outputData = new Float32Array(outputLength);
        for (let i = 0; i < outputLength; i++) {
          outputData[i] = this.buffer[Math.floor(i * this.resampleRatio)];
        }
        
        const pcmData = this.float32To16bitPCM(outputData);
        this.port.postMessage(pcmData, [pcmData.buffer]);
        
        this.buffer = this.buffer.slice(outputLength * this.resampleRatio);
      }
    }
    return true;
  }
  
  float32To16bitPCM(input) {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  }
}
registerProcessor('resample-processor', ResampleProcessor);
`;


class RealtimeService {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  
  private agentAudioQueue: Uint8Array[] = [];
  private isPlayingAgentAudio = false;
  
  private callbacks: RealtimeServiceCallbacks = {
    onStateChange: () => {},
    onUserTranscript: () => {},
    onAgentTranscript: () => {},
    onAgentSpeaking: () => {},
  };

  init(callbacks: RealtimeServiceCallbacks) {
    this.callbacks = callbacks;
  }

  private setState(state: SessionState) {
    this.callbacks.onStateChange(state);
  }
  
  async startSession(agent: Agent) {
    if (this.ws || !OPENAI_API_KEY) return;
    this.setState('connecting');

    try {
      const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview",
          modalities: ["audio", "text"],
          instructions: agent.personality_prompt,
          voice: "alloy", // Can be configured later
          input_audio_format: "pcm16",
          output_audio_format: "pcm16",
          input_audio_transcription: { model: "whisper-1" },
          turn_detection: { type: 'server_vad' }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }
      
      const sessionData = await response.json();
      const clientSecret = sessionData.client_secret?.value;
      if (!clientSecret) {
          throw new Error("Client secret not found in session response.");
      }

      this.ws = new WebSocket(`wss://api.openai.com/v1/realtime/sessions/ws?client_secret=${clientSecret}`);
      this.ws.onopen = () => this.startAudioCapture();
      this.ws.onmessage = (event) => this.handleServerMessage(event.data);
      this.ws.onclose = () => this.endSession();
      this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.setState('error');
          this.endSession();
      };

    } catch (error) {
      console.error('Failed to start session:', error);
      this.setState('error');
    }
  }

  async endSession() {
    this.setState('ending');
    
    this.stopAudioCapture();

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
      this.ws = null;
    }
    
    this.agentAudioQueue = [];
    this.isPlayingAgentAudio = false;

    this.setState('ended');
  }

  private async startAudioCapture() {
    try {
      this.audioContext = new AudioContext();
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const blob = new Blob([processorCode], { type: 'application/javascript' });
      const workletURL = URL.createObjectURL(blob);
      await this.audioContext.audioWorklet.addModule(workletURL);
      
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.workletNode = new AudioWorkletNode(this.audioContext, 'resample-processor', {
        processorOptions: {
          inputSampleRate: this.audioContext.sampleRate,
          outputSampleRate: TARGET_SAMPLE_RATE,
        }
      });

      this.workletNode.port.onmessage = (event) => {
        const pcmData = event.data as Int16Array;
        const base64Data = this.toBase64(pcmData.buffer);
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Data
          }));
        }
      };

      this.sourceNode.connect(this.workletNode);
      this.setState('running');

    } catch (error) {
      console.error('Failed to start audio capture:', error);
      this.setState('error');
      this.endSession();
    }
  }

  private stopAudioCapture() {
    this.mediaStream?.getTracks().forEach(track => track.stop());
    this.sourceNode?.disconnect();
    this.workletNode?.disconnect();
    this.audioContext?.close();

    this.mediaStream = null;
    this.sourceNode = null;
    this.workletNode = null;
    this.audioContext = null;
  }
  
  private handleServerMessage(data: any) {
    try {
      const event = JSON.parse(data);
      switch(event.type) {
        case 'conversation.item.input_audio_transcription.delta':
          this.callbacks.onUserTranscript(event.delta);
          break;
        case 'response.text.delta':
          this.callbacks.onAgentTranscript(event.delta);
          break;
        case 'response.audio.delta':
          if (!this.isPlayingAgentAudio) {
              this.callbacks.onAgentSpeaking(true);
              this.isPlayingAgentAudio = true;
          }
          this.agentAudioQueue.push(this.fromBase64(event.delta));
          this.playAgentAudio();
          break;
        case 'response.done':
        case 'response.cancelled':
            this.isPlayingAgentAudio = false;
            this.callbacks.onAgentSpeaking(false);
            break;
      }
    } catch (error) {
      console.error("Error handling server message", error);
    }
  }
  
  private async playAgentAudio() {
    if (!this.agentAudioQueue.length || !this.audioContext) return;
    
    const audioData = this.agentAudioQueue.shift();
    if (!audioData) return;

    try {
      const pcm16Data = new Int16Array(audioData.buffer);
      const float32Data = new Float32Array(pcm16Data.length);
      for (let i = 0; i < pcm16Data.length; i++) {
        float32Data[i] = pcm16Data[i] / 32768.0;
      }
      
      const audioBuffer = this.audioContext.createBuffer(1, float32Data.length, TARGET_SAMPLE_RATE);
      audioBuffer.copyToChannel(float32Data, 0);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();
      source.onended = () => {
          this.playAgentAudio();
      }
    } catch(e) {
      console.error("Error playing audio", e);
      this.playAgentAudio();
    }
  }
  
  private toBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private fromBase64(base64: string): Uint8Array {
      const binary_string = window.atob(base64);
      const len = binary_string.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
          bytes[i] = binary_string.charCodeAt(i);
      }
      return bytes;
  }
}

export const realtimeService = new RealtimeService();
