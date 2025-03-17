import React, { useState, useEffect } from 'react';
import { useTour } from '../../contexts/TourContext';

/**
 * TourOverlay component
 * A simplified, reliable overlay for highlighting elements during the tour
 */
const TourOverlay = () => {
  const { active, currentStep } = useTour();
  const [targetRect, setTargetRect] = useState(null);
  
  // Find and measure the target element when the step changes
  useEffect(() => {
    if (!active || !currentStep || currentStep.disableOverlay) {
      setTargetRect(null);
      return;
    }
    
    // Skip if spotlight is disabled for this step
    if (currentStep.disableSpotlight) {
      setTargetRect(null);
      return;
    }
    
    const target = currentStep.target;
    if (!target || target === 'body') {
      // Center spotlight
      setTargetRect({
        left: window.innerWidth / 2 - 150,
        top: window.innerHeight / 2 - 150,
        width: 300,
        height: 300,
        right: window.innerWidth / 2 + 150,
        bottom: window.innerHeight / 2 + 150
      });
      return;
    }
    
    try {
      // Find the target element
      const targetElement = document.querySelector(target);
      if (!targetElement) {
        console.warn(`Tour target element not found: ${target}`);
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
        right: rect.right + padding,
        bottom: rect.bottom + padding
      };
      
      setTargetRect(paddedRect);
    } catch (error) {
      console.error('Error finding target element:', error);
      setTargetRect(null);
    }
  }, [active, currentStep]);
  
  // Don't render anything if the tour is not active or overlay is disabled
  if (!active || !currentStep || currentStep.disableOverlay) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Semi-transparent background */}
      <div 
        className="absolute inset-0 bg-black/25"
        style={{
          pointerEvents: currentStep.blockBackground === false ? 'none' : 'auto'
        }}
      />
      
      {/* Spotlight cutout */}
      {targetRect && !currentStep.disableSpotlight && (
        <>
          {/* Spotlight hole */}
          <div 
            className="absolute bg-transparent"
            style={{
              left: targetRect.left,
              top: targetRect.top,
              width: targetRect.width,
              height: targetRect.height,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.25)',
              borderRadius: '4px'
            }}
          />
          
          {/* Highlight glow */}
          <div 
            className="absolute"
            style={{
              left: targetRect.left - 3,
              top: targetRect.top - 3,
              width: targetRect.width + 6,
              height: targetRect.height + 6,
              border: '2px solid rgba(59, 130, 246, 0.5)',
              borderRadius: '4px',
              pointerEvents: 'none'
            }}
          />
        </>
      )}
    </div>
  );
};

export default TourOverlay;