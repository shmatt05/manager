import React, { useState, useEffect, useCallback } from 'react';
import TourCursor from './TourCursor';

/**
 * TaskInputDemo component
 * A React-based demonstration of adding a task
 * Shows cursor typing text, clicking button, and task being added
 */
const TaskInputDemo = () => {
  const [step, setStep] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ x: 100, y: 100 });
  const [targetPosition, setTargetPosition] = useState({ x: 100, y: 100 });
  const [typedText, setTypedText] = useState('');
  const [showClick, setShowClick] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [demoText] = useState('Complete project proposal #do @tomorrow');
  
  // Find DOM elements and calculate positions
  const findElements = useCallback(() => {
    const inputField = document.querySelector('form input[type="text"]');
    const addButton = document.querySelector('[data-tour-id="add-task-button"]');
    
    if (inputField && addButton) {
      const inputRect = inputField.getBoundingClientRect();
      const buttonRect = addButton.getBoundingClientRect();
      
      // Position for typing (inside input field)
      const typingX = inputRect.left + 120;
      const typingY = inputRect.top + (inputRect.height / 2);
      
      // Position for clicking button
      const buttonX = buttonRect.left + (buttonRect.width / 2);
      const buttonY = buttonRect.top + (buttonRect.height / 2);
      
      return {
        inputField,
        addButton,
        typingPosition: { x: typingX, y: typingY },
        buttonPosition: { x: buttonX, y: buttonY }
      };
    }
    
    return null;
  }, []);
  
  // Type text in input field
  const typeText = useCallback((text, inputField) => {
    if (!inputField) return;
    
    // Clear existing input value
    inputField.value = '';
    
    // Create and dispatch an input event to update the React state
    const inputEvent = new Event('input', { bubbles: true });
    
    let charIndex = 0;
    
    const typeChar = () => {
      if (charIndex < text.length) {
        // Add one character
        const currentText = text.substring(0, charIndex + 1);
        inputField.value = currentText;
        setTypedText(currentText);
        
        // Dispatch event to React
        inputField.dispatchEvent(inputEvent);
        
        // Move to next character
        charIndex++;
        setTimeout(typeChar, 100);
      } else {
        // Typing complete
        setTimeout(() => setStep(1), 800);
      }
    };
    
    setTimeout(typeChar, 500);
  }, []);
  
  // Click button
  const clickButton = useCallback((button) => {
    if (!button) return;
    
    // Show click animation first
    setShowClick(true);
    
    // Then simulate creating a task programmatically
    setTimeout(() => {
      // Create a custom event to add a task in the demo board
      const demoTask = {
        id: 'tour-demo-task-' + Date.now(),
        title: 'Complete project proposal',
        description: '#do @tomorrow',
        tags: ['demo', 'tour', 'do'],
        priority: 1,
        status: 'todo',
        quadrant: 'q1', // Do quadrant
        dueDate: new Date(Date.now() + 86400000).toISOString(), // tomorrow
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Dispatch custom event to add task
      const addTaskEvent = new CustomEvent('tour:add-task', {
        detail: { task: demoTask }
      });
      document.dispatchEvent(addTaskEvent);
      
      // Wait a bit before hiding cursor to make sure we see the result
      setTimeout(() => setIsComplete(true), 1000);
    }, 300);
  }, []);
  
  // Initialize demo  
  useEffect(() => {
    const initialize = () => {
      const elements = findElements();
      if (!elements) {
        // If elements not found, retry
        setTimeout(initialize, 100);
        return;
      }
      
      // Disable actual input field to prevent user interaction
      if (elements.inputField) {
        elements.inputField.disabled = true;
        // Remove data-tour-interaction to make it non-interactive
        elements.inputField.removeAttribute('data-tour-interaction');
      }
      
      // Disable button to prevent clicking
      if (elements.addButton) {
        elements.addButton.disabled = true;
        elements.addButton.removeAttribute('data-tour-interaction');
      }
      
      const { typingPosition } = elements;
      
      // Set initial cursor position (center of screen)
      const startX = window.innerWidth / 2;
      const startY = window.innerHeight / 2;
      
      setCursorPosition({ x: startX, y: startY });
      
      // Move cursor to input field
      setTimeout(() => {
        setTargetPosition(typingPosition);
        
        // Begin typing after cursor arrives
        setTimeout(() => {
          typeText(demoText, elements.inputField);
        }, 1000);
      }, 500);
    };
    
    // Start with a delay
    setTimeout(initialize, 800);
    
    // Cleanup
    return () => {
      // Reset form if demo is interrupted
      const inputField = document.querySelector('form input[type="text"]');
      if (inputField) {
        // Reset value
        inputField.value = '';
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Re-enable the input field
        inputField.disabled = false;
        inputField.setAttribute('data-tour-interaction', 'enabled');
      }
      
      // Re-enable button
      const addButton = document.querySelector('[data-tour-id="add-task-button"]');
      if (addButton) {
        addButton.disabled = false;
        addButton.setAttribute('data-tour-interaction', 'enabled');
      }
    };
  }, [findElements, typeText, demoText]);
  
  // Handle step transitions
  useEffect(() => {
    if (step === 1) {
      const elements = findElements();
      if (elements) {
        setTargetPosition(elements.buttonPosition);
        
        // Click button after cursor arrives
        setTimeout(() => {
          clickButton(elements.addButton);
        }, 1000);
      }
    }
  }, [step, findElements, clickButton]);
  
  return (
    <TourCursor 
      fromPosition={cursorPosition} 
      toPosition={targetPosition}
      duration={1000}
      showClick={showClick}
      visible={!isComplete}
    />
  );
};

export default TaskInputDemo;