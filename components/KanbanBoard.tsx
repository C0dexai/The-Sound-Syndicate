
import React from 'react';
import { Task, Status } from '../types';
import { BOARD_COLUMNS } from '../constants';
import KanbanColumn from './KanbanColumn';

interface KanbanBoardProps {
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onOpenTask, onUpdateTask }) => {
  const handleDrop = (taskId: string, newStatus: Status) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      onUpdateTask({ ...task, status: newStatus });
    }
  };

  const getTargetStatusForColumn = (statuses: Status[]): Status => {
      if (statuses.includes(Status.Done)) return Status.Done;
      if (statuses.includes(Status.InProgress)) return Status.InProgress;
      if (statuses.includes(Status.ToDo)) return Status.ToDo;
      return statuses[0] || Status.Backlog;
  }

  return (
    <div className="flex-grow flex flex-col bg-gray-800/50 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
      <div className="flex-grow overflow-x-auto p-4">
        <div className="flex gap-6 min-w-max h-full">
          {BOARD_COLUMNS.map(({ title, statuses }) => (
            <KanbanColumn
              key={title}
              title={title}
              targetStatus={getTargetStatusForColumn(statuses)}
              tasks={tasks.filter(task => statuses.includes(task.status))}
              onOpenTask={onOpenTask}
              onUpdateTask={onUpdateTask}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;
