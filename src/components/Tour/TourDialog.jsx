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

    const targetSelector = currentStep.target;
    if (!targetSelector) {
      // Center in the viewport if no target is specified
      setPosition({
        top: windowSize.height / 2,
        left: windowSize.width / 2,
        transform: 'translate(-50%, -50%)'
      });
      return;
    }

    // Handle special case for 'body' target (center of screen)
    if (targetSelector === 'body' || currentStep.position === 'center') {
      setPosition({
        top: windowSize.height / 2,
        left: windowSize.width / 2,
        transform: 'translate(-50%, -50%)'
      });
      return;
    }

    // Find the target element
    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) {
      console.warn(`Tour target element not found: ${targetSelector}`);
      // Center in the viewport if target is not found
      setPosition({
        top: windowSize.height / 2,
        left: windowSize.width / 2,
        transform: 'translate(-50%, -50%)'
      });
      return;
    }

    // Get the dimensions of the dialog
    const dialogRect = dialogRef.current.getBoundingClientRect();
    const dialogWidth = dialogRect.width;
    const dialogHeight = dialogRect.height;

    // Get the target element's position and dimensions
    const targetRect = targetElement.getBoundingClientRect();
    
    // Calculate position based on the specified position
    const pos = currentStep.position || 'bottom';
    let newPosition = {};

    switch (pos) {
      case 'top':
        newPosition = {
          top: targetRect.top - dialogHeight - 20,
          left: targetRect.left + (targetRect.width / 2),
          transform: 'translateX(-50%)'
        };
        break;
      case 'right':
        newPosition = {
          top: targetRect.top + (targetRect.height / 2),
          left: targetRect.right + 20,
          transform: 'translateY(-50%)'
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
          left: targetRect.left - dialogWidth - 20,
          transform: 'translateY(-50%)'
        };
        break;
      default:
        newPosition = {
          top: targetRect.bottom + 20,
          left: targetRect.left + (targetRect.width / 2),
          transform: 'translateX(-50%)'
        };
    }

    // Ensure the dialog stays within the viewport
    if (newPosition.left < 20) {
      newPosition.left = 20;
      newPosition.transform = newPosition.transform.replace('translateX(-50%)', '');
    } else if (newPosition.left + dialogWidth > windowSize.width - 20) {
      newPosition.left = windowSize.width - dialogWidth - 20;
      newPosition.transform = newPosition.transform.replace('translateX(-50%)', '');
    }

    if (newPosition.top < 20) {
      newPosition.top = 20;
      newPosition.transform = newPosition.transform.replace('translateY(-50%)', '');
    } else if (newPosition.top + dialogHeight > windowSize.height - 20) {
      newPosition.top = windowSize.height - dialogHeight - 20;
      newPosition.transform = newPosition.transform.replace('translateY(-50%)', '');
    }

    setPosition(newPosition);
  }, [active, currentStep, windowSize]);

  // Execute any actions associated with the current step
  useEffect(() => {
    if (active && currentStep && currentStep.onShow && typeof currentStep.onShow === 'function') {
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
    // Replace <li> with styled list items
    processed = processed.replace(/<li>/g, '<li class="flex items-start"><span class="inline-block w-2 h-2 bg-primary-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span><span>');
    processed = processed.replace(/<\/li>/g, '</span></li>');
    // Add spacing to paragraphs
    processed = processed.replace(/<p>/g, '<p class="mb-3">');
    // Style strong elements
    processed = processed.replace(/<strong>/g, '<strong class="text-primary-600 dark:text-primary-400 font-medium">');
    
    return processed;
  };

  return (
    <div 
      ref={dialogRef}
      className="fixed z-[60] bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-dark-surface-2 rounded-lg shadow-2xl p-8 border border-blue-200 dark:border-blue-900 transition-all duration-300 ease-in-out"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: position.transform || '',
        maxWidth: '90vw',
        width: '500px',
        boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.1), 0 8px 10px -6px rgba(59, 130, 246, 0.1)'
      }}
    >
      {/* Title */}
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white border-b border-blue-100 dark:border-blue-900 pb-3">
        {currentStep.title}
      </h2>
      
      {/* Content */}
      <div 
        className="text-gray-700 dark:text-gray-200 mb-6 prose dark:prose-invert prose-sm max-w-none overflow-auto"
        style={{ maxHeight: '60vh' }}
        dangerouslySetInnerHTML={{ __html: processContent(currentStep.content) }}
      />
      
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-200 dark:bg-dark-surface-4 rounded-full mb-4">
        <div 
          className="h-1.5 bg-primary-500 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {/* Step indicator */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Step {currentStepIndex + 1} of {totalSteps}
        </span>
        
        {/* Skip button */}
        <button
          onClick={endTour}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          Skip tour
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
              ? 'bg-gray-200 text-gray-400 dark:bg-dark-surface-3 dark:text-gray-500 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 dark:bg-dark-surface-3 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-surface-4'
          }`}
        >
          Back
        </button>
        
        {/* Next/Finish button */}
        <button
          onClick={currentStepIndex === totalSteps - 1 ? endTour : nextStep}
          className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
        >
          {currentStepIndex === totalSteps - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default TourDialog; 