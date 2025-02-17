import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import MatrixView from './views/MatrixView'
import CompletedView from './views/CompletedView'
import TaskCreate from './components/TaskCreate'
import clsx from 'clsx'
import TaskModal from './components/TaskModal'
import { storage } from './utils/storage'

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

  const handleTaskClick = (task) => {
    setSelectedTask(task)
    setIsModalOpen(true)
  }

  const handleTaskSave = (updatedTask) => {
    setTasks(tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ))
    setIsModalOpen(false)
    setSelectedTask(null)
  }

  const saveTasksToStorage = async (tasks) => {
    await storage.saveData(tasks)
  }

  const loadTasksFromStorage = async () => {
    const data = await storage.loadData()
    if (data) {
      setTasks(data)
    }
  }

  // Load tasks from storage on mount
  useEffect(() => {
    loadTasksFromStorage();
  }, []);

  // Save tasks to storage whenever they change
  useEffect(() => {
    saveTasksToStorage(tasks);
  }, [tasks]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col h-screen bg-blue-50">
        <TaskCreate />
        
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
          {activeTab === 'matrix' ? <MatrixView /> : <CompletedView />}
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