
import React from 'react';
import { agents } from '../agents';
import { ChevronRightIcon, UsersIcon, WorkflowIcon, MusicIcon, MicrophoneIcon, SlidersHorizontalIcon, BrainCircuitIcon } from './icons/Icons';

interface StartPageProps {
  onEnter: () => void;
}

const features = [
    {
        icon: UsersIcon,
        title: 'AI Team Chat',
        description: 'Collaborate with a specialized team of AI audio experts to solve complex problems and get creative advice.',
    },
    {
        icon: WorkflowIcon,
        title: 'Automated Workflows',
        description: 'Design entire audio environments from a single prompt. Let the AI agents handle the blueprint, analysis, and compliance.',
    },
    {
        icon: MusicIcon,
        title: 'Prompt-to-Sound',
        description: 'Become a sound designer. Generate unique audio samples and MIDI sequences from simple text descriptions.',
    },
    {
        icon: MicrophoneIcon,
        title: 'Interactive Sound Lab',
        description: 'Enter a sonic playground. Sculpt sound in real-time with an interactive modular synthesizer interface.',
    },
    {
        icon: SlidersHorizontalIcon,
        title: 'Virtual DJ Mixer',
        description: 'Load your tracks and mix like a pro. A fully-featured dual-deck DJ setup with EQs, crossfader, and analysis.',
    },
    {
        icon: BrainCircuitIcon,
        title: 'AI Orchestration',
        description: 'Witness true AI collaboration. See agents communicate and sync knowledge across different domains autonomously.',
    },
];


const StartPage: React.FC<StartPageProps> = ({ onEnter }) => {
  return (
    <>
      {/* Background */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('https://images.pexels.com/photos/315918/pexels-photo-315918.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
      </div>

      {/* Scrollable Content */}
      <div className="relative z-10 h-screen overflow-y-auto font-sans antialiased text-gray-100 custom-scrollbar">
        
        {/* Hero Section */}
        <section className="h-screen min-h-[700px] flex flex-col items-center justify-center text-center p-4">
          <div className="animate-fade-in-down">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] neon-text-cyan" style={{textShadow: '0 0 5px var(--neon-cyan), 0 0 15px var(--neon-cyan), 0 0 30px var(--neon-cyan)'}}>
              The Sound Syndicate
            </h1>
            <p className="text-xl md:text-2xl neon-text-pink mt-4 font-mono tracking-wider">
              An AI Collective for Advanced Sound Engineering.
            </p>
            <p className="max-w-3xl mx-auto mt-6 text-gray-300 text-lg">
                Design, analyze, and optimize any acoustic environment. From studio blueprints and live sound analysis to generative music and DJ mixing, control every frequency with the power of a dedicated AI team.
            </p>
            <button
              onClick={onEnter}
              className="mt-12 animate-pulse-slow group flex items-center gap-3 bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-lg shadow-cyan-400/30 hover:shadow-cyan-400/60 transform hover:scale-105 mx-auto"
            >
              Enter The Studio
              <ChevronRightIcon />
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 sm:py-32 bg-dark-bg/80 backdrop-blur-md border-y-2 border-neon-purple/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl neon-text-pink">A Symphony of AI Tools</h2>
                    <p className="mt-4 text-lg leading-8 text-gray-300">Everything you need to master the world of sound.</p>
                </div>
                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="card-bg p-6 rounded-lg border border-neon-purple/20 hover:border-neon-cyan/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,255,255,0.2)] transform hover:-translate-y-1">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-800 rounded-full text-neon-cyan border border-neon-cyan/30">
                                    <feature.icon />
                                </div>
                                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                            </div>
                            <p className="mt-4 text-gray-400">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Meet the Team Section */}
        <section className="py-20 sm:py-32 bg-dark-bg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl neon-text-cyan">Meet the Engineering Team</h2>
                    <p className="mt-4 text-lg leading-8 text-gray-300">Your personal crew of specialized AI agents.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                    {agents.map((agent) => (
                        <div 
                        key={agent.name} 
                        className="card-bg border border-neon-purple/20 rounded-lg p-4 text-center flex flex-col items-center shadow-lg hover:shadow-neon-cyan/20 hover:border-neon-cyan transition-all duration-300 h-full"
                        >
                        <div className={`w-20 h-20 rounded-full mb-3 border-2 ${agent.gender === 'Male' ? 'border-neon-cyan' : 'border-neon-pink'} bg-slate-900 flex items-center justify-center shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]`}>
                            <span className="text-3xl font-bold">{agent.name.charAt(0)}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white">{agent.name}</h3>
                        <p className="text-xs text-neon-cyan/80 mb-2">{agent.role}</p>
                        <p className="text-xs text-gray-400 italic flex-grow">"{agent.personality}"</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Footer CTA */}
        <footer className="py-20 bg-dark-bg/80 backdrop-blur-md border-t-2 border-neon-purple/30 text-center">
             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl neon-text-cyan">Ready to Take Control?</h2>
                <p className="mt-4 text-lg leading-8 text-gray-300">The studio is waiting. Step inside and shape the future of sound.</p>
                <button
                    onClick={onEnter}
                    className="mt-10 animate-pulse-slow group flex items-center gap-3 bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-lg shadow-cyan-400/30 hover:shadow-cyan-400/60 transform hover:scale-105 mx-auto"
                >
                    Enter The Studio
                    <ChevronRightIcon />
                </button>
             </div>
        </footer>

      </div>

      <style>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.8s ease-out both; }
        .animate-pulse-slow { animation: pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse {
            0%, 100% { 
              box-shadow: 0 0 10px var(--neon-cyan), 0 0 20px var(--neon-cyan);
              opacity: 1; 
            }
            50% { 
              box-shadow: 0 0 20px var(--neon-cyan), 0 0 40px var(--neon-cyan);
              opacity: .9;
            }
        }
        /* Custom scrollbar for the content */
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: var(--neon-cyan);
            border-radius: 4px;
            border: 2px solid transparent;
            background-clip: content-box;
            box-shadow: 0 0 5px var(--neon-cyan);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: var(--neon-cyan) rgba(0,0,0,0.5);
        }
      `}</style>
    </>
  );
};

export default StartPage;
