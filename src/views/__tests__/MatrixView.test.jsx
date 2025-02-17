import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import MatrixView from '../MatrixView'
import { DndContext } from '@dnd-kit/core'
import useTaskStore from '../../stores/taskStore'

// Mock the store hook
vi.mock('../../stores/taskStore')

const mockTasks = [
  {
    id: '1',
    title: 'Urgent Important',
    priority: 1,
    tags: ['important'],
    status: 'todo',
    rawText: 'Urgent Important'
  },
  {
    id: '2',
    title: 'Not Urgent Important',
    priority: 4,
    tags: ['important'],
    status: 'todo',
    rawText: 'Not Urgent Important'
  },
  {
    id: '3',
    title: 'Tomorrow Task',
    priority: 3,
    scheduledFor: 'tomorrow',
    tags: [],
    status: 'todo',
    rawText: 'Tomorrow Task'
  }
]

const renderWithDnd = (ui) => {
  return render(
    <DndContext>
      {ui}
    </DndContext>
  )
}

describe('MatrixView', () => {
  beforeEach(() => {
    // Set up the mock implementation for each test
    useTaskStore.mockImplementation((selector) => {
      // Return the full store state if no selector is provided
      if (!selector) return { tasks: mockTasks }
      // Otherwise, call the selector with the store state
      return selector({ tasks: mockTasks })
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders all quadrants', () => {
    renderWithDnd(<MatrixView />)
    
    expect(screen.getByText('Do')).toBeInTheDocument()
    expect(screen.getByText('Schedule')).toBeInTheDocument()
    expect(screen.getByText('Delegate')).toBeInTheDocument()
    expect(screen.getByText('Eliminate')).toBeInTheDocument()
    expect(screen.getByText('Tomorrow')).toBeInTheDocument()
  })

  it('sorts tasks into correct quadrants', () => {
    renderWithDnd(<MatrixView />)
    
    // Use getByRole to find the task titles
    expect(screen.getByRole('heading', { name: 'Urgent Important' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Not Urgent Important' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tomorrow Task' })).toBeInTheDocument()
  })

  it('filters out completed tasks', () => {
    const tasksWithCompleted = [
      ...mockTasks,
      {
        id: '4',
        title: 'Completed Task',
        priority: 1,
        tags: [],
        status: 'completed',
        rawText: 'Completed Task'
      }
    ]

    useTaskStore.mockImplementation((selector) => {
      if (!selector) return { tasks: tasksWithCompleted }
      return selector({ tasks: tasksWithCompleted })
    })
    
    renderWithDnd(<MatrixView />)
    
    expect(screen.queryByRole('heading', { name: 'Completed Task' })).not.toBeInTheDocument()
  })
}) 