import React, { useState, useEffect, useRef } from 'react';
import { useTour } from '../../contexts/TourContext';

/**
 * TourDialog component
 * Displays the tour content and navigation controls
 */
const TourDialog = () => {
  const { 
    active, 
    currentStep, 
    currentStepIndex, 
    totalSteps,
    nextStep, 
    prevStep, 
    endTour,
    goToStep,
    executeAction
  } = useTour();
  
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dialogRef = useRef(null);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Log when the component renders
  console.log('TourDialog rendering, active:', active, 'currentStep:', currentStep ? currentStep.id : null);

  // Update window size on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Position the dialog based on the target element and specified position
  useEffect(() => {
    if (!active || !currentStep || !dialogRef.current) {
      return;
    }

    console.log('Positioning dialog for step:', currentStep.id);

    const targetSelector = currentStep.target;
    const dialogPosition = currentStep.position || 'center';
    
    // Default position (center of screen)
    let newPosition = {
      top: windowSize.height / 2,
      left: windowSize.width / 2,
      transform: 'translate(-50%, -50%)'
    };

    // If no target or position is 'center', keep the dialog centered
    if (!targetSelector || dialogPosition === 'center') {
      setPosition(newPosition);
      return;
    }

    // Find the target element
    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) {
      console.warn(`Tour target element not found: ${targetSelector}`);
      setPosition(newPosition);
      return;
    }

    // Get the element's position and dimensions
    const targetRect = targetElement.getBoundingClientRect();
    const dialogRect = dialogRef.current.getBoundingClientRect();
    
    // Calculate position based on the specified position
    switch (dialogPosition) {
      case 'top':
        newPosition = {
          top: targetRect.top - dialogRect.height - 20,
          left: targetRect.left + (targetRect.width / 2),
          transform: 'translateX(-50%)'
        };
        break;
      case 'bottom':
        newPosition = {
          top: targetRect.bottom + 20,
          left: targetRect.left + (targetRect.width / 2),
          transform: 'translateX(-50%)'
        };
        break;
      case 'left':
        newPosition = {
          top: targetRect.top + (targetRect.height / 2),
          left: targetRect.left - dialogRect.width - 20,
          transform: 'translateY(-50%)'
        };
        break;
      case 'right':
        newPosition = {
          top: targetRect.top + (targetRect.height / 2),
          left: targetRect.right + 20,
          transform: 'translateY(-50%)'
        };
        break;
      default:
        // Default to center if position is not recognized
        break;
    }

    // Ensure the dialog stays within the viewport
    const padding = 20;
    
    // Check top boundary
    if (newPosition.top < padding) {
      newPosition.top = padding;
      if (newPosition.transform.includes('translateY')) {
        newPosition.transform = newPosition.transform.replace('translateY(-50%)', '');
      }
    }
    
    // Check bottom boundary
    if (newPosition.top + dialogRect.height > windowSize.height - padding) {
      newPosition.top = windowSize.height - dialogRect.height - padding;
      if (newPosition.transform.includes('translateY')) {
        newPosition.transform = newPosition.transform.replace('translateY(-50%)', '');
      }
    }
    
    // Check left boundary
    if (newPosition.left < padding) {
      newPosition.left = padding;
      if (newPosition.transform.includes('translateX')) {
        newPosition.transform = newPosition.transform.replace('translateX(-50%)', '');
      }
    }
    
    // Check right boundary
    if (newPosition.left + dialogRect.width > windowSize.width - padding) {
      newPosition.left = windowSize.width - dialogRect.width - padding;
      if (newPosition.transform.includes('translateX')) {
        newPosition.transform = newPosition.transform.replace('translateX(-50%)', '');
      }
    }

    setPosition(newPosition);
  }, [active, currentStep, windowSize, dialogRef]);

  // Execute the onShow action when the step changes
  useEffect(() => {
    if (active && currentStep && currentStep.onShow && typeof currentStep.onShow === 'function') {
      console.log('Executing onShow action for step:', currentStep.id);
      executeAction(currentStep.onShow);
    }
  }, [active, currentStep, executeAction]);

  // Don't render anything if the tour is not active
  if (!active || !currentStep) {
    return null;
  }

  // Create a progress indicator
  const progressPercentage = ((currentStepIndex + 1) / totalSteps) * 100;

  // Process content to improve readability
  const processContent = (content) => {
    // Replace <ul> with styled lists
    let processed = content.replace(/<ul>/g, '<ul class="space-y-2 my-4">');
    
    // Replace <li> with styled list items based on quadrant colors
    const quadrantColors = {
      do: '#FF6B6B', // Coral for Do (Urgent/Important)
      delegate: '#3AAAA0', // Darker Teal for Delegate (was #4ECDC4)
      backlog: '#95A5A6', // Warm gray for Backlog
      default: '#7F8C8D' // Steel gray for default
    };
    
    // Use different bullet colors based on content
    processed = processed.replace(/<li>/g, (match, offset) => {
      // Determine which color to use based on content
      let bulletColor = quadrantColors.default;
      
      // Check if the content after this <li> contains specific keywords
      const remainingContent = content.substring(offset);
      if (remainingContent.includes('urgent') || remainingContent.includes('important')) {
        bulletColor = quadrantColors.do;
      } else if (remainingContent.includes('delegate') || remainingContent.includes('later')) {
        bulletColor = quadrantColors.delegate;
      } else if (remainingContent.includes('backlog')) {
        bulletColor = quadrantColors.backlog;
      }
      
      return `<li class="flex items-start"><span class="inline-block w-2 h-2 bg-[${bulletColor}] rounded-full mt-1.5 mr-2 flex-shrink-0"></span><span>`;
    });
    
    processed = processed.replace(/<\/li>/g, '</span></li>');
    
    // Add spacing to paragraphs
    processed = processed.replace(/<p>/g, '<p class="mb-3">');
    
    // Style strong elements with darker turquoise for better visibility
    processed = processed.replace(/<strong>/g, '<strong class="text-[#2C3E50] dark:text-[#3AAAA0] font-medium">');
    
    // Ensure code blocks have proper contrast
    processed = processed.replace(/<code class="bg-gray-100 dark:bg-gray-700/g, '<code class="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200');
    
    return processed;
  };

  console.log('Rendering TourDialog with position:', position);

  return (
    <div 
      ref={dialogRef}
      className="fixed z-[60] rounded-lg shadow-xl p-8 transition-all duration-300 ease-in-out"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: position.transform || '',
        maxWidth: '90vw',
        width: '500px',
        background: 'linear-gradient(to bottom right, #F0F0F0, #E5E7EB)', // Darker light gray background
        borderColor: '#7F8C8D',
        boxShadow: '0 8px 16px rgba(52, 73, 94, 0.1)',
        pointerEvents: 'auto', // Ensure the dialog receives pointer events
      }}
      onClick={(e) => e.stopPropagation()} // Prevent clicks from propagating to elements below
    >
      {/* Title */}
      <h2 className="text-2xl font-semibold mb-4 text-[#2C3E50] border-b border-[#7F8C8D] pb-3">
        {currentStep.title}
      </h2>
      
      {/* Content */}
      <div 
        className="text-[#2C3E50] mb-6 prose prose-sm max-w-none overflow-auto"
        style={{ 
          maxHeight: '60vh',
          boxShadow: 'inset 0 0 8px rgba(58, 170, 160, 0.08)' // Darker teal shadow
        }}
        dangerouslySetInnerHTML={{ __html: processContent(currentStep.content) }}
      />
      
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-[#BDC3C7] rounded-full mb-4">
        <div 
          className="h-1.5 bg-[#3AAAA0] rounded-full transition-all duration-300 ease-in-out" // Darker teal
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {/* Step indicator */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-[#7F8C8D]">
          Step {currentStepIndex + 1} of {totalSteps}
        </span>
        
        {/* Skip button */}
        <button
          onClick={endTour}
          className="text-sm text-[#34495E] hover:text-[#2C3E50] transition-colors"
        >
          Skip Tour
        </button>
      </div>
      
      {/* Navigation buttons */}
      <div className="flex justify-between">
        {/* Back button */}
        <button
          onClick={prevStep}
          disabled={currentStepIndex === 0}
          className={`px-4 py-2 rounded-md transition-colors ${
            currentStepIndex === 0
              ? 'bg-[#BDC3C7] text-[#95A5A6] cursor-not-allowed'
              : 'bg-[#BDC3C7] text-[#34495E] hover:bg-[#95A5A6]'
          }`}
        >
          Back
        </button>
        
        {/* Next/Finish button */}
        <button
          onClick={currentStepIndex === totalSteps - 1 ? endTour : nextStep}
          className="px-4 py-2 bg-[#2ECC71] text-white rounded-md hover:bg-[#27AE60] transition-colors"
        >
          {currentStepIndex === totalSteps - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default TourDialog; 