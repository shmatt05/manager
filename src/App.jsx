import { useEffect, useState, useCallback, useRef } from 'react'
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
  // No longer using sendAllToBacklogFn - functionality has been moved to direct button click
  // Remove the backlogOperationActive state as it was causing an infinite loop

  // CRITICAL FIX: We don't need to pass the function between components anymore
  // This was causing the issues with tasks being moved to backlog unexpectedly
  useEffect(() => {
    // Make tasks available to the Header component via window for the Send All to Backlog button
    window.allTasks = tasks;
  }, [tasks]);
  const { user, loading } = useAuth()
  const { isProd, useFirebase } = config

  // Filter backlog tasks for the Day Planner
  const backlogTasks = tasks.filter(task => 
    task.scheduledFor === 'backlog' && 
    task.status !== 'completed'
  )
  
  // FINAL FIX: Proper implementation that accepts tasks array
  const handleSendAllToBacklog = useCallback((updatedTasks) => {
    // If we get an array of tasks, use that directly
    if (Array.isArray(updatedTasks) && updatedTasks.length > 0) {
      console.log("Processing explicit 'Send All to Backlog' with provided tasks array");
      // Use bulk update to process changes
      TaskService.bulkUpdateTasks(updatedTasks, user, isProd, lastLocalUpdate, setLastLocalUpdate)
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
    
    // Find non-backlog, non-completed tasks
    const tasksToMove = tasks.filter(task => 
      task.status !== 'completed' && task.scheduledFor !== 'backlog'
    );
    
    if (tasksToMove.length === 0) {
      console.log("No tasks to move to backlog");
      return;
    }
    
    console.log(`Moving ${tasksToMove.length} tasks to backlog`);
    
    // Create updated tasks
    const updatedTaskList = tasks.map(task => {
      if (task.status !== 'completed' && task.scheduledFor !== 'backlog') {
        // Remove existing quadrant tags
        const quadrantTags = ['do', 'schedule', 'delegate', 'eliminate', 'backlog'];
        const filteredTags = task.tags.filter(tag => !quadrantTags.includes(tag));
        
        return {
          ...task,
          scheduledFor: 'backlog',
          priority: 5,
          tags: [...new Set([...filteredTags, 'backlog'])],
          updatedAt: new Date().toISOString()
        };
      }
      return task;
    });
    
    // Update tasks
    TaskService.bulkUpdateTasks(updatedTaskList, user, isProd, lastLocalUpdate, setLastLocalUpdate)
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
    <div className="flex flex-col h-screen bg-blue-50 dark:bg-dark-background noise-texture">
      <Header 
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSendAllToBacklog={handleSendAllToBacklog}
        backlogTasks={backlogTasks}
        onTaskDecision={handleDayPlannerDecision}
      >
        <TaskCreate onCreateTask={handleCreateTask} />
      </Header>

      <main className="flex-1 overflow-auto scrollbar-subtle">
        {activeTab === 'matrix' ? (
          <MatrixView 
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onTaskUpdate={handleTasksUpdate}
            onTaskSave={handleTaskSave}
            onTaskDelete={handleDeleteTask}
            onTaskComplete={handleTaskComplete}
            /* No longer needed */
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
