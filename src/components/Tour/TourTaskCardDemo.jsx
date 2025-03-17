import React, { useEffect } from 'react';

/**
 * TourTaskCardDemo component
 * Displays an annotated task card for the tour
 */
const TourTaskCardDemo = () => {
  useEffect(() => {
    // Create and inject the demo card when the component mounts
    const createDemoCard = () => {
      // Check if demo already exists
      if (document.getElementById('tour-task-card-demo')) {
        return;
      }

      // Create container
      const demoContainer = document.createElement('div');
      demoContainer.id = 'tour-task-card-demo';
      demoContainer.className = 'fixed inset-0 z-50 pointer-events-none flex items-center justify-center';
      
      // Create the demo card
      demoContainer.innerHTML = `
        <div class="relative bg-white dark:bg-dark-surface-2 rounded-lg shadow-xl p-4 max-w-md mx-auto border-2 border-primary-500 animate-pulse-slow">
          <!-- Task Card -->
          <div class="bg-white dark:bg-dark-surface-1 rounded shadow-sm border border-gray-200 dark:border-gray-700 p-3 relative">
            <!-- Title with Priority Indicator -->
            <div class="flex items-start mb-2">
              <div class="w-2 h-2 rounded-full bg-error mt-1.5 mr-2 flex-shrink-0" data-annotation="priority"></div>
              <h3 class="text-sm font-medium text-gray-900 dark:text-dark-text-primary flex-grow">Quarterly Report Review</h3>
            </div>
            
            <!-- Description -->
            <p class="text-xs text-gray-600 dark:text-dark-text-secondary mb-2" data-annotation="description">
              Review the Q3 financial report before the board meeting
            </p>
            
            <!-- Tags -->
            <div class="flex flex-wrap gap-1 mb-2" data-annotation="tags">
              <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                #important
              </span>
              <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                #finance
              </span>
            </div>
            
            <!-- Due Date -->
            <div class="flex items-center text-xs text-gray-500 dark:text-dark-text-tertiary mb-2" data-annotation="due-date">
              <svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Today at 2:00 PM
            </div>
            
            <!-- Action Buttons -->
            <div class="flex justify-end space-x-1" data-annotation="actions">
              <button class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          
          <!-- Annotations -->
          <div class="absolute -top-10 left-1/4 transform -translate-x-1/2 bg-primary-500 text-white px-2 py-1 rounded text-xs">
            Priority Indicator
            <div class="absolute w-px h-10 bg-primary-500 bottom-0 left-1/2 transform translate-x-1/2"></div>
          </div>
          
          <div class="absolute -right-32 top-1/4 transform -translate-y-1/2 bg-primary-500 text-white px-2 py-1 rounded text-xs">
            Task Description
            <div class="absolute w-10 h-px bg-primary-500 top-1/2 right-full"></div>
          </div>
          
          <div class="absolute -left-28 top-1/2 transform -translate-y-1/2 bg-primary-500 text-white px-2 py-1 rounded text-xs">
            Tags & Categories
            <div class="absolute w-8 h-px bg-primary-500 top-1/2 left-full"></div>
          </div>
          
          <div class="absolute -right-24 bottom-1/4 transform translate-y-1/2 bg-primary-500 text-white px-2 py-1 rounded text-xs">
            Due Date
            <div class="absolute w-6 h-px bg-primary-500 top-1/2 right-full"></div>
          </div>
          
          <div class="absolute -bottom-10 right-1/4 transform translate-x-1/2 bg-primary-500 text-white px-2 py-1 rounded text-xs">
            Quick Actions
            <div class="absolute w-px h-10 bg-primary-500 top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
        </div>
      `;
      
      document.body.appendChild(demoContainer);
      
      // Add animation
      setTimeout(() => {
        const card = demoContainer.querySelector('div');
        if (card) {
          card.classList.add('animate-bounce-subtle');
        }
      }, 500);
    };
    
    createDemoCard();
    
    // Clean up function
    return () => {
      const demoCard = document.getElementById('tour-task-card-demo');
      if (demoCard) {
        demoCard.remove();
      }
    };
  }, []);
  
  return null; // This component doesn't render anything directly
};

export default TourTaskCardDemo; 