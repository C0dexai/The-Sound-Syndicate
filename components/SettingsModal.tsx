
import React, { useState } from 'react';
import { agents } from '../agents';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAgentName: string;
  onSave: (agentName: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentAgentName, onSave }) => {
  const [selectedAgent, setSelectedAgent] = useState(currentAgentName);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(selectedAgent);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card-bg border border-neon-purple/50 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-neon-purple/30">
          <h2 className="text-2xl font-bold neon-text-cyan">AI Configuration</h2>
          <p className="text-gray-400 text-sm mt-1">Select your liaison from the CASSA VEGAS family.</p>
        </div>
        <div className="p-6 flex-grow overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map(agent => (
              <div
                key={agent.name}
                onClick={() => setSelectedAgent(agent.name)}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 h-full flex flex-col
                  ${selectedAgent === agent.name 
                    ? 'border-neon-cyan bg-slate-700/50 shadow-[0_0_15px_var(--neon-cyan)]' 
                    : 'border-slate-700 bg-slate-900/70 hover:border-neon-cyan/50 hover:bg-slate-800'}`}
              >
                <h3 className="text-xl font-bold text-white">{agent.name}</h3>
                <p className="text-sm text-neon-cyan/80 mb-2">{agent.role}</p>
                <p className="text-xs text-gray-400 italic mb-3">"{agent.personality}"</p>
                <div className="mt-auto">
                    <p className="text-xs font-bold uppercase text-gray-500">Skills</p>
                    <p className="text-xs text-gray-300">{agent.skills.join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 bg-slate-950/50 border-t border-neon-purple/30 flex justify-end gap-4">
          <button onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition">Cancel</button>
          <button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition hover:shadow-[0_0_10px_var(--neon-cyan)]">Save Selection</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
