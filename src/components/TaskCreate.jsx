import { useCallback, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useTaskStore from '../stores/taskStore';
import { parse, set, addDays } from 'date-fns';

const taskSchema = z.object({
  rawText: z.string().min(1, 'Task description is required'),
});

// Helper function to parse time string
const parseTimeString = (timeStr) => {
  try {
    // Remove @ symbol and trim
    timeStr = timeStr.replace('@', '').trim().toLowerCase();
    
    // Handle special cases
    if (timeStr === 'noon') timeStr = '12pm';
    if (timeStr === 'midnight') timeStr = '12am';

    // Try to parse the time
    const parsedTime = parse(timeStr, 'ha', new Date());
    if (isNaN(parsedTime.getTime())) {
      // Try alternative format (h:mma)
      const parsedTimeWithMinutes = parse(timeStr, 'h:mma', new Date());
      if (isNaN(parsedTimeWithMinutes.getTime())) return null;
      return parsedTimeWithMinutes;
    }
    return parsedTime;
  } catch (error) {
    console.error('Error parsing time:', error);
    return null;
  }
};

// Add createTask function
const createTask = (rawText) => {
  const now = new Date();
  const timeMatch = rawText.match(/@(\d{1,2}(?::\d{2})?(?:am|pm)|noon|midnight)/i);
  let dueDate = null;

  if (timeMatch) {
    const timeStr = timeMatch[1];
    const parsedTime = parseTimeString(timeStr);
    if (parsedTime) {
      dueDate = set(now, {
        hours: parsedTime.getHours(),
        minutes: parsedTime.getMinutes(),
        seconds: 0,
        milliseconds: 0
      });
      
      // If the time is earlier today, assume it's for tomorrow
      if (dueDate < now) {
        dueDate = addDays(dueDate, 1);
      }
    }
  }

  return {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    rawText,
    title: rawText.replace(/@\w+/g, '').trim(),
    description: rawText,
    priority: 4,
    status: 'todo',
    tags: [],
    createdAt: now.toISOString(),
    scheduledFor: 'today',
    dueDate: dueDate?.toISOString() || null
  };
};

const parseTaskText = (text) => {
  const tags = [];
  const title = text.replace(/#(\w+)/g, (match, tag) => {
    tags.push(tag);
    return '';
  }).trim();

  // Map special tags to quadrants
  const quadrantTags = {
    'do': { priority: 1, tags: ['important'] },         // urgent-important
    'schedule': { priority: 3, tags: ['important'] },   // not-urgent-important
    'delegate': { priority: 2, tags: [] },              // urgent-not-important
    'eliminate': { priority: 4, tags: [] },             // not-urgent-not-important
    'tomorrow': { scheduledFor: 'tomorrow', priority: 5 }
  };

  let priority = 4;
  let scheduledFor = 'today';
  let finalTags = [...new Set(tags)];

  // Check for quadrant tags
  for (const tag of tags) {
    if (quadrantTags[tag]) {
      const quadrant = quadrantTags[tag];
      priority = quadrant.priority;
      scheduledFor = quadrant.scheduledFor || scheduledFor;
      if (quadrant.tags) {
        finalTags = [...new Set([...finalTags, ...quadrant.tags])];
      }
    }
  }

  return {
    title,
    tags: finalTags,
    priority,
    scheduledFor
  };
};

const TaskCreate = ({ onCreateTask }) => {
  const [taskText, setTaskText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = inputRef.current.value.trim();
    if (!text) return;

    const { title, tags, priority, scheduledFor } = parseTaskText(text);
    
    const task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description: text,
      tags,
      priority,
      status: 'todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scheduledFor
    };

    onCreateTask(task);
    inputRef.current.value = '';
    setIsOpen(false);
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="max-w-3xl mx-auto flex gap-2 p-4"
    >
      <input
        type="text"
        value={taskText}
        onChange={(e) => setTaskText(e.target.value)}
        placeholder="Add a new task... (e.g., 'Review Q4 reports')"
        className="flex-1 px-4 py-2 text-gray-700 bg-gray-50 rounded-lg
                 border border-gray-200 focus:border-blue-500 focus:ring-2 
                 focus:ring-blue-200 focus:outline-none transition-all duration-200
                 placeholder:text-gray-400"
        ref={inputRef}
      />
      <button
        type="submit"
        disabled={!taskText.trim()}
        className="px-6 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                 duration-200 font-medium shadow-sm"
      >
        Add
      </button>
    </form>
  );
};

export default TaskCreate; 