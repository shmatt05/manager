import React, { createContext, useContext, useState, useEffect } from 'react';
import tourSteps from '../data/tourSteps';

// Create the context
const TourContext = createContext();

// Custom hook to use the tour context
export const useTour = () => useContext(TourContext);

/**
 * TourProvider component
 * A simplified, reliable implementation of the tour context
 */
export const TourProvider = ({ children }) => {
  // Tour state
  const [active, setActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepHistory, setStepHistory] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);

  // Get the current step
  const currentStep = tourSteps[currentStepIndex];
  const totalSteps = tourSteps.length;

  // Console logging for debugging
  useEffect(() => {
    if (active) {
      console.log('Tour active, current step:', currentStepIndex, currentStep?.id);
    }
  }, [active, currentStepIndex, currentStep]);

  // Start the tour
  const startTour = (startIndex = 0) => {
    console.log('Starting tour at index:', startIndex);
    setCurrentStepIndex(startIndex);
    setActive(true);
    setStepHistory([startIndex]);
    setCompleted(false);
    
    // Disable scrolling on the body when tour is active
    document.body.style.overflow = 'hidden';
    
    // Add tour-active class to body to prevent interactions
    document.body.classList.add('tour-active');
    
    // Dispatch tour:start event
    window.dispatchEvent(new CustomEvent('tour:start'));
  };

  // End the tour
  const endTour = () => {
    console.log('Ending tour');
    setActive(false);
    setAutoPlay(false);
    
    // Re-enable scrolling
    document.body.style.overflow = '';
    
    // Remove tour-active class from body
    document.body.classList.remove('tour-active');
    
    // Dispatch tour:end event
    window.dispatchEvent(new CustomEvent('tour:end'));
  };

  // Complete the tour
  const completeTour = () => {
    console.log('Completing tour');
    setActive(false);
    setCompleted(true);
    setAutoPlay(false);
    
    // Re-enable scrolling
    document.body.style.overflow = '';
    
    // Remove tour-active class from body
    document.body.classList.remove('tour-active');
    
    // Dispatch tour:end event
    window.dispatchEvent(new CustomEvent('tour:end'));
  };

  // Go to the next step
  const nextStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      const nextIndex = currentStepIndex + 1;
      console.log('Going to next step:', nextIndex);
      setCurrentStepIndex(nextIndex);
      setStepHistory([...stepHistory, nextIndex]);
    } else {
      completeTour();
    }
  };

  // Go to the previous step
  const prevStep = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      console.log('Going to previous step:', prevIndex);
      setCurrentStepIndex(prevIndex);
      setStepHistory([...stepHistory, prevIndex]);
    }
  };

  // Go to a specific step
  const goToStep = (index) => {
    if (index >= 0 && index < totalSteps) {
      console.log('Going to specific step:', index);
      setCurrentStepIndex(index);
      setStepHistory([...stepHistory, index]);
    }
  };

  // Set auto play mode
  const setAutoPlayMode = (isAutoPlay) => {
    console.log('Setting auto play mode:', isAutoPlay);
    setAutoPlay(isAutoPlay);
  };

  // Reset the tour
  const resetTour = () => {
    console.log('Resetting tour');
    setActive(false);
    setCurrentStepIndex(0);
    setStepHistory([]);
    setAutoPlay(false);
    setCompleted(false);
  };

  // Handle keyboard events
  const handleKeyDown = (e) => {
    if (active) {
      // Prevent default behavior for arrow keys, escape, enter, and space
      if (
        e.key === 'ArrowRight' || 
        e.key === 'ArrowLeft' || 
        e.key === 'Escape' || 
        e.key === 'Enter' || 
        e.key === ' '
      ) {
        e.preventDefault();
        e.stopPropagation();
        
        // Handle navigation with keyboard
        switch (e.key) {
          case 'ArrowRight':
          case 'Enter':
          case ' ':
            nextStep();
            break;
          case 'ArrowLeft':
            prevStep();
            break;
          case 'Escape':
            endTour();
            break;
          default:
            break;
        }
      }
    }
  };

  // Set up keyboard listeners
  useEffect(() => {
    if (active) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, currentStepIndex]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      document.body.classList.remove('tour-active');
    };
  }, []);

  // Value to be provided by the context
  const value = {
    active,
    currentStep,
    currentStepIndex,
    totalSteps,
    stepHistory,
    autoPlay,
    completed,
    startTour,
    endTour,
    nextStep,
    prevStep,
    goToStep,
    setAutoPlay: setAutoPlayMode,
    completeTour,
    resetTour
  };

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
};

export default TourContext;