import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import MatrixView from './views/MatrixView'
import CompletedView from './views/CompletedView'
import TaskCreate from './components/TaskCreate'
import clsx from 'clsx'
import TaskModal from './components/TaskModal'
import { storage } from './utils/storage'
import AuthButton from './components/AuthButton'
import { getFirestore, collection, doc, setDoc, onSnapshot } from 'firebase/firestore'
import UserIndicator from './components/UserIndicator'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/Login'

const queryClient = new QueryClient()

const tabs = [
  { id: 'matrix', label: 'Matrix' },
  { id: 'completed', label: 'Completed' }
]

function AppContent() {
  const [activeTab, setActiveTab] = useState('matrix')
  const [tasks, setTasks] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user, loading } = useAuth()
  const isProd = import.meta.env.PROD

  const handleTaskClick = (task) => {
    setSelectedTask(task)
    setIsModalOpen(true)
  }

  const handleTaskSave = (updatedTask) => {
    const newTasks = tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    )
    saveToStorage(newTasks)
    setIsModalOpen(false)
    setSelectedTask(null)
  }

  const saveToStorage = async (newTasks) => {
    if (isProd && user) {
      const db = getFirestore()
      const batch = newTasks.map(task => 
        setDoc(doc(db, `users/${user.uid}/tasks/${task.id}`), {
          ...task,
          userId: user.uid,
          updatedAt: new Date().toISOString()
        })
      )
      await Promise.all(batch)
    } else {
      localStorage.setItem('tasks', JSON.stringify(newTasks))
    }
    setTasks(newTasks)
  }

  const handleCreateTask = async (newTask) => {
    const updatedTasks = [...tasks, newTask]
    await saveToStorage(updatedTasks)
  }

  const handleDeleteTask = async (taskId) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId)
    await saveToStorage(updatedTasks)
  }

  const handleTaskComplete = async (task) => {
    const updatedTask = {
      ...task,
      status: task.status === 'completed' ? 'active' : 'completed',
      completedAt: task.status === 'completed' ? null : new Date().toISOString()
    };

    try {
      if (isProd && user) {
        const db = getFirestore();
        const taskRef = doc(db, `users/${user.uid}/tasks/${task.id}`);
        await setDoc(taskRef, {
          ...updatedTask,
          userId: user.uid,
          updatedAt: new Date().toISOString()
        });
      } else {
        const newTasks = tasks.map(t => t.id === task.id ? updatedTask : t);
        localStorage.setItem('tasks', JSON.stringify(newTasks));
        setTasks(newTasks);
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  useEffect(() => {
    if (isProd && user) {
      const db = getFirestore()
      const tasksRef = collection(db, `users/${user.uid}/tasks`)
      
      const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }))
        setTasks(tasksData)
      })

      return () => unsubscribe()
    } else {
      const savedTasks = localStorage.getItem('tasks')
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks))
      }
    }
  }, [isProd, user])

  if (loading) {
    return <div>Loading...</div>
  }

  if (isProd && !user) {
    return <Login />
  }

  return (
    <div className="flex flex-col h-screen bg-blue-50">
      {import.meta.env.MODE === 'production' && user && <UserIndicator />}
      <div className="flex justify-between items-center">
        <TaskCreate onCreateTask={handleCreateTask} />
        <AuthButton />
      </div>
      
      <div className="border-b bg-white px-6">
        <nav className="flex gap-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'px-4 py-2 font-medium text-sm border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <main className="flex-1 overflow-auto">
        {activeTab === 'matrix' ? (
          <MatrixView 
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onTaskUpdate={saveToStorage}
            onTaskDelete={handleDeleteTask}
            onTaskComplete={handleTaskComplete}
          />
        ) : (
          <CompletedView 
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onTaskUpdate={saveToStorage}
            onTaskDelete={handleDeleteTask}
            onTaskComplete={handleTaskComplete}
          />
        )}
      </main>

      <TaskModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedTask(null)
        }}
        onSave={handleTaskSave}
      />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </AuthProvider>
  )
} 