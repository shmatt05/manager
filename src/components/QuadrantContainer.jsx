import { useDroppable } from '@dnd-kit/core';
import TaskCard from './TaskCard';
import clsx from 'clsx';

export default function QuadrantContainer({ id, title, tasks, onTaskEdit, className }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'bg-white p-4 rounded-lg shadow',
        className,
        isOver && 'ring-2 ring-blue-400 ring-opacity-50'
      )}
    >
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="space-y-2">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onTaskEdit}
          />
        ))}
      </div>
    </div>
  );
} 