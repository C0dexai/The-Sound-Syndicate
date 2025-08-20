
import React, { useState, useEffect } from 'react';
import { Task, Priority } from '../types';
import { PRIORITY_STYLES } from '../constants';

interface TaskCardProps {
  task: Task;
  onOpenTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onOpenTask, onUpdateTask }) => {
  const priorityStyle = PRIORITY_STYLES[task.priority] || 'bg-gray-400';
  const [title, setTitle] = useState(task.title);

  useEffect(() => {
    setTitle(task.title);
  }, [task.title]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    if (task.title !== title && title.trim() !== '') {
      onUpdateTask({ ...task, title: title.trim() });
    } else {
      setTitle(task.title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setTitle(task.title);
      e.currentTarget.blur();
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      onClick={() => onOpenTask(task)}
      draggable
      onDragStart={handleDragStart}
      className="card-bg p-3 rounded-md shadow-lg border border-neon-purple/30 hover:border-neon-purple/70 cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-[0_0_10px_rgba(157,0,255,0.5)]"
    >
      <div className="flex justify-between items-start gap-2">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          onKeyDown={handleKeyDown}
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="w-full bg-transparent text-base font-medium text-gray-100 pr-2 focus:outline-none focus:ring-1 focus:ring-neon-cyan rounded px-1 -mx-1"
        />
        {task.priority !== Priority.None && (
          <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold text-white rounded-full ${priorityStyle}`}>
            {task.priority}
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
