
import React, { useState, useEffect } from 'react';
import { Task, Status, Priority } from '../types';
import { KANBAN_COLUMNS } from '../constants';
import { PRIORITY_STYLES } from '../constants';
import { SparklesIcon, ExclamationTriangleIcon } from './icons/Icons';

interface TaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onCritique: (task: Task) => Promise<void>;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, task, onClose, onUpdate, onCritique }) => {
  const [editableTask, setEditableTask] = useState<Task>(task);
  const [isCritiquing, setIsCritiquing] = useState(false);

  useEffect(() => {
    setEditableTask(task);
  }, [task]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditableTask(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onUpdate(editableTask);
    onClose();
  };
  
  const handleCritiqueClick = async () => {
    setIsCritiquing(true);
    await onCritique(editableTask);
    setIsCritiquing(false);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card-bg border border-neon-purple/50 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-neon-purple/30 flex-shrink-0">
          <input
            type="text"
            name="title"
            value={editableTask.title}
            onChange={handleInputChange}
            className="w-full bg-transparent text-2xl font-bold text-white focus:outline-none"
          />
        </div>

        <div className="p-6 flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Editable Fields */}
          <div className="md:col-span-2 flex flex-col gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
              <textarea
                name="description"
                value={editableTask.description}
                onChange={handleInputChange}
                rows={8}
                className="w-full bg-slate-900/70 border border-slate-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-neon-cyan focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
              <select
                name="status"
                value={editableTask.status}
                onChange={handleInputChange}
                className="w-full bg-slate-900/70 border border-slate-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-neon-cyan focus:outline-none"
              >
                {KANBAN_COLUMNS.map(col => <option key={col.status} value={col.status}>{col.title}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Priority</label>
               <select
                name="priority"
                value={editableTask.priority}
                onChange={handleInputChange}
                className="w-full bg-slate-900/70 border border-slate-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-neon-cyan focus:outline-none"
              >
                {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Right Column: AI Critique */}
          <div className="bg-slate-900/50 p-4 rounded-lg border border-neon-pink/30 flex flex-col">
            <h3 className="text-lg font-bold neon-text-pink flex items-center gap-2">
              <ExclamationTriangleIcon />
              The Evisceration
            </h3>
            <p className="text-xs text-gray-500 mb-3">Brutal, honest feedback.</p>
            <div className="bg-slate-950 rounded-md p-3 text-sm text-gray-300 flex-grow overflow-y-auto whitespace-pre-wrap font-mono">
              {editableTask.critique || 'No critique yet. Dare to ask?'}
            </div>
            <button
              onClick={handleCritiqueClick}
              disabled={isCritiquing}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-red-700 hover:bg-red-600 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition hover:shadow-[0_0_10px_rgba(255,0,0,0.7)]"
            >
              {isCritiquing ? 'Eviscerating...' : <> <SparklesIcon /> Critique Task </>}
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-950/50 border-t border-neon-purple/30 flex justify-end gap-4 flex-shrink-0">
          <button onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition">Cancel</button>
          <button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition hover:shadow-[0_0_10px_var(--neon-cyan)]">Save & Close</button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
