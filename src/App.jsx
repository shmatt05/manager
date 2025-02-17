import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import MatrixView from './views/MatrixView'
import CompletedView from './views/CompletedView'
import TaskCreate from './components/TaskCreate'
import clsx from 'clsx'
import TaskModal from './components/TaskModal'
import { storage } from './utils/storage'
import AuthButton from './components/AuthButton'
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { getDatabase, ref, set, onValue } from 'firebase/database'

const queryClient = new QueryClient()

const tabs = [
  { id: 'matrix', label: 'Matrix' },
  { id: 'completed', label: 'Completed' }
]

function App() {
  const [activeTab, setActiveTab] = useState('matrix')
  const [tasks, setTasks] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [user, setUser] = useState(null)
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

  const handleLogin = async () => {
    const auth = getAuth()
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      setUser(result.user)
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  const saveToStorage = async (newTasks) => {
    if (isProd && user) {
      const db = getDatabase()
      await set(ref(db, `tasks/${user.uid}`), newTasks)
    } else if (!isProd) {
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

  useEffect(() => {
    if (isProd) {
      const auth = getAuth()
      const unsubscribe = auth.onAuthStateChanged((user) => {
        setUser(user)
        if (user) {
          localStorage.clear()
          
          const db = getDatabase()
          const tasksRef = ref(db, `tasks/${user.uid}`)
          
          const unsubscribeDB = onValue(tasksRef, (snapshot) => {
            const data = snapshot.val()
            setTasks(data || [])
          })

          return () => unsubscribeDB()
        } else {
          setTasks([])
        }
      })

      return () => unsubscribe()
    } else {
      const savedTasks = localStorage.getItem('tasks')
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks))
      }
    }
  }, [isProd])

  if (isProd && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Welcome to Task Manager</h1>
          <button 
            onClick={handleLogin}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col h-screen bg-blue-50">
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
            />
          ) : (
            <CompletedView 
              tasks={tasks}
              onTaskClick={handleTaskClick}
              onTaskUpdate={saveToStorage}
              onTaskDelete={handleDeleteTask}
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
    </QueryClientProvider>
  )
}

export default App 