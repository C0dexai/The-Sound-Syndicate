
import React, { useState } from 'react';
import { WorkflowStep } from '../types';
import { agents } from '../agents';
import { SparklesIcon } from './icons/Icons';

interface WorkflowPageProps {
  steps: WorkflowStep[];
  isRunning: boolean;
  onStart: (goal: string) => void;
  onViewArtifact: (artifact: WorkflowStep) => void;
}

const getAgentInitial = (name: string) => agents.find(a => a.name === name)?.name.charAt(0) || '?';

const StatusIndicator: React.FC<{ status: WorkflowStep['status'] }> = ({ status }) => {
  switch (status) {
    case 'pending':
      return <div className="h-3 w-3 rounded-full bg-gray-500" title="Pending"></div>;
    case 'running':
      return <div className="h-3 w-3 rounded-full bg-neon-cyan animate-pulse shadow-[0_0_8px_var(--neon-cyan)]" title="Running"></div>;
    case 'complete':
      return <div className="h-3 w-3 rounded-full bg-neon-green shadow-[0_0_8px_var(--neon-green)]" title="Complete"></div>;
    case 'error':
      return <div className="h-3 w-3 rounded-full bg-neon-pink shadow-[0_0_8px_var(--neon-pink)]" title="Error"></div>;
    default:
      return null;
  }
};

const WorkflowPage: React.FC<WorkflowPageProps> = ({ steps, isRunning, onStart, onViewArtifact }) => {
  const [goal, setGoal] = useState('');

  const handleStart = () => {
    if (goal.trim()) {
      onStart(goal.trim());
    }
  };

  return (
    <div className="flex-grow flex flex-col card-bg border border-neon-purple/20 rounded-lg shadow-lg overflow-hidden p-6">
      <div className="flex-shrink-0 pb-4 border-b border-neon-purple/20 mb-6">
        <h2 className="text-2xl font-bold neon-text-cyan">Agent-Driven Audio Environment Design</h2>
        <p className="text-neon-pink/80">Orchestrate a team of AI agents to design and analyze an acoustic space from a single goal.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Panel: Controls */}
        <div className="md:w-1/3 flex-shrink-0 bg-slate-900/40 p-4 rounded-lg border border-neon-purple/20">
          <h3 className="font-bold text-lg text-white mb-2">1. Define Your Goal</h3>
          <p className="text-sm text-gray-400 mb-4">Describe the space or audio project you want the agents to design and analyze.</p>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g., 'Design an acoustically treated home office for voiceover recording and podcasting.'"
            rows={5}
            className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-neon-cyan focus:outline-none"
            disabled={isRunning}
          />
          <button
            onClick={handleStart}
            disabled={isRunning || !goal.trim()}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition hover:shadow-[0_0_10px_var(--neon-cyan)]"
          >
            {isRunning ? 'Orchestration in Progress...' : <> <SparklesIcon /> Generate Design & Analysis </>}
          </button>
        </div>

        {/* Right Panel: Timeline */}
        <div className="flex-grow">
            <h3 className="font-bold text-lg text-white mb-2">2. Monitor the Workflow</h3>
            <p className="text-sm text-gray-400 mb-4">Andoy will task the team to generate the artifacts in sequence.</p>
            <div className="space-y-4">
                {steps.map((step, index) => (
                    <div key={index} className="bg-slate-800/70 p-4 rounded-lg border border-slate-700 flex items-start gap-4">
                       <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-neon-cyan flex items-center justify-center text-lg font-bold text-white shadow-[0_0_8px_var(--neon-cyan)]">
                                {getAgentInitial(step.agentName)}
                            </div>
                       </div>
                       <div className="flex-grow">
                           <div className="flex justify-between items-center">
                                <p className="font-bold neon-text-cyan">{step.agentName}</p>
                                <StatusIndicator status={step.status} />
                           </div>
                           <h4 className="text-md font-semibold text-white mt-1">{step.name}</h4>
                           <p className="text-xs text-gray-400">{step.description}</p>
                           {step.status === 'complete' && (
                               <div className="mt-2 flex items-center justify-between bg-slate-900/50 p-2 rounded-md">
                                   <p className="text-sm font-mono text-gray-300">{step.artifactName}</p>
                                   <button 
                                     onClick={() => onViewArtifact(step)}
                                     className="text-xs bg-slate-700 hover:bg-slate-600 text-white font-semibold py-1 px-3 rounded-md transition"
                                   >
                                       View
                                   </button>
                               </div>
                           )}
                           {step.status === 'error' && (
                                <div className="mt-2 text-xs text-red-400 bg-red-900/30 p-2 rounded-md border border-red-800">
                                    <p className="font-bold">Error:</p>
                                    <p>{step.error}</p>
                                </div>
                           )}
                       </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowPage;
