import React, { useState, useEffect, useRef } from 'react';
import TourCursor from './TourCursor';

/**
 * TourTaskMoveDemo component
 * A realistic task card drag-and-drop demonstration
 * Uses cursor animation and task card movement
 */
const TourTaskMoveDemo = () => {
  const [step, setStep] = useState(0);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });
  const [grabbing, setGrabbing] = useState(false);
  const [quadrantPositions, setQuadrantPositions] = useState({
    q1: { x: 0, y: 0, width: 0, height: 0 }, // Do
    q3: { x: 0, y: 0, width: 0, height: 0 }  // Delegate
  });
  
  const animationRef = useRef(null);
  
  // Find position of quadrants
  useEffect(() => {
    // Find the "Do" (urgent-important) quadrant
    const doQuadrant = document.querySelector('[data-tour-id="urgent-important-quadrant"]');
    // Find the "Delegate" (urgent-not-important) quadrant
    const delegateQuadrant = document.querySelector('[data-tour-id="urgent-not-important-quadrant"]');
    
    if (doQuadrant && delegateQuadrant) {
      const doRect = doQuadrant.getBoundingClientRect();
      const delegateRect = delegateQuadrant.getBoundingClientRect();
      
      setQuadrantPositions({
        q1: {
          x: doRect.left + (doRect.width * 0.2),  // 20% into the quadrant
          y: doRect.top + (doRect.height * 0.3),
          width: doRect.width,
          height: doRect.height
        },
        q3: {
          x: delegateRect.left + (delegateRect.width * 0.2),
          y: delegateRect.top + (delegateRect.height * 0.3),
          width: delegateRect.width,
          height: delegateRect.height
        }
      });
      
      // Initial cursor position (center of window)
      setCursorPosition({ 
        x: window.innerWidth / 2, 
        y: window.innerHeight / 2 
      });
    }
  }, []);
  
  // Run animation sequence
  useEffect(() => {
    // Make sure quadrant positions are loaded
    if (quadrantPositions.q1.width === 0) return;
    
    const startAnimation = () => {
      // Step 0: Move cursor to first card
      if (step === 0) {
        setTargetPosition(quadrantPositions.q1);
        setTimeout(() => setStep(1), 1500);
      }
      // Step 1: Click (grab) card
      else if (step === 1) {
        setGrabbing(true);
        setCardPosition(quadrantPositions.q1);
        setTimeout(() => setStep(2), 500);
      }
      // Step 2: Move card to delegate quadrant
      else if (step === 2) {
        setTargetPosition(quadrantPositions.q3);
        setTimeout(() => setStep(3), 2000);
      }
      // Step 3: Release card
      else if (step === 3) {
        setGrabbing(false);
        setCardPosition(quadrantPositions.q3);
        setTimeout(() => {
          setAnimationComplete(true);
        }, 500);
      }
    };
    
    // Start animation after a delay
    const timeout = setTimeout(startAnimation, 500);
    
    return () => clearTimeout(timeout);
  }, [step, quadrantPositions]);
  
  // Update card position to follow cursor
  useEffect(() => {
    // Only update card position when grabbing
    if (grabbing && step > 1) {
      // Card follows cursor with a slight offset
      setCardPosition({
        x: cursorPosition.x + 10,
        y: cursorPosition.y + 10
      });
    }
  }, [cursorPosition, grabbing, step]);
  
  return (
    <div className="fixed inset-0 pointer-events-none z-[9000]">
      {/* Animated tour cursor */}
      <TourCursor
        fromPosition={cursorPosition}
        toPosition={targetPosition}
        duration={1500}
        showClick={step === 1}
        visible={!animationComplete}
        onComplete={() => {
          setCursorPosition(targetPosition);
        }}
      />
      
      {/* Task card being moved */}
      <div
        className={`absolute bg-white dark:bg-gray-800 rounded-md shadow-md p-3 w-64 
                    transition-opacity duration-300 ${animationComplete ? 'opacity-0' : 'opacity-100'}`}
        style={{
          left: cardPosition.x,
          top: cardPosition.y,
          transform: 'translate(-50%, -50%)',
          border: '2px solid #4FD1C5',
          cursor: grabbing ? 'grabbing' : 'grab',
          transition: grabbing ? 'none' : 'all 0.3s ease'
        }}
      >
        <div className="font-medium text-gray-900 dark:text-gray-100">Board Meeting Presentation</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Prepare slides and notes for tomorrow</div>
        <div className="flex mt-2 gap-1">
          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-0.5 rounded">important</span>
          <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 px-2 py-0.5 rounded">urgent</span>
        </div>
      </div>
      
      {/* Instructions */}
      <div 
        className="absolute top-32 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 p-3 rounded-lg 
                  shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs text-center"
      >
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {step < 3 ? "Watch as we drag a task from 'Do' to 'Delegate'" : "Tasks can be moved between any quadrants as priorities change"}
        </p>
      </div>
      
      {/* Source quadrant highlight */}
      <div
        className="absolute pointer-events-none border-2 border-dashed border-cyan-500/30 rounded-lg"
        style={{
          left: quadrantPositions.q1.x - quadrantPositions.q1.width * 0.1,
          top: quadrantPositions.q1.y - quadrantPositions.q1.height * 0.2,
          width: quadrantPositions.q1.width * 0.8,
          height: quadrantPositions.q1.height * 0.8,
          opacity: step < 2 ? 0.8 : 0.3,
          transition: 'opacity 0.5s ease'
        }}
      />
      
      {/* Target quadrant highlight */}
      <div
        className="absolute pointer-events-none border-2 border-dashed border-cyan-500/30 rounded-lg"
        style={{
          left: quadrantPositions.q3.x - quadrantPositions.q3.width * 0.1,
          top: quadrantPositions.q3.y - quadrantPositions.q3.height * 0.2,
          width: quadrantPositions.q3.width * 0.8,
          height: quadrantPositions.q3.height * 0.8,
          opacity: step > 1 ? 0.8 : 0.3,
          transition: 'opacity 0.5s ease'
        }}
      />
    </div>
  );
};

export default TourTaskMoveDemo;