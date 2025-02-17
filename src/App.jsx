import { useState } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import MatrixView from './views/MatrixView'
import CompletedView from './views/CompletedView'
import TaskCreate from './components/TaskCreate'
import clsx from 'clsx'

const queryClient = new QueryClient()

const tabs = [
  { id: 'matrix', label: 'Matrix' },
  { id: 'completed', label: 'Completed' }
]

function App() {
  const [activeTab, setActiveTab] = useState('matrix')

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
      </div>
    </QueryClientProvider>
  )
}

export default App 