import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import CompletedView from '../CompletedView'
import { DndContext } from '@dnd-kit/core'
import useTaskStore from '../../stores/taskStore'

// Mock the store hook
vi.mock('../../stores/taskStore')

const mockCompletedTasks = [
  {
    id: '1',
    title: 'Completed Task 1',
    status: 'completed',
    completedAt: '2024-03-20T10:00:00.000Z',
    rawText: 'Completed Task 1',
    tags: [],
    priority: 3
  },
  {
    id: '2',
    title: 'Completed Task 2',
    status: 'completed',
    completedAt: '2024-03-21T10:00:00.000Z',
    rawText: 'Completed Task 2',
    tags: [],
    priority: 3
  }
]

const renderWithDnd = (ui) => {
  return render(
    <DndContext>
      {ui}
    </DndContext>
  )
}

describe('CompletedView', () => {
  beforeEach(() => {
    useTaskStore.mockImplementation((selector) => {
      if (!selector) return { tasks: mockCompletedTasks }
      return selector({ tasks: mockCompletedTasks })
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders completed tasks grouped by date', () => {
    renderWithDnd(<CompletedView />)
    
    expect(screen.getByText('Completed Tasks')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Completed Task 1' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Completed Task 2' })).toBeInTheDocument()
  })

  it('shows empty state when no completed tasks', () => {
    useTaskStore.mockImplementation((selector) => {
      if (!selector) return { tasks: [] }
      return selector({ tasks: [] })
    })
    
    renderWithDnd(<CompletedView />)
    
    expect(screen.getByText('No completed tasks yet')).toBeInTheDocument()
  })
}) 