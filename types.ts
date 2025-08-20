

export enum Priority {
  None = 'None',
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical',
}

export enum Status {
  Backlog = 'Backlog',
  ToDo = 'To Do',
  InProgress = 'In Progress',
  InReview = 'In Review',
  Done = 'Done',
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  critique?: string;
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

export interface WorkflowStep {
  name: string;
  agentName: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  artifactName: string;
  artifactContent?: string;
  description: string;
  error?: string;
}

// Types for Orchestration Page
export interface KnowledgeBaseItem {
  id: string;
  name: string;
  version: string;
  status: 'synced' | 'pending' | 'syncing' | 'conflict' | 'updated';
  lastUpdatedBy?: 'Lyra' | 'Kara';
}

export interface OrchestrationLogEntry {
  id: string;
  speaker: 'Lyra' | 'Kara' | 'System';
  text: string;
  timestamp: string;
}

export interface MetaInsight {
  id: string;
  source: 'Gemini' | 'OpenAI';
  text: string;
  type: 'suggestion' | 'analysis' | 'warning';
}

// Types for PromptDJ Page
export interface AudioParams {
  name: string;
  description: string;
  waveform: 'sine' | 'square' | 'sawtooth' | 'triangle';
  baseFrequency: number;
  duration: number;
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  filter?: {
    type: BiquadFilterType;
    frequency: number;
    q: number;
  };
  reverb?: {
      decay: number;
      mix: number;
  };
}

export interface MidiNote {
  note: number;
  velocity: number;
  start: number;
  duration: number;
}

export interface MidiSequence {
  name:string;
  description: string;
  bpm: number;
  notes: MidiNote[];
}

export interface PromptDJAsset {
  id: string;
  prompt: string;
  type: 'audio' | 'midi';
  data: AudioParams | MidiSequence;
  isPlaying: boolean;
}
