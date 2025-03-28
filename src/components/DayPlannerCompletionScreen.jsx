import React from 'react';
import { SunIcon } from '@heroicons/react/24/outline';

export default function CompletionScreen({ decisions, onClose, onReviewTasks }) {
  const totalTasks = Object.values(decisions).reduce((sum, count) => sum + count, 0);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-20 h-20 mb-6 text-yellow-500 animate-pulse">
        <SunIcon className="w-full h-full" />
      </div>

      <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-[#f5f5f7] tracking-[0.3px] leading-[1.5]">
        Great job planning your day!
      </h2>

      <p className="text-lg mb-8 text-gray-600 dark:text-gray-300 tracking-[0.3px] leading-[1.5]">
        You've prioritized all {totalTasks} tasks in your backlog.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 w-full max-w-2xl">
        {decisions.do > 0 && (
          <div className="bg-[#8b2e27]/10 dark:bg-[#8b2e27]/20 p-[18px] rounded-[8px] border border-[#8b2e27]/20 shadow-sm hover:shadow transition-all duration-200">
            <p className="text-[#8b2e27] dark:text-[#f5f5f7] font-medium tracking-[0.3px] leading-[1.5]">{decisions.do} tasks to do today</p>
          </div>
        )}

        {decisions.schedule > 0 && (
          <div className="bg-[#1e3380]/10 dark:bg-[#1e3380]/20 p-[18px] rounded-[8px] border border-[#1e3380]/20 shadow-sm hover:shadow transition-all duration-200">
            <p className="text-[#1e3380] dark:text-[#f5f5f7] font-medium tracking-[0.3px] leading-[1.5]">{decisions.schedule} tasks scheduled</p>
          </div>
        )}

        {decisions.delegate > 0 && (
          <div className="bg-[#b36d23]/10 dark:bg-[#b36d23]/20 p-[18px] rounded-[8px] border border-[#b36d23]/20 shadow-sm hover:shadow transition-all duration-200">
            <p className="text-[#b36d23] dark:text-[#f5f5f7] font-medium tracking-[0.3px] leading-[1.5]">{decisions.delegate} tasks delegated</p>
          </div>
        )}

        {decisions.eliminate > 0 && (
          <div className="bg-[#4a4f59]/10 dark:bg-[#4a4f59]/20 p-[18px] rounded-[8px] border border-[#4a4f59]/20 shadow-sm hover:shadow transition-all duration-200">
            <p className="text-[#4a4f59] dark:text-[#f5f5f7] font-medium tracking-[0.3px] leading-[1.5]">{decisions.eliminate} tasks eliminated</p>
          </div>
        )}

        {decisions.backlog > 0 && (
          <div className="bg-[#6a3485]/10 dark:bg-[#6a3485]/20 p-[18px] rounded-[8px] border border-[#6a3485]/20 shadow-sm hover:shadow transition-all duration-200">
            <p className="text-[#6a3485] dark:text-[#f5f5f7] font-medium tracking-[0.3px] leading-[1.5]">{decisions.backlog} tasks kept in backlog</p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          className="px-6 py-3 bg-[#4a4f59] hover:bg-[#3d424a] rounded-[8px] text-[#f5f5f7] font-medium transition-colors border border-white/10 shadow-md"
          onClick={onClose}
        >
          Close
        </button>

        {decisions.do > 0 && (
          <button
            className="px-6 py-3 bg-[#8b2e27] hover:bg-[#7a2922] rounded-[8px] text-[#f5f5f7] font-medium transition-colors border border-white/10 shadow-md"
            onClick={onReviewTasks}
          >
            Review Today's Tasks
          </button>
        )}
      </div>
    </div>
  );
}
