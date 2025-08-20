
import React, { useState } from 'react';
import { Task, Status } from '../types';
import TaskCard from './TaskCard';

interface KanbanColumnProps {
  title: string;
  targetStatus: Status;
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDrop: (taskId: string, newStatus: Status) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, targetStatus, tasks, onOpenTask, onUpdateTask, onDrop }) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if(taskId) {
        onDrop(taskId, targetStatus);
    }
    setIsOver(false);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-96 flex-shrink-0 flex flex-col rounded-lg transition-colors duration-300 ${isOver ? 'bg-gray-700' : ''}`}
    >
      <div className="flex-shrink-0 flex items-center justify-between bg-gray-800 px-3 py-2 rounded-t-lg border-b-2 border-cyan-500">
        <h3 className="font-bold text-white">{title}</h3>
        <span className="text-sm font-mono bg-gray-700 text-gray-300 rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>
      <div 
        className="bg-gray-800/50 p-2 rounded-b-lg h-full flex flex-col gap-3 overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 300px)'}}
      >
        {tasks.length > 0 ? (
          tasks.map(task => (
            <TaskCard key={task.id} task={task} onOpenTask={onOpenTask} onUpdateTask={onUpdateTask} />
          ))
        ) : (
          <div className="flex-grow flex items-center justify-center text-center text-sm text-gray-500 py-10">
            {isOver ? 'Drop task here' : 'No tasks here.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
