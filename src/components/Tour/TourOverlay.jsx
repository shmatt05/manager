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
  if (!active || !currentStep) {
    console.log('TourOverlay: Not rendering overlay because', {
      active, 
      stepId: currentStep?.id,
    });
    return null;
  }
  
  // Special case for custom overlay settings
  if (currentStep.disableOverlay) {
    console.log('TourOverlay: Using minimal overlay for step', {
      stepId: currentStep?.id,
      hasTarget: !!targetRect,
      disableSpotlight: currentStep?.disableSpotlight
    });
    // Still render a pointer-blocking layer when overlay is disabled
    // This prevents interaction with the matrix
    return (
      <div className="fixed inset-0 z-40 pointer-events-auto" style={{ background: 'transparent' }}>
        {/* Block all interactions except where explicitly allowed */}
        {currentStep.allowInteractionAt && (
          <div 
            className="absolute"
            style={{
              left: currentStep.allowInteractionAt.left,
              top: currentStep.allowInteractionAt.top,
              width: currentStep.allowInteractionAt.width,
              height: currentStep.allowInteractionAt.height,
              pointerEvents: 'none'
            }}
          />
        )}
      </div>
    );
  }
  
  console.log('TourOverlay: Rendering full overlay for step', {
    stepId: currentStep?.id,
    hasTarget: !!targetRect,
    disableSpotlight: currentStep?.disableSpotlight
  });
  
  return (
    <div className={`fixed inset-0 z-40 pointer-events-none ${currentStep.id?.includes('matrix') || currentStep.id?.includes('task-move') ? 'tour-step-matrix-view' : ''}`}>
      {/* Semi-transparent background */}
      <div 
        className="absolute inset-0 bg-black/25 tour-overlay"
        style={{
          pointerEvents: 'auto', // Always block interactions with the background
          opacity: currentStep.id?.includes('matrix') || currentStep.id?.includes('task-move') ? 0.15 : 0.25
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
              boxShadow: `0 0 0 9999px rgba(0, 0, 0, ${currentStep.id?.includes('matrix') || currentStep.id?.includes('task-move') ? '0.15' : '0.25'})`,
              borderRadius: '4px',
              // Only allow interaction if specifically enabled for this area
              pointerEvents: currentStep.allowTargetInteraction ? 'none' : 'auto'
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