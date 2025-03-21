import React, { useState, useEffect, useRef } from 'react';
import { useTour } from '../../contexts/TourContext';

/**
 * TaskInputDemo component
 * Guides the user to use the real input field and button
 * Uses highlighting to show what to interact with
 */
const TaskInputDemo = () => {
  const [step, setStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [waitingForClick, setWaitingForClick] = useState(false);
  
  // References for cleanup
  const timeoutRefs = useRef([]);
  const inputRef = useRef(null);
  const buttonRef = useRef(null);
  const { nextStep } = useTour();

  // Suggested task text
  const suggestedTask = "Board Meeting Presentation #do";

  // Find and setup form elements
  const findAndSetupElements = () => {
    // Find the input field
    const inputField = document.querySelector('[data-tour-id="task-input-field"]') || 
                     document.querySelector('input[type="text"][placeholder*="task"]') ||
                     document.querySelector('input[placeholder*="Add task"]') ||
                     document.querySelector('form input[type="text"]');
    
    // Find the add button
    const button = document.querySelector('[data-tour-id="add-task-button"]') ||
                  document.querySelector('form button[type="submit"]') ||
                  document.querySelector('form button');
    
    // Set up data attributes for easier reference
    if (inputField) {
      inputField.setAttribute('data-tour-id', 'task-input-field');
      inputRef.current = inputField;
    }
    
    if (button) {
      button.setAttribute('data-tour-id', 'add-task-button');
      buttonRef.current = button;
    }
    
    return { inputField, button };
  };

  // Add spotlight effect to an element
  const addSpotlightTo = (element, className = 'tour-pulse-highlight') => {
    if (!element) return;
    
    // Remove existing highlights
    document.querySelectorAll('.tour-highlight, .tour-pulse-highlight, .tour-focus-highlight').forEach(el => {
      el.classList.remove('tour-highlight', 'tour-pulse-highlight', 'tour-focus-highlight');
    });
    
    // Add the specified highlight class
    element.classList.add(className);
    
    // Ensure the element is visible
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Simulate typing into input field
  const simulateTyping = (text, onComplete) => {
    const inputField = inputRef.current;
    if (!inputField) return;
    
    // Focus the input field
    inputField.focus();
    
    // Type each character with a slight delay
    let currentIndex = 0;
    let currentText = '';
    
    const typeNextChar = () => {
      if (currentIndex < text.length) {
        // Add next character
        currentText += text[currentIndex];
        
        // Update input value
        inputField.value = currentText;
        
        // Dispatch input event to update React state
        const inputEvent = new Event('input', { bubbles: true });
        inputField.dispatchEvent(inputEvent);
        
        // Dispatch change event
        const changeEvent = new Event('change', { bubbles: true });
        inputField.dispatchEvent(changeEvent);
        
        // Move to next character
        currentIndex++;
        
        // Schedule next character with variable timing for realism
        const typingDelay = 50 + Math.random() * 100;
        const timeout = setTimeout(typeNextChar, typingDelay);
        timeoutRefs.current.push(() => clearTimeout(timeout));
      } else if (onComplete) {
        // Typing complete, call callback
        onComplete();
      }
    };
    
    // Start typing
    typeNextChar();
  };

  // Highlight input and simulate typing
  const highlightInput = () => {
    const inputField = inputRef.current;
    if (!inputField) return;
    
    // Add pulse highlight to attract attention
    addSpotlightTo(inputField, 'tour-pulse-highlight');
    
    // Focus the input
    inputField.focus();
    
    // Wait a moment then start typing
    const timeout = setTimeout(() => {
      // Remove the pulsing and add steady highlight
      addSpotlightTo(inputField, 'tour-focus-highlight');
      
      // Simulate typing
      simulateTyping(suggestedTask, () => {
        // When typing is complete, highlight the button
        highlightAddButton();
      });
    }, 1200);
    
    timeoutRefs.current.push(() => clearTimeout(timeout));
  };


  // Highlight the add button after input
  const highlightAddButton = () => {
    const button = buttonRef.current;
    if (!button) return;
    
    // No longer waiting for input
    setWaitingForInput(false);
    
    // Now waiting for button click
    setWaitingForClick(true);
    
    // Add pulse highlight to button
    addSpotlightTo(button, 'tour-pulse-highlight');
    
    // Listen for click event
    const clickHandler = () => {
      // User clicked the button
      setWaitingForClick(false);
      
      // Remove highlights
      button.classList.remove('tour-pulse-highlight');
      
      // Continue tour after a short delay
      setTimeout(() => {
        completeStep();
      }, 1000);
    };
    
    button.addEventListener('click', clickHandler, { once: true });
    
    // Store cleanup function
    const cleanup = () => {
      button.removeEventListener('click', clickHandler);
    };
    
    timeoutRefs.current.push(cleanup);
  };

  // Complete this tour step
  const completeStep = () => {
    // Remove all highlights
    document.querySelectorAll('.tour-highlight, .tour-pulse-highlight, .tour-focus-highlight').forEach(el => {
      el.classList.remove('tour-highlight', 'tour-pulse-highlight', 'tour-focus-highlight');
    });
    
    // Remove suggestion tooltip
    removeSuggestion();
    
    setIsComplete(true);
    
    // Proceed to next step after a short delay
    setTimeout(() => {
      nextStep();
    }, 500);
  };

  // Run the tour sequence
  const runDemo = () => {
    // Find and setup elements
    const { inputField, button } = findAndSetupElements();
    
    if (!inputField) {
      console.error('TaskInputDemo: Could not find input field');
      // Skip to next step so tour isn't blocked
      setTimeout(() => nextStep(), 1000);
      return;
    }
    
    if (!button) {
      console.error('TaskInputDemo: Could not find add button');
      // Skip to next step so tour isn't blocked
      setTimeout(() => nextStep(), 1000);
      return;
    }
    
    // Clear any existing value in the input field
    inputField.value = '';
    const clearEvent = new Event('input', { bubbles: true });
    inputField.dispatchEvent(clearEvent);
    
    // Start by highlighting the input field
    setTimeout(() => {
      setStep(1);
      highlightInput();
    }, 800);
  };

  // Cleanup on unmount or when tour advances
  const cleanupDemo = () => {
    // Clear all timeouts
    timeoutRefs.current.forEach(timeoutId => {
      if (typeof timeoutId === 'function') {
        timeoutId(); // Execute cleanup function
      } else {
        clearTimeout(timeoutId); // Clear timeout
      }
    });
    timeoutRefs.current = [];
    
    // Remove highlights
    document.querySelectorAll('.tour-highlight, .tour-pulse-highlight, .tour-focus-highlight').forEach(el => {
      el.classList.remove('tour-highlight', 'tour-pulse-highlight', 'tour-focus-highlight');
    });
  };

  // Initialize the tour
  useEffect(() => {
    // Add CSS for animations if not already present
    if (!document.getElementById('tour-pulse-styles')) {
      const style = document.createElement('style');
      style.id = 'tour-pulse-styles';
      style.textContent = `
        @keyframes tour-pulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3), 0 0 0 4px rgba(59, 130, 246, 0.2); }
          50% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.3); }
        }
        
        .tour-pulse-highlight {
          animation: tour-pulse 1.5s infinite !important;
          outline: 2px solid rgba(59, 130, 246, 0.7) !important;
          position: relative !important;
          z-index: 9000 !important;
        }
        
        .tour-focus-highlight {
          outline: 2px solid rgba(59, 130, 246, 0.7) !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3) !important;
          position: relative !important;
          z-index: 9000 !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Start the demo after a short delay
    const timeout = setTimeout(() => {
      runDemo();
    }, 500);
    
    timeoutRefs.current.push(timeout);
    
    // Clean up on unmount
    return () => {
      cleanupDemo();
    };
  }, []);

  // No visual rendering, just guidance through DOM manipulation
  return null;
};

export default TaskInputDemo;