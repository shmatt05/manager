import { useMemo } from 'react';
import { format } from 'date-fns';
import useTaskStore from '../stores/taskStore';
import TaskCard from '../components/TaskCard';
import { getFirestore, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth } from '../firebase';

export default function CompletedView({ tasks, onTaskClick, onTaskUpdate, onTaskDelete, onTaskComplete }) {
  const isProd = import.meta.env.PROD;

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

  const handleTaskDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      if (isProd && auth.currentUser) {
        const db = getFirestore();
        const taskRef = doc(db, `users/${auth.currentUser.uid}/tasks/${taskId}`);
        await deleteDoc(taskRef);
      } else {
        const savedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const newTasks = savedTasks.filter(t => t.id !== taskId);
        localStorage.setItem('tasks', JSON.stringify(newTasks));
        useTaskStore.getState().setTasks(newTasks);
        onTaskUpdate(newTasks);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return (
    <div className="h-full p-3 sm:p-4 overflow-auto dark:bg-dark-background">
      <div className="max-w-6xl mx-auto w-full">
        {/* App bar with Material Design styling */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-surface-200 dark:border-dark-surface-6 sticky top-0 z-10 bg-white/90 dark:bg-dark-background/90 backdrop-blur-sm">
          <h1 className="text-2xl font-medium text-surface-800 dark:text-dark-text-primary select-none">
            Completed Tasks
          </h1>
        </div>
        
        {completedTasks.length === 0 ? (
          <div className="bg-surface-50 dark:bg-dark-surface-2 shadow-dp2 dark:shadow-dp1 rounded-lg p-6 text-center">
            <div className="flex flex-col items-center justify-center py-8 text-surface-500 dark:text-dark-text-secondary">
              <svg className="w-12 h-12 mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm select-none">No completed tasks yet</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(tasksByDate).map(([date, tasks]) => (
              <div key={date} className="animate-fade-in" style={{animationDelay: '50ms'}}>
                {/* Date header with Material Design styling */}
                <div className="flex items-center mb-3">
                  <span className="bg-surface-100 dark:bg-dark-surface-4 text-surface-700 dark:text-dark-text-secondary px-3 py-1 rounded-pill text-sm font-medium select-none">
                    {format(new Date(date), 'MMMM d, yyyy')}
                  </span>
                  <div className="ml-3 h-px flex-grow bg-surface-200 dark:bg-dark-surface-6"></div>
                </div>
                
                {/* Tasks with Material Design cards */}
                <div className="space-y-2">
                  {tasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task}
                      className="shadow-dp1 dark:shadow-none hover:shadow-dp2 dark:hover:bg-opacity-90 transition-all"
                      onEdit={() => onTaskClick(task)}
                      onComplete={onTaskComplete}
                      onDelete={() => handleTaskDelete(task.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 