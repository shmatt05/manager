import React, { useState, useEffect, useRef } from 'react';
import TourCursor from './TourCursor';

/**
 * TaskInputDemo component
 * Demonstrates adding a task with typing animation
 */
const TaskInputDemo = () => {
  const [cursorPosition, setCursorPosition] = useState({ x: -50, y: -50 });
  const [cursorVisible, setCursorVisible] = useState(true);
  const [cursorClicking, setCursorClicking] = useState(false);
  const [inputText, setInputText] = useState('');
  const [step, setStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // References for cleanup
  const timeoutRefs = useRef([]);
  const cleanupFunctions = useRef([]);
  const inputRef = useRef(null);
  
  // Task title to type
  const taskTitle = "Board Meeting Presentation #do";
  
  // Flag to track if we've set the input value directly
  const hasManuallySetInput = useRef(false);

  // Get input field position
  const getInputPosition = () => {
    // Try to find the task input field by data attribute first
    let inputField = document.querySelector('[data-tour-id="task-input-field"]');
    
    // If not found, try other selectors
    if (!inputField) {
      console.log('TaskInputDemo: Input field with data-tour-id not found, trying alternatives');
      inputField = document.querySelector('input[type="text"][placeholder*="task"]') || 
                 document.querySelector('input[placeholder*="Add task"]') ||
                 document.querySelector('form input[type="text"]') ||
                 document.querySelector('.task-input') ||
                 document.querySelector('header input') ||
                 document.querySelector('input');
      
      // If found with alternative selector, add the data attribute
      if (inputField) {
        console.log('TaskInputDemo: Found input field with alternative selector', inputField);
        inputField.setAttribute('data-tour-id', 'task-input-field');
        inputRef.current = inputField;
      }
    } else {
      inputRef.current = inputField;
    }
    
    if (!inputField) {
      console.warn('TaskInputDemo: Could not find input field, using fallback position');
      return { x: window.innerWidth / 2, y: 100 };
    }
    
    const rect = inputField.getBoundingClientRect();
    return {
      x: rect.left + Math.min(100, rect.width / 3), // Position cursor near start of input
      y: rect.top + rect.height / 2
    };
  };

  // Get button position
  const getButtonPosition = () => {
    // Try to find the button by data attribute first
    let button = document.querySelector('[data-tour-id="add-task-button"]');
    
    // If not found, try other selectors
    if (!button) {
      console.log('TaskInputDemo: Add button with data-tour-id not found, trying alternatives');
      button = document.querySelector('form button') ||
               document.querySelector('button[type="submit"]') ||
               document.querySelector('header button') ||
               document.querySelector('.add-task-button') ||
               document.querySelector('button');
      
      // If found with alternative selector, add the data attribute
      if (button) {
        console.log('TaskInputDemo: Found button with alternative selector', button);
        button.setAttribute('data-tour-id', 'add-task-button');
      }
    }
    
    if (!button) {
      console.warn('TaskInputDemo: Could not find add button, using fallback position');
      return { x: window.innerWidth / 2 + 150, y: 100 };
    }
    
    // Get exact button position
    const rect = button.getBoundingClientRect();
    console.log('TaskInputDemo: Add button position', { 
      left: rect.left, 
      top: rect.top,
      width: rect.width,
      height: rect.height,
      center: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    });
    
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
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
        cleanupFunctions.current.push(cancelAnimation);
      } else if (onFinish) {
        onFinish();
      }
    };
    
    animate();
  };

  // Direct DOM manipulation to update input field
  const updateInputFieldValue = (text) => {
    const inputField = inputRef.current || 
                     document.querySelector('[data-tour-id="task-input-field"]') || 
                     document.querySelector('input[type="text"][placeholder*="task"]') || 
                     document.querySelector('form input[type="text"]') ||
                     document.querySelector('header input') ||
                     document.querySelector('input');
    
    if (inputField) {
      console.log(`TaskInputDemo: Directly setting input field value to "${text}"`);
      
      // Set value directly on the DOM element
      inputField.value = text;
      
      // Force React to recognize the change
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      ).set;
      
      nativeInputValueSetter.call(inputField, text);
      
      // Dispatch input event to trigger React's onChange
      const inputEvent = new Event('input', { bubbles: true });
      inputField.dispatchEvent(inputEvent);
      
      hasManuallySetInput.current = true;
      
      return true;
    }
    
    console.warn('TaskInputDemo: Failed to update input field value');
    return false;
  };

  // Simulating typing into input field
  const simulateTyping = (text, onComplete) => {
    let currentIndex = 0;
    
    // Focus the input field programmatically
    const inputField = inputRef.current || 
                     document.querySelector('[data-tour-id="task-input-field"]') || 
                     document.querySelector('input[type="text"][placeholder*="task"]') || 
                     document.querySelector('form input[type="text"]');
    
    if (inputField) {
      // Try to set focus
      inputField.focus();
      console.log('TaskInputDemo: Focusing input field');
    }
    
    const typeNextChar = () => {
      if (currentIndex < text.length) {
        const newText = text.substring(0, currentIndex + 1);
        setInputText(newText);
        
        // Update the actual DOM element value directly
        updateInputFieldValue(newText);
        
        currentIndex++;
        
        // Type at varying speeds for realism
        const delay = 50 + Math.random() * 100; 
        const timeout = setTimeout(typeNextChar, delay);
        timeoutRefs.current.push(timeout);
      } else if (onComplete) {
        // Make sure the final text is set
        updateInputFieldValue(text);
        
        const timeout = setTimeout(onComplete, 300);
        timeoutRefs.current.push(timeout);
      }
    };
    
    typeNextChar();
  };

  // Click the Add button
  const clickButton = () => {
    setCursorClicking(true);
    console.log('Clicking Add button');
    
    // Make sure the input has the full text before clicking
    updateInputFieldValue(taskTitle);
    
    // Find the button and try to click it programmatically
    const button = document.querySelector('[data-tour-id="add-task-button"]') ||
                 document.querySelector('form button') ||
                 document.querySelector('button[type="submit"]');
    
    if (button) {
      console.log('TaskInputDemo: Programmatically clicking button', {
        id: button.id,
        type: button.type,
        text: button.textContent,
        rect: button.getBoundingClientRect()
      });
      
      try {
        // Use different approach to simulate a more realistic click
        
        // 1. First trigger a mousedown event
        const mousedownEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        button.dispatchEvent(mousedownEvent);
        
        // 2. Then trigger a mouseup event
        const mouseupEvent = new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        button.dispatchEvent(mouseupEvent);
        
        // 3. Finally simulate the actual click
        button.click();
        
        console.log('TaskInputDemo: Button click events dispatched');
      } catch (err) {
        console.error('TaskInputDemo: Failed to click button', err);
        
        // Fallback to simpler click
        try {
          button.click();
        } catch (e) {
          console.error('TaskInputDemo: Even simple click failed', e);
        }
      }
    } else {
      console.error('TaskInputDemo: Could not find any button to click');
    }
    
    // Show clicking animation then reset
    const timeout = setTimeout(() => {
      setCursorClicking(false);
      
      // Simulate adding the task
      const taskId = 'tour-task-' + Date.now();
      console.log('TaskInputDemo: Created task with ID', taskId);
      
      // Dispatch event to add a task to the demo board
      const addTaskEvent = new CustomEvent('tour:add-task', {
        detail: { 
          task: {
            id: taskId,
            title: taskTitle,
            description: 'Created during tour demonstration',
            tags: ['important', 'tour', 'do'],
            priority: 1,
            status: 'todo',
            quadrant: 'q1', // "Do" quadrant
            dueDate: new Date(Date.now() + 86400000).toISOString(), // tomorrow
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      });
      
      // Log and dispatch the event
      console.log('TaskInputDemo: Dispatching task creation event', addTaskEvent.detail);
      document.dispatchEvent(addTaskEvent);
      
      // Finish the demo with a delay
      const completeTimeout = setTimeout(() => {
        setIsComplete(true);
        
        // Move cursor off screen
        const finalPosition = { x: window.innerWidth + 100, y: window.innerHeight / 2 };
        moveCursor(finalPosition, 800);
      }, 1000);
      
      timeoutRefs.current.push(completeTimeout);
    }, 300);
    
    timeoutRefs.current.push(timeout);
  };

  // Initialize and run the demo
  useEffect(() => {
    // Add a class to the body to make the tour elements more visible
    document.body.classList.add('tour-active');
    
    // Ensure the input field is tagged and prepared
    const prepareElements = () => {
      // Tag the input field
      const input = document.querySelector('input[type="text"][placeholder*="task"]') || 
                  document.querySelector('form input[type="text"]') ||
                  document.querySelector('header input') ||
                  document.querySelector('input');
                  
      if (input) {
        input.setAttribute('data-tour-id', 'task-input-field');
        console.log('TaskInputDemo: Tagged input field with data-tour-id', input);
        inputRef.current = input;
        
        // Make sure placeholder doesn't interfere
        if (input.value === '') {
          input.placeholder = '';
        }
        
        // Clear any existing value
        updateInputFieldValue('');
      }
      
      // Tag the submit button
      const button = document.querySelector('form button') ||
                   document.querySelector('button[type="submit"]') ||
                   document.querySelector('header button') ||
                   document.querySelector('button');
                   
      if (button) {
        button.setAttribute('data-tour-id', 'add-task-button');
        console.log('TaskInputDemo: Tagged button with data-tour-id', button);
      }
      
      return !!input && !!button;
    };
    
    // Sequence defining the steps of the demo
    const runDemo = () => {
      // First prepare the elements
      const elementsReady = prepareElements();
      
      if (!elementsReady) {
        console.log('TaskInputDemo: Elements not ready, retrying in 200ms');
        const retryTimeout = setTimeout(runDemo, 200);
        timeoutRefs.current.push(retryTimeout);
        return;
      }
      
      // Start with cursor off-screen
      setCursorPosition({ x: -50, y: window.innerHeight / 2 });
      
      // Step 1: Move to input field
      const timeout1 = setTimeout(() => {
        const inputPos = getInputPosition();
        console.log('TaskInputDemo: Moving to input position', inputPos);
        
        moveCursor(inputPos, 1000, () => {
          // Step 2: Type in the task title
          const timeout2 = setTimeout(() => {
            console.log('TaskInputDemo: Starting typing animation');
            
            simulateTyping(taskTitle, () => {
              // Step 3: Move to Add button
              const timeout3 = setTimeout(() => {
                const buttonPos = getButtonPosition();
                console.log('TaskInputDemo: Moving to button position', buttonPos);
                
                moveCursor(buttonPos, 800, () => {
                  // Step 4: Click the Add button
                  const timeout4 = setTimeout(() => {
                    clickButton();
                  }, 200);
                  timeoutRefs.current.push(timeout4);
                });
              }, 300);
              timeoutRefs.current.push(timeout3);
            });
          }, 200);
          timeoutRefs.current.push(timeout2);
        });
      }, 500);
      timeoutRefs.current.push(timeout1);
    };

    // Start the demo
    runDemo();

    // Regularly check if we need to forcefully update the input field value
    const inputUpdateInterval = setInterval(() => {
      if (inputText && !hasManuallySetInput.current) {
        updateInputFieldValue(inputText);
      }
    }, 100);
    
    cleanupFunctions.current.push(() => clearInterval(inputUpdateInterval));

    // Cleanup function
    return () => {
      console.log('TaskInputDemo: Cleaning up');
      
      // Clear all timeouts
      timeoutRefs.current.forEach(clearTimeout);
      
      // Run all cleanup functions
      cleanupFunctions.current.forEach(fn => fn());
      
      // Reset input field
      const inputField = inputRef.current || 
                        document.querySelector('[data-tour-id="task-input-field"]') ||
                        document.querySelector('form input[type="text"]');
                        
      if (inputField) {
        updateInputFieldValue('');
      }
      
      // Remove tour-active class from body
      document.body.classList.remove('tour-active');
    };
  }, []);

  return (
    <TourCursor 
      position={cursorPosition}
      visible={cursorVisible}
      clicking={cursorClicking}
    />
  );
};

export default TaskInputDemo;