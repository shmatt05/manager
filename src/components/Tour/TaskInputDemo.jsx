import React, { useState, useEffect, useRef } from 'react';
import { useTour } from '../../contexts/TourContext';

/**
 * TaskInputDemo component
 * Guides the user to use the real input field and button
 * Uses the actual app functionality to create a real task
 */
const TaskInputDemo = () => {
  const [isComplete, setIsComplete] = useState(false);
  const inputRef = useRef(null);
  const buttonRef = useRef(null);
  const formRef = useRef(null);
  const { nextStep } = useTour();
  
  // References for cleanup
  const cleanupFunctions = useRef([]);
  // Keep a reference to the style element
  const styleElementRef = useRef(null);

  // Suggested task text
  const suggestedTask = "Board Meeting Presentation #do";

  // Find and reference form elements
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
    
    // Find the form element
    const form = inputField ? inputField.closest('form') : null;
    
    if (inputField) {
      inputField.setAttribute('data-tour-id', 'task-input-field');
      inputRef.current = inputField;
    }
    
    if (button) {
      button.setAttribute('data-tour-id', 'add-task-button');
      buttonRef.current = button;
    }
    
    if (form) {
      formRef.current = form;
    }
    
    return { inputField, button, form };
  };

  // Highlight an element with a subtle effect
  const highlightElement = (element) => {
    if (!element) return;
    
    element.classList.add('tour-highlight');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    return () => {
      if (element) {
        element.classList.remove('tour-highlight');
      }
    };
  };

  // Complete this tour step
  const completeStep = () => {
    console.log('TaskInputDemo: Completing step');
    
    // Clean up all event listeners and timeouts
    cleanupFunctions.current.forEach(cleanupFn => {
      try {
        if (typeof cleanupFn === 'function') {
          cleanupFn();
        }
      } catch (error) {
        console.log('TaskInputDemo: Error during cleanup', error);
      }
    });
    
    // Proceed to next step
    setIsComplete(true);
    nextStep();
  };

  // Guide the user through task creation
  useEffect(() => {
    if (isComplete) return;
    
    // Add minimal CSS for highlight effect
    const style = document.createElement('style');
    style.textContent = `
      .tour-highlight {
        outline: 2px solid rgba(59, 130, 246, 0.7) !important;
        box-shadow: 0 0 8px rgba(59, 130, 246, 0.4) !important;
      }
    `;
    document.head.appendChild(style);
    styleElementRef.current = style;
    
    cleanupFunctions.current.push(() => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    });
    
    // Find and setup all the required elements
    const { inputField, button } = findAndSetupElements();
    
    if (!inputField || !button) {
      console.error('TaskInputDemo: Could not find required elements');
      setTimeout(completeStep, 2000);
      return;
    }
    
    // 1. Highlight the input field
    const removeInputHighlight = highlightElement(inputField);
    cleanupFunctions.current.push(removeInputHighlight);
    
    // 2. Fill in the task text for the user
    inputField.value = suggestedTask;
    
    // Dispatch input event to trigger React state updates
    const inputEvent = new Event('input', { bubbles: true });
    inputField.dispatchEvent(inputEvent);
    
    // Dispatch change event
    const changeEvent = new Event('change', { bubbles: true });
    inputField.dispatchEvent(changeEvent);
    
    // 3. After a short delay, highlight the Add button
    const inputHighlightTimeout = setTimeout(() => {
      removeInputHighlight();
      
      // Make sure button is enabled
      if (button.hasAttribute('disabled')) {
        button.removeAttribute('disabled');
      }
      
      const removeButtonHighlight = highlightElement(button);
      cleanupFunctions.current.push(removeButtonHighlight);
      
      // 4. After another delay, click the button to create the task
      const buttonClickTimeout = setTimeout(() => {
        // Click the button to submit the form and create a real task
        button.click();
        
        // Wait for task to be created before moving to next step
        const completeTimeout = setTimeout(completeStep, 1000);
        cleanupFunctions.current.push(() => clearTimeout(completeTimeout));
      }, 2000);
      
      cleanupFunctions.current.push(() => clearTimeout(buttonClickTimeout));
    }, 2000);
    
    cleanupFunctions.current.push(() => clearTimeout(inputHighlightTimeout));
    
    // Clean up on unmount
    return () => {
      cleanupFunctions.current.forEach(fn => {
        try {
          if (typeof fn === 'function') fn();
        } catch (error) {
          console.log('TaskInputDemo: Error during cleanup', error);
        }
      });
      
      // Ensure style element is removed
      if (styleElementRef.current && document.head.contains(styleElementRef.current)) {
        document.head.removeChild(styleElementRef.current);
      }
    };
  }, [isComplete]);

  // No visual rendering, just DOM manipulation
  return null;
};

export default TaskInputDemo;