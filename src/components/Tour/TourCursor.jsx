import React, { useState, useEffect } from 'react';

/**
 * TourCursor component
 * A React-based animated cursor for tour demonstrations
 * Uses React state for animation, avoiding direct DOM manipulation
 */
const TourCursor = ({ fromPosition, toPosition, duration = 1000, showClick = false, onComplete = null, visible = true }) => {
  const [position, setPosition] = useState(fromPosition);
  const [isClicking, setIsClicking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  // Handle animation via React useEffect
  useEffect(() => {
    const startTime = Date.now();
    
    // Animation frame loop
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / duration, 1);
      
      // Update progress state for animation
      setProgress(newProgress);
      
      // Calculate new position with easing
      const easeOutCubic = 1 - Math.pow(1 - newProgress, 3);
      const x = fromPosition.x + (toPosition.x - fromPosition.x) * easeOutCubic;
      const y = fromPosition.y + (toPosition.y - fromPosition.y) * easeOutCubic;
      
      // Update position state
      setPosition({ x, y });
      
      // Continue animation if not complete
      if (newProgress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete
        if (showClick) {
          // Show click animation
          setIsClicking(true);
          
          // Reset after click animation
          setTimeout(() => {
            setIsClicking(false);
            
            // Call onComplete callback if provided
            if (onComplete) {
              setTimeout(() => {
                onComplete();
              }, 200);
            }
          }, 300);
        } else if (onComplete) {
          onComplete();
        }
      }
    };
    
    // Start animation
    const animationId = requestAnimationFrame(animate);
    
    // Cleanup animation on unmount
    return () => {
      cancelAnimationFrame(animationId);
      setIsVisible(false);
    };
  }, [fromPosition, toPosition, duration, showClick, onComplete]);
  
  if (!isVisible || !visible) return null;
  
  return (
    <div 
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        transform: `translate(${position.x}px, ${position.y}px)`,
        zIndex: 9999,
        pointerEvents: 'none',
        transition: isClicking ? 'none' : 'transform 0.05s linear',
        willChange: 'transform'
      }}
    >
      {/* Cursor SVG */}
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        className={`transform -translate-x-1/2 -translate-y-1/2 ${isClicking ? 'scale-95' : ''}`}
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
      >
        <path
          d="M2.5 2L11 20.5L13.5 13.5L20.5 11L2.5 2Z"
          fill="white"
          stroke="#333"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        
        {isClicking && (
          <circle 
            cx="12" 
            cy="12" 
            r="8" 
            fill="rgba(79, 209, 197, 0.3)" 
            opacity={1 - (isClicking ? 0.5 : 0)}
          >
            <animate
              attributeName="r"
              from="4"
              to="12"
              dur="0.3s"
              begin="0s"
              fill="freeze"
            />
            <animate
              attributeName="opacity"
              from="0.8"
              to="0"
              dur="0.3s"
              begin="0s"
              fill="freeze"
            />
          </circle>
        )}
      </svg>
    </div>
  );
};

export default TourCursor;