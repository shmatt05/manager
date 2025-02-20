import { useCallback } from 'react';
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

export default function TaskCreate({ onCreateTask }) {
  const addTask = useTaskStore(state => state.addTask);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      rawText: ''
    }
  });

  const onSubmit = useCallback((data) => {
    // Extract time using regex
    const timeMatch = data.rawText.match(/@([^\s#]+)/);
    let dueDate = null;

    if (timeMatch) {
      const parsedTime = parseTimeString(timeMatch[0]);
      if (parsedTime) {
        const now = new Date();
        // If the time is earlier than now, assume it's for tomorrow
        dueDate = set(now, {
          hours: parsedTime.getHours(),
          minutes: parsedTime.getMinutes(),
          seconds: 0,
          milliseconds: 0
        });
        
        if (dueDate < now) {
          dueDate = addDays(dueDate, 1);
        }
      }
    }

    // Get title (everything before @ or #)
    const title = data.rawText.split(/[@#]/)[0].trim();
    
    // Determine initial priority based on tags
    const tags = ['important'];
    const isUrgent = data.rawText.toLowerCase().includes('#urgent');
    if (isUrgent) {
      tags.push('urgent');
    }

    // Set priority based on urgency and importance
    let priority;
    if (isUrgent && tags.includes('important')) {
      priority = 1;
    } else if (isUrgent && !tags.includes('important')) {
      priority = 2;
    } else if (!isUrgent && tags.includes('important')) {
      priority = 3;
    } else {
      priority = 4;
    }
    
    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      rawText: data.rawText,
      title,
      description: data.rawText,
      priority,
      tags,
      scheduledFor: 'today',
      status: 'todo',
      createdAt: new Date().toISOString(),
      dueDate: dueDate ? dueDate.toISOString() : null
    };

    console.log('Creating new task:', newTask);
    addTask(newTask);
    reset();
    onCreateTask(newTask);
  }, [addTask, reset, onCreateTask]);

  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleSubmit(onSubmit)();
    }
  }, [handleSubmit, onSubmit]);

  return (
    <div className="border-b bg-white shadow-sm">
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto p-4">
        <div className="flex gap-2">
          <input
            {...register('rawText')}
            type="text"
            placeholder="Add task... (e.g., Review PR @3pm #code #urgent)"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
            onKeyDown={handleKeyDown}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add
          </button>
        </div>
        {errors.rawText && (
          <p className="mt-1 text-sm text-red-500">{errors.rawText.message}</p>
        )}
      </form>
    </div>
  );
} 