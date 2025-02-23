import { useCallback, useState } from 'react';
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

const TaskCreate = ({ onAddTask }) => {
  const [taskText, setTaskText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (taskText.trim()) {
      onAddTask(taskText.trim());
      setTaskText('');
    }
  };

  return (
    <div className="w-full bg-white shadow-sm border-b border-gray-100">
      <form 
        onSubmit={handleSubmit} 
        className="max-w-3xl mx-auto flex gap-2 p-4 my-6"
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
    </div>
  );
};

export default TaskCreate; 