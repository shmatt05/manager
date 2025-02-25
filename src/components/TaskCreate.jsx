import { useState, useRef } from 'react';
import { parse, set, addDays } from 'date-fns';

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
    return null;
  }
};


const parseTaskText = (text) => {
  // First, extract and remove time information
  let processedText = text;
  let timeMatch = null;
  
  // Look for @time pattern
  const timeRegex = /@(\w+(?::\w+)?(?:am|pm)?)/i;
  timeMatch = processedText.match(timeRegex);
  
  // Remove the time string from the text if found
  if (timeMatch && timeMatch[0]) {
    processedText = processedText.replace(timeMatch[0], '').trim();
  }
  
  // Continue with tag extraction on the cleaned text
  const tags = [];
  const title = processedText.replace(/#(\w+)/g, (match, tag) => {
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
    timeMatch: timeMatch ? timeMatch[1] : null,
    tags: finalTags,
    priority,
    scheduledFor,
    processedText
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

    const { title, timeMatch, tags, priority, scheduledFor, processedText } = parseTaskText(text);
    
    // Parse time information if it was found
    let dueDate = null;
    if (timeMatch) {
      const parsedTime = parseTimeString(timeMatch);
      if (parsedTime) {
        // Set the due date to today with the parsed time
        dueDate = parsedTime.toISOString();
        
        // If scheduled for tomorrow, add a day
        if (scheduledFor === 'tomorrow') {
          dueDate = addDays(parsedTime, 1).toISOString();
        }
      }
    }
    
    const task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description: processedText, // Use the processed text without the time string
      tags,
      priority,
      status: 'todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scheduledFor,
      dueDate
    };

    onCreateTask(task);
    inputRef.current.value = '';
    setTaskText('');
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
        placeholder="Add a new task... (e.g., 'Review Q4 reports @2pm')"
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