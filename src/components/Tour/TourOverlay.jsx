import React, { useState, useEffect, useRef } from 'react';
import { useTour } from '../../contexts/TourContext';

/**
 * TourOverlay component
 * Creates a semi-transparent overlay with a spotlight effect on the target element
 */
const TourOverlay = () => {
  const { active, currentStep } = useTour();
  const [targetRect, setTargetRect] = useState(null);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const overlayRef = useRef(null);

  // Update window size on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Find and measure the target element when the current step changes
  useEffect(() => {
    if (!active || !currentStep) {
      setTargetRect(null);
      return;
    }

    // Skip if spotlight is disabled for this step
    if (currentStep.disableSpotlight) {
      setTargetRect(null);
      return;
    }

    const targetSelector = currentStep.target;
    if (!targetSelector) {
      setTargetRect(null);
      return;
    }

    // Handle special case for 'body' target (center of screen)
    if (targetSelector === 'body') {
      const centerRect = {
        left: windowSize.width / 2 - 150,
        top: windowSize.height / 2 - 150,
        width: 300,
        height: 300,
        bottom: windowSize.height / 2 + 150,
        right: windowSize.width / 2 + 150
      };
      setTargetRect(centerRect);
      return;
    }

    // Find the target element
    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) {
      console.warn(`Tour target element not found: ${targetSelector}`);
      setTargetRect(null);
      return;
    }

    // Get the element's position and dimensions
    const rect = targetElement.getBoundingClientRect();
    
    // Add some padding around the element
    const padding = currentStep.spotlightPadding || 10;
    const paddedRect = {
      left: rect.left - padding,
      top: rect.top - padding,
      width: rect.width + (padding * 2),
      height: rect.height + (padding * 2),
      bottom: rect.bottom + padding,
      right: rect.right + padding
    };
    
    setTargetRect(paddedRect);
  }, [active, currentStep, windowSize]);

  // Don't render anything if the tour is not active
  if (!active || !currentStep || currentStep.disableOverlay) {
    return null;
  }

  // Calculate the clip path for the spotlight effect
  const getClipPath = () => {
    if (!targetRect) return 'circle(0px at 50% 50%)';
    
    // Use the specified radius or calculate based on the element size
    const radius = currentStep.spotlightRadius || 
      Math.max(targetRect.width, targetRect.height) / 2;
    
    // Calculate the center of the target element
    const centerX = targetRect.left + (targetRect.width / 2);
    const centerY = targetRect.top + (targetRect.height / 2);
    
    return `circle(${radius}px at ${centerX}px ${centerY}px)`;
  };

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-50 pointer-events-none transition-opacity duration-300"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        WebkitClipPath: getClipPath(),
        clipPath: getClipPath(),
        opacity: targetRect ? 0 : 1, // Invert the mask (show everything except the spotlight)
      }}
    >
      {/* Inverted mask to create spotlight effect */}
      <div 
        className="absolute inset-0 bg-black opacity-75"
        style={{
          WebkitClipPath: `polygon(
            0% 0%, 100% 0%, 100% 100%, 0% 100%,
            0% 0%
          )`,
          clipPath: `polygon(
            0% 0%, 100% 0%, 100% 100%, 0% 100%,
            0% 0%
          )`,
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

export default TourOverlay; 