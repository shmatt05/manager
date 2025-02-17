import { useMemo } from 'react';
import { format } from 'date-fns';
import useTaskStore from '../stores/taskStore';
import TaskCard from '../components/TaskCard';
import { getFirestore, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth } from '../firebase';

export default function CompletedView({ onTaskClick }) {
  const tasks = useTaskStore(state => state.tasks);
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

  const handleTaskComplete = async (task) => {
    const updatedTask = {
      ...task,
      status: 'active',
      completedAt: null,
      updatedAt: new Date().toISOString()
    };

    if (isProd && auth.currentUser) {
      const db = getFirestore();
      const taskRef = doc(db, `users/${auth.currentUser.uid}/tasks/${task.id}`);
      await setDoc(taskRef, {
        ...updatedTask,
        userId: auth.currentUser.uid
      });
    } else {
      const savedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      const newTasks = savedTasks.map(t => t.id === task.id ? updatedTask : t);
      localStorage.setItem('tasks', JSON.stringify(newTasks));
      useTaskStore.getState().setTasks(newTasks);
    }
  };

  const handleTaskDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    if (isProd && auth.currentUser) {
      const db = getFirestore();
      const taskRef = doc(db, `users/${auth.currentUser.uid}/tasks/${taskId}`);
      await deleteDoc(taskRef);
    } else {
      const savedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      const newTasks = savedTasks.filter(t => t.id !== taskId);
      localStorage.setItem('tasks', JSON.stringify(newTasks));
      useTaskStore.getState().setTasks(newTasks);
    }
  };

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
                onEdit={() => onTaskClick(task)}
                onComplete={handleTaskComplete}
                onDelete={() => handleTaskDelete(task.id)}
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