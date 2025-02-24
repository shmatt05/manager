import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import MatrixView from './views/MatrixView'
import CompletedView from './views/CompletedView'
import TaskCreate from './components/TaskCreate'
import clsx from 'clsx'
import TaskModal from './components/TaskModal'
import { storage } from './utils/storage'
import AuthButton from './components/AuthButton'
import { getFirestore, collection, doc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore'
import UserIndicator from './components/UserIndicator'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import HistoryView from './views/HistoryView'
import Header from './components/Header'

const queryClient = new QueryClient()

const tabs = [
  { id: 'matrix', label: 'Matrix' },
  { id: 'completed', label: 'Completed' },
  { id: 'history', label: 'History' }
]

const createHistoryEntry = (task, action, userId, changes = null) => ({
  id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  timestamp: new Date().toISOString(),
  action,
  userId,
  ticketData: task,
  changes
});

// Helper function to save history entry to localStorage
const saveHistoryToLocalStorage = (historyEntry) => {
  const existingHistory = JSON.parse(localStorage.getItem('taskHistory') || '[]');
  const newHistory = [historyEntry, ...existingHistory];
  localStorage.setItem('taskHistory', JSON.stringify(newHistory));
};

function AppContent() {
  const [activeTab, setActiveTab] = useState('matrix')
  const [tasks, setTasks] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [lastLocalUpdate, setLastLocalUpdate] = useState(null)
  const { user, loading } = useAuth()
  const isProd = import.meta.env.PROD

  const handleTaskClick = (task) => {
    setSelectedTask(task)
    setIsModalOpen(true)
  }

  const handleTaskSave = async (updatedTask) => {
    console.log('handleTaskSave received:', updatedTask);
    
    if (Array.isArray(updatedTask)) {
      console.error('Received array instead of single task');
      return;
    }

    try {
      const oldTask = tasks.find(t => t.id === updatedTask.id);
      if (!oldTask) {
        console.error('Could not find original task');
        return;
      }

      // Create merged task with cleaned data
      const mergedTask = Object.fromEntries(
        Object.entries({
          ...oldTask,
          ...updatedTask,
          details: updatedTask.description || updatedTask.details || oldTask.details || '',
          description: updatedTask.description || updatedTask.details || oldTask.description || '',
          updatedAt: new Date().toISOString()
        }).filter(([_, v]) => v !== undefined)
      );

      // Calculate changes
      const changes = [];
      ['title', 'description', 'priority', 'status', 'tags', 'scheduledFor'].forEach(key => {
        const oldValue = oldTask[key];
        const newValue = updatedTask[key];
        
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes.push({ field: key, oldValue, newValue });
        }
      });

      // Only create history entry if there are actual changes
      if (changes.length > 0) {
        const historyEntry = createHistoryEntry(mergedTask, 'UPDATE', isProd ? user.uid : 'local-user', changes);
        console.log('Creating history entry for update:', historyEntry);

        if (isProd && user) {
          const db = getFirestore();
          await Promise.all([
            setDoc(doc(db, `users/${user.uid}/tasks/${updatedTask.id}`), mergedTask),
            setDoc(doc(db, `users/${user.uid}/taskHistory/${Date.now()}`), historyEntry)
          ]);
        } else {
          // Update both tasks and history in localStorage
          const newTasks = tasks.map(task => 
            task.id === updatedTask.id ? mergedTask : task
          );
          localStorage.setItem('tasks', JSON.stringify(newTasks));
          saveHistoryToLocalStorage(historyEntry);
        }
      }

      // Update local state immediately
      setTasks(currentTasks => 
        currentTasks.map(task => task.id === updatedTask.id ? mergedTask : task)
      );

      setIsModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const taskToDelete = tasks.find(t => t.id === taskId);
      
      if (isProd && user) {
        const db = getFirestore();
        
        // Create history entry for deletion
        const historyEntry = createHistoryEntry(taskToDelete, 'DELETE', user.uid);
        console.log('Creating history entry for delete:', historyEntry);

        await Promise.all([
          deleteDoc(doc(db, `users/${user.uid}/tasks/${taskId}`)),
          setDoc(doc(db, `users/${user.uid}/taskHistory/${Date.now()}`), historyEntry)
        ]);
      } else {
        // Local storage handling
        localStorage.setItem('tasks', JSON.stringify(tasks.filter(t => t.id !== taskId)));
        
        // Add history entry
        const historyEntry = createHistoryEntry(taskToDelete, 'DELETE', 'local-user');
        saveHistoryToLocalStorage(historyEntry);
      }

      // Update local state immediately
      setTasks(currentTasks => currentTasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleTaskComplete = async (task) => {
    const updatedTask = {
      ...task,
      status: task.status === 'completed' ? 'active' : 'completed',
      completedAt: task.status === 'completed' ? null : new Date().toISOString()
    };

    try {
      if (isProd && user) {
        const db = getFirestore();
        
        // Create history entry for completion
        const historyEntry = createHistoryEntry(
          updatedTask, 
          updatedTask.status === 'completed' ? 'COMPLETE' : 'REOPEN',
          user.uid,
          [{
            field: 'status',
            oldValue: task.status,
            newValue: updatedTask.status
          }]
        );
        console.log('Creating history entry for completion:', historyEntry);

        await Promise.all([
          setDoc(doc(db, `users/${user.uid}/tasks/${task.id}`), {
            ...updatedTask,
            userId: user.uid,
            updatedAt: new Date().toISOString()
          }),
          setDoc(doc(db, `users/${user.uid}/taskHistory/${Date.now()}`), historyEntry)
        ]);
      } else {
        // Local storage handling
        const newTasks = tasks.map(t => t.id === task.id ? updatedTask : t);
        setTasks(newTasks);
        
        // Add history entry
        const historyEntry = createHistoryEntry(
          updatedTask,
          updatedTask.status === 'completed' ? 'COMPLETE' : 'REOPEN',
          'local-user',
          [{
            field: 'status',
            oldValue: task.status,
            newValue: updatedTask.status
          }]
        );
        saveHistoryToLocalStorage(historyEntry);
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleCreateTask = async (newTask) => {
    try {
      if (isProd && user) {
        const db = getFirestore();
        
        // Create history entry for new task
        const historyEntry = createHistoryEntry(newTask, 'CREATE', user.uid);
        console.log('Creating history entry for new task:', historyEntry);

        await Promise.all([
          setDoc(doc(db, `users/${user.uid}/tasks/${newTask.id}`), {
            ...newTask,
            userId: user.uid,
            updatedAt: new Date().toISOString()
          }),
          setDoc(doc(db, `users/${user.uid}/taskHistory/${Date.now()}`), historyEntry)
        ]);

        // Update local state immediately
        setTasks([...tasks, newTask]);
      } else {
        // Local storage handling
        const newTasks = [...tasks, newTask];
        localStorage.setItem('tasks', JSON.stringify(newTasks));
        setTasks(newTasks);
        
        // Add history entry
        const historyEntry = createHistoryEntry(newTask, 'CREATE', 'local-user');
        saveHistoryToLocalStorage(historyEntry);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleTasksUpdate = async (updatedTasks) => {
    try {
      console.log('🎭 DND Update Start:', new Date().getTime());
      
      // Set the lastLocalUpdate timestamp
      const updateTime = new Date().getTime();
      setLastLocalUpdate(updateTime);
      
      setTasks(updatedTasks);
      console.log('🎭 Local state updated');

      if (isProd && user) {
        console.log('🎭 Starting Firestore update');
        const db = getFirestore();
        const batch = await Promise.all(updatedTasks.map(task => {
          // Clean up the task object by removing undefined fields
          const cleanTask = Object.fromEntries(
            Object.entries({
              ...task,
              userId: user.uid,
              updatedAt: new Date().toISOString(),
              // Ensure description/details consistency
              details: task.description || task.details || '',
              description: task.description || task.details || ''
            }).filter(([_, v]) => v !== undefined)
          );
          
          console.log('Saving cleaned task to Firestore:', cleanTask);
          return setDoc(doc(db, `users/${user.uid}/tasks/${task.id}`), cleanTask);
        }));
        console.log('🎭 Firestore update complete');
      } else {
        console.log('Saving to localStorage:', updatedTasks);
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));
      }
    } catch (error) {
      console.error('🎭 Error:', error);
      setTasks(tasks);
    }
  };

  useEffect(() => {
    if (isProd && user) {
      const db = getFirestore();
      const tasksRef = collection(db, `users/${user.uid}/tasks`);
      
      const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
        const currentTime = new Date().getTime();
        console.log('🔥 Firestore snapshot received:', currentTime);
        
        // Ignore updates that happen within 1 second of a local update
        if (lastLocalUpdate && currentTime - lastLocalUpdate < 1000) {
          console.log('🔥 Ignoring Firestore update due to recent local update');
          return;
        }

        const tasksData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        setTasks(tasksData);
      });

      return () => unsubscribe();
    } else {
      const savedTasks = localStorage.getItem('tasks');
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }
    }
  }, [isProd, user, lastLocalUpdate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (isProd && !user) {
    return <Login />;
  }

  return (
    <div className="flex flex-col h-screen bg-blue-50">
      <Header 
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        <TaskCreate onCreateTask={handleCreateTask} />
      </Header>

      <main className="flex-1 overflow-auto">
        {activeTab === 'matrix' ? (
          <MatrixView 
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onTaskUpdate={handleTasksUpdate}
            onTaskSave={handleTaskSave}
            onTaskDelete={handleDeleteTask}
            onTaskComplete={handleTaskComplete}
          />
        ) : activeTab === 'completed' ? (
          <CompletedView 
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onTaskUpdate={handleTaskSave}
            onTaskDelete={handleDeleteTask}
            onTaskComplete={handleTaskComplete}
          />
        ) : (
          <HistoryView />
        )}
      </main>

      <TaskModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        onSave={handleTaskSave}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </AuthProvider>
  );
}