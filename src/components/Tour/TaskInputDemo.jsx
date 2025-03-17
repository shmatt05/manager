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
  
  // Update input element and cursor positions
  const updatePositions = useCallback(() => {
    // Find input field
    const inputField = document.querySelector('form input[type="text"]');
    const addButton = document.querySelector('[data-tour-id="add-task-button"]');
    
    if (inputField && addButton) {
      const inputRect = inputField.getBoundingClientRect();
      const buttonRect = addButton.getBoundingClientRect();
      
      // Position for typing (inside input field)
      const typingX = inputRect.left + Math.min(100, inputRect.width * 0.3);
      const typingY = inputRect.top + (inputRect.height / 2);
      
      // Position for clicking button
      const buttonX = buttonRect.left + (buttonRect.width / 2);
      const buttonY = buttonRect.top + (buttonRect.height / 2);
      
      return {
        typingPosition: { x: typingX, y: typingY },
        buttonPosition: { x: buttonX, y: buttonY },
        inputField,
        addButton
      };
    }
    
    return null;
  }, []);
  
  // Simulate typing effect
  const simulateTyping = useCallback((text, inputElement) => {
    let index = 0;
    
    const typeNextChar = () => {
      if (index <= text.length) {
        const currentText = text.substring(0, index);
        setTypedText(currentText);
        
        // Update the actual input field value and dispatch input event
        if (inputElement) {
          inputElement.value = currentText;
          const inputEvent = new Event('input', { bubbles: true });
          inputElement.dispatchEvent(inputEvent);
        }
        
        index++;
        setTimeout(typeNextChar, 100);
      } else {
        // Typing finished, move to button
        setTimeout(() => {
          setStep(1);
        }, 500);
      }
    };
    
    typeNextChar();
  }, []);
  
  // Start the demo when component mounts
  useEffect(() => {
    // Initial delay before starting
    const startTimeout = setTimeout(() => {
      const positions = updatePositions();
      if (positions) {
        // Start by moving cursor to input field
        setCursorPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        setTargetPosition(positions.typingPosition);
        
        // After cursor reaches input, begin typing
        setTimeout(() => {
          simulateTyping(demoText, positions.inputField);
        }, 1500); // Allow time for cursor to move to input
      }
    }, 1000);
    
    return () => clearTimeout(startTimeout);
  }, [updatePositions, simulateTyping, demoText]);
  
  // Handle moving to button after typing
  useEffect(() => {
    if (step === 1) {
      const positions = updatePositions();
      if (positions) {
        setTargetPosition(positions.buttonPosition);
        setTimeout(() => {
          setShowClick(true);
          
          // After clicking, trigger actual button click
          setTimeout(() => {
            if (positions.addButton) {
              positions.addButton.click();
              setIsComplete(true);
            }
          }, 300);
        }, 1000);
      }
    }
  }, [step, updatePositions]);
  
  return (
    <>
      {/* Controlled input field for visual feedback */}
      <TourCursor 
        fromPosition={cursorPosition} 
        toPosition={targetPosition}
        duration={1500}
        showClick={showClick}
        visible={!isComplete}
      />
    </>
  );
};

export default TaskInputDemo;