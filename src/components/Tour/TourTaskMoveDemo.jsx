import React, { useState, useEffect, useRef } from 'react';
import TourCursor from './TourCursor';

/**
 * TourTaskMoveDemo component
 * Simulates drag and drop of a task between quadrants with a visible cursor
 */
const TourTaskMoveDemo = () => {
  // Demo states
  const [step, setStep] = useState(0);
  const [sourceTask, setSourceTask] = useState(null);
  const [sourceQuadrant, setSourceQuadrant] = useState(null);
  const [targetQuadrant, setTargetQuadrant] = useState(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 100, y: 100 });
  const [targetPosition, setTargetPosition] = useState({ x: 100, y: 100 });
  const [showClick, setShowClick] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [draggedTaskElement, setDraggedTaskElement] = useState(null);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [cursorClicking, setCursorClicking] = useState(false);
  const [cursorDragging, setCursorDragging] = useState(false);
  const [doQuadrant, setDoQuadrant] = useState(null);
  const [delegateQuadrant, setDelegateQuadrant] = useState(null);
  
  // Refs for cleanup
  const timeoutRefs = useRef([]);
  const cleanupFunctions = useRef([]);
  
  // Initialize the demo
  useEffect(() => {
    console.log('TourTaskMoveDemo: Initializing...');
    
    // Add debug elements to visualize what we're working with
    const addDebugVisuals = () => {
      // Remove any existing debug elements
      const existingDebug = document.querySelectorAll('.tour-debug-overlay');
      existingDebug.forEach(el => el.remove());
      
      if (!doQuadrant || !delegateQuadrant) return;
      
      // Highlight quadrants
      const highlightQuadrant = (quadrant, color, label) => {
        const rect = quadrant.getBoundingClientRect();
        const overlay = document.createElement('div');
        overlay.className = 'tour-debug-overlay';
        overlay.style.position = 'absolute';
        overlay.style.left = `${rect.left}px`;
        overlay.style.top = `${rect.top}px`;
        overlay.style.width = `${rect.width}px`;
        overlay.style.height = `${rect.height}px`;
        overlay.style.border = `3px dashed ${color}`;
        overlay.style.boxSizing = 'border-box';
        overlay.style.zIndex = '9999';
        overlay.style.pointerEvents = 'none';
        overlay.innerHTML = `<div style="position:absolute;top:0;left:0;background:${color};color:white;padding:4px;font-size:12px;">${label}</div>`;
        document.body.appendChild(overlay);
        return overlay;
      };
      
      // Highlight Do quadrant
      highlightQuadrant(doQuadrant, 'rgba(0, 128, 255, 0.5)', 'Do Quadrant');
      
      // Highlight Delegate quadrant
      highlightQuadrant(delegateQuadrant, 'rgba(255, 128, 0, 0.5)', 'Delegate Quadrant');
      
      // Highlight task cards if found
      const taskCards = doQuadrant.querySelectorAll('.task-card, [data-testid="task-card"], .card, .task, .task-item, [draggable="true"], [data-tour-id="draggable-task"]');
      taskCards.forEach((card, i) => {
        const rect = card.getBoundingClientRect();
        const overlay = document.createElement('div');
        overlay.className = 'tour-debug-overlay';
        overlay.style.position = 'absolute';
        overlay.style.left = `${rect.left}px`;
        overlay.style.top = `${rect.top}px`;
        overlay.style.width = `${rect.width}px`;
        overlay.style.height = `${rect.height}px`;
        overlay.style.border = '2px solid red';
        overlay.style.boxSizing = 'border-box';
        overlay.style.zIndex = '99999';
        overlay.style.pointerEvents = 'none';
        overlay.innerHTML = `<div style="position:absolute;top:0;right:0;background:red;color:white;padding:2px;font-size:10px;">Task ${i}</div>`;
        document.body.appendChild(overlay);
      });
      
      // Add a timer to remove debug overlays after 10 seconds
      const cleanupTimeout = setTimeout(() => {
        const overlays = document.querySelectorAll('.tour-debug-overlay');
        overlays.forEach(el => el.remove());
      }, 10000);
      
      timeoutRefs.current.push(cleanupTimeout);
    };
    
    // Find the quadrants
    const findQuadrants = () => {
      try {
        // Try to find the quadrants by data attributes first
        let doQuadrantEl = document.querySelector('[data-quadrant="q1"], [data-testid="q1"]');
        let delegateQuadrantEl = document.querySelector('[data-quadrant="q2"], [data-testid="q2"]');
        
        // If not found, try alternative selectors
        if (!doQuadrantEl || !delegateQuadrantEl) {
          // Try by class name
          const quadrants = document.querySelectorAll('.quadrant');
          
          // Assuming the first is "Do" and second is "Delegate" based on typical layout
          if (quadrants.length >= 2) {
            doQuadrantEl = quadrants[0];
            delegateQuadrantEl = quadrants[1];
          }
        }
        
        // If still not found, try by text content in headers
        if (!doQuadrantEl || !delegateQuadrantEl) {
          const headers = document.querySelectorAll('h2, h3, .quadrant-header');
          
          for (const header of headers) {
            const text = header.textContent.toLowerCase();
            if (text.includes('do')) {
              doQuadrantEl = header.closest('.quadrant') || header.parentElement;
            } else if (text.includes('delegate')) {
              delegateQuadrantEl = header.closest('.quadrant') || header.parentElement;
            }
          }
        }
        
        if (doQuadrantEl && delegateQuadrantEl) {
          setDoQuadrant(doQuadrantEl);
          setDelegateQuadrant(delegateQuadrantEl);
          console.log('TourTaskMoveDemo: Found quadrants', {
            doQuadrant: !!doQuadrantEl, 
            delegateQuadrant: !!delegateQuadrantEl
          });
          
          // Add visual debugging
          setTimeout(addDebugVisuals, 500);
          
          return true;
        }
        
        console.error('TourTaskMoveDemo: Could not find all required quadrants');
        return false;
      } catch (error) {
        console.error('TourTaskMoveDemo: Error finding quadrants', error);
        return false;
      }
    };
    
    // Add a class to the body to make the tour elements more visible
    document.body.classList.add('tour-active');
    
    // Start at step 0 explicitly 
    setStep(0);
    
    // Find the source "Do" quadrant - try different selectors
    const doQuadrant = document.querySelector('[data-tour-id="urgent-important-quadrant"]') || 
                     document.querySelector('.quadrant-1') ||
                     document.querySelector('[data-quadrant="q1"]') ||
                     document.querySelector('[data-testid="quadrant-1"]') ||
                     document.querySelectorAll('.quadrant')[0]; // First quadrant (top-left)
    
    // Find the target "Delegate" quadrant - try different selectors
    const delegateQuadrant = document.querySelector('[data-tour-id="urgent-not-important-quadrant"]') || 
                           document.querySelector('.quadrant-2') ||
                           document.querySelector('[data-quadrant="q2"]') ||
                           document.querySelector('[data-testid="quadrant-2"]') ||
                           document.querySelectorAll('.quadrant')[1]; // Second quadrant (top-right)
    
    if (!doQuadrant || !delegateQuadrant) {
      console.error('TourTaskMoveDemo: Could not find required quadrants');
      
      // Last ditch attempt - just get any quadrants by position
      const quadrants = document.querySelectorAll('.matrix-grid > div, .matrix > div, .board > div');
      console.log('TourTaskMoveDemo: Found possible quadrants:', quadrants.length);
      
      if (quadrants.length >= 4) {
        // Assume the first is "Do" and the second is "Delegate"
        const fallbackDoQuadrant = quadrants[0];
        const fallbackDelegateQuadrant = quadrants[1];
        
        console.log('TourTaskMoveDemo: Using fallback quadrants');
        
        // Set the quadrants
        setSourceQuadrant({
          element: fallbackDoQuadrant,
          rect: fallbackDoQuadrant.getBoundingClientRect()
        });
        
        setTargetQuadrant({
          element: fallbackDelegateQuadrant,
          rect: fallbackDelegateQuadrant.getBoundingClientRect()
        });
        
        // Continue with the setup
        if (setupSourceTask()) {
          console.log('TourTaskMoveDemo: Task setup complete with fallback quadrants');
          startDemoSequence();
        }
        
        return;
      }
      
      return;
    }
    
    console.log('TourTaskMoveDemo: Found quadrants', {
      doQuadrant: !!doQuadrant,
      delegateQuadrant: !!delegateQuadrant
    });
    
    // Add data-tour-id attributes if they're missing
    if (!doQuadrant.hasAttribute('data-tour-id')) {
      doQuadrant.setAttribute('data-tour-id', 'urgent-important-quadrant');
    }
    
    if (!delegateQuadrant.hasAttribute('data-tour-id')) {
      delegateQuadrant.setAttribute('data-tour-id', 'urgent-not-important-quadrant');
    }
    
    // Add highlight classes to the quadrants
    doQuadrant.classList.add('tour-source-highlight');
    delegateQuadrant.classList.add('tour-target-highlight');
    
    // Store quadrant information
    setSourceQuadrant({
      element: doQuadrant,
      rect: doQuadrant.getBoundingClientRect()
    });
    
    setTargetQuadrant({
      element: delegateQuadrant,
      rect: delegateQuadrant.getBoundingClientRect()
    });
    
    // Function to find or create a task in the source quadrant
    const setupSourceTask = () => {
      console.log('TourTaskMoveDemo: Searching for tasks in the Do quadrant');
      
      // First, try to find actual task cards with specific selectors
      let tasks = Array.from(doQuadrant.querySelectorAll('.task-card, [data-testid="task-card"], .card, .task, .task-item, [draggable="true"]'));
      
      // Additional selectors with direct children of the quadrant that could be task cards
      if (tasks.length === 0) {
        // Try another approach - look for elements with specific characteristics
        const allElements = Array.from(doQuadrant.querySelectorAll('*'));
        
        // Filter elements that are likely task cards based on their CSS properties and dimensions
        tasks = allElements.filter(el => {
          if (!el || el === doQuadrant) return false;
          
          // Skip very large elements and containers
          if (el.children && el.children.length > 5) return false;
          
          // Get computed styles
          const styles = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          const doRect = doQuadrant.getBoundingClientRect();
          
          // Skip elements with positions that make them unlikely to be cards
          if (styles.position === 'static' && styles.display === 'inline') return false;
          
          // Skip tiny or huge elements
          if (rect.width < 80 || rect.height < 40) return false;
          if (rect.width > doRect.width * 0.9 || rect.height > doRect.height * 0.8) return false;
          
          // Look for card-like styling (border, background, padding)
          const hasBorder = styles.border !== 'none' || styles.borderRadius !== '0px';
          const hasBackground = styles.backgroundColor !== 'rgba(0, 0, 0, 0)' && styles.backgroundColor !== 'transparent';
          const hasPadding = parseInt(styles.padding) > 0 || parseInt(styles.paddingTop) > 0;
          const hasShadow = styles.boxShadow !== 'none';
          
          // Check if element has text content that would be in a task card
          const hasTextContent = el.textContent && el.textContent.trim().length > 0;
          
          // Elements that look like cards would typically have some combination of these properties
          return (hasBackground || hasBorder || hasShadow) && (hasPadding || hasTextContent);
        });
      }
      
      console.log('TourTaskMoveDemo: Found tasks in Do quadrant:', tasks.length);
      
      if (tasks.length > 0) {
        // Use the first task
        const task = tasks[0];
        
        // Add a data attribute to mark this as our draggable task
        task.setAttribute('data-tour-id', 'draggable-task');
        
        // Make sure it's draggable
        task.setAttribute('draggable', 'true');
        
        const taskRect = task.getBoundingClientRect();
        
        setSourceTask({
          element: task,
          rect: taskRect,
          id: task.id?.replace('task-', '') || 'tour-task'
        });
        
        // Position cursor off-screen initially (left side)
        const initialCursorPosition = {
          x: -50,
          y: Math.max(window.innerHeight / 2, taskRect.top)
        };
        
        setCursorPosition(initialCursorPosition);
        return true;
      } else {
        console.log('TourTaskMoveDemo: No tasks found in Do quadrant. Finding alternatives...');
        
        // Try to find any task cards anywhere in the document
        const allTaskCards = Array.from(document.querySelectorAll('.task-card, [data-testid="task-card"], .card, .task'));
        
        if (allTaskCards.length > 0) {
          // Find a card that's within the Do quadrant bounds
          const doRect = doQuadrant.getBoundingClientRect();
          const tasksInDoQuadrant = allTaskCards.filter(card => {
            const cardRect = card.getBoundingClientRect();
            const cardCenterX = cardRect.left + cardRect.width / 2;
            const cardCenterY = cardRect.top + cardRect.height / 2;
            
            return (
              cardCenterX >= doRect.left &&
              cardCenterX <= doRect.right &&
              cardCenterY >= doRect.top &&
              cardCenterY <= doRect.bottom
            );
          });
          
          if (tasksInDoQuadrant.length > 0) {
            const task = tasksInDoQuadrant[0];
            task.setAttribute('data-tour-id', 'draggable-task');
            
            const taskRect = task.getBoundingClientRect();
            logElementDetails(task, 'Selected task in Do quadrant');
            
            setSourceTask({
              element: task,
              rect: taskRect,
              id: task.id?.replace('task-', '') || 'tour-task-' + Date.now()
            });
            
            const initialCursorPosition = {
              x: -50,
              y: Math.max(window.innerHeight / 2, taskRect.top)
            };
            
            setCursorPosition(initialCursorPosition);
            return true;
          }
        }
        
        // As a last resort, try to find a draggable element within the quadrant
        const draggableElements = Array.from(doQuadrant.querySelectorAll('[draggable="true"], [data-draggable="true"]'));
        
        if (draggableElements.length > 0) {
          const draggableElement = draggableElements[0];
          
          draggableElement.setAttribute('data-tour-id', 'draggable-task');
          
          const taskRect = draggableElement.getBoundingClientRect();
          
          setSourceTask({
            element: draggableElement,
            rect: taskRect,
            id: draggableElement.id || 'tour-task-' + Date.now()
          });
          
          const initialCursorPosition = {
            x: -50,
            y: Math.max(window.innerHeight / 2, taskRect.top)
          };
          
          setCursorPosition(initialCursorPosition);
          return true;
        }
        
        // Find child elements that look like cards
        const cardLikeElements = Array.from(doQuadrant.querySelectorAll('div > div'));
        
        // Filter to only include elements with reasonable card dimensions
        const potentialTasks = cardLikeElements.filter(el => {
          const rect = el.getBoundingClientRect();
          // Exclude the quadrant itself and very large elements
          const doRect = doQuadrant.getBoundingClientRect();
          const isTooLarge = (
            rect.width > doRect.width * 0.8 && 
            rect.height > doRect.height * 0.8
          );
          
          // A task card should be reasonable dimensions
          const isReasonableSize = (
            rect.width > 100 && rect.width < 300 &&
            rect.height > 50 && rect.height < 200 &&
            !isTooLarge
          );
          
          return isReasonableSize;
        });
        
        console.log('TourTaskMoveDemo: Found potential card-like elements:', potentialTasks.length);
        
        // Debug: log first task details
        if (potentialTasks.length > 0) {
          logElementDetails(potentialTasks[0], `Potential card`);
        }
        
        if (potentialTasks.length > 0) {
          const taskElement = potentialTasks[0];
          taskElement.setAttribute('data-tour-id', 'draggable-task');
          
          const taskRect = taskElement.getBoundingClientRect();
          
          setSourceTask({
            element: taskElement,
            rect: taskRect,
            id: 'tour-task-' + Date.now()
          });
          
          console.log('TourTaskMoveDemo: Using a card-like element as task', {
            width: Math.round(taskRect.width),
            height: Math.round(taskRect.height),
            position: { x: Math.round(taskRect.left), y: Math.round(taskRect.top) }
          });
          
          // Position cursor off-screen initially
          const initialCursorPosition = {
            x: -50,
            y: Math.max(window.innerHeight / 2, taskRect.top)
          };
          
          setCursorPosition(initialCursorPosition);
          return true;
        }
        
        // Fall back to creating a mock task as last resort
        console.log('TourTaskMoveDemo: Creating fallback mock task');
        
        // Since this is extremely rare (since the demo board should populate tasks),
        // we'll create a mock position for the demo
        const doQuadrantRect = doQuadrant.getBoundingClientRect();
        
        // Create task in the upper area of the Do quadrant
        const mockTaskRect = {
          left: doQuadrantRect.left + doQuadrantRect.width * 0.25,
          top: doQuadrantRect.top + doQuadrantRect.height * 0.25,
          width: 180,
          height: 100,
          right: doQuadrantRect.left + doQuadrantRect.width * 0.25 + 180,
          bottom: doQuadrantRect.top + doQuadrantRect.height * 0.25 + 100
        };
        
        // Create a placeholder element
        const placeholderTask = document.createElement('div');
        placeholderTask.id = 'tour-mock-task';
        placeholderTask.className = 'task-card';
        placeholderTask.setAttribute('data-tour-id', 'draggable-task');
        placeholderTask.style.position = 'absolute';
        placeholderTask.style.left = `${mockTaskRect.left}px`;
        placeholderTask.style.top = `${mockTaskRect.top}px`;
        placeholderTask.style.width = `${mockTaskRect.width}px`;
        placeholderTask.style.height = `${mockTaskRect.height}px`;
        placeholderTask.style.backgroundColor = '#ffffff';
        placeholderTask.style.border = '1px solid #e5e7eb';
        placeholderTask.style.borderRadius = '8px';
        placeholderTask.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        placeholderTask.style.zIndex = '55';
        placeholderTask.style.pointerEvents = 'none';
        placeholderTask.innerHTML = `
          <div style="padding: 16px;">
            <div style="font-weight: bold; margin-bottom: 8px;">Demo Task</div>
            <div style="color: #6b7280;">For tour demonstration</div>
          </div>
        `;
        
        document.body.appendChild(placeholderTask);
        
        setSourceTask({
          element: placeholderTask,
          rect: mockTaskRect,
          id: 'tour-mock-task'
        });
        
        // Position cursor off-screen initially
        const initialCursorPosition = {
          x: -50,
          y: Math.max(window.innerHeight / 2, mockTaskRect.top)
        };
        
        setCursorPosition(initialCursorPosition);
        return true;
      }
    };
    
    // Function to start the demo sequence
    const startDemoSequence = () => {
      console.log('TourTaskMoveDemo: Starting demo sequence');
      
      if (!sourceTask || !sourceTask.element || !delegateQuadrant) {
        console.error('TourTaskMoveDemo: Cannot start demo, missing elements', {
          hasSourceTask: !!sourceTask,
          hasElement: sourceTask ? !!sourceTask.element : false,
          hasDelegateQuadrant: !!delegateQuadrant
        });
        
        // Try a last-resort approach - find elements directly 
        const taskElement = document.querySelector('[data-tour-id="draggable-task"]');
        if (taskElement && delegateQuadrant) {
          console.log('TourTaskMoveDemo: Found task element directly, proceeding with demo');
          runRealDragAndDrop(taskElement, delegateQuadrant);
          return;
        }
        
        return;
      }
      
      // Also dispatch a custom event to notify the app that we're starting a drag operation
      const dragStartEvent = new CustomEvent('tour:start-drag', {
        detail: {
          taskId: sourceTask.id,
          element: sourceTask.element,
          fromQuadrant: 'q1', // "Do" quadrant
          toQuadrant: 'q2' // "Delegate" quadrant
        },
        bubbles: true
      });
      document.dispatchEvent(dragStartEvent);
      
      // Run the drag and drop simulation
      runRealDragAndDrop(sourceTask.element, delegateQuadrant);
    };
    
    // Start the setup
    if (setupSourceTask()) {
      // If a task was found immediately, start the demo sequence after a short delay
      // to ensure React state updates have completed
      console.log('TourTaskMoveDemo: Task setup complete, scheduling demo sequence');
      
      // Use setTimeout to ensure state updates have propagated
      const startTimeout = setTimeout(() => {
        // Double check that we have all required elements before starting
        if (sourceTask && sourceQuadrant && targetQuadrant) {
          console.log('TourTaskMoveDemo: Starting demo sequence with:', { 
            sourceTask: !!sourceTask, 
            sourceQuadrant: !!sourceQuadrant, 
            targetQuadrant: !!targetQuadrant 
          });
          startDemoSequence();
        } else {
          console.log('TourTaskMoveDemo: Still missing required elements, using fallback approach');
          
          // Use values directly instead of waiting for state
          const taskElement = document.querySelector('[data-tour-id="draggable-task"]');
          const doQuadrantElement = document.querySelector('[data-tour-id="urgent-important-quadrant"]');
          const delegateQuadrantElement = document.querySelector('[data-tour-id="urgent-not-important-quadrant"]');
          
          if (taskElement && doQuadrantElement && delegateQuadrantElement) {
            // Create temporary objects for the demo sequence
            const tempSourceTask = {
              element: taskElement,
              rect: taskElement.getBoundingClientRect(),
              id: taskElement.id?.replace('task-', '') || 'tour-task'
            };
            
            const tempSourceQuadrant = {
              element: doQuadrantElement,
              rect: doQuadrantElement.getBoundingClientRect()
            };
            
            const tempTargetQuadrant = {
              element: delegateQuadrantElement,
              rect: delegateQuadrantElement.getBoundingClientRect()
            };
            
            // Manually run the demo sequence
            console.log('TourTaskMoveDemo: Running demo with direct DOM elements');
            
            // First set the state variables
            setSourceTask(tempSourceTask);
            setSourceQuadrant(tempSourceQuadrant);
            setTargetQuadrant(tempTargetQuadrant);
            
            // Then wait a bit and start the sequence
            setTimeout(() => {
              startDemoSequence();
            }, 500);
          } else {
            console.error('TourTaskMoveDemo: Could not start demo, missing elements even with fallback');
          }
        }
      }, 500); // Wait half a second for React to update state
      
      timeoutRefs.current.push(startTimeout);
    }
    
    // Cleanup function
    return () => {
      console.log('TourTaskMoveDemo: Cleaning up');
      
      // Clear all timeouts
      timeoutRefs.current.forEach(clearTimeout);
      
      // Run all cleanup functions
      cleanupFunctions.current.forEach(fn => fn());
      
      // Remove any cloned elements
      const clonedElement = document.getElementById('tour-dragged-task');
      if (clonedElement) {
        clonedElement.remove();
      }
      
      // Remove mock task if created
      const mockTask = document.getElementById('tour-mock-task');
      if (mockTask) {
        mockTask.remove();
      }
      
      // Reset any original elements
      if (sourceTask && sourceTask.element) {
        sourceTask.element.style.opacity = '1';
        sourceTask.element.style.visibility = 'visible';
        sourceTask.element.removeAttribute('data-tour-id');
      }
      
      // Reset quadrant styles
      if (sourceQuadrant && sourceQuadrant.element) {
        sourceQuadrant.element.style.backgroundColor = '';
        sourceQuadrant.element.style.boxShadow = '';
        sourceQuadrant.element.classList.remove('tour-source-highlight');
      }
      
      if (targetQuadrant && targetQuadrant.element) {
        targetQuadrant.element.style.backgroundColor = '';
        targetQuadrant.element.style.boxShadow = '';
        targetQuadrant.element.classList.remove('tour-target-highlight');
      }
      
      // Remove tour-active class from body
      document.body.classList.remove('tour-active');
    };
  }, []);
  
  // Function to create a visual element for dragging
  const createDraggedElement = () => {
    if (!sourceTask || !sourceTask.element) {
      console.error('TourTaskMoveDemo: No source task available to create dragged element');
      return;
    }
    
    console.log('TourTaskMoveDemo: Creating dragged task visual');
    
    // Create a clone of the source task
    const original = sourceTask.element;
    const rect = original.getBoundingClientRect();
    
    // Hide the original (make it semi-transparent)
    original.style.opacity = '0.6';
    
    // Create a clone for dragging
    const clone = document.createElement('div');
    clone.id = 'tour-dragged-task';
    clone.style.position = 'fixed';
    clone.style.left = `${rect.left}px`;
    clone.style.top = `${rect.top}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.backgroundColor = '#ffffff';
    clone.style.borderRadius = '8px';
    clone.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
    clone.style.zIndex = '99998';
    clone.style.pointerEvents = 'none';
    clone.style.transform = 'rotate(3deg)';
    clone.style.transition = 'box-shadow 0.2s ease-out, transform 0.2s ease-out';
    clone.className = 'task-card tour-dragged-task';
    
    // Copy the inner HTML from the original
    clone.innerHTML = original.innerHTML;
    
    // Append to the body
    document.body.appendChild(clone);
    
    // Store the dragged element reference
    setDraggedTaskElement(clone);
  };
  
  // Handle step transitions
  useEffect(() => {
    if (!sourceTask || !sourceQuadrant || !targetQuadrant) return;
    
    // Clear previous timeouts
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
    
    console.log('TourTaskMoveDemo: Running step', step);
    
    // Step 0: Initial setup
    if (step === 0) {
      // Automatically progress to step 1 after a short delay
      const timeout = setTimeout(() => {
        console.log('TourTaskMoveDemo: Initializing animation sequence');
        setStep(1);
      }, 300);
      timeoutRefs.current.push(timeout);
    }
    
    // Step 1: Move cursor to the task
    else if (step === 1) {
      // Position at the center of the task
      const taskCenter = {
        x: sourceTask.rect.left + sourceTask.rect.width / 2,
        y: sourceTask.rect.top + sourceTask.rect.height / 2
      };
      
      console.log('TourTaskMoveDemo: Moving cursor to task', taskCenter);
      
      // Highlight source quadrant
      sourceQuadrant.element.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
      sourceQuadrant.element.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.3) inset';
      sourceQuadrant.element.style.transition = 'all 0.5s ease';
      
      // Move the cursor directly to the task with explicit callback
      const moveTimeout = setTimeout(() => {
        moveCursor(cursorPosition, taskCenter, 1000, () => {
          console.log('TourTaskMoveDemo: Cursor reached task position, moving to step 2');
          
          // Force move to next step after animation completes
          const nextStepTimeout = setTimeout(() => {
            setStep(2);
          }, 200);
          timeoutRefs.current.push(nextStepTimeout);
        });
      }, 300);
      
      timeoutRefs.current.push(moveTimeout);
    }
    
    // Step 2: Click on the task to start dragging
    else if (step === 2) {
      setShowClick(true);
      
      // Create the dragged task clone
      const clonedTask = createDraggedElement();
      setDraggedTaskElement(clonedTask);
      
      // Highlight target quadrant
      targetQuadrant.element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
      targetQuadrant.element.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5) inset';
      targetQuadrant.element.style.transition = 'all 0.5s ease';
      
      const timeout = setTimeout(() => {
        setShowClick(false);
        setStep(3); // Move to next step: dragging to target quadrant
      }, 500);
      
      timeoutRefs.current.push(timeout);
    }
    
    // Step 3: Drag the task to the target quadrant
    else if (step === 3) {
      // Calculate position in target quadrant (centered)
      const targetCenter = {
        x: targetQuadrant.rect.left + targetQuadrant.rect.width / 2,
        y: targetQuadrant.rect.top + targetQuadrant.rect.height / 2
      };
      
      console.log('TourTaskMoveDemo: Dragging to target quadrant', targetCenter);
      setTargetPosition(targetCenter);
      
      // Update the dragged task position to follow cursor with slight offset
      if (draggedTaskElement) {
        // This function updates the dragged task position to follow the cursor
        const updateDraggedTaskPosition = (cursorX, cursorY) => {
          if (draggedTaskElement) {
            const offsetX = sourceTask.rect.width / 2;
            const offsetY = sourceTask.rect.height / 2;
            
            draggedTaskElement.style.left = `${cursorX - offsetX}px`;
            draggedTaskElement.style.top = `${cursorY - offsetY}px`;
          }
        };
        
        // Start position (use current cursor position)
        updateDraggedTaskPosition(
          cursorPosition.x, 
          cursorPosition.y
        );
        
        // Listen for cursor position updates
        const handleCursorUpdate = (e) => {
          if (e.detail && e.detail.position) {
            updateDraggedTaskPosition(
              e.detail.position.x, 
              e.detail.position.y
            );
          }
        };
        
        // Add custom event listener for cursor position updates
        document.addEventListener('tour:cursor-position', handleCursorUpdate);
        
        // Add to cleanup functions
        cleanupFunctions.current.push(() => {
          document.removeEventListener('tour:cursor-position', handleCursorUpdate);
        });
      }
      
      const timeout = setTimeout(() => {
        setStep(4); // Move to next step: dropping in target quadrant
      }, 1500);
      
      timeoutRefs.current.push(timeout);
    }
    
    // Step 4: Release the task (click to drop)
    else if (step === 4) {
      setShowClick(true);
      
      const timeout1 = setTimeout(() => {
        setShowClick(false);
        
        // Remove dragged clone
        if (draggedTaskElement) {
          draggedTaskElement.style.opacity = '0';
          draggedTaskElement.style.transition = 'opacity 0.3s ease';
          
          const timeout = setTimeout(() => {
            draggedTaskElement.remove();
          }, 300);
          
          timeoutRefs.current.push(timeout);
        }
        
        // Show original task in target quadrant with animation
        if (sourceTask && sourceTask.element) {
          const taskElement = sourceTask.element;
          
          // Create a 'moved' event
          const movedEvent = new CustomEvent('tour:move-task', {
            detail: {
              taskId: sourceTask.id,
              targetQuadrant: 'q2' // "Delegate" quadrant
            }
          });
          
          console.log('TourTaskMoveDemo: Dispatching move-task event', movedEvent.detail);
          
          // Also dispatch the event as update-task-quadrant for compatibility
          const updateEvent = new CustomEvent('tour:update-task-quadrant', {
            detail: {
              taskId: sourceTask.id,
              targetQuadrant: 'q2' // "Delegate" quadrant
            }
          });
          
          document.dispatchEvent(movedEvent);
          document.dispatchEvent(updateEvent);
          
          // Show original again
          const timeout = setTimeout(() => {
            taskElement.style.opacity = '1';
            taskElement.style.visibility = 'visible';
            
            // Reset quadrant highlights
            sourceQuadrant.element.style.backgroundColor = '';
            sourceQuadrant.element.style.boxShadow = '';
            
            targetQuadrant.element.style.backgroundColor = '';
            targetQuadrant.element.style.boxShadow = '';
          }, 500);
          
          timeoutRefs.current.push(timeout);
        }
        
        setStep(5); // Complete the demo
      }, 500);
      
      timeoutRefs.current.push(timeout1);
    }
    
    // Step 5: Complete the demo
    else if (step === 5) {
      const timeout = setTimeout(() => {
        setIsComplete(true);
      }, 1000);
      
      timeoutRefs.current.push(timeout);
    }
  }, [step, sourceTask, sourceQuadrant, targetQuadrant, cursorPosition, draggedTaskElement]);
  
  // Set up cursor position event dispatch
  useEffect(() => {
    // Dispatch cursor position for other components to use
    const event = new CustomEvent('tour:cursor-position', {
      detail: { position: cursorPosition }
    });
    
    document.dispatchEvent(event);
  }, [cursorPosition]);
  
  // Function to simulate cursor movement with animation
  const moveCursor = (fromPos, toPos, duration = 1000, onFinish = null) => {
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    console.log('TourTaskMoveDemo: Starting cursor movement', {
      from: fromPos,
      to: toPos,
      duration,
      hasCallback: !!onFinish
    });
    
    // Animation function using requestAnimationFrame
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      
      // Cubic ease out for more natural movement
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const newX = fromPos.x + (toPos.x - fromPos.x) * easeProgress;
      const newY = fromPos.y + (toPos.y - fromPos.y) * easeProgress;
      
      setCursorPosition({ x: newX, y: newY });
      
      if (progress < 1) {
        const animFrame = requestAnimationFrame(animate);
        const cancelAnimation = () => cancelAnimationFrame(animFrame);
        cleanupFunctions.current.push(cancelAnimation);
      } else {
        console.log('TourTaskMoveDemo: Cursor movement complete', { 
          finalPosition: { x: newX, y: newY } 
        });
        
        if (onFinish) {
          console.log('TourTaskMoveDemo: Calling onFinish callback');
          // Add a small delay to ensure the UI updates before the next step
          setTimeout(() => {
            onFinish();
          }, 50);
        }
      }
    };
    
    // Start the animation
    animate();
  };
  
  // Add a utility function to help analyze DOM elements
  const logElementDetails = (element, label) => {
    if (!element) {
      console.error(`TourTaskMoveDemo: ${label} element is null`);
      return;
    }
    
    const rect = element.getBoundingClientRect();
    const classes = Array.from(element.classList || []).join(', ');
    const id = element.id;
    const tagName = element.tagName;
    const childCount = element.children.length;
    const dimensions = `${Math.round(rect.width)}x${Math.round(rect.height)}`;
    
    console.log(`TourTaskMoveDemo: ${label} details:`, {
      tagName,
      id,
      classes,
      dimensions,
      childCount,
      position: { x: Math.round(rect.left), y: Math.round(rect.top) }
    });
  };
  
  // Function to simulate DOM events for real drag and drop
  const simulateMouseEvent = (element, eventType, options = {}) => {
    if (!element) {
      console.error(`TourTaskMoveDemo: Cannot simulate ${eventType} on null element`);
      return false;
    }
    
    // Get element position
    const rect = element.getBoundingClientRect();
    
    // Default options
    const defaultOptions = {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
      button: 0,
      buttons: 1,
      ...options
    };
    
    try {
      // Create the event
      const event = new MouseEvent(eventType, defaultOptions);
      
      // Add dataTransfer for drag events
      if (eventType.startsWith('drag')) {
        Object.defineProperty(event, 'dataTransfer', {
          value: new DataTransfer(),
          writable: false
        });
      }
      
      // Dispatch the event
      const dispatched = element.dispatchEvent(event);
      
      return dispatched;
    } catch (error) {
      console.error(`TourTaskMoveDemo: Error simulating ${eventType}:`, error);
      return false;
    }
  };
  
  // Function to run real drag and drop simulation
  const runRealDragAndDrop = async (sourceElement, targetElement) => {
    if (!sourceElement || !targetElement) {
      console.error('TourTaskMoveDemo: Missing elements for real drag and drop');
      return false;
    }
    
    // Add visual indicator of the source and target elements
    const highlightElement = (element, color, label) => {
      if (!element) return null;
      
      const rect = element.getBoundingClientRect();
      const overlay = document.createElement('div');
      overlay.className = 'tour-debug-highlight';
      overlay.style.position = 'absolute';
      overlay.style.left = `${rect.left}px`;
      overlay.style.top = `${rect.top}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      overlay.style.border = `3px solid ${color}`;
      overlay.style.backgroundColor = `${color}22`;
      overlay.style.boxSizing = 'border-box';
      overlay.style.zIndex = '99999';
      overlay.style.pointerEvents = 'none';
      overlay.innerHTML = `<div style="position:absolute;top:0;left:0;background:${color};color:white;padding:4px;font-size:12px;">${label}</div>`;
      document.body.appendChild(overlay);
      
      return overlay;
    };
    
    // Highlight the source and target elements
    const sourceHighlight = highlightElement(sourceElement, '#ff0000', 'Source Task');
    const targetHighlight = highlightElement(targetElement, '#00ff00', 'Target Quadrant');
    
    // Clean up highlights when done
    const cleanupHighlights = () => {
      if (sourceHighlight) sourceHighlight.remove();
      if (targetHighlight) targetHighlight.remove();
      document.querySelectorAll('.tour-debug-highlight').forEach(el => el.remove());
    };
    
    // Register cleanup
    timeoutRefs.current.push(setTimeout(cleanupHighlights, 10000));
    
    // Ensure the task element is properly tagged for drag & drop
    sourceElement.setAttribute('draggable', 'true');
    
    // Get positions
    const sourceRect = sourceElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    
    // Source center
    const sourceX = sourceRect.left + sourceRect.width / 2;
    const sourceY = sourceRect.top + sourceRect.height / 2;
    
    // Target center
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;
    
    // Create a task ID if the source task doesn't have one
    const taskId = sourceElement.id || ('tour-task-' + Date.now());
    
    // Make the element listen for drag events
    const handleDragStart = (e) => {
      console.log('Element received dragstart event');
      if (e.dataTransfer) {
        e.dataTransfer.setData('text/plain', 'task-being-dragged');
        e.dataTransfer.effectAllowed = 'move';
      }
    };
    
    // Add listener for real drag events
    sourceElement.addEventListener('dragstart', handleDragStart);
    
    // Dispatch real click event to the element
    const dispatchRealClick = (element, options = {}) => {
      if (!element) return false;
      
      try {
        element.dispatchEvent(new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          view: window,
          ...options
        }));
        
        element.dispatchEvent(new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          view: window,
          ...options
        }));
        
        element.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
          ...options
        }));
        
        return true;
      } catch (e) {
        console.error('Error dispatching real click:', e);
        return false;
      }
    };
    
    // Timeline for the demo sequence
    const timeline = [
      // Move cursor to the task
      () => {
        const timeout = setTimeout(() => {
          console.log('TourTaskMoveDemo: Moving cursor to task');
          moveCursor({ x: sourceX, y: sourceY }, 1000, timeline[1]);
        }, 500);
        timeoutRefs.current.push(timeout);
      },
      
      // Click on the task to grab it (mousedown)
      () => {
        const timeout = setTimeout(() => {
          console.log('TourTaskMoveDemo: Clicking on task (mousedown)');
          setCursorClicking(true);
          
          const clickTimeout = setTimeout(() => {
            setCursorClicking(false);
            setCursorDragging(true);
            
            // Try real click first
            dispatchRealClick(sourceElement, {
              clientX: sourceX,
              clientY: sourceY
            });
            
            // Try direct DOM events
            try {
              // Simulate mousedown
              simulateMouseEvent(sourceElement, 'mousedown', {
                clientX: sourceX,
                clientY: sourceY
              });
              
              // Simulate dragstart
              simulateMouseEvent(sourceElement, 'dragstart', {
                clientX: sourceX,
                clientY: sourceY
              });
            } catch (e) {
              console.error('TourTaskMoveDemo: Error simulating drag start:', e);
            }
            
            // As a fallback, also dispatch a custom event for our app to handle
            try {
              const dragStartEvent = new CustomEvent('tour:drag-start', {
                detail: {
                  taskId: taskId,
                  element: sourceElement,
                  position: { x: sourceX, y: sourceY }
                },
                bubbles: true
              });
              document.dispatchEvent(dragStartEvent);
            } catch (e) {
              console.error('TourTaskMoveDemo: Error dispatching custom drag start event:', e);
            }
            
            const nextTimeout = setTimeout(timeline[2], 500);
            timeoutRefs.current.push(nextTimeout);
          }, 300);
          
          timeoutRefs.current.push(clickTimeout);
        }, 200);
        timeoutRefs.current.push(timeout);
      },
      
      // Drag the task to the target quadrant
      () => {
        const timeout = setTimeout(() => {
          console.log('TourTaskMoveDemo: Dragging task to target');
          
          // Generate intermediate points for drag
          const steps = 10;
          const dragPath = [];
          
          for (let i = 0; i <= steps; i++) {
            const progress = i / steps;
            const x = sourceX + (targetX - sourceX) * progress;
            const y = sourceY + (targetY - sourceY) * progress;
            dragPath.push({ x, y });
          }
          
          // Function to process drag path
          const processDragPath = (index) => {
            if (index >= dragPath.length) {
              timeline[3]();
              return;
            }
            
            const point = dragPath[index];
            
            // Move cursor
            setCursorPosition(point);
            
            // Simulate drag events
            if (index > 0 && index < dragPath.length - 1) {
              try {
                simulateMouseEvent(sourceElement, 'drag', {
                  clientX: point.x,
                  clientY: point.y
                });
                
                // Send mousemove events to document
                simulateMouseEvent(document.documentElement, 'mousemove', {
                  clientX: point.x,
                  clientY: point.y
                });
                
                // Add dragover on target when close
                if (index > dragPath.length / 2) {
                  simulateMouseEvent(targetElement, 'dragover', {
                    clientX: point.x,
                    clientY: point.y
                  });
                  
                  // Also dispatch custom event for dragging
                  const dragMoveEvent = new CustomEvent('tour:drag-move', {
                    detail: {
                      taskId: taskId,
                      element: sourceElement,
                      position: point,
                      overTarget: true,
                      targetQuadrant: 'q2' // Delegate quadrant
                    },
                    bubbles: true
                  });
                  document.dispatchEvent(dragMoveEvent);
                }
              } catch (e) {
                console.error('TourTaskMoveDemo: Error during drag:', e);
              }
            }
            
            // Process next point after delay
            const pointDelay = 1500 / dragPath.length;
            const nextTimeout = setTimeout(() => {
              processDragPath(index + 1);
            }, pointDelay);
            
            timeoutRefs.current.push(nextTimeout);
          };
          
          // Start drag path
          processDragPath(0);
        }, 200);
        timeoutRefs.current.push(timeout);
      },
      
      // Release the task in the target quadrant
      () => {
        const timeout = setTimeout(() => {
          console.log('TourTaskMoveDemo: Releasing task in target');
          setCursorClicking(true);
          
          const clickTimeout = setTimeout(() => {
            setCursorClicking(false);
            setCursorDragging(false);
            
            try {
              // Simulate drop events
              simulateMouseEvent(targetElement, 'dragenter', {
                clientX: targetX,
                clientY: targetY
              });
              
              simulateMouseEvent(targetElement, 'drop', {
                clientX: targetX,
                clientY: targetY
              });
              
              simulateMouseEvent(sourceElement, 'dragend', {
                clientX: targetX,
                clientY: targetY
              });
              
              simulateMouseEvent(sourceElement, 'mouseup', {
                clientX: targetX,
                clientY: targetY
              });
            } catch (e) {
              console.error('TourTaskMoveDemo: Error simulating drop:', e);
            }
            
            // Dispatch a custom event for our app to handle
            const dropEvent = new CustomEvent('tour:drop', {
              detail: {
                taskId: taskId,
                element: sourceElement,
                position: { x: targetX, y: targetY },
                targetQuadrant: 'q2', // Delegate quadrant
                fromQuadrant: 'q1' // Do quadrant
              },
              bubbles: true
            });
            document.dispatchEvent(dropEvent);
            
            // Also dispatch a move-task event as fallback
            const moveEvent = new CustomEvent('tour:move-task', {
              detail: {
                taskId: taskId,
                fromQuadrant: 'q1', // "Do" quadrant
                toQuadrant: 'q2' // "Delegate" quadrant
              }
            });
            
            document.dispatchEvent(moveEvent);
            
            // Continue to next step in timeline
            const nextTimeout = setTimeout(timeline[4], 1000);
            timeoutRefs.current.push(nextTimeout);
          }, 300);
          
          timeoutRefs.current.push(clickTimeout);
        }, 200);
        timeoutRefs.current.push(timeout);
      },
      
      // Move cursor away (demo complete)
      () => {
        const timeout = setTimeout(() => {
          console.log('TourTaskMoveDemo: Demo complete, moving cursor away');
          const finalPosition = {
            x: window.innerWidth + 100,
            y: window.innerHeight / 2
          };
          
          moveCursor(cursorPosition, finalPosition, 1000, () => {
            // Fade out cursor
            setCursorVisible(false);
          });
        }, 500);
        timeoutRefs.current.push(timeout);
      }
    ];
    
    // Cleanup function
    const cleanup = () => {
      sourceElement.removeEventListener('dragstart', handleDragStart);
    };
    
    // Register cleanup
    timeoutRefs.current.push(setTimeout(cleanup, 10000));
    
    // Start the timeline
    timeline[0]();
    return true;
  };
  
  // Function to run the demo timeline using React state
  const runTimeline = (taskCenter, targetCenter) => {
    // Get the actual DOM elements - with better selectors to ensure we find them
    let taskElement = document.querySelector('[data-tour-id="draggable-task"]');
    let targetElement = document.querySelector('[data-tour-id="urgent-not-important-quadrant"]');
    
    console.log('TourTaskMoveDemo: Current document elements:', {
      taskElements: document.querySelectorAll('.task-card').length,
      quadrantElements: document.querySelectorAll('.quadrant, [data-quadrant]').length,
      draggableElements: document.querySelectorAll('[draggable="true"]').length,
      tourElements: document.querySelectorAll('[data-tour-id]').length
    });
    
    if (!taskElement) {
      console.log('TourTaskMoveDemo: Looking for draggable task with alternative selectors');
      // Try alternative selectors for task element - look specifically for TaskCard components
      taskElement = document.querySelector('[data-tour-id="task-card"]') ||
                    document.querySelector('.task-card') || 
                    document.querySelector('[draggable="true"]') || 
                    document.querySelector('.compact-card') ||
                    document.querySelector('.quadrant-1 .task-card');
      
      if (taskElement) {
        console.log('TourTaskMoveDemo: Found task with alternative selector, marking it for dragging');
        taskElement.setAttribute('data-tour-id', 'draggable-task');
        taskElement.setAttribute('draggable', 'true');
      } else {
        // Find any clickable element in the first quadrant as a last resort
        const firstQuadrant = document.querySelector('[data-tour-id="urgent-important-quadrant"]') || 
                           document.querySelector('.quadrant-1') ||
                           document.querySelector('[data-quadrant="q1"]');
        
        if (firstQuadrant) {
          // Get the first child div that could be a task
          const possibleTask = firstQuadrant.querySelector('div > div');
          if (possibleTask) {
            console.log('TourTaskMoveDemo: Using generic element as task');
            taskElement = possibleTask;
            taskElement.setAttribute('data-tour-id', 'draggable-task');
            taskElement.setAttribute('draggable', 'true');
          }
        }
      }
    }
    
    if (!targetElement) {
      console.log('TourTaskMoveDemo: Looking for target quadrant with alternative selectors');
      // Try alternative selectors for target delegate quadrant (Urgent, Not Important)
      targetElement = document.querySelector('[data-quadrant="q2"]') || 
                      document.querySelector('[data-quadrant="q3"]') || 
                      document.querySelector('.quadrant-2') || 
                      document.querySelector('.quadrant-3');
      
      if (targetElement) {
        console.log('TourTaskMoveDemo: Found target quadrant with alternative selector');
        targetElement.setAttribute('data-tour-id', 'urgent-not-important-quadrant');
      } else {
        // Last resort: try to get any quadrant element that isn't the source
        const allQuadrants = document.querySelectorAll('.quadrant, [data-quadrant]');
        if (allQuadrants.length > 1) {
          // Use the second quadrant as the target
          targetElement = allQuadrants[1];
          console.log('TourTaskMoveDemo: Using second quadrant as target');
          targetElement.setAttribute('data-tour-id', 'urgent-not-important-quadrant');
        }
      }
    }
    
    if (taskElement && targetElement) {
      console.log('TourTaskMoveDemo: Using real drag events with elements', {
        task: taskElement.id || 'unnamed-task',
        target: targetElement.id || 'unnamed-quadrant'
      });
      
      // Force cursor to initial position before starting timeline
      setCursorPosition({ x: -50, y: window.innerHeight / 2 });
      
      // Reset any state that might have been set previously
      setCursorClicking(false);
      setCursorDragging(false);
      setCursorVisible(true);
      
      // Start from step 0 to ensure full animation sequence
      setStep(0);
      
      return;
    }
    
    // Fallback to visual-only simulation if we can't find the elements
    console.log('TourTaskMoveDemo: Falling back to visual-only simulation');
    
    // Timeline for the demo sequence
    const timeline = [
      // Move cursor to the task
      () => {
        const timeout = setTimeout(() => {
          console.log('TourTaskMoveDemo: Moving cursor to task');
          moveCursor(cursorPosition, taskCenter, 1000, timeline[1]);
        }, 500);
        timeoutRefs.current.push(timeout);
      },
      
      // Click on the task to grab it
      () => {
        const timeout = setTimeout(() => {
          console.log('TourTaskMoveDemo: Clicking on task');
          setCursorClicking(true);
          
          const clickTimeout = setTimeout(() => {
            setCursorClicking(false);
            
            // Create visual feedback for dragging
            createDraggedElement();
            setCursorDragging(true);
            
            const nextTimeout = setTimeout(timeline[2], 500);
            timeoutRefs.current.push(nextTimeout);
          }, 300);
          
          timeoutRefs.current.push(clickTimeout);
        }, 200);
        timeoutRefs.current.push(timeout);
      },
      
      // Remaining timeline steps...
      // ... (existing code) ...
    ];
    
    // Start the timeline
    timeline[0]();
  };
  
  // Function to run demo with direct DOM elements as fallback
  const runDemoWithDirectElements = (taskElement, sourceQuadrantElement, targetQuadrantElement, taskCenter, targetCenter) => {
    // Try to use real drag and drop first
    if (taskElement && targetQuadrantElement) {
      console.log('TourTaskMoveDemo: Using real drag events with direct DOM elements');
      // Use real drag and drop with the DOM elements
      runRealDragAndDrop(taskElement, targetQuadrantElement);
      return;
    }
    
    // Fall back to visual-only simulation if needed
    console.log('TourTaskMoveDemo: Falling back to visual-only simulation with direct DOM');
    
    // ... (existing code for visual simulation) ...
  };
  
  // Function to trigger direct DOM mousedown/mouseup/click events
  const triggerMouseEvent = (element, eventType, options = {}) => {
    if (!element) return false;
    
    const event = new MouseEvent(eventType, {
      view: window,
      bubbles: true,
      cancelable: true,
      ...options
    });
    
    try {
      return element.dispatchEvent(event);
    } catch (error) {
      console.error(`Error triggering ${eventType}:`, error);
      return false;
    }
  };
  
  // Add an event listener to handle demo events from other components
  useEffect(() => {
    // Listen for external commands to start the demo
    const handleStartDemo = (event) => {
      console.log('TourTaskMoveDemo: Received start-demo event');
      
      // Try to delay the demo execution a bit to ensure all elements are loaded
      setTimeout(() => {
        // If we don't have quadrants yet, try to find them first
        if (!doQuadrant || !delegateQuadrant) {
          const findResult = findQuadrants();
          if (!findResult) {
            console.error('TourTaskMoveDemo: Failed to find quadrants on external start');
            return;
          }
        }
        
        // If we don't have a task yet, try to set it up
        if (!sourceTask || !sourceTask.element) {
          const setupResult = setupSourceTask();
          if (!setupResult) {
            console.error('TourTaskMoveDemo: Failed to set up task on external start');
            return;
          }
        }
        
        // Start the demo sequence
        startDemoSequence();
      }, 1000);
    };
    
    document.addEventListener('tour:start-move-demo', handleStartDemo);
    
    return () => {
      document.removeEventListener('tour:start-move-demo', handleStartDemo);
    };
  }, [doQuadrant, delegateQuadrant, sourceTask]);
  
  return (
    <TourCursor 
      position={cursorPosition} 
      visible={cursorVisible} 
      clicking={cursorClicking}
      dragging={cursorDragging}
    />
  );
};

export default TourTaskMoveDemo;