
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Agent } from '../agents';
import { Message } from '../types';
import { PaperAirplaneIcon, TerminalIcon } from './icons/Icons';

interface InferencePageProps {
  agents: Agent[];
  selectedAgentName: string;
  setSelectedAgentName: (name: string) => void;
  messages: Message[];
  onCommand: (command: string) => void;
  isLoading: boolean;
}

const InferencePage: React.FC<InferencePageProps> = ({
  agents,
  selectedAgentName,
  setSelectedAgentName,
  messages,
  onCommand,
  isLoading
}) => {
  const [input, setInput] = useState('');
  const logEndRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  
  const activeAgent = agents.find(a => a.name === selectedAgentName) || agents[0];

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const activeTab = tabsRef.current?.querySelector(`[data-agent-name="${selectedAgentName}"]`);
    activeTab?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selectedAgentName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onCommand(input.trim());
      setInput('');
    }
  };

  const handlePromptClick = (prompt: string) => {
    if (!isLoading) {
      onCommand(prompt);
    }
  };

  const handleTabClick = (agentName: string) => {
    setSelectedAgentName(agentName);
  };
  
  return (
    <div className="flex-grow flex flex-col card-bg border border-neon-purple/20 rounded-lg shadow-lg overflow-hidden">
      {/* Tabs */}
      <div ref={tabsRef} className="flex-shrink-0 border-b border-neon-purple/20 overflow-x-auto whitespace-nowrap no-scrollbar">
        <nav className="flex space-x-2 p-2">
          {agents.map(agent => (
            <button
              key={agent.name}
              data-agent-name={agent.name}
              onClick={() => handleTabClick(agent.name)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                selectedAgentName === agent.name
                  ? 'bg-neon-cyan text-black font-bold shadow-[0_0_10px_var(--neon-cyan)]'
                  : 'text-gray-300 hover:bg-slate-700/50 hover:text-neon-cyan'
              }`}
            >
              {agent.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-grow flex flex-col overflow-y-auto p-4">
        {/* Agent Header */}
        <div className="flex-shrink-0 mb-4 pb-4 border-b border-neon-purple/20">
           <h2 className="text-2xl font-bold text-white">{activeAgent.name}</h2>
           <p className="neon-text-cyan">{activeAgent.role}</p>
           <p className="text-sm text-gray-400 mt-1 italic">"{activeAgent.personality}"</p>
        </div>

        {/* Contextual Prompts */}
        <div className="flex-shrink-0 mb-4">
            <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">Suggested Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {activeAgent.suggested_prompts.map((prompt, index) => (
                    <button 
                        key={index}
                        onClick={() => handlePromptClick(prompt)}
                        disabled={isLoading}
                        className="text-left p-3 bg-slate-800/50 hover:bg-slate-700/80 rounded-lg border border-neon-purple/30 hover:border-neon-purple/70 transition-all text-sm text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {prompt}
                    </button>
                ))}
            </div>
        </div>

        {/* Chat Log */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4 font-mono text-sm bg-slate-900/40 rounded-lg border border-neon-purple/20">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.sender === 'USER' ? (
                  <div className="flex items-start gap-2">
                    <span className="neon-text-cyan flex-shrink-0 mt-0.5"><TerminalIcon/></span>
                    <p className="text-gray-200 whitespace-pre-wrap flex-1">{msg.text}</p>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-800/80 rounded-lg border border-neon-pink/30 space-y-2">
                     <p className="font-bold neon-text-pink">{msg.sender}</p>
                     <p className="text-gray-300 whitespace-pre-wrap">{msg.text}</p>
                  </div>
                )}
              </div>
            ))}
             {isLoading && (
                <div className="p-3">
                  <div className="flex items-center gap-3 text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neon-cyan"></div>
                    <span>CASSA VEGAS is on it...</span>
                  </div>
                </div>
            )}
            <div ref={logEndRef} />
        </div>
      </div>
      
      {/* Chat Input */}
       <form onSubmit={handleSubmit} className="flex-shrink-0 p-3 border-t border-neon-purple/20 flex items-center gap-3 bg-slate-900/70">
         <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message ${activeAgent.name}...`}
          className="flex-grow bg-transparent text-gray-100 focus:outline-none placeholder-gray-500"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()} className="p-2 rounded-md bg-cyan-600 text-white hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors hover:shadow-[0_0_8px_var(--neon-cyan)]">
          <PaperAirplaneIcon />
        </button>
      </form>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default InferencePage;
