import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import MatrixView from './views/MatrixView'
import CompletedView from './views/CompletedView'
import TaskCreate from './components/TaskCreate'
import TaskModal from './components/TaskModal'
import { getFirestore, collection, onSnapshot } from 'firebase/firestore'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import HistoryView from './views/HistoryView'
import Header from './components/Header'
import { TaskService } from './services/TaskService'
import { config } from './config'

const queryClient = new QueryClient()

const tabs = [
  { id: 'matrix', label: 'Matrix' },
  { id: 'completed', label: 'Completed' },
  { id: 'history', label: 'History' }
]

// These functions are now provided by TaskService

function AppContent() {
  const [activeTab, setActiveTab] = useState('matrix')
  const [tasks, setTasks] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [lastLocalUpdate, setLastLocalUpdate] = useState(null)
  const { user, loading } = useAuth()
  const { isProd, useFirebase } = config

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  }

  const handleTaskSave = async (updatedTask) => {
    try {
      const updatedTasks = await TaskService.updateTask(updatedTask, tasks, user, isProd);
      setTasks(updatedTasks);
      setIsModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const updatedTasks = await TaskService.deleteTask(taskId, tasks, user, isProd);
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleTaskComplete = async (task) => {
    try {
      const updatedTasks = await TaskService.toggleTaskComplete(task, tasks, user, isProd);
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleCreateTask = async (newTask) => {
    try {
      const updatedTasks = await TaskService.createTask(newTask, user, isProd, tasks);
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleTasksUpdate = async (updatedTasks) => {
    try {
      const result = await TaskService.bulkUpdateTasks(updatedTasks, user, isProd, lastLocalUpdate, setLastLocalUpdate);
      setTasks(result);
    } catch (error) {
      console.error('Error updating tasks:', error);
      setTasks(tasks); // Revert on error
    }
  };

  useEffect(() => {
    if (useFirebase && user) {
      const db = getFirestore();
      const tasksRef = collection(db, `users/${user.uid}/tasks`);
      
      const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
        const currentTime = new Date().getTime();
        
        // Ignore updates that happen within 2 seconds of a local update
        if (lastLocalUpdate && currentTime - lastLocalUpdate < 2000) {
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
  }, [useFirebase, user, lastLocalUpdate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (useFirebase && !user) {
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