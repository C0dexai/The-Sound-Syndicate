
import React, { useState, useEffect } from 'react';
import { Task, Status } from '../types';
import { KANBAN_COLUMNS, PRIORITY_STYLES } from '../constants';
import { getTasksDB } from '../services/dbService';

const PreviewCard: React.FC<{ task: Task }> = ({ task }) => {
    return (
        <div className="card-bg p-3 rounded-md border border-neon-purple/30 shadow-md">
            <div className="flex justify-between items-start gap-2">
                <p className="text-base font-medium text-gray-100 pr-2">{task.title}</p>
                {task.priority !== "None" && (
                  <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold text-white rounded-full ${PRIORITY_STYLES[task.priority]}`}>
                      {task.priority}
                  </span>
                )}
            </div>
        </div>
    );
};


const PreviewPage: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const loadTasks = async () => {
            try {
                const dbTasks = await getTasksDB();
                setTasks(dbTasks);
            } catch (error) {
                console.error("Failed to load tasks for preview", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadTasks();
    }, []);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === Status.Done).length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const appUrl = window.location.origin + window.location.pathname;

    if (isLoading) {
        return (
            <div className="min-h-screen dark-bg text-gray-100 font-sans antialiased flex items-center justify-center">
                <div className="text-center animate-pulse">
                    <h1 className="text-3xl font-bold tracking-tighter neon-text-cyan">Loading Project Preview</h1>
                    <p className="neon-text-pink/80 mt-1">Please wait...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen dark-bg text-gray-100 font-sans antialiased">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <header className="border-b border-neon-cyan/20 pb-4 mb-6">
                    <h1 className="text-3xl font-bold tracking-tighter neon-text-cyan">Project Preview: The Crucible</h1>
                    <p className="neon-text-pink/80 mt-1">A read-only snapshot of the current project status.</p>
                </header>

                <main>
                    {totalTasks > 0 && (
                      <div className="mb-8 p-4 card-bg border border-neon-purple/30 rounded-lg">
                          <h2 className="text-xl font-bold text-gray-200">Progress Overview</h2>
                          <div className="mt-3 flex items-center gap-4">
                              <div className="w-full bg-slate-700 rounded-full h-2.5">
                                  <div className="bg-neon-cyan h-2.5 rounded-full transition-all duration-500 shadow-[0_0_8px_var(--neon-cyan)]" style={{ width: `${progress}%` }}></div>
                              </div>
                              <span className="font-mono text-lg text-white">{progress}%</span>
                          </div>
                          <p className="text-sm text-gray-400 mt-2">{completedTasks} of {totalTasks} tasks complete.</p>
                      </div>
                    )}

                    <div className="flex-grow overflow-x-auto pb-4">
                      <div className="flex gap-6 min-w-max">
                        {KANBAN_COLUMNS.map(({ title, status }) => {
                            const filteredTasks = tasks.filter(task => task.status === status);
                            if (filteredTasks.length === 0) return null;

                            return (
                                <div key={status} className="w-80 flex-shrink-0">
                                    <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-t-lg border-b-2 border-neon-cyan" style={{textShadow: '0 0 5px var(--neon-cyan)'}}>
                                      <h3 className="font-bold text-white">{title}</h3>
                                      <span className="text-sm font-mono bg-slate-700 text-gray-300 rounded-full px-2 py-0.5">
                                        {filteredTasks.length}
                                      </span>
                                    </div>
                                    <div className="card-bg p-2 rounded-b-lg h-full flex flex-col gap-3 border border-t-0 border-neon-purple/20">
                                      {filteredTasks.map(task => <PreviewCard key={task.id} task={task} />)}
                                    </div>
                                </div>
                            );
                        })}
                      </div>
                    </div>
                </main>
                <footer className="text-center mt-12 text-gray-500 text-sm">
                    <p>
                        Status as of {new Date().toLocaleString()}. 
                        <a href={appUrl} className="ml-2 text-neon-cyan hover:underline">Return to The Crucible</a>.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default PreviewPage;
