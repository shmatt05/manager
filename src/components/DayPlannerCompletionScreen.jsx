import React from 'react';
import { SunIcon } from '@heroicons/react/24/outline';

export default function CompletionScreen({ decisions, onClose, onReviewTasks }) {
  const totalTasks = Object.values(decisions).reduce((sum, count) => sum + count, 0);
  
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-24 h-24 mb-6 text-yellow-500 animate-pulse">
        <SunIcon className="w-full h-full" />
      </div>
      
      <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">
        Great job planning your day!
      </h2>
      
      <p className="text-lg mb-8 text-gray-600 dark:text-gray-300">
        You've prioritized all {totalTasks} tasks in your backlog.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 w-full max-w-2xl">
        {decisions.do > 0 && (
          <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">
            <p className="text-red-800 dark:text-red-300 font-medium">{decisions.do} tasks to do today</p>
          </div>
        )}
        
        {decisions.schedule > 0 && (
          <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg">
            <p className="text-blue-800 dark:text-blue-300 font-medium">{decisions.schedule} tasks scheduled</p>
          </div>
        )}
        
        {decisions.delegate > 0 && (
          <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-lg">
            <p className="text-amber-800 dark:text-amber-300 font-medium">{decisions.delegate} tasks delegated</p>
          </div>
        )}
        
        {decisions.eliminate > 0 && (
          <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-lg">
            <p className="text-gray-800 dark:text-gray-300 font-medium">{decisions.eliminate} tasks eliminated</p>
          </div>
        )}
        
        {decisions.backlog > 0 && (
          <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-lg">
            <p className="text-purple-800 dark:text-purple-300 font-medium">{decisions.backlog} tasks kept in backlog</p>
          </div>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-gray-800 dark:text-white font-medium transition-colors"
          onClick={onClose}
        >
          Close
        </button>
        
        {decisions.do > 0 && (
          <button
            className="px-6 py-3 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-lg text-white font-medium transition-colors"
            onClick={onReviewTasks}
          >
            Review Today's Tasks
          </button>
        )}
      </div>
    </div>
  );
}