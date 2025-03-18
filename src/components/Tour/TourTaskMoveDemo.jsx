import React, { useState, useEffect, useRef } from 'react';
import TourCursor from './TourCursor';

/**
 * TourTaskMoveDemo component
 * Simulates drag and drop by controlling an actual task card in the matrix
 */
const TourTaskMoveDemo = () => {
  const [step, setStep] = useState(0);
  const [demoTask, setDemoTask] = useState(null);
  const [sourceQuadrant, setSourceQuadrant] = useState(null);
  const [targetQuadrant, setTargetQuadrant] = useState(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });
  const [showClick, setShowClick] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  
  const timeoutRef = useRef(null);
  
  // Find task and quadrants
  useEffect(() => {
    // Find the "Do" (urgent-important) quadrant
    const doQuadrant = document.querySelector('[data-tour-id="urgent-important-quadrant"]');
    // Find the "Delegate" (urgent-not-important) quadrant
    const delegateQuadrant = document.querySelector('[data-tour-id="urgent-not-important-quadrant"]');
    
    if (doQuadrant && delegateQuadrant) {
      // Get positions for later
      setSourceQuadrant({
        element: doQuadrant,
        rect: doQuadrant.getBoundingClientRect()
      });
      
      setTargetQuadrant({
        element: delegateQuadrant,
        rect: delegateQuadrant.getBoundingClientRect()
      });
      
      // Find a task in the Do quadrant
      const tasks = doQuadrant.querySelectorAll('.task-card');
      if (tasks.length > 0) {
        // Use the first task we find
        const task = tasks[0];
        setDemoTask({
          element: task,
          rect: task.getBoundingClientRect()
        });
        
        // Initial cursor position (slightly above the task)
        setCursorPosition({ 
          x: window.innerWidth / 2, 
          y: window.innerHeight / 3 
        });
      } else {
        // Create a fake event to add a task to the demo board
        const demoTaskEvent = new CustomEvent('tour:add-task', {
          detail: { 
            task: {
              id: 'tour-demo-task-' + Date.now(),
              title: 'Board Meeting Presentation',
              description: 'Prepare slides for tomorrow',
              tags: ['important', 'demo', 'tour'],
              priority: 1,
              status: 'todo',
              quadrant: 'q1', // Do quadrant
              dueDate: new Date(Date.now() + 86400000).toISOString(), // tomorrow
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        });
        document.dispatchEvent(demoTaskEvent);
        
        // Set a timeout to find the task after it's been created
        timeoutRef.current = setTimeout(() => {
          const newTasks = doQuadrant.querySelectorAll('.task-card');
          if (newTasks.length > 0) {
            const newTask = newTasks[0];
            setDemoTask({
              element: newTask,
              rect: newTask.getBoundingClientRect()
            });
          }
        }, 500);
      }
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // Run the animation sequence
  useEffect(() => {
    // If we don't have a task or quadrants yet, wait
    if (!demoTask || !sourceQuadrant || !targetQuadrant) return;
    
    // Step 0: Move cursor to the task
    if (step === 0) {
      // Calculate position at center of task
      const taskCenter = {
        x: demoTask.rect.left + demoTask.rect.width / 2,
        y: demoTask.rect.top + demoTask.rect.height / 2
      };
      
      setTargetPosition(taskCenter);
      timeoutRef.current = setTimeout(() => setStep(1), 800);
    }
    // Step 1: "Grab" the task
    else if (step === 1) {
      setShowClick(true);
      setIsDragging(true);
      
      // Highlight source quadrant
      sourceQuadrant.element.style.backgroundColor = 'rgba(79, 209, 197, 0.05)';
      sourceQuadrant.element.style.transition = 'background-color 0.5s ease';
      
      // Highlight target quadrant
      targetQuadrant.element.style.backgroundColor = 'rgba(79, 209, 197, 0.1)';
      targetQuadrant.element.style.transition = 'background-color 0.5s ease';
      
      // Find the task card after clicking to get latest position
      const updatedTask = document.querySelector(`#${demoTask.element.id}`);
      if (updatedTask) {
        // Create overlay element to make it look like the task is being dragged
        const overlay = document.createElement('div');
        overlay.id = 'tour-task-overlay';
        overlay.className = demoTask.element.className;
        overlay.style.position = 'fixed';
        overlay.style.zIndex = '9999';
        overlay.style.left = `${demoTask.rect.left}px`;
        overlay.style.top = `${demoTask.rect.top}px`;
        overlay.style.width = `${demoTask.rect.width}px`;
        overlay.style.height = `${demoTask.rect.height}px`;
        overlay.style.pointerEvents = 'none';
        overlay.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2)';
        overlay.style.transform = 'scale(1.05)';
        overlay.style.transition = 'left 1.5s ease, top 1.5s ease';
        overlay.innerHTML = updatedTask.innerHTML;
        document.body.appendChild(overlay);
        
        // Hide the actual task while "dragging"
        demoTask.element.style.opacity = '0';
        demoTask.element.style.transition = 'opacity 0.3s ease';
      }
      
      timeoutRef.current = setTimeout(() => setStep(2), 800);
    }
    // Step 2: Move to the target quadrant
    else if (step === 2) {
      // Move to target quadrant
      const targetCenter = {
        x: targetQuadrant.rect.left + targetQuadrant.rect.width / 2,
        y: targetQuadrant.rect.top + targetQuadrant.rect.height / 2
      };
      setTargetPosition(targetCenter);
      
      // Move the overlay to target quadrant
      const overlay = document.getElementById('tour-task-overlay');
      if (overlay) {
        overlay.style.left = `${targetCenter.x - demoTask.rect.width / 2}px`;
        overlay.style.top = `${targetCenter.y - demoTask.rect.height / 2}px`;
      }
      
      timeoutRef.current = setTimeout(() => setStep(3), 1500);
    }
    // Step 3: "Drop" the task and finish
    else if (step === 3) {
      setShowClick(true);
      setIsDragging(false);
      
      // Remove highlight from quadrants
      sourceQuadrant.element.style.backgroundColor = '';
      targetQuadrant.element.style.backgroundColor = '';
      
      // Remove the overlay
      const overlay = document.getElementById('tour-task-overlay');
      if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        }, 300);
      }
      
      // Simulate the task moving to the delegate quadrant by creating a custom event
      const moveTaskEvent = new CustomEvent('tour:update-task-quadrant', {
        detail: {
          taskId: demoTask.element.id.replace('task-', ''),
          newQuadrant: 'q3' // Delegate quadrant
        }
      });
      document.dispatchEvent(moveTaskEvent);
      
      // Show the actual task again (it will now be in the delegate quadrant)
      demoTask.element.style.opacity = '1';
      
      timeoutRef.current = setTimeout(() => {
        setAnimationComplete(true);
      }, 1000);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [step, demoTask, sourceQuadrant, targetQuadrant]);
  
  // Update cursor position when target changes
  useEffect(() => {
    return () => {
      // Cleanup if component unmounts
      const overlay = document.getElementById('tour-task-overlay');
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      
      // Reset quadrant styles
      if (sourceQuadrant && sourceQuadrant.element) {
        sourceQuadrant.element.style.backgroundColor = '';
        sourceQuadrant.element.style.transition = '';
      }
      
      if (targetQuadrant && targetQuadrant.element) {
        targetQuadrant.element.style.backgroundColor = '';
        targetQuadrant.element.style.transition = '';
      }
      
      // Reset task opacity
      if (demoTask && demoTask.element) {
        demoTask.element.style.opacity = '1';
        demoTask.element.style.transition = '';
      }
      
      // Clear any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [sourceQuadrant, targetQuadrant, demoTask]);
  
  return (
    <>
      <TourCursor
        fromPosition={cursorPosition}
        toPosition={targetPosition}
        duration={800}
        showClick={showClick}
        visible={!animationComplete}
        onComplete={() => {
          setCursorPosition(targetPosition);
          setShowClick(false);
        }}
      />
      
      {/* Instructions */}
      <div 
        className="absolute top-32 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 p-3 rounded-lg 
                 shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs text-center"
        style={{
          opacity: animationComplete ? 0 : 1,
          transition: 'opacity 0.5s ease',
          zIndex: 9000
        }}
      >
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {step < 2 
            ? "Watch as we drag a task from 'Do' to 'Delegate' quadrant" 
            : "Tasks can be moved between quadrants as priorities change"}
        </p>
      </div>
    </>
  );
};

export default TourTaskMoveDemo;