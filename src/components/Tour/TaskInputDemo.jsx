import React, { useState, useEffect, useRef } from 'react';
import { useTour } from '../../contexts/TourContext';
import TourCursor from './TourCursor';

/**
 * TaskInputDemo component
 * Demonstrates adding a task by using the real app functionality
 * Uses a visible cursor for demonstrations and the real form
 */
const TaskInputDemo = () => {
  const [step, setStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: -50, y: -50 });
  const [cursorVisible, setCursorVisible] = useState(true);
  const [cursorClicking, setCursorClicking] = useState(false);
  
  // References for cleanup
  const timeoutRefs = useRef([]);
  const inputRef = useRef(null);
  const buttonRef = useRef(null);
  const { nextStep } = useTour();

  // Task title to type
  const taskTitle = "Board Meeting Presentation #do";

  // Get references to the actual form elements
  const findAndSetupElements = () => {
    // Find the input field first
    const inputField = document.querySelector('[data-tour-id="task-input-field"]') || 
                       document.querySelector('input[type="text"][placeholder*="task"]') ||
                       document.querySelector('input[placeholder*="Add task"]') ||
                       document.querySelector('form input[type="text"]');
    
    // Find the add button
    const button = document.querySelector('[data-tour-id="add-task-button"]') ||
                  document.querySelector('form button[type="submit"]') ||
                  document.querySelector('form button');
    
    // Save references
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

  // Highlight the input field to draw user's attention
  const highlightInput = (inputField) => {
    if (inputField) {
      inputField.classList.add('tour-highlight');
      
      // Focus the input field to place cursor in it
      inputField.focus();
    }
  };

  // Simulate typing or guide the user to type
  const handleTyping = () => {
    // Automatically fill in the task input
    const inputField = inputRef.current;
    
    if (inputField) {
      // Set the value directly
      inputField.value = taskTitle;
      
      // Trigger input event to update React state
      const inputEvent = new Event('input', { bubbles: true });
      inputField.dispatchEvent(inputEvent);
      
      // Trigger change event
      const changeEvent = new Event('change', { bubbles: true });
      inputField.dispatchEvent(changeEvent);
      
      console.log('TaskInputDemo: Set input value to', taskTitle);
      
      // Move to next step after a brief pause
      const timeout = setTimeout(() => {
        setStep(2);
        highlightAddButton();
      }, 1000);
      
      timeoutRefs.current.push(timeout);
    }
  };

  // Highlight the add button
  const highlightAddButton = () => {
    const button = buttonRef.current;
    
    if (button) {
      // Remove highlight from input
      const inputField = inputRef.current;
      if (inputField) {
        inputField.classList.remove('tour-highlight');
      }
      
      // Add highlight to button
      button.classList.add('tour-highlight');
      
      // Scroll to ensure button is visible
      button.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Get button position for cursor
      const buttonPosition = getElementPosition(button);
      
      // Move cursor to button
      moveCursor(buttonPosition, 1000, () => {
        // Show click animation before clicking
        setCursorClicking(true);
        
        // After a short delay, simulate click on the button
        const timeout = setTimeout(() => {
          handleAddTask();
          setTimeout(() => setCursorClicking(false), 300);
        }, 500);
        
        timeoutRefs.current.push(timeout);
      });
    }
  };

  // Handle adding the task
  const handleAddTask = () => {
    const button = buttonRef.current;
    
    if (button) {
      // Actually click the button
      button.click();
      console.log('TaskInputDemo: Clicked add button');
      
      // Complete the demo
      const timeout = setTimeout(() => {
        // Clean up highlights
        if (inputRef.current) {
          inputRef.current.classList.remove('tour-highlight');
        }
        
        if (buttonRef.current) {
          buttonRef.current.classList.remove('tour-highlight');
        }
        
        setIsComplete(true);
        
        // Wait a moment before proceeding to the next tour step
        const nextTimeout = setTimeout(() => {
          nextStep();
        }, 500);
        
        timeoutRefs.current.push(nextTimeout);
      }, 1000);
      
      timeoutRefs.current.push(timeout);
    }
  };

  // Move cursor with animation
  const moveCursor = (toPos, duration = 800, onFinish = null) => {
    const startPos = { ...cursorPosition };
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);

      // Cubic ease out for more natural movement
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const newX = startPos.x + (toPos.x - startPos.x) * easeProgress;
      const newY = startPos.y + (toPos.y - startPos.y) * easeProgress;

      setCursorPosition({ x: newX, y: newY });

      if (progress < 1) {
        const animFrame = requestAnimationFrame(animate);
        const cancelAnimation = () => cancelAnimationFrame(animFrame);
        timeoutRefs.current.push(cancelAnimation);
      } else if (onFinish) {
        onFinish();
      }
    };

    animate();
  };

  // Get element position for cursor
  const getElementPosition = (element) => {
    if (!element) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 3,
      y: rect.top + rect.height / 2
    };
  };

  // Run the demo
  const runDemo = () => {
    // First locate and set up the elements
    const { inputField, button } = findAndSetupElements();
    
    if (!inputField || !button) {
      console.error('TaskInputDemo: Could not find required elements');
      return;
    }
    
    // Position cursor out of view initially
    setCursorPosition({ x: -50, y: window.innerHeight / 2 });
    
    // Start by moving cursor to the input field
    const inputPosition = getElementPosition(inputField);
    
    // Move cursor to input field
    const timeout0 = setTimeout(() => {
      moveCursor(inputPosition, 1000, () => {
        // Start by highlighting the input field
        highlightInput(inputField);
        
        // After a short delay, fill in the input
        const timeout = setTimeout(() => {
          setStep(1);
          // Show click animation before typing
          setCursorClicking(true);
          setTimeout(() => setCursorClicking(false), 300);
          handleTyping();
        }, 500);
        
        timeoutRefs.current.push(timeout);
      });
    }, 500);
    
    timeoutRefs.current.push(timeout0);
  };

  // Cleanup function
  const cleanupDemo = () => {
    // Clear all timeouts
    timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
    timeoutRefs.current = [];
    
    // Remove any highlights
    if (inputRef.current) {
      inputRef.current.classList.remove('tour-highlight');
    }
    
    if (buttonRef.current) {
      buttonRef.current.classList.remove('tour-highlight');
    }
    
    // Remove any other highlights
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
    });
  };

  // Initialize the demo
  useEffect(() => {
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

  // Render the cursor visualization
  if (!cursorVisible) return null;
  
  return (
    <TourCursor 
      position={cursorPosition} 
      clicking={cursorClicking} 
      dragging={false} 
    />
  );
};

export default TaskInputDemo;