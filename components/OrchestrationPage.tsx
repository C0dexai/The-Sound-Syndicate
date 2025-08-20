
import React, { useState, useCallback, useRef } from 'react';
import { KnowledgeBaseItem, OrchestrationLogEntry, MetaInsight } from '../types';
import { BrainCircuitIcon, SparklesIcon, FileTextIcon, CheckCircle2Icon, XCircleIcon } from './icons/Icons';

const initialDomainAKB: KnowledgeBaseItem[] = [
    { id: 'd1-doc1', name: 'Live Event Safety Checklist', version: '1.1', status: 'synced' },
    { id: 'd1-doc2', name: 'Studio Wiring Diagram', version: '2.3', status: 'synced' },
    { id: 'd1-doc3', name: 'Acoustic Treatment Guide', version: '1.0', status: 'synced' },
];

const initialDomainBKB: KnowledgeBaseItem[] = [
    { id: 'd2-doc1', name: 'Master Compliance Document', version: '2.4', status: 'synced' },
    { id: 'd2-doc2', name: 'Venue Onboarding Protocol', version: '3.1', status: 'synced' },
    { id: 'd2-doc3', name: 'Emergency Evacuation Plan', version: '1.5', status: 'synced' },
];

const OrchestrationPage: React.FC = () => {
    const [workflowState, setWorkflowState] = useState<'idle' | 'running' | 'complete'>('idle');
    const [log, setLog] = useState<OrchestrationLogEntry[]>([]);
    const [domainAKB, setDomainAKB] = useState<KnowledgeBaseItem[]>(initialDomainAKB);
    const [domainBKB, setDomainBKB] = useState<KnowledgeBaseItem[]>(initialDomainBKB);
    const [geminiInsight, setGeminiInsight] = useState<MetaInsight | null>(null);
    const [openAIInsight, setOpenAIInsight] = useState<MetaInsight | null>(null);

    const logEndRef = useRef<HTMLDivElement>(null);

    const addLogEntry = (entry: Omit<OrchestrationLogEntry, 'id' | 'timestamp'>) => {
        setLog(prev => [...prev, { ...entry, id: `log-${Date.now()}`, timestamp: new Date().toISOString() }]);
        setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const updateKBStatus = (domain: 'A' | 'B', id: string, updates: Partial<KnowledgeBaseItem>) => {
        const setKB = domain === 'A' ? setDomainAKB : setDomainBKB;
        setKB(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    const runWorkflow = useCallback(() => {
        setWorkflowState('running');
        setLog([]);
        setDomainAKB(initialDomainAKB);
        setDomainBKB(initialDomainBKB);
        setGeminiInsight(null);
        setOpenAIInsight(null);

        const steps = [
            () => addLogEntry({ speaker: 'System', text: 'Workflow initiated: Cross-Domain Knowledge Sync.' }),
            () => {
                addLogEntry({ speaker: 'Lyra', text: "Initiating sync with Compliance Corp. New OSHA guidelines require updates to our safety checklists." });
                updateKBStatus('A', 'd1-doc1', { status: 'updated', version: '1.2' });
            },
            () => addLogEntry({ speaker: 'Lyra', text: "Kara, I'm pushing our updated 'Live Event Safety Checklist v1.2'. Please review and integrate." }),
            () => updateKBStatus('B', 'd2-doc1', { status: 'syncing' }),
            () => setGeminiInsight({ id: 'mi-1', source: 'Gemini', type: 'suggestion', text: "The term 'permissible exposure limit' in v1.2 could be linked to the specific OSHA regulation 1910.95(b)(1) for clarity." }),
            () => addLogEntry({ speaker: 'Kara', text: "Acknowledged, Lyra. Receiving the document. I see the Gemini suggestion, will incorporate." }),
            () => setOpenAIInsight({ id: 'mi-2', source: 'OpenAI', type: 'analysis', text: "Analysis: The changes align with 95% of the Master Compliance Document. Potential conflict detected in section 'Emergency Exits'." }),
            () => updateKBStatus('B', 'd2-doc1', { status: 'conflict' }),
            () => addLogEntry({ speaker: 'Kara', text: "Lyra, OpenAI flagged a conflict. My document requires 5-foot clearance for emergency exits, yours states 4-foot. Please advise." }),
            () => addLogEntry({ speaker: 'Lyra', text: "Good catch. Let's adhere to the stricter 5-foot requirement. I'm updating our source document." }),
            () => updateKBStatus('A', 'd1-doc1', { version: '1.3', lastUpdatedBy: 'Lyra' }),
            () => addLogEntry({ speaker: 'Kara', text: "Integration complete. 'Master Compliance Document' is now at v2.5. Pushing back the harmonized version." }),
            () => updateKBStatus('B', 'd2-doc1', { status: 'synced', version: '2.5', lastUpdatedBy: 'Kara' }),
            () => addLogEntry({ speaker: 'System', text: 'All knowledge bases are now synchronized.' }),
            () => setWorkflowState('complete'),
        ];

        steps.forEach((step, index) => {
            setTimeout(step, index * 1500);
        });
    }, []);
    
    const StatusBadge: React.FC<{status: KnowledgeBaseItem['status']}> = ({status}) => {
        const styles = {
            synced: 'bg-green-500/20 text-green-400 border-green-500/30',
            pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            syncing: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 animate-pulse',
            conflict: 'bg-red-500/20 text-red-400 border-red-500/30',
            updated: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        };
        return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${styles[status]}`}>{status}</span>
    }

    const MetaCard: React.FC<{insight: MetaInsight | null, source: 'Gemini' | 'OpenAI'}> = ({insight, source}) => {
        const colors = {
            Gemini: 'from-blue-500/40 to-purple-500/40 border-cyan-400/50',
            OpenAI: 'from-teal-500/40 to-green-500/40 border-emerald-400/50'
        }
        const textColors = {
            Gemini: 'text-cyan-300',
            OpenAI: 'text-emerald-300'
        }
        return (
            <div className={`card-bg p-4 rounded-lg border bg-gradient-to-br min-h-[120px] transition-opacity duration-500 ${colors[source]} ${insight ? 'opacity-100' : 'opacity-40'}`}>
                <h3 className={`font-bold text-lg ${textColors[source]}`}>{source} Meta-Intelligence</h3>
                {insight ? (
                    <p className="text-sm text-gray-200 mt-2">{insight.text}</p>
                ) : (
                    <p className="text-sm text-gray-500 mt-2">Awaiting analysis...</p>
                )}
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col p-2 sm:p-0 gap-6 overflow-hidden">
            <div className="flex-shrink-0 card-bg border border-neon-purple/20 rounded-lg p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                     <h1 className="text-xl font-bold neon-text-cyan flex items-center gap-2"><BrainCircuitIcon /> Cross-Domain AI Orchestration</h1>
                     <p className="text-sm text-gray-400 mt-1 italic max-w-2xl">"This system orchestrates agent-to-agent automation and knowledge management across two domains via API..."</p>
                </div>
                <button onClick={runWorkflow} disabled={workflowState === 'running'} className="px-4 py-2 flex-shrink-0 rounded-lg font-semibold bg-cyan-600 text-white hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_10px_var(--neon-cyan)]">
                    <SparklesIcon/> {workflowState === 'running' ? 'Orchestration in Progress...' : 'Initiate Knowledge Sync'}
                </button>
            </div>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 xl:grid-cols-[1fr_1fr] min-h-0">
                <MetaCard insight={geminiInsight} source="Gemini" />
                <MetaCard insight={openAIInsight} source="OpenAI" />
            </div>

            <div className="flex-grow grid grid-cols-1 xl:grid-cols-3 gap-6 min-h-0">
                 {/* Domain A */}
                 <div className="card-bg border border-neon-purple/20 rounded-lg flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-neon-purple/30">
                        <h2 className="font-bold text-lg neon-text-pink">Domain A: The Sound Syndicate</h2>
                        <p className="text-sm text-gray-400">Lead Agent: <span className="font-semibold text-white">Lyra</span></p>
                    </div>
                    <div className="p-4 space-y-3 overflow-y-auto">
                        {domainAKB.map(item => (
                            <div key={item.id} className="bg-slate-900/50 p-3 rounded-md border border-slate-700">
                                <div className="flex justify-between items-center">
                                    <p className="font-medium text-white flex items-center gap-2"><FileTextIcon className="w-4 h-4 text-gray-400"/>{item.name}</p>
                                    <p className="text-xs font-mono text-gray-500">v{item.version}</p>
                                </div>
                                <div className="mt-2 flex justify-between items-center">
                                    <StatusBadge status={item.status} />
                                    {item.lastUpdatedBy && <p className="text-xs text-gray-500">by {item.lastUpdatedBy}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>

                 {/* Orchestration Log */}
                <div className="card-bg border border-neon-cyan/20 rounded-lg flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-neon-cyan/30">
                        <h2 className="font-bold text-lg neon-text-cyan">Context Ledger</h2>
                        <p className="text-sm text-gray-400">Live agent-to-agent communication</p>
                    </div>
                    <div className="p-4 space-y-3 font-mono text-xs overflow-y-auto">
                         {log.map(entry => (
                            <div key={entry.id} className="flex gap-2">
                                <p className="text-gray-600 flex-shrink-0">{new Date(entry.timestamp).toLocaleTimeString()}</p>
                                <p className={entry.speaker === 'Lyra' ? 'text-pink-400' : entry.speaker === 'Kara' ? 'text-purple-400' : 'text-cyan-400'}>{entry.speaker}:</p>
                                <p className="text-gray-300 flex-1 whitespace-pre-wrap">{entry.text}</p>
                            </div>
                         ))}
                         {workflowState === 'running' && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neon-cyan mx-auto"></div>}
                         <div ref={logEndRef}></div>
                    </div>
                 </div>

                {/* Domain B */}
                <div className="card-bg border border-neon-purple/20 rounded-lg flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-neon-purple/30">
                        <h2 className="font-bold text-lg neon-text-pink">Domain B: Compliance Corp</h2>
                        <p className="text-sm text-gray-400">Lead Agent: <span className="font-semibold text-white">Kara</span></p>
                    </div>
                    <div className="p-4 space-y-3 overflow-y-auto">
                        {domainBKB.map(item => (
                            <div key={item.id} className="bg-slate-900/50 p-3 rounded-md border border-slate-700">
                                <div className="flex justify-between items-center">
                                    <p className="font-medium text-white flex items-center gap-2"><FileTextIcon className="w-4 h-4 text-gray-400"/>{item.name}</p>
                                    <p className="text-xs font-mono text-gray-500">v{item.version}</p>
                                </div>
                                <div className="mt-2 flex justify-between items-center">
                                    <StatusBadge status={item.status} />
                                     {item.lastUpdatedBy && <p className="text-xs text-gray-500">by {item.lastUpdatedBy}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrchestrationPage;
