import React, { useEffect } from 'react';

/**
 * TourTaskMoveDemo component
 * Displays an animated task card moving between quadrants for the tour
 */
const TourTaskMoveDemo = () => {
  useEffect(() => {
    // Create and inject the demo animation when the component mounts
    const createMoveDemo = () => {
      // Check if demo already exists
      if (document.getElementById('tour-task-move-demo')) {
        return;
      }

      // Create container
      const demoContainer = document.createElement('div');
      demoContainer.id = 'tour-task-move-demo';
      demoContainer.className = 'fixed inset-0 z-50 pointer-events-none';
      
      // Create the matrix grid and moving task
      demoContainer.innerHTML = `
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="relative w-[600px] h-[400px] bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-xl border-2 border-primary-500 backdrop-blur-sm">
            <!-- Matrix Grid -->
            <div class="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-2 p-4">
              <!-- Q1: Important & Urgent -->
              <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800/50 flex flex-col">
                <h3 class="text-sm font-medium text-red-800 dark:text-red-300 mb-2 text-center">Important & Urgent</h3>
              </div>
              
              <!-- Q2: Important & Not Urgent -->
              <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800/50 flex flex-col">
                <h3 class="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 text-center">Important & Not Urgent</h3>
              </div>
              
              <!-- Q3: Not Important & Urgent -->
              <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800/50 flex flex-col">
                <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2 text-center">Not Important & Urgent</h3>
              </div>
              
              <!-- Q4: Not Important & Not Urgent -->
              <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800/50 flex flex-col">
                <h3 class="text-sm font-medium text-green-800 dark:text-green-300 mb-2 text-center">Not Important & Not Urgent</h3>
              </div>
            </div>
            
            <!-- Moving Task Card -->
            <div id="moving-task-card" class="absolute top-[80px] left-[80px] w-[180px] bg-white dark:bg-dark-surface-1 rounded shadow-md border border-gray-200 dark:border-gray-700 p-3 z-10 transition-all duration-1000 ease-in-out">
              <div class="flex items-start mb-2">
                <div class="w-2 h-2 rounded-full bg-error mt-1.5 mr-2 flex-shrink-0"></div>
                <h3 class="text-sm font-medium text-gray-900 dark:text-dark-text-primary flex-grow">Project Deadline</h3>
              </div>
              <p class="text-xs text-gray-600 dark:text-dark-text-secondary mb-2">
                Complete project before deadline
              </p>
              <div class="flex flex-wrap gap-1 mb-2">
                <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                  #urgent
                </span>
              </div>
            </div>
            
            <!-- Path Visualization -->
            <svg class="absolute inset-0 w-full h-full pointer-events-none z-[5]" xmlns="http://www.w3.org/2000/svg">
              <path id="motion-path" d="M80,80 C150,80 150,320 300,320 S450,180 520,180" fill="none" stroke="rgba(99, 102, 241, 0.5)" stroke-width="2" stroke-dasharray="6 4" />
              <circle id="position-indicator" cx="80" cy="80" r="5" fill="rgb(99, 102, 241)" />
            </svg>
            
            <!-- Quadrant Labels -->
            <div class="absolute top-[50px] left-[80px] bg-primary-500 text-white px-2 py-1 rounded text-xs z-20">
              Start: Urgent & Important
            </div>
            <div class="absolute top-[320px] left-[300px] bg-primary-500 text-white px-2 py-1 rounded text-xs z-20">
              Move to: Not Important & Urgent
            </div>
            <div class="absolute top-[180px] left-[520px] bg-primary-500 text-white px-2 py-1 rounded text-xs z-20">
              End at: Important & Not Urgent
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(demoContainer);
      
      // Animate the task card movement
      let step = 0;
      const animateTaskMovement = () => {
        const card = document.getElementById('moving-task-card');
        const indicator = document.getElementById('position-indicator');
        
        if (!card || !indicator) return;
        
        // Define the movement path
        const positions = [
          { top: 80, left: 80 },     // Q1: Important & Urgent
          { top: 320, left: 300 },   // Q3: Not Important & Urgent
          { top: 180, left: 520 }    // Q2: Important & Not Urgent
        ];
        
        // Update position
        card.style.top = `${positions[step].top}px`;
        card.style.left = `${positions[step].left}px`;
        indicator.setAttribute('cx', positions[step].left);
        indicator.setAttribute('cy', positions[step].top);
        
        // Add highlight effect
        card.classList.add('ring-4', 'ring-primary-500', 'ring-opacity-70');
        setTimeout(() => {
          card.classList.remove('ring-4', 'ring-primary-500', 'ring-opacity-70');
        }, 500);
        
        // Move to next position
        step = (step + 1) % positions.length;
      };
      
      // Start animation after a short delay
      setTimeout(() => {
        const interval = setInterval(animateTaskMovement, 2000);
        
        // Store the interval ID for cleanup
        demoContainer.dataset.intervalId = interval;
      }, 500);
    };
    
    createMoveDemo();
    
    // Clean up function
    return () => {
      const demoContainer = document.getElementById('tour-task-move-demo');
      if (demoContainer) {
        // Clear the animation interval
        if (demoContainer.dataset.intervalId) {
          clearInterval(parseInt(demoContainer.dataset.intervalId));
        }
        demoContainer.remove();
      }
    };
  }, []);
  
  return null; // This component doesn't render anything directly
};

export default TourTaskMoveDemo; 