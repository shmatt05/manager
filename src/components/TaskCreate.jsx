import { useState, useRef, useEffect } from 'react';
import { parse, set, addDays } from 'date-fns';
import { useTour } from '../contexts/TourContext';

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
    'do': { priority: 1, tags: ['important', 'do'] },         // urgent-important
    'schedule': { priority: 3, tags: ['important', 'schedule'] },   // not-urgent-important
    'delegate': { priority: 2, tags: ['delegate'] },               // urgent-not-important
    'eliminate': { priority: 4, tags: ['eliminate'] },             // not-urgent-not-important
    'backlog': { scheduledFor: 'backlog', priority: 5, tags: ['backlog'] }
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
  const { isTourOpen, tourStep, nextStep } = useTour();
  const [isTypingAnimation, setIsTypingAnimation] = useState(false);
  const [isButtonHighlighted, setIsButtonHighlighted] = useState(false);
  const exampleText = "Review reports @2pm #do";
  const typingTimerRef = useRef(null);

  // Handle tour step 2 - typing animation and button highlighting
  useEffect(() => {
    // Check if tour is open and we're on step 2 (index 1)
    if (isTourOpen && tourStep === 1) {
      let currentIndex = 0;
      setIsTypingAnimation(true);
      setTaskText('');

      // Clear any existing timer
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }

      // Start typing animation
      typingTimerRef.current = setInterval(() => {
        if (currentIndex < exampleText.length) {
          setTaskText(exampleText.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          // Typing complete, clear interval and highlight button
          clearInterval(typingTimerRef.current);
          setIsTypingAnimation(false);
          setIsButtonHighlighted(true);
        }
      }, 100); // Adjust speed as needed

      // Focus the input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } else {
      // Reset when not on step 2
      setIsButtonHighlighted(false);
    }

    // Cleanup function
    return () => {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }
      setIsTypingAnimation(false);
      setIsButtonHighlighted(false);
    };
  }, [isTourOpen, tourStep, exampleText]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('TaskCreate: handleSubmit triggered');
    console.log('TaskCreate: Current tour step:', tourStep);
    console.log('TaskCreate: isTourOpen:', isTourOpen);
    console.log('TaskCreate: data-tour-task-adding attribute present:', document.body.hasAttribute('data-tour-task-adding'));
    
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

        // If scheduled for backlog, add a day
        if (scheduledFor === 'backlog') {
          dueDate = addDays(parsedTime, 1).toISOString();
        }
      }
    }

    const task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description: '', // Empty description by default
      tags,
      priority,
      status: 'todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scheduledFor,
      dueDate
    };

    console.log('TaskCreate: Creating task:', task);
    onCreateTask(task);
    inputRef.current.value = '';
    setTaskText('');
    setIsOpen(false);

    // If we're in step 2 of the tour, advance to the next step
    // Skip if the tour element has the 'from-tour-demo' attribute, which means
    // TaskInputDemo will handle the tour advancement
    if (isTourOpen && tourStep === 1 && !document.body.hasAttribute('data-tour-task-adding')) {
      console.log('TaskCreate: Tour conditions met, advancing to next step');
      console.log('TaskCreate: Calling nextStep() to advance from step', tourStep);
      nextStep();
      console.log('TaskCreate: After nextStep(), current step is now', tourStep);
    } else {
      console.log('TaskCreate: Not advancing tour - conditions not met:');
      console.log('  - isTourOpen:', isTourOpen);
      console.log('  - tourStep === 1:', tourStep === 1);
      console.log('  - !data-tour-task-adding:', !document.body.hasAttribute('data-tour-task-adding'));
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="w-full max-w-xl flex gap-1 task-create-form"
    >
      <input
        type="text"
        value={taskText}
        onChange={(e) => setTaskText(e.target.value)}
        placeholder="Add task... (e.g., 'Review reports @2pm #do')"
        className="flex-1 px-2 py-1 text-sm text-gray-700 dark:text-dark-text-primary 
                 bg-gray-50 dark:bg-gray-800 rounded-md
                 border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-1
                 focus:ring-blue-200 dark:focus:ring-blue-500/30 focus:outline-none transition-all
                 placeholder:text-gray-400 dark:placeholder:text-gray-400 min-w-[280px]"
        ref={inputRef}
      />
      <button
        type="submit"
        disabled={!taskText.trim()}
        className={`px-3 py-1 text-white text-sm bg-blue-500 dark:bg-blue-600 rounded-md hover:bg-blue-600 dark:hover:bg-blue-700
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium relative
                 ${isButtonHighlighted ? 'ring-4 ring-blue-300 dark:ring-blue-500/50 animate-pulse' : ''}`}
      >
        Add
        {isButtonHighlighted && (
          <span className="absolute inset-0 rounded-md bg-blue-400/20 dark:bg-blue-500/30 animate-ping"></span>
        )}
      </button>
    </form>
  );
};

export default TaskCreate; 
