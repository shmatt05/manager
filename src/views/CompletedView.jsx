import { useMemo } from 'react';
import { format } from 'date-fns';
import useTaskStore from '../stores/taskStore';
import TaskCard from '../components/TaskCard';

export default function CompletedView() {
  const tasks = useTaskStore(state => state.tasks);
  
  const completedTasks = useMemo(() => {
    return tasks
      .filter(task => task.status === 'completed')
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  }, [tasks]);

  const tasksByDate = useMemo(() => {
    const grouped = {};
    
    completedTasks.forEach(task => {
      const date = format(new Date(task.completedAt), 'yyyy-MM-dd');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(task);
    });
    
    return grouped;
  }, [completedTasks]);

  return (
    <div className="h-full p-6 overflow-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Completed Tasks</h1>
      
      {Object.entries(tasksByDate).map(([date, tasks]) => (
        <div key={date} className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            {format(new Date(date), 'MMMM d, yyyy')}
          </h2>
          <div className="space-y-3">
            {tasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task}
                className="opacity-75 hover:opacity-100 transition-opacity"
              />
            ))}
          </div>
        </div>
      ))}
      
      {completedTasks.length === 0 && (
        <div className="text-center text-gray-500 mt-12">
          No completed tasks yet
        </div>
      )}
    </div>
  );
} 