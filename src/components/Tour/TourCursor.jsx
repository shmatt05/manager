import React, { useState, useEffect } from 'react';

/**
 * TourCursor component
 * A React-based animated cursor for tour demonstrations
 * Uses React state for animation, avoiding direct DOM manipulation
 */
const TourCursor = ({ position, visible = true, clicking = false, dragging = false }) => {
  // Determine style based on input props
  const baseStyle = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    pointerEvents: 'none',
    zIndex: 99999,
    opacity: visible ? 1 : 0,
    transform: 'translate(-50%, -50%)',
    transition: 'left 0.4s ease-out, top 0.4s ease-out, transform 0.1s ease-out, opacity 0.2s ease-out',
    filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 4px rgba(0, 0, 0, 0.7))',
    width: '40px',
    height: '40px'
  };

  // Add click animation if clicking
  const svgScale = clicking ? 'scale(0.8)' : 'scale(1)';
  const svgStyle = {
    transform: svgScale,
    transition: 'transform 0.1s ease-out'
  };

  return (
    <div style={baseStyle} className="tour-cursor">
      <div style={svgStyle}>
        <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M7.75 4L16.19 26.94C16.31 27.25 16.75 27.22 16.83 26.9L19.97 16.84L29.05 12.61C29.35 12.47 29.31 12.02 18 4C14.18 1.41 8.15 3.58 7.75 4Z"
            fill="white"
            stroke="black"
            strokeWidth="2.5"
          />
          {clicking && (
            <circle cx="16" cy="16" r="14" fill="rgba(59, 130, 246, 0.3)" opacity="0.7">
              <animate attributeName="r" from="10" to="20" dur="0.3s" begin="0s" fill="freeze" />
              <animate attributeName="opacity" from="0.7" to="0" dur="0.3s" begin="0s" fill="freeze" />
            </circle>
          )}
        </svg>
      </div>
      {dragging && (
        <div 
          className="pulse"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: 'rgba(79, 70, 229, 0.5)',
            border: '3px solid #4f46e5',
            boxShadow: '0 0 12px rgba(79, 70, 229, 0.8)',
          }}
        />
      )}
    </div>
  );
};

export default TourCursor;