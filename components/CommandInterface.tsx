
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { PaperAirplaneIcon, TerminalIcon } from './icons/Icons';

interface CommandInterfaceProps {
  messages: Message[];
  onCommand: (command: string) => void;
  isLoading: boolean;
}

const CommandInterface: React.FC<CommandInterfaceProps> = ({ messages, onCommand, isLoading }) => {
  const [input, setInput] = useState('');
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onCommand(input.trim());
      setInput('');
    }
  };

  return (
    <div className="dark-bg/80 backdrop-blur-sm border-t border-neon-purple/30 flex flex-col max-h-[50vh] z-10">
      <div className="flex-grow overflow-y-auto p-4 space-y-4 font-mono text-sm">
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.sender === 'USER' ? (
              <div className="flex items-start gap-2">
                <span className="text-neon-cyan flex-shrink-0 mt-0.5"><TerminalIcon/></span>
                <p className="text-gray-200 whitespace-pre-wrap flex-1">{msg.text}</p>
              </div>
            ) : (
              <div className="p-3 bg-slate-800/60 rounded-lg border border-neon-pink/30 space-y-2">
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
      <form onSubmit={handleSubmit} className="flex-shrink-0 p-3 border-t border-neon-purple/30 flex items-center gap-3 bg-dark-bg">
         <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Breakdown a feature... critique a task... ask for advice..."
          className="flex-grow bg-transparent text-gray-100 focus:outline-none placeholder-gray-500"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()} className="p-2 rounded-md bg-cyan-600 text-white hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors hover:shadow-[0_0_8px_var(--neon-cyan)]">
          <PaperAirplaneIcon />
        </button>
      </form>
    </div>
  );
};

export default CommandInterface;
