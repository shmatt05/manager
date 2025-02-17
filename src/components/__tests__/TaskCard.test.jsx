import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import TaskCard from '../TaskCard'
import { DndContext } from '@dnd-kit/core'
import useTaskStore from '../../stores/taskStore'

// Mock the store hook
vi.mock('../../stores/taskStore')

describe('TaskCard', () => {
  const mockTask = {
    id: '123',
    title: 'Test Task',
    rawText: 'Test Task #important',
    priority: 2,
    tags: ['important'],
    status: 'todo',
    dueDate: new Date().toISOString()
  }

  const mockUpdateTask = vi.fn()
  const mockDeleteTask = vi.fn()

  beforeEach(() => {
    useTaskStore.mockImplementation((selector) => 
      selector({
        tasks: [mockTask],
        updateTask: mockUpdateTask,
        deleteTask: mockDeleteTask,
        reorderTasks: vi.fn()
      })
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderWithDnd = (ui) => {
    return render(
      <DndContext>
        {ui}
      </DndContext>
    )
  }

  it('renders task details correctly', () => {
    renderWithDnd(<TaskCard task={mockTask} />)
    
    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getByText('#important')).toBeInTheDocument()
    expect(screen.getByText('P2')).toBeInTheDocument()
  })

  it('shows action buttons on hover', async () => {
    renderWithDnd(<TaskCard task={mockTask} />)
    
    const card = screen.getByText('Test Task').closest('div')
    fireEvent.mouseEnter(card)
    
    expect(screen.getByTitle('Complete task')).toBeInTheDocument()
    expect(screen.getByTitle('Delete task')).toBeInTheDocument()
  })

  it('handles task completion', () => {
    renderWithDnd(<TaskCard task={mockTask} />)
    
    const card = screen.getByText('Test Task').closest('div')
    fireEvent.mouseEnter(card)
    const completeButton = screen.getByTitle('Complete task')
    fireEvent.click(completeButton)
    
    expect(mockUpdateTask).toHaveBeenCalledWith('123', {
      status: 'completed',
      completedAt: expect.any(String)
    })
  })

  it('handles task restoration when completed', () => {
    const completedTask = { ...mockTask, status: 'completed' }
    renderWithDnd(<TaskCard task={completedTask} />)
    
    const card = screen.getByText('Test Task').closest('div')
    fireEvent.mouseEnter(card)
    const restoreButton = screen.getByTitle('Restore task')
    fireEvent.click(restoreButton)
    
    expect(mockUpdateTask).toHaveBeenCalledWith('123', {
      status: 'todo',
      completedAt: null
    })
  })

  it('handles reordering with up/down buttons', () => {
    const onMoveUp = vi.fn()
    const onMoveDown = vi.fn()
    
    renderWithDnd(
      <TaskCard 
        task={mockTask} 
        onMoveUp={onMoveUp} 
        onMoveDown={onMoveDown}
        isFirst={false}
        isLast={false}
      />
    )
    
    fireEvent.click(screen.getByTitle('Move up'))
    expect(onMoveUp).toHaveBeenCalled()
    
    fireEvent.click(screen.getByTitle('Move down'))
    expect(onMoveDown).toHaveBeenCalled()
  })
}) 