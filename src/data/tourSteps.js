/**
 * Tour steps configuration
 * Each step contains:
 * - id: Unique identifier for the step
 * - title: Title displayed in the tour dialog
 * - content: Main content/description for the step
 * - target: CSS selector or element ID to highlight
 * - position: Where to position the dialog relative to the target
 * - onShow: Function to execute when the step is shown (optional)
 * - spotlightRadius: Custom radius for the spotlight (optional)
 * - disableOverlay: Whether to disable the overlay for this step (optional)
 * - disableSpotlight: Whether to disable the spotlight for this step (optional)
 */

// Helper function to show the task modal with a sample task
const showTaskModal = () => {
  // Find the task modal element
  const taskModal = document.querySelector('[data-tour-id="task-modal"]');
  if (taskModal) {
    // Create a custom event to trigger the modal
    const event = new CustomEvent('tour:show-task-modal');
    document.dispatchEvent(event);
  }
};

// Helper function to simulate adding a task
const simulateAddingTask = () => {
  // Find the task input field
  const taskInput = document.querySelector('form input[type="text"]');
  const addButton = document.querySelector('[data-tour-id="add-task-button"]');
  
  if (taskInput && addButton) {
    // Highlight the input field
    taskInput.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
    
    // Simulate typing
    const sampleTask = 'Review report @2pm #important';
    let i = 0;
    
    const typeChar = () => {
      if (i < sampleTask.length) {
        taskInput.value = sampleTask.substring(0, i + 1);
        
        // Create an input event
        const event = new Event('input', { bubbles: true });
        taskInput.dispatchEvent(event);
        
        i++;
        setTimeout(typeChar, 100);
      } else {
        // Highlight the add button after typing is complete
        setTimeout(() => {
          addButton.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
          
          // Remove highlights after a delay
          setTimeout(() => {
            taskInput.style.boxShadow = '';
            addButton.style.boxShadow = '';
            taskInput.value = '';
            
            // Create an input event to clear the input
            const event = new Event('input', { bubbles: true });
            taskInput.dispatchEvent(event);
          }, 2000);
        }, 500);
      }
    };
    
    // Start typing
    setTimeout(typeChar, 500);
  }
};

// Helper function to show the task card demo
const showTaskCardDemo = () => {
  // Find the task card element
  const taskCard = document.querySelector('[data-tour-id="task-card"]');
  if (taskCard) {
    taskCard.classList.add('tour-highlight');
  }
};

// Helper function to clean up task card demo
const cleanupTaskCardDemo = () => {
  // Find the task card element
  const taskCard = document.querySelector('[data-tour-id="task-card"]');
  if (taskCard) {
    taskCard.classList.remove('tour-highlight');
  }
};

// Helper function to show the task movement demo
const showTaskMoveDemo = () => {
  // Create a container for the demo if it doesn't exist
  let demoContainer = document.getElementById('tour-task-move-demo');
  if (!demoContainer) {
    // Import the demo component dynamically
    import('../components/Tour/TourTaskMoveDemo').then(module => {
      const TourTaskMoveDemo = module.default;
      // Create the demo instance
      const demo = new TourTaskMoveDemo();
      // The component will handle its own rendering via useEffect
    }).catch(error => {
      console.error('Error loading task move demo:', error);
    });
  }
};

// Helper function to clean up the task movement demo
const cleanupTaskMoveDemo = () => {
  const demoContainer = document.getElementById('tour-task-move-demo');
  if (demoContainer) {
    demoContainer.remove();
  }
};

// Helper function to show the matrix quadrants
const showMatrixQuadrants = () => {
  // Find all quadrant elements
  const quadrants = document.querySelectorAll('[data-tour-id^="quadrant-"]');
  quadrants.forEach(quadrant => {
    quadrant.classList.add('tour-highlight');
  });
};

// Helper function to clean up matrix quadrants
const cleanupMatrixQuadrants = () => {
  // Find all quadrant elements
  const quadrants = document.querySelectorAll('[data-tour-id^="quadrant-"]');
  quadrants.forEach(quadrant => {
    quadrant.classList.remove('tour-highlight');
  });
};

// Helper function to show the backlog
const showBacklog = () => {
  // Find the backlog element
  const backlog = document.querySelector('[data-tour-id="backlog"]');
  if (backlog) {
    backlog.classList.add('tour-highlight');
  }
};

// Helper function to clean up backlog
const cleanupBacklog = () => {
  // Find the backlog element
  const backlog = document.querySelector('[data-tour-id="backlog"]');
  if (backlog) {
    backlog.classList.remove('tour-highlight');
  }
};

// Helper function to show the completed tasks
const showCompletedTasks = () => {
  // Find the completed tasks element
  const completedTasks = document.querySelector('[data-tour-id="completed-tasks"]');
  if (completedTasks) {
    completedTasks.classList.add('tour-highlight');
  }
};

// Helper function to clean up completed tasks
const cleanupCompletedTasks = () => {
  // Find the completed tasks element
  const completedTasks = document.querySelector('[data-tour-id="completed-tasks"]');
  if (completedTasks) {
    completedTasks.classList.remove('tour-highlight');
  }
};

// Helper function to show the history view
const showHistoryView = () => {
  // Find the history view element
  const historyView = document.querySelector('[data-tour-id="history-view"]');
  if (historyView) {
    historyView.classList.add('tour-highlight');
  }
};

// Helper function to clean up history view
const cleanupHistoryView = () => {
  // Find the history view element
  const historyView = document.querySelector('[data-tour-id="history-view"]');
  if (historyView) {
    historyView.classList.remove('tour-highlight');
  }
};

// Helper function to show the task creation form
const showTaskCreation = () => {
  // Find the task creation form element
  const taskCreation = document.querySelector('[data-tour-id="task-creation"]');
  if (taskCreation) {
    taskCreation.classList.add('tour-highlight');
  }
};

// Helper function to clean up task creation form
const cleanupTaskCreation = () => {
  // Find the task creation form element
  const taskCreation = document.querySelector('[data-tour-id="task-creation"]');
  if (taskCreation) {
    taskCreation.classList.remove('tour-highlight');
  }
};

// Define custom bullet point styles for different quadrants
const bulletStyles = {
  do: '<span class="inline-block w-2 h-2 bg-[#FF6B6B] rounded-full mt-1.5 mr-2 flex-shrink-0"></span>',
  delegate: '<span class="inline-block w-2 h-2 bg-[#3AAAA0] rounded-full mt-1.5 mr-2 flex-shrink-0"></span>',
  backlog: '<span class="inline-block w-2 h-2 bg-[#95A5A6] rounded-full mt-1.5 mr-2 flex-shrink-0"></span>',
  default: '<span class="inline-block w-2 h-2 bg-[#7F8C8D] rounded-full mt-1.5 mr-2 flex-shrink-0"></span>'
};

const tourSteps = [
  // Introduction
  {
    id: 'welcome',
    title: 'Welcome to the Eisenhower Matrix',
    content: `
      <p>This task management system is based on the Eisenhower Matrix, a proven method for prioritizing tasks based on their urgency and importance.</p>
      
      <p>The matrix divides your tasks into four quadrants:</p>
      
      <ul>
        <li class="flex items-start">
          ${bulletStyles.do}<span><strong>Do</strong> (Urgent & Important): Tasks that require immediate attention</span>
        </li>
        <li class="flex items-start">
          ${bulletStyles.delegate}<span><strong>Schedule</strong> (Important, Not Urgent): Tasks to plan for later</span>
        </li>
        <li class="flex items-start">
          ${bulletStyles.delegate}<span><strong>Delegate</strong> (Urgent, Not Important): Tasks to minimize or delegate</span>
        </li>
        <li class="flex items-start">
          ${bulletStyles.backlog}<span><strong>Eliminate</strong> (Not Urgent or Important): Tasks to reconsider or eliminate</span>
        </li>
      </ul>
      
      <p>Let's take a quick tour to help you get started!</p>
    `,
    target: 'body',
    position: 'center'
  },
  
  // Matrix View
  {
    id: 'matrix-overview',
    title: 'The Eisenhower Matrix',
    content: `
      <p class="mb-4">The matrix is divided into four quadrants, each representing different types of tasks:</p>
      
      <ul class="space-y-3 mb-4">
        <li class="flex items-start">
          ${bulletStyles.do}<span><strong>Do</strong> (Urgent & Important): Tasks requiring immediate attention</span>
        </li>
        <li class="flex items-start">
          ${bulletStyles.delegate}<span><strong>Schedule</strong> (Important, Not Urgent): Tasks to plan for later</span>
        </li>
        <li class="flex items-start">
          ${bulletStyles.delegate}<span><strong>Delegate</strong> (Urgent, Not Important): Tasks that could be delegated</span>
        </li>
        <li class="flex items-start">
          ${bulletStyles.backlog}<span><strong>Eliminate</strong> (Not Urgent or Important): Tasks to reconsider</span>
        </li>
      </ul>
      
      <p>This framework helps you make better decisions about where to invest your time and energy.</p>
    `,
    target: '.grid-cols-2',
    position: 'bottom',
  },
  
  {
    id: 'creating-tasks',
    title: 'Creating New Tasks',
    content: `
      <p class="mb-4">Adding tasks is simple and flexible:</p>
      
      <ul class="space-y-3 mb-4">
        <li class="flex items-start">
          ${bulletStyles.do}<span>Type your task in the input field and click the "Add" button</span>
        </li>
        <li class="flex items-start">
          ${bulletStyles.delegate}<span>Tasks are automatically categorized based on priority and tags</span>
        </li>
        <li class="flex items-start">
          ${bulletStyles.delegate}<span>You can create tasks directly in any quadrant</span>
        </li>
      </ul>
      
      <p class="italic text-gray-600 dark:text-gray-400">Watch as we demonstrate adding a task with a due time and importance tag.</p>
    `,
    target: '[data-tour-id="add-task-button"]',
    position: 'bottom',
    onShow: simulateAddingTask
  },
  
  {
    id: 'task-parsing-tricks',
    title: 'Smart Task Parsing',
    content: `
      <p class="mb-4">Save time with these powerful text shortcuts when creating tasks:</p>
      
      <div class="grid grid-cols-2 gap-2 mb-4">
        <div>
          <ul class="space-y-2">
            <li class="flex items-start">
              ${bulletStyles.do}<span><code class="bg-gray-200 dark:bg-gray-700 px-1 rounded text-gray-800 dark:text-gray-200">#important</code> - Marks as important</span>
            </li>
            <li class="flex items-start">
              ${bulletStyles.delegate}<span><code class="bg-gray-200 dark:bg-gray-700 px-1 rounded text-gray-800 dark:text-gray-200">#do</code> - "Do" quadrant</span>
            </li>
            <li class="flex items-start">
              ${bulletStyles.delegate}<span><code class="bg-gray-200 dark:bg-gray-700 px-1 rounded text-gray-800 dark:text-gray-200">#schedule</code> - "Schedule" quadrant</span>
            </li>
            <li class="flex items-start">
              ${bulletStyles.delegate}<span><code class="bg-gray-200 dark:bg-gray-700 px-1 rounded text-gray-800 dark:text-gray-200">#delegate</code> - "Delegate" quadrant</span>
            </li>
          </ul>
        </div>
        <div>
          <ul class="space-y-2">
            <li class="flex items-start">
              ${bulletStyles.backlog}<span><code class="bg-gray-200 dark:bg-gray-700 px-1 rounded text-gray-800 dark:text-gray-200">#eliminate</code> - "Eliminate" quadrant</span>
            </li>
            <li class="flex items-start">
              ${bulletStyles.delegate}<span><code class="bg-gray-200 dark:bg-gray-700 px-1 rounded text-gray-800 dark:text-gray-200">@time</code> - Sets due time</span>
            </li>
            <li class="flex items-start">
              ${bulletStyles.delegate}<span><code class="bg-gray-200 dark:bg-gray-700 px-1 rounded text-gray-800 dark:text-gray-200">@noon</code> - Sets to 12:00 PM</span>
            </li>
            <li class="flex items-start">
              ${bulletStyles.delegate}<span><code class="bg-gray-200 dark:bg-gray-700 px-1 rounded text-gray-800 dark:text-gray-200">@midnight</code> - Sets to 12:00 AM</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div class="bg-gray-200 dark:bg-gray-700 p-2 rounded text-gray-800 dark:text-gray-200">
        <p class="text-sm font-medium">Example:</p>
        <p class="text-sm"><code>"Review report @2pm #important"</code> creates an important task due at 2:00 PM.</p>
      </div>
    `,
    target: 'form',
    position: 'bottom',
  },
  
  {
    id: 'task-card',
    title: 'Task Card Features',
    content: `
      <p class="mb-4">Each task card contains key information at a glance:</p>
      
      <ul class="space-y-3 mb-4">
        <li class="flex items-start">
          ${bulletStyles.do}<span>Title and description</span>
        </li>
        <li class="flex items-start">
          ${bulletStyles.delegate}<span>Priority indicators</span>
        </li>
        <li class="flex items-start">
          ${bulletStyles.delegate}<span>Tags for categorization</span>
        </li>
        <li class="flex items-start">
          ${bulletStyles.delegate}<span>Due date (if set)</span>
        </li>
        <li class="flex items-start">
          ${bulletStyles.delegate}<span>Quick action buttons</span>
        </li>
      </ul>
      
      <p class="italic text-gray-600 dark:text-gray-400">Look at the highlighted task card to see all these features in action.</p>
    `,
    target: '[data-tour-id="task-card"]',
    position: 'right',
    onShow: showTaskCardDemo,
    onHide: cleanupTaskCardDemo,
    disableOverlay: true,
  },
  
  {
    id: 'moving-tasks',
    title: 'Moving Tasks Between Quadrants',
    content: `
      <p class="mb-4">As priorities change, you can easily move tasks:</p>
      
      <ul class="space-y-3 mb-4">
        <li class="flex items-start">
          ${bulletStyles.do}<span>Drag and drop tasks between quadrants</span>
        </li>
        <li class="flex items-start">
          ${bulletStyles.delegate}<span>Priority and tags update automatically</span>
        </li>
        <li class="flex items-start">
          ${bulletStyles.delegate}<span>Use the right-click menu for quick moves</span>
        </li>
      </ul>
      
      <p class="italic text-gray-600 dark:text-gray-400">Watch the animation to see how tasks can move between different quadrants.</p>
    `,
    target: '[data-tour-id="draggable-task"]',
    position: 'right',
    onShow: showTaskMoveDemo,
    onHide: cleanupTaskMoveDemo,
    disableOverlay: true,
  },
  
  {
    id: 'backlog',
    title: 'The Backlog Section',
    content: `
      <p class="mb-4">The Backlog is your holding area for future tasks:</p>
      
      <ul class="space-y-3 mb-4">
        <li class="flex items-start">
          ${bulletStyles.backlog}<span>Store tasks you'll work on later</span>
        </li>
        <li class="flex items-start">
          ${bulletStyles.delegate}<span>Drag tasks to/from the Backlog as needed</span>
        </li>
        <li class="flex items-start">
          ${bulletStyles.delegate}<span>Use "Send All to Backlog" to clear your matrix at the end of the day</span>
        </li>
      </ul>
      
      <p>This helps you maintain a clean workspace while keeping track of upcoming tasks.</p>
    `,
    target: '[data-tour-id="backlog-section"]',
    position: 'top',
  },
  
  // Task Modal
  {
    id: 'task-modal',
    title: 'Task Details Modal',
    content: `
      <p class="mb-4">The task modal provides comprehensive task management:</p>
      
      <ul class="space-y-3 mb-4">
        <li class="flex items-start">
          ${bulletStyles.do}<span>View and edit all task details</span>
        </li>
        <li class="flex items-start">
          ${bulletStyles.delegate}<span>Set priority levels</span>
        </li>
        <li class="flex items-start">
          ${bulletStyles.delegate}<span>Add tags and due dates</span>
        </li>
        <li class="flex items-start">
          ${bulletStyles.backlog}<span>Track task history</span>
        </li>
      </ul>
      
      <p>Access this by clicking on any task or when creating a new one.</p>
    `,
    target: '[data-tour-id="task-modal"]',
    position: 'center',
    onShow: showTaskModal
  },
  
  {
    id: 'task-editing',
    title: 'Editing Tasks',
    content: `
      <p>Updating tasks is straightforward:</p>
      <ul>
        <li>Edit any field in the modal</li>
        <li>Changes are saved automatically</li>
        <li>Task history tracks all modifications</li>
      </ul>
      <p>This ensures your task list always reflects your current priorities.</p>
    `,
    target: '[data-tour-id="task-title-input"]',
    position: 'bottom',
  },
  
  {
    id: 'task-actions',
    title: 'Task Actions',
    content: `
      <p>Manage the lifecycle of your tasks:</p>
      <ul>
        <li>Complete tasks to move them to the Completed list</li>
        <li>Delete tasks you no longer need</li>
        <li>Move tasks between quadrants</li>
        <li>Duplicate tasks for similar work</li>
      </ul>
      <p>These actions are available in the task modal and via right-click.</p>
    `,
    target: '[data-tour-id="task-save-button"]',
    position: 'left',
  },
  
  // Right-Click Menu
  {
    id: 'context-menu',
    title: 'Right-Click Context Menu',
    content: `
      <p>Right-clicking on any task reveals quick actions:</p>
      <ul>
        <li>Edit or delete the task</li>
        <li>Mark as complete</li>
        <li>Move to any quadrant</li>
        <li>Copy task details</li>
      </ul>
      <p>This context menu speeds up common actions without opening the full modal.</p>
    `,
    target: '[data-tour-id="context-menu"]',
    position: 'right',
  },
  
  {
    id: 'quick-actions',
    title: 'Quick Actions',
    content: `
      <p>Efficiency is built into every interaction:</p>
      <ul>
        <li>Hover actions for common operations</li>
        <li>Keyboard shortcuts for power users</li>
        <li>Batch operations for multiple tasks</li>
      </ul>
      <p>These quick actions help you manage tasks with minimal effort.</p>
    `,
    target: '[data-tour-id="task-card"]',
    position: 'bottom',
  },
  
  // Completed Tasks View
  {
    id: 'completed-view',
    title: 'Completed Tasks View',
    content: `
      <p>Track your accomplishments in the Completed view:</p>
      <ul>
        <li>See all completed tasks in one place</li>
        <li>Filter by date, quadrant, or tags</li>
        <li>Restore tasks if needed</li>
        <li>View completion statistics</li>
      </ul>
      <p>This provides a satisfying record of your productivity.</p>
    `,
    target: 'body',
    position: 'center',
    disableSpotlight: true,
  },
  
  {
    id: 'completed-management',
    title: 'Managing Completed Tasks',
    content: `
      <p>Your completed tasks are valuable data:</p>
      <ul>
        <li>Restore tasks to active status if needed</li>
        <li>Permanently delete old tasks</li>
        <li>View completion patterns and statistics</li>
        <li>Export completed tasks for reporting</li>
      </ul>
      <p>This history helps you understand your productivity patterns over time.</p>
    `,
    target: 'body',
    position: 'center',
    disableSpotlight: true,
  },
  
  // History View
  {
    id: 'history-overview',
    title: 'Task History Overview',
    content: `
      <p>The History view provides insights into your task patterns:</p>
      <ul>
        <li>Track all task changes over time</li>
        <li>See when tasks were created, modified, or completed</li>
        <li>Understand how your priorities have shifted</li>
      </ul>
      <p>This historical data helps you reflect on and improve your productivity habits.</p>
    `,
    target: 'body',
    position: 'center',
    disableSpotlight: true,
  },
  
  {
    id: 'history-filtering',
    title: 'Filtering History',
    content: `
      <p>Analyze your task history with powerful filters:</p>
      <ul>
        <li>Filter by date ranges</li>
        <li>Focus on specific quadrants</li>
        <li>Search by task content or tags</li>
        <li>View completion rates and patterns</li>
      </ul>
      <p>These filters help you identify trends and areas for improvement.</p>
    `,
    target: 'body',
    position: 'center',
    disableSpotlight: true,
  },
  
  {
    id: 'exporting',
    title: 'Exporting Your Data',
    content: `
      <p>Take your data with you:</p>
      <ul>
        <li>Export to CSV for spreadsheet analysis</li>
        <li>Export to JSON for data portability</li>
        <li>Include or exclude specific data fields</li>
        <li>Set custom date ranges for exports</li>
      </ul>
      <p>Your data is always yours, and these export options ensure you can use it however you need.</p>
    `,
    target: 'body',
    position: 'center',
    disableSpotlight: true,
  },
  
  // Conclusion
  {
    id: 'conclusion',
    title: 'Tour Complete',
    content: `
      <p class="mb-4">Congratulations! You've completed the guided tour of Task Manager.</p>
      
      <p class="mb-4">You now have the knowledge to:</p>
      
      <ul class="space-y-3 mb-4">
        <li class="flex items-start">
          ${bulletStyles.do}<span>Effectively prioritize tasks using the Eisenhower Matrix</span>
        </li>
        <li class="flex items-start">
          ${bulletStyles.delegate}<span>Manage tasks throughout their lifecycle</span>
        </li>
        <li class="flex items-start">
          ${bulletStyles.backlog}<span>Track your productivity and history</span>
        </li>
        <li class="flex items-start">
          ${bulletStyles.delegate}<span>Export your data for further analysis</span>
        </li>
      </ul>
      
      <p>You can restart this tour anytime from the Help menu. Happy organizing!</p>
    `,
    target: 'body',
    position: 'center',
    disableSpotlight: true,
  },
];

export default tourSteps; 