import React, { useState, useEffect, useRef } from 'react';
import { useTour } from '../../contexts/TourContext';

/**
 * TourDialog component
 * A simplified, reliable dialog for displaying tour content
 */
const TourDialog = () => {
  const { 
    active, 
    currentStep, 
    currentStepIndex, 
    totalSteps,
    nextStep, 
    prevStep, 
    endTour 
  } = useTour();
  
  const [position, setPosition] = useState({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
  const dialogRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  // Update dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Position the dialog based on current step settings
  useEffect(() => {
    if (!active || !currentStep) return;
    
    console.log('TourDialog: Positioning dialog for step', {
      stepId: currentStep.id,
      position: currentStep.position,
      dialogPosition: currentStep.dialogPosition,
      target: currentStep.target
    });
    
    // Default position (center)
    let newPosition = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    
    // If we have an explicit dialogPosition, use it directly
    if (currentStep.dialogPosition) {
      newPosition = { ...currentStep.dialogPosition };
    }
    // Otherwise, use position relative to target
    else if (currentStep.position === 'center') {
      // Keep default center positioning
    } else if (currentStep.position === 'top-right') {
      // Position at top right corner
      newPosition = {
        top: '20px',
        right: '20px',
        left: 'auto',
        transform: 'none'
      };
    } else if (currentStep.target && currentStep.target !== 'body' && currentStep.position) {
      try {
        // Find the target element
        const targetEl = document.querySelector(currentStep.target);
        if (targetEl) {
          const targetRect = targetEl.getBoundingClientRect();
          
          // Position based on target and specified position
          switch (currentStep.position) {
            case 'top':
              newPosition = {
                top: `${targetRect.top - 20}px`,
                left: `${targetRect.left + targetRect.width/2}px`,
                transform: 'translate(-50%, -100%)'
              };
              break;
            case 'bottom':
              newPosition = {
                top: `${targetRect.bottom + 20}px`,
                left: `${targetRect.left + targetRect.width/2}px`,
                transform: 'translate(-50%, 0)'
              };
              break;
            case 'left':
              newPosition = {
                top: `${targetRect.top + targetRect.height/2}px`,
                left: `${targetRect.left - 20}px`,
                transform: 'translate(-100%, -50%)'
              };
              break;
            case 'right':
              newPosition = {
                top: `${targetRect.top + targetRect.height/2}px`,
                left: `${targetRect.right + 20}px`,
                transform: 'translate(0, -50%)'
              };
              break;
            default:
              break;
          }
        }
      } catch (error) {
        console.error('Error positioning dialog:', error);
      }
    }
    
    // Apply any offset specified for this step
    if (currentStep.dialogOffset) {
      if (typeof newPosition.top === 'string' && newPosition.top.endsWith('px')) {
        newPosition.top = `${parseInt(newPosition.top) + (currentStep.dialogOffset.y || 0)}px`;
      }
      if (typeof newPosition.left === 'string' && newPosition.left.endsWith('px')) {
        newPosition.left = `${parseInt(newPosition.left) + (currentStep.dialogOffset.x || 0)}px`;
      }
    }
    
    console.log('TourDialog: Final position calculated', newPosition);
    setPosition(newPosition);
    
    // Call onShow handler if available
    if (currentStep.onShow && typeof currentStep.onShow === 'function') {
      try {
        currentStep.onShow();
      } catch (error) {
        console.error('Error in step onShow handler:', error);
      }
    }
    
    // Return cleanup function
    return () => {
      // Call onHide handler if available
      if (currentStep.onHide && typeof currentStep.onHide === 'function') {
        try {
          currentStep.onHide();
        } catch (error) {
          console.error('Error in step onHide handler:', error);
        }
      }
    };
  }, [active, currentStep, dimensions, currentStepIndex]);
  
  // Don't render anything if the tour is not active
  if (!active || !currentStep) {
    return null;
  }
  
  // Calculate the progress percentage
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;
  
  return (
    <div 
      className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center"
      style={{ pointerEvents: 'none' }}
    >
      <div 
        ref={dialogRef}
        className="bg-slate-800 rounded-lg shadow-2xl p-6 max-w-lg pointer-events-auto border border-slate-700 tour-dialog-content"
        style={{
          position: 'absolute',
          top: position.top,
          left: position.left,
          transform: position.transform,
          zIndex: 60,
          backdropFilter: 'blur(8px)',
          maxWidth: '450px'
        }}
      >
        {/* Title */}
        <h2 className="text-xl font-semibold mb-4 text-white border-b border-slate-700 pb-2">
          {currentStep.title}
        </h2>
        
        {/* Content */}
        <div 
          className="prose prose-sm prose-invert max-w-none mb-6 text-slate-200 tour-dialog-content"
          dangerouslySetInnerHTML={{ __html: currentStep.content }}
        />
        
        {/* Progress bar */}
        <div className="w-full h-1 bg-slate-700 rounded mb-4">
          <div 
            className="h-1 bg-blue-500 rounded transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Navigation */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-slate-400">
            Step {currentStepIndex + 1} of {totalSteps}
          </div>
          
          <div className="space-x-2">
            <button
              onClick={endTour}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Skip
            </button>
            
            <button
              onClick={prevStep}
              disabled={currentStepIndex === 0}
              className={`px-3 py-1 rounded transition-colors ${
                currentStepIndex === 0
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              Back
            </button>
            
            <button
              onClick={nextStep}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
            >
              {currentStepIndex === totalSteps - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
        
        {/* Render component if provided */}
        {currentStep.component && React.createElement(currentStep.component)}
      </div>
    </div>
  );
};

export default TourDialog;