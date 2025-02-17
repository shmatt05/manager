import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useTaskStore from '../stores/taskStore';

const taskSchema = z.object({
  rawText: z.string().min(1, 'Task description is required'),
});

export default function TaskCreate({ onCreateTask }) {
  const addTask = useTaskStore(state => state.addTask);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      rawText: ''
    }
  });

  const onSubmit = useCallback((data) => {
    const title = data.rawText.split(/[@#]/)[0].trim();
    
    // Determine initial priority based on tags
    const tags = ['important']; // Default tags
    const isUrgent = data.rawText.toLowerCase().includes('#urgent');
    if (isUrgent) {
      tags.push('urgent');
    }

    // Set priority based on urgency and importance
    let priority;
    if (isUrgent && tags.includes('important')) {
      priority = 1;  // Urgent & Important (Do) - Red
    } else if (isUrgent && !tags.includes('important')) {
      priority = 2;  // Urgent & Not Important (Delegate) - Yellow
    } else if (!isUrgent && tags.includes('important')) {
      priority = 3;  // Not Urgent & Important (Schedule) - Blue
    } else {
      priority = 4;  // Not Urgent & Not Important (Eliminate) - Gray
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
      createdAt: new Date().toISOString()
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