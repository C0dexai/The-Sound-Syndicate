
import React, { useState } from 'react';
import { LayoutGridIcon, UsersIcon, WorkflowIcon, SlidersHorizontalIcon, PlusIcon, BrainCircuitIcon, MusicIcon, MicrophoneIcon } from './icons/Icons';
import { ViewType } from '../App';

interface FloatingNavProps {
  setCurrentView: (view: ViewType) => void;
}

const viewIcons: { view: ViewType; icon: React.FC; name: string }[] = [
  { view: 'dj', icon: SlidersHorizontalIcon, name: 'DJ Mixer' },
  { view: 'voice', icon: MicrophoneIcon, name: 'Sound Lab' },
  { view: 'promptdj', icon: MusicIcon, name: 'PromptDJ' },
  { view: 'inference', icon: UsersIcon, name: 'Team Chat' },
  { view: 'workflow', icon: WorkflowIcon, name: 'Workflow' },
  { view: 'orchestration', icon: BrainCircuitIcon, name: 'Orchestration' },
];

const FloatingNav: React.FC<FloatingNavProps> = ({ setCurrentView }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative flex flex-col items-center gap-3">
        {/* Menu Items */}
        <div className={`flex flex-col items-center gap-3 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 scale-90 -translate-y-2 pointer-events-none'}`}>
          {viewIcons.map((item) => (
              <button
                key={item.view}
                onClick={() => {
                    setCurrentView(item.view);
                    setIsOpen(false);
                }}
                className="p-3 rounded-full bg-slate-700 text-neon-cyan hover:bg-neon-cyan hover:text-black hover:scale-110 shadow-lg transition-all"
                aria-label={`Switch to ${item.name} view`}
                title={item.name}
              >
                  <item.icon />
              </button>
          ))}
        </div>
        
        {/* Main Orb Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-neon-cyan transition-transform duration-200 hover:scale-110 focus:outline-none border-2 border-neon-cyan/50"
          aria-expanded={isOpen}
          aria-label="Toggle navigation menu"
        >
          <div className="absolute inset-0 rounded-full bg-neon-cyan opacity-20 animate-pulse"></div>
          <div className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>
            <PlusIcon />
          </div>
        </button>
      </div>
    </div>
  );
};

export default FloatingNav;
