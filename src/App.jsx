import { useEffect, useState, useCallback, useRef } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import MatrixView from './views/MatrixView'
import CompletedView from './views/CompletedView'
import TaskCreate from './components/TaskCreate'
import TaskModal from './components/TaskModal'
import { getFirestore, collection, onSnapshot, query, where } from 'firebase/firestore'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { TourProvider, useTour } from './contexts/TourContext'
import Joyride from 'react-joyride'
import Login from './components/Login'
import HistoryView from './views/HistoryView'
import Header from './components/Header'
import { TaskService } from './services/TaskService'
import { BoardService } from './services/BoardService'
import { config } from './config'
import StepThreeTooltip from './components/Tour/StepThreeTooltip'
import useBoardStore from './stores/boardStore'
import useTaskStore from './stores/taskStore'

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
  const [boards, setBoards] = useState([])
  const [isLoadingBoards, setIsLoadingBoards] = useState(true)
  // No longer using sendAllToBacklogFn - functionality has been moved to direct button click
  // Remove the backlogOperationActive state as it was causing an infinite loop

  // Get auth and config variables early to avoid reference errors
  const { user, loading } = useAuth()
  const { isProd, useFirebase } = config

  // Get tour state and callbacks from TourContext
  const { isTourOpen, tourStep, tourSteps, handleJoyrideCallback, nextStep, prevStep } = useTour();

  // Get board store state and actions
  const { activeBoard, initializeBoards, setBoards: setBoardsInStore } = useBoardStore();

  // Initialize boards
  useEffect(() => {
    const initBoards = async () => {
      if (loading) return;

      try {
        // Initialize the board store
        const activeBoardId = initializeBoards();

        if (useFirebase && user) {
          // Load boards from Firebase
          const loadedBoards = await BoardService.getBoards(user, isProd);

          if (loadedBoards.length === 0) {
            // Create a default board if none exists
            const defaultBoard = {
              id: 'default',
              name: 'Default Board',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              order: 0
            };

            await BoardService.createBoard(defaultBoard, user, isProd);
            setBoardsInStore([defaultBoard]);
            setBoards([defaultBoard]);
          } else {
            // Sort boards by order
            const sortedBoards = [...loadedBoards].sort((a, b) => a.order - b.order);
            setBoardsInStore(sortedBoards);
            setBoards(sortedBoards);
          }
        }
      } catch (error) {
        console.error('Error initializing boards:', error);
      } finally {
        setIsLoadingBoards(false);
      }
    };

    initBoards();
  }, [user, loading, isProd, useFirebase, initializeBoards, setBoardsInStore]);

  // Listen for tour:close-modal event to close the modal when moving from step 3 to step 4
  useEffect(() => {
    const handleCloseModal = () => {
      console.log('App: Received tour:close-modal event, closing modal');
      setIsModalOpen(false);
      setSelectedTask(null);
    };

    document.addEventListener('tour:close-modal', handleCloseModal);
    return () => {
      document.removeEventListener('tour:close-modal', handleCloseModal);
    };
  }, []);

  // Listen for tour:change-tab event to change the active tab during the tour
  useEffect(() => {
    const handleChangeTab = (event) => {
      if (event.detail && event.detail.tab) {
        console.log('App: Received tour:change-tab event, changing tab to', event.detail.tab);
        setActiveTab(event.detail.tab);
      }
    };

    document.addEventListener('tour:change-tab', handleChangeTab);
    return () => {
      document.removeEventListener('tour:change-tab', handleChangeTab);
    };
  }, []);

  // Listen for tour:complete-task event to complete a task during the tour
  useEffect(() => {
    const handleCompleteTask = (event) => {
      if (event.detail && event.detail.taskId) {
        console.log('App: Received tour:complete-task event for task:', event.detail.taskId);
        const taskToComplete = tasks.find(task => task.id === event.detail.taskId);
        if (taskToComplete) {
          handleTaskComplete(taskToComplete);
        } else {
          console.error('App: Could not find task with ID:', event.detail.taskId);
        }
      }
    };

    document.addEventListener('tour:complete-task', handleCompleteTask);
    return () => {
      document.removeEventListener('tour:complete-task', handleCompleteTask);
    };
  }, [tasks, user, isProd]);

  // CRITICAL FIX: We don't need to pass the function between components anymore
  // This was causing the issues with tasks being moved to backlog unexpectedly
  useEffect(() => {
    // Make tasks available to the Header component via window for the Send All to Backlog button
    window.allTasks = tasks;
  }, [tasks]);

  // Filter backlog tasks for the Day Planner
  const backlogTasks = tasks.filter(task => 
    task.scheduledFor === 'backlog' && 
    task.status !== 'completed'
  )

  // FINAL FIX: Proper implementation that accepts tasks array
  const handleSendAllToBacklog = useCallback((updatedTasks) => {
    // Get the active board ID
    const activeBoardId = useBoardStore.getState().activeBoard || 'default';

    // If we get an array of tasks, use that directly
    if (Array.isArray(updatedTasks) && updatedTasks.length > 0) {
      console.log("Processing explicit 'Send All to Backlog' with provided tasks array");

      // Ensure all tasks have a boardId (use existing or active board)
      const tasksWithBoard = updatedTasks.map(task => ({
        ...task,
        boardId: task.boardId || activeBoardId
      }));

      // Use bulk update to process changes
      TaskService.bulkUpdateTasks(tasksWithBoard, user, isProd, lastLocalUpdate, setLastLocalUpdate, activeBoardId)
        .then((result) => {
          setTasks(result);
          console.log("Successfully moved tasks to backlog");
        })
        .catch(error => {
          console.error("Failed to move tasks to backlog:", error);
        });
      return;
    }

    // Otherwise, process tasks from the current state (fallback)
    console.log("Processing 'Send All to Backlog' request");

    // Find non-backlog, non-completed tasks in the active board
    const tasksToMove = tasks.filter(task => 
      task.status !== 'completed' && 
      task.scheduledFor !== 'backlog' &&
      (task.boardId === activeBoardId || (!task.boardId && activeBoardId === 'default'))
    );

    if (tasksToMove.length === 0) {
      console.log("No tasks to move to backlog");
      return;
    }

    console.log(`Moving ${tasksToMove.length} tasks to backlog`);

    // Create updated tasks
    const updatedTaskList = tasks.map(task => {
      if (task.status !== 'completed' && 
          task.scheduledFor !== 'backlog' &&
          (task.boardId === activeBoardId || (!task.boardId && activeBoardId === 'default'))) {
        // Remove existing quadrant tags
        const quadrantTags = ['do', 'schedule', 'delegate', 'eliminate', 'backlog'];
        const filteredTags = task.tags.filter(tag => !quadrantTags.includes(tag));

        return {
          ...task,
          scheduledFor: 'backlog',
          priority: 5,
          tags: [...new Set([...filteredTags, 'backlog'])],
          boardId: task.boardId || activeBoardId,
          updatedAt: new Date().toISOString()
        };
      }
      return task;
    });

    // Update tasks
    TaskService.bulkUpdateTasks(updatedTaskList, user, isProd, lastLocalUpdate, setLastLocalUpdate, activeBoardId)
      .then((result) => {
        setTasks(result);
        console.log("Successfully moved all tasks to backlog");
      })
      .catch(error => {
        console.error("Failed to move tasks to backlog:", error);
      });
  }, [tasks, user, isProd, lastLocalUpdate, setLastLocalUpdate]);

  // Handle task decisions from the Day Planner
  const handleDayPlannerDecision = async (task, decision) => {
    try {
      // Create a copy of the task with updated properties
      const updatedTask = { ...task };
      let shouldUpdateTask = true;

      // Update task properties based on decision
      if (decision === 'do') {
        updatedTask.scheduledFor = 'today';
        updatedTask.priority = 1;
        updatedTask.tags = [...new Set([...updatedTask.tags.filter(tag => tag !== 'backlog'), 'important', 'do'])];
      } else if (decision === 'schedule') {
        updatedTask.scheduledFor = 'today';
        updatedTask.priority = 3;
        updatedTask.tags = [...new Set([...updatedTask.tags.filter(tag => tag !== 'backlog'), 'important', 'schedule'])];
      } else if (decision === 'delegate') {
        updatedTask.scheduledFor = 'today';
        updatedTask.priority = 2;
        updatedTask.tags = [...new Set([...updatedTask.tags.filter(tag => tag !== 'important').filter(tag => tag !== 'backlog'), 'delegate'])];
      } else if (decision === 'eliminate') {
        updatedTask.scheduledFor = 'today';
        updatedTask.priority = 4;
        updatedTask.tags = [...new Set([...updatedTask.tags.filter(tag => tag !== 'important').filter(tag => tag !== 'backlog'), 'eliminate'])];
      } else if (decision === 'backlog') {
        // For backlog decisions, we don't need to update the task in the database,
        // but we need to continue processing to ensure the day planner moves to the next task
        // and eventually shows the completion screen
        shouldUpdateTask = false;
      }

      if (shouldUpdateTask) {
        // Add updated timestamp
        updatedTask.updatedAt = new Date().toISOString();

        // Update the task
        const updatedTasks = await TaskService.updateTask(updatedTask, tasks, user, isProd);
        setTasks(updatedTasks);
      }
    } catch (error) {
      console.error('Error updating task from Day Planner:', error);
    }
  }

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  }

  const handleTaskSave = async (updatedTask) => {
    try {
      // Handle special actions
      if (updatedTask._action) {
        if (updatedTask._action === 'delete') {
          await handleDeleteTask(updatedTask.id);
          setIsModalOpen(false);
          setSelectedTask(null);
          return;
        } else if (updatedTask._action === 'toggleComplete') {
          await handleTaskComplete(updatedTask);
          setIsModalOpen(false);
          setSelectedTask(null);
          return;
        }
        // Remove the _action property before saving
        const { _action, ...taskToSave } = updatedTask;
        updatedTask = taskToSave;
      }

      // Get the active board ID
      const activeBoardId = useBoardStore.getState().activeBoard || 'default';

      // Ensure the task has a boardId (use existing or active board)
      const taskWithBoard = {
        ...updatedTask,
        boardId: updatedTask.boardId || activeBoardId
      };

      const updatedTasks = await TaskService.updateTask(taskWithBoard, tasks, user, isProd, activeBoardId);
      setTasks(updatedTasks);
      setIsModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      // Get the task to delete
      const taskToDelete = tasks.find(t => t.id === taskId);
      if (!taskToDelete) return;

      // Get the active board ID
      const activeBoardId = useBoardStore.getState().activeBoard || 'default';

      // Ensure the task has a boardId (use existing or active board)
      const taskWithBoard = {
        ...taskToDelete,
        boardId: taskToDelete.boardId || activeBoardId
      };

      // Only delete if the task belongs to the active board
      if (taskWithBoard.boardId === activeBoardId || (taskWithBoard.boardId === 'default' && activeBoardId === 'default')) {
        const updatedTasks = await TaskService.deleteTask(taskId, tasks, user, isProd);
        setTasks(updatedTasks);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleTaskComplete = async (task) => {
    try {
      // Get the active board ID
      const activeBoardId = useBoardStore.getState().activeBoard || 'default';

      // Ensure the task has a boardId (use existing or active board)
      const taskWithBoard = {
        ...task,
        boardId: task.boardId || activeBoardId
      };

      const updatedTasks = await TaskService.toggleTaskComplete(taskWithBoard, tasks, user, isProd);
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleCreateTask = async (newTask) => {
    try {
      // Get the active board ID
      const activeBoardId = useBoardStore.getState().activeBoard || 'default';

      // Create the task with the active board ID
      const updatedTasks = await TaskService.createTask(newTask, user, isProd, tasks, activeBoardId);
      setTasks(updatedTasks);

      // Dispatch tour:add-task event for the tour to track the newly created task
      const tourAddTaskEvent = new CustomEvent('tour:add-task', {
        detail: { task: newTask }
      });
      document.dispatchEvent(tourAddTaskEvent);
      console.log('App: Dispatched tour:add-task event for task:', newTask.id);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleTasksUpdate = async (updatedTasks) => {
    try {
      // Get the active board ID
      const activeBoardId = useBoardStore.getState().activeBoard || 'default';

      // Ensure all tasks have a boardId (use existing or active board)
      const tasksWithBoard = updatedTasks.map(task => ({
        ...task,
        boardId: task.boardId || activeBoardId
      }));

      const result = await TaskService.bulkUpdateTasks(tasksWithBoard, user, isProd, lastLocalUpdate, setLastLocalUpdate, activeBoardId);
      setTasks(result);
    } catch (error) {
      console.error('Error updating tasks:', error);
      setTasks(tasks); // Revert on error
    }
  };

  // Watch for changes to the active board
  useEffect(() => {
    // When the active board changes, update the tasks
    if (activeBoard && tasks.length > 0) {
      // Filter tasks for the active board
      const filteredTasks = tasks.filter(task => 
        task.boardId === activeBoard || 
        (!task.boardId && activeBoard === 'default')
      );

      // If we have filtered tasks, update the task store
      if (filteredTasks.length !== tasks.length) {
        useTaskStore.getState().setTasks(tasks);
      }
    }
  }, [activeBoard, tasks]);

  // Load tasks from Firebase or localStorage
  useEffect(() => {
    if (useFirebase && user) {
      const db = getFirestore();
      const tasksRef = collection(db, `users/${user.uid}/tasks`);

      // Create a query to get all tasks (we'll filter by board ID in memory)
      // This allows us to efficiently handle board switching without re-fetching
      const tasksQuery = query(tasksRef);

      const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
        const currentTime = new Date().getTime();

        // Ignore updates that happen within 2 seconds of a local update
        if (lastLocalUpdate && currentTime - lastLocalUpdate < 2000) {
          return;
        }

        const tasksData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          boardId: doc.data().boardId || 'default' // Ensure all tasks have a boardId
        }));

        // Sort tasks by order field if it exists, otherwise maintain the order from Firebase
        const sortedTasks = [...tasksData].sort((a, b) => {
          // If both tasks have order field, sort by order
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          // If only one task has order field, prioritize the one with order
          if (a.order !== undefined) return -1;
          if (b.order !== undefined) return 1;
          // Default to creation time (newest first) if no order field
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

        // Update the task store
        useTaskStore.getState().setTasks(sortedTasks);

        // Update the local state
        setTasks(sortedTasks);
      });

      return () => unsubscribe();
    } else {
      const savedTasks = localStorage.getItem('tasks');
      if (savedTasks) {
        const tasksData = JSON.parse(savedTasks);

        // Ensure all tasks have a boardId
        const tasksWithBoard = tasksData.map(task => ({
          ...task,
          boardId: task.boardId || 'default'
        }));

        // Sort tasks by order field if it exists, otherwise maintain the order from localStorage
        const sortedTasks = [...tasksWithBoard].sort((a, b) => {
          // If both tasks have order field, sort by order
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          // If only one task has order field, prioritize the one with order
          if (a.order !== undefined) return -1;
          if (b.order !== undefined) return 1;
          // Default to creation time (newest first) if no order field
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

        // Update the task store
        useTaskStore.getState().setTasks(sortedTasks);

        // Update the local state
        setTasks(sortedTasks);
      }
    }
  }, [useFirebase, user, lastLocalUpdate, activeBoard]);

  // Force position the tooltip for step 3
  useEffect(() => {
    if (isTourOpen && tourStep === 2) {
      const positionTooltip = () => {
        const tooltip = document.querySelector('.react-joyride__tooltip');
        if (tooltip) {
          tooltip.style.position = 'fixed';
          tooltip.style.top = '20px';
          tooltip.style.left = '50%';
          tooltip.style.transform = 'translateX(-50%)';
          tooltip.style.margin = '0';
          tooltip.style.zIndex = '11000';
          console.log('App: Forced tooltip position to top of screen');
        }
      };

      // Try positioning immediately
      positionTooltip();

      // And also set an interval to keep checking
      const intervalId = setInterval(positionTooltip, 100);

      return () => clearInterval(intervalId);
    }
  }, [isTourOpen, tourStep]);

  // Add tour-step-4 class to body when on step 4
  useEffect(() => {
    if (isTourOpen && tourStep === 3) {
      // Add class for step 4
      document.body.classList.add('tour-step-4');
    } else {
      // Remove class when not on step 4
      document.body.classList.remove('tour-step-4');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('tour-step-4');
    };
  }, [isTourOpen, tourStep]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (useFirebase && !user) {
    return <Login />;
  }

  // Joyride tour configuration
  const joyrideStyles = {
    options: {
      zIndex: 10000,
      arrowColor: '#fff',
      backgroundColor: '#fff',
      primaryColor: '#3366FF',
      textColor: '#333',
      overlayColor: 'rgba(0, 0, 0, 0.5)',
    },
    tooltip: {
      borderRadius: '8px',
      fontSize: '14px',
      padding: '16px',
      maxWidth: '420px',
    },
    tooltipContainer: {
      textAlign: 'left',
    },
    tooltipTitle: {
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '8px',
    },
    buttonNext: {
      backgroundColor: '#3366FF',
      borderRadius: '4px',
      color: '#fff',
      fontSize: '14px',
    },
    buttonBack: {
      color: '#666',
      fontSize: '14px',
      marginRight: '8px',
    },
    buttonSkip: {
      color: '#666',
      fontSize: '14px',
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    spotlight: {
      borderRadius: '8px',
    }
  };

  // Filter tasks by active board
  const activeBoardId = useBoardStore.getState().activeBoard || 'default';
  const filteredTasks = tasks.filter(task => 
    task.boardId === activeBoardId || 
    (!task.boardId && activeBoardId === 'default')
  );

  // Filter backlog tasks for the active board
  const filteredBacklogTasks = backlogTasks.filter(task => 
    task.boardId === activeBoardId || 
    (!task.boardId && activeBoardId === 'default')
  );

  // Loading state for boards
  if (isLoadingBoards) {
    return <div className="flex items-center justify-center h-screen bg-blue-50 dark:bg-dark-background">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading boards...</p>
      </div>
    </div>;
  }

  return (
    <div className="flex flex-col h-screen bg-blue-50 dark:bg-dark-background noise-texture">
      {/* Custom Step Three Tooltip */}
      <StepThreeTooltip 
        isVisible={isTourOpen && tourStep === 2}
        onNext={nextStep}
        onPrev={prevStep}
      />

      {/* Joyride Tour Component - Hide during step 3 */}
      {(tourStep !== 2 || !isTourOpen) && (
        <Joyride
          steps={tourSteps}
          run={isTourOpen}
          stepIndex={tourStep}
          callback={handleJoyrideCallback}
          continuous
          showProgress
          showSkipButton
          styles={{
            ...joyrideStyles,
            overlay: {
              ...joyrideStyles.overlay,
              backgroundColor: tourStep === 2 ? 'transparent' : 
                              tourStep === 3 ? 'rgba(0, 0, 0, 0.2)' : 
                              tourStep === 4 ? 'transparent' : 'rgba(0, 0, 0, 0.5)',
            },
            options: {
              ...joyrideStyles.options,
              zIndex: tourStep === 2 ? 9000 : 10000,
            }
          }}
          disableOverlayClose={false}
          disableOverlay={tourStep === 2 || tourStep === 4}
          disableCloseOnEsc={false}
          spotlightClicks={true}
          floaterProps={{
            disableAnimation: false,
            hideArrow: tourStep === 2,
          }}
          locale={{
            back: 'Back',
            close: 'Close',
            last: 'Finish',
            next: 'Next',
            skip: 'Skip',
          }}
          scrollToFirstStep
          scrollOffset={120}
        />
      )}

      <Header 
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSendAllToBacklog={handleSendAllToBacklog}
        backlogTasks={filteredBacklogTasks}
        onTaskDecision={handleDayPlannerDecision}
        tourEnabled={isTourOpen} // Pass tour state to Header
      >
        <TaskCreate onCreateTask={handleCreateTask} />
      </Header>

      <main className="flex-1 overflow-auto scrollbar-subtle">
        {activeTab === 'matrix' ? (
          <MatrixView 
            tasks={filteredTasks}
            onTaskClick={handleTaskClick}
            onTaskUpdate={handleTasksUpdate}
            onTaskSave={handleTaskSave}
            onTaskDelete={handleDeleteTask}
            onTaskComplete={handleTaskComplete}
            /* No longer needed */
          />
        ) : activeTab === 'completed' ? (
          <CompletedView 
            tasks={filteredTasks}
            onTaskClick={handleTaskClick}
            onTaskUpdate={handleTaskSave}
            onTaskDelete={handleDeleteTask}
            onTaskComplete={handleTaskComplete}
          />
        ) : (
          <HistoryView boardId={activeBoardId} />
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
        <TourProvider>
          <AppContent />
        </TourProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}
