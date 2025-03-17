import React, { useEffect, useState } from 'react';
import { useTour } from '../../contexts/TourContext';

// Helper function to create timestamps for demo data
const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const hoursAgo = (hours) => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
};

const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

// Helper to create task history
const createTaskHistory = (task, additionalEntries = []) => {
  const baseHistory = [
    {
      type: 'created',
      timestamp: task.createdAt,
      details: 'Task created'
    }
  ];
  
  return [...baseHistory, ...additionalEntries];
};

/**
 * Sample tasks for the demo board - Active Tasks
 */
const DEMO_TASKS = [
  // Q1: Important & Urgent
  {
    id: 'demo-q1-1',
    title: 'Critical System Outage',
    description: 'Investigate and resolve the payment processing system outage affecting multiple customers. High priority incident requiring immediate attention.',
    tags: ['critical', 'technical', 'customer-impact'],
    priority: 'high',
    status: 'todo',
    quadrant: 'q1',
    dueDate: new Date().toISOString(),
    createdAt: hoursAgo(4),
    updatedAt: hoursAgo(1),
    history: createTaskHistory(
      { createdAt: hoursAgo(4) },
      [
        { type: 'updated', timestamp: hoursAgo(3), details: 'Added technical team' },
        { type: 'updated', timestamp: hoursAgo(1), details: 'Updated severity to high' }
      ]
    )
  },
  {
    id: 'demo-q1-2',
    title: 'Board Meeting Presentation',
    description: 'Finalize Q4 financial presentation for tomorrow\'s board meeting. Need executive sign-off by EOD.',
    tags: ['presentation', 'finance', 'deadline'],
    priority: 'high',
    status: 'todo',
    quadrant: 'q1',
    dueDate: daysFromNow(1),
    createdAt: daysAgo(2),
    updatedAt: hoursAgo(3),
    history: createTaskHistory(
      { createdAt: daysAgo(2) },
      [
        { type: 'updated', timestamp: daysAgo(1), details: 'Added financial data' },
        { type: 'updated', timestamp: hoursAgo(3), details: 'Updated executive summary' }
      ]
    )
  },
  {
    id: 'demo-q1-3',
    title: 'Client Contract Deadline',
    description: 'Review and sign-off on the Enterprise client contract renewal. Legal review pending.',
    tags: ['client', 'contract', 'urgent'],
    priority: 'high',
    status: 'todo',
    quadrant: 'q1',
    dueDate: daysFromNow(2),
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1),
    history: createTaskHistory(
      { createdAt: daysAgo(5) },
      [
        { type: 'updated', timestamp: daysAgo(3), details: 'Added legal requirements' },
        { type: 'updated', timestamp: daysAgo(1), details: 'Updated terms' }
      ]
    )
  },
  
  // Q2: Important & Not Urgent
  {
    id: 'demo-q2-1',
    title: '2024 Strategic Planning',
    description: 'Develop comprehensive strategic plan for the upcoming year. Focus on growth initiatives and market expansion.',
    tags: ['strategy', 'planning', 'important'],
    priority: 'medium',
    status: 'todo',
    quadrant: 'q2',
    dueDate: daysFromNow(14),
    createdAt: daysAgo(10),
    updatedAt: daysAgo(2),
    history: createTaskHistory(
      { createdAt: daysAgo(10) },
      [
        { type: 'updated', timestamp: daysAgo(7), details: 'Added market analysis' },
        { type: 'updated', timestamp: daysAgo(2), details: 'Updated growth projections' }
      ]
    )
  },
  {
    id: 'demo-q2-2',
    title: 'Team Development Program',
    description: 'Design and implement new team development program focusing on leadership and technical skills.',
    tags: ['training', 'development', 'team'],
    priority: 'medium',
    status: 'todo',
    quadrant: 'q2',
    dueDate: daysFromNow(21),
    createdAt: daysAgo(15),
    updatedAt: daysAgo(5),
    history: createTaskHistory(
      { createdAt: daysAgo(15) },
      [
        { type: 'updated', timestamp: daysAgo(10), details: 'Added curriculum outline' },
        { type: 'updated', timestamp: daysAgo(5), details: 'Updated training schedule' }
      ]
    )
  },
  {
    id: 'demo-q2-3',
    title: 'Product Roadmap Review',
    description: 'Quarterly product roadmap review and alignment with company objectives.',
    tags: ['product', 'strategy', 'planning'],
    priority: 'medium',
    status: 'todo',
    quadrant: 'q2',
    dueDate: daysFromNow(30),
    createdAt: daysAgo(20),
    updatedAt: daysAgo(3),
    history: createTaskHistory(
      { createdAt: daysAgo(20) },
      [
        { type: 'updated', timestamp: daysAgo(15), details: 'Added feature priorities' },
        { type: 'updated', timestamp: daysAgo(3), details: 'Updated timeline' }
      ]
    )
  },
  
  // Q3: Not Important & Urgent
  {
    id: 'demo-q3-1',
    title: 'Weekly Status Report',
    description: 'Compile and submit weekly department status report by end of day.',
    tags: ['reporting', 'admin', 'recurring'],
    priority: 'medium',
    status: 'todo',
    quadrant: 'q3',
    dueDate: daysFromNow(1),
    createdAt: daysAgo(2),
    updatedAt: hoursAgo(12),
    history: createTaskHistory(
      { createdAt: daysAgo(2) },
      [
        { type: 'updated', timestamp: hoursAgo(12), details: 'Added project updates' }
      ]
    )
  },
  {
    id: 'demo-q3-2',
    title: 'Office Supply Order',
    description: 'Place urgent order for depleted office supplies.',
    tags: ['office', 'procurement', 'urgent'],
    priority: 'low',
    status: 'todo',
    quadrant: 'q3',
    dueDate: daysFromNow(2),
    createdAt: daysAgo(1),
    updatedAt: hoursAgo(4),
    history: createTaskHistory(
      { createdAt: daysAgo(1) },
      [
        { type: 'updated', timestamp: hoursAgo(4), details: 'Updated supply list' }
      ]
    )
  },
  {
    id: 'demo-q3-3',
    title: 'Meeting Minutes Distribution',
    description: 'Format and distribute minutes from yesterday\'s department meeting.',
    tags: ['admin', 'meeting', 'documentation'],
    priority: 'low',
    status: 'todo',
    quadrant: 'q3',
    dueDate: daysFromNow(1),
    createdAt: daysAgo(1),
    updatedAt: hoursAgo(2),
    history: createTaskHistory(
      { createdAt: daysAgo(1) },
      [
        { type: 'updated', timestamp: hoursAgo(2), details: 'Added action items' }
      ]
    )
  },
  
  // Q4: Not Important & Not Urgent
  {
    id: 'demo-q4-1',
    title: 'Office Layout Redesign',
    description: 'Plan potential office layout improvements for better collaboration.',
    tags: ['office', 'improvement', 'planning'],
    priority: 'low',
    status: 'todo',
    quadrant: 'q4',
    dueDate: null,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(15),
    history: createTaskHistory(
      { createdAt: daysAgo(30) },
      [
        { type: 'updated', timestamp: daysAgo(15), details: 'Added layout options' }
      ]
    )
  },
  {
    id: 'demo-q4-2',
    title: 'Industry Research',
    description: 'Research emerging industry trends and potential opportunities.',
    tags: ['research', 'industry', 'learning'],
    priority: 'low',
    status: 'todo',
    quadrant: 'q4',
    dueDate: null,
    createdAt: daysAgo(45),
    updatedAt: daysAgo(20),
    history: createTaskHistory(
      { createdAt: daysAgo(45) },
      [
        { type: 'updated', timestamp: daysAgo(20), details: 'Added research topics' }
      ]
    )
  },
  {
    id: 'demo-q4-3',
    title: 'Team Building Ideas',
    description: 'Research and propose team building activities for next quarter.',
    tags: ['team', 'culture', 'planning'],
    priority: 'low',
    status: 'todo',
    quadrant: 'q4',
    dueDate: null,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(30),
    history: createTaskHistory(
      { createdAt: daysAgo(60) },
      [
        { type: 'updated', timestamp: daysAgo(30), details: 'Added activity suggestions' }
      ]
    )
  },
  
  // Backlog
  {
    id: 'demo-backlog-1',
    title: 'Process Documentation',
    description: 'Create comprehensive documentation for core business processes.',
    tags: ['documentation', 'process', 'knowledge'],
    priority: 'medium',
    status: 'todo',
    quadrant: 'backlog',
    dueDate: null,
    createdAt: daysAgo(90),
    updatedAt: daysAgo(45),
    history: createTaskHistory(
      { createdAt: daysAgo(90) },
      [
        { type: 'updated', timestamp: daysAgo(60), details: 'Added process maps' },
        { type: 'moved', timestamp: daysAgo(45), details: 'Moved to backlog' }
      ]
    )
  },
  {
    id: 'demo-backlog-2',
    title: 'Employee Survey',
    description: 'Develop annual employee satisfaction survey.',
    tags: ['hr', 'feedback', 'annual'],
    priority: 'medium',
    status: 'todo',
    quadrant: 'backlog',
    dueDate: null,
    createdAt: daysAgo(75),
    updatedAt: daysAgo(40),
    history: createTaskHistory(
      { createdAt: daysAgo(75) },
      [
        { type: 'updated', timestamp: daysAgo(50), details: 'Added survey questions' },
        { type: 'moved', timestamp: daysAgo(40), details: 'Moved to backlog' }
      ]
    )
  },
  {
    id: 'demo-backlog-3',
    title: 'Vendor Review',
    description: 'Annual review of vendor relationships and contracts.',
    tags: ['vendor', 'contracts', 'review'],
    priority: 'low',
    status: 'todo',
    quadrant: 'backlog',
    dueDate: null,
    createdAt: daysAgo(100),
    updatedAt: daysAgo(55),
    history: createTaskHistory(
      { createdAt: daysAgo(100) },
      [
        { type: 'updated', timestamp: daysAgo(70), details: 'Added vendor list' },
        { type: 'moved', timestamp: daysAgo(55), details: 'Moved to backlog' }
      ]
    )
  }
];

/**
 * Sample completed tasks
 */
const DEMO_COMPLETED_TASKS = [
  {
    id: 'demo-completed-1',
    title: 'Q3 Financial Review',
    description: 'Complete Q3 financial performance review and prepare board report.',
    tags: ['finance', 'quarterly', 'reporting'],
    priority: 'high',
    status: 'completed',
    quadrant: 'q1',
    dueDate: daysAgo(5),
    createdAt: daysAgo(20),
    completedAt: daysAgo(5),
    updatedAt: daysAgo(5),
    history: createTaskHistory(
      { createdAt: daysAgo(20) },
      [
        { type: 'updated', timestamp: daysAgo(15), details: 'Added financial data' },
        { type: 'updated', timestamp: daysAgo(10), details: 'Updated projections' },
        { type: 'completed', timestamp: daysAgo(5), details: 'Task completed - Report submitted' }
      ]
    )
  },
  {
    id: 'demo-completed-2',
    title: 'Security Audit',
    description: 'Annual security audit and compliance review.',
    tags: ['security', 'compliance', 'audit'],
    priority: 'high',
    status: 'completed',
    quadrant: 'q1',
    dueDate: daysAgo(3),
    createdAt: daysAgo(30),
    completedAt: daysAgo(3),
    updatedAt: daysAgo(3),
    history: createTaskHistory(
      { createdAt: daysAgo(30) },
      [
        { type: 'updated', timestamp: daysAgo(20), details: 'Added audit checklist' },
        { type: 'updated', timestamp: daysAgo(10), details: 'Updated compliance items' },
        { type: 'completed', timestamp: daysAgo(3), details: 'Task completed - Audit passed' }
      ]
    )
  }
];

// Combine all tasks for the demo
const ALL_DEMO_TASKS = [...DEMO_TASKS, ...DEMO_COMPLETED_TASKS];

/**
 * TourDemoBoard component
 * Displays a demo board with sample tasks during the tour
 */
const TourDemoBoard = () => {
  const { active } = useTour();
  const [originalState, setOriginalState] = useState(null);
  
  // Effect to handle tour activation and deactivation
  useEffect(() => {
    if (!active) {
      // If we have original state and tour is ending, dispatch event to restore it
      if (originalState) {
        console.log('Tour ended, restoring original state');
        window.dispatchEvent(new CustomEvent('tour:end', { detail: originalState }));
        setOriginalState(null);
      }
      return;
    }
    
    console.log('Tour started, setting up demo board');
    
    // Save current state before starting tour
    const currentState = {
      tasks: localStorage.getItem('tasks'),
      activeTab: localStorage.getItem('activeTab'),
      completedTasks: localStorage.getItem('completedTasks'),
      taskHistory: localStorage.getItem('taskHistory'),
      selectedTask: localStorage.getItem('selectedTask'),
      view: localStorage.getItem('view')
    };
    
    // Save original state
    setOriginalState(currentState);
    
    // Dispatch event to show demo data
    window.dispatchEvent(new CustomEvent('tour:start', {
      detail: {
        tasks: DEMO_TASKS,
        completedTasks: DEMO_COMPLETED_TASKS,
        taskHistory: [...DEMO_TASKS, ...DEMO_COMPLETED_TASKS].flatMap(task => {
          if (!task.history) return [];
          return task.history.map(entry => ({
            taskId: task.id,
            taskTitle: task.title,
            ...entry
          }));
        })
      }
    }));
    
    // Cleanup function
    return () => {
      if (originalState) {
        console.log('Component unmounting, restoring original state');
        window.dispatchEvent(new CustomEvent('tour:end', { detail: originalState }));
        setOriginalState(null);
      }
    };
  }, [active]);
  
  // Component doesn't render anything
  return null;
};

export default TourDemoBoard; 