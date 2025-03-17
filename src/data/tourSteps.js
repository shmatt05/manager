import TourTaskMoveDemo from '../components/Tour/TourTaskMoveDemo';
import TaskInputDemo from '../components/Tour/TaskInputDemo';

/**
 * Tour steps configuration
 * Each step contains:
 * - id: Unique identifier for the step
 * - title: Title displayed in the tour dialog
 * - content: Main content/description for the step
 * - target: CSS selector or element ID to highlight
 * - position: Where to position the dialog relative to the target
 * - component: Optional React component to render with this step
 * - disableOverlay: Whether to disable the overlay for this step
 * - disableSpotlight: Whether to disable the spotlight for this step
 */

// Custom bullet point styling
const bulletStyles = {
  do: '<span class="inline-block w-2 h-2 bg-[#FF6B6B] rounded-full mt-0.5 mr-2 flex-shrink-0"></span>',
  delegate: '<span class="inline-block w-2 h-2 bg-[#3AAAA0] rounded-full mt-0.5 mr-2 flex-shrink-0"></span>',
  backlog: '<span class="inline-block w-2 h-2 bg-[#95A5A6] rounded-full mt-0.5 mr-2 flex-shrink-0"></span>',
  default: '<span class="inline-block w-2 h-2 bg-[#7F8C8D] rounded-full mt-0.5 mr-2 flex-shrink-0"></span>'
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
  
  // Creating Tasks
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
          ${bulletStyles.delegate}<span>Use hashtags like <code class="bg-gray-200 dark:bg-gray-700 px-1 rounded text-gray-800 dark:text-gray-200">#do</code> to assign tasks to specific quadrants</span>
        </li>
      </ul>
      
      <p class="italic text-gray-600 dark:text-gray-400">Watch as we add a task with the #do hashtag to place it in the "Do" quadrant.</p>
    `,
    target: 'form input[type="text"]',
    position: 'bottom',
    dialogOffset: { x: 0, y: 20 },
    blockBackground: false,
    disableSpotlight: true,
    component: TaskInputDemo
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
          </ul>
        </div>
        <div>
          <ul class="space-y-2">
            <li class="flex items-start">
              ${bulletStyles.delegate}<span><code class="bg-gray-200 dark:bg-gray-700 px-1 rounded text-gray-800 dark:text-gray-200">#delegate</code> - "Delegate" quadrant</span>
            </li>
            <li class="flex items-start">
              ${bulletStyles.backlog}<span><code class="bg-gray-200 dark:bg-gray-700 px-1 rounded text-gray-800 dark:text-gray-200">#eliminate</code> - "Eliminate" quadrant</span>
            </li>
            <li class="flex items-start">
              ${bulletStyles.delegate}<span><code class="bg-gray-200 dark:bg-gray-700 px-1 rounded text-gray-800 dark:text-gray-200">@tomorrow</code> - Sets due date</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div class="bg-gray-200 dark:bg-gray-700 p-2 rounded text-gray-800 dark:text-gray-200">
        <p class="text-sm font-medium">Example:</p>
        <p class="text-sm"><code>"Review report @tomorrow #important"</code> creates an important task due tomorrow.</p>
      </div>
    `,
    target: '[data-tour-id="add-task-button"]',
    position: 'bottom',
    dialogOffset: { x: 0, y: 20 }
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
    target: '[data-tour-id="urgent-important-quadrant"]',
    position: 'right',
    onShow: () => {
      // Highlight a task card in the first quadrant if available
      setTimeout(() => {
        const quadrant = document.querySelector('[data-tour-id="urgent-important-quadrant"]');
        if (quadrant) {
          const taskCard = quadrant.querySelector('.task-card');
          if (taskCard) {
            taskCard.classList.add('tour-target-highlight');
          }
        }
      }, 100);
    },
    onHide: () => {
      // Remove highlight from all task cards
      document.querySelectorAll('.tour-target-highlight').forEach(el => {
        el.classList.remove('tour-target-highlight');
      });
    }
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
      
      <p class="italic text-gray-600 dark:text-gray-400">Watch as we move a task from "Do" to "Delegate" by dragging.</p>
    `,
    target: 'body',
    position: 'top-right',
    dialogPosition: { top: '20px', left: 'auto', right: '20px', transform: 'none' },
    disableOverlay: true,
    blockBackground: false,
    component: TourTaskMoveDemo
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
    onShow: () => {
      // Find the task modal element and trigger event
      const taskModal = document.querySelector('[data-tour-id="task-modal"]');
      if (taskModal) {
        // Create a custom event to trigger the modal
        const event = new CustomEvent('tour:show-task-modal');
        document.dispatchEvent(event);
      }
    }
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