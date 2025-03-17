import React from 'react';

/**
 * TourTaskMoveDemo component
 * A purely React-based demonstration of moving a task between quadrants
 * Uses standard React rendering without DOM manipulations
 */
const TourTaskMoveDemo = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[9000]">
      {/* Animated arrow showing task movement */}
      <svg width="100%" height="100%">
        <defs>
          <marker 
            id="tour-arrowhead" 
            viewBox="0 0 10 10" 
            refX="5" 
            refY="5"
            markerWidth="6" 
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#4FD1C5" />
          </marker>
          <linearGradient id="tour-line-gradient" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4FD1C5" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#4FD1C5" stopOpacity="1" />
          </linearGradient>
        </defs>
        
        {/* Source highlight - Top-left quadrant */}
        <rect
          x="15%" 
          y="30%" 
          width="30%" 
          height="30%"
          fill="none"
          stroke="#4FD1C5"
          strokeWidth="2"
          strokeDasharray="5,5"
          opacity="0.5"
        />
        
        {/* Target highlight - Bottom-left quadrant */}
        <rect
          x="15%" 
          y="65%" 
          width="30%" 
          height="30%"
          fill="none"
          stroke="#4FD1C5"
          strokeWidth="2"
          strokeDasharray="5,5"
          opacity="0.5"
        />
        
        {/* Animated path */}
        <path
          d="M 25% 40% C 20% 50%, 20% 60%, 25% 70%"
          stroke="url(#tour-line-gradient)"
          strokeWidth="3"
          fill="none" 
          markerEnd="url(#tour-arrowhead)"
          strokeDasharray="10,10"
          opacity="0.8"
          className="animate-dash-offset"
          style={{ animation: 'dashOffset 30s linear infinite' }}
        />
        
        {/* Moving task representation */}
        <rect
          x="20%" 
          y="35%" 
          width="10%" 
          height="5%"
          rx="4"
          fill="#4FD1C5"
          fillOpacity="0.3"
          stroke="#4FD1C5"
          strokeWidth="2"
          className="animate-pulse"
        />
        
        {/* Task label */}
        <text
          x="25%" 
          y="37.5%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="#000"
          fontSize="12"
          fontWeight="bold"
          opacity="0.8"
        >
          Board Meeting Presentation
        </text>
      </svg>
      
      {/* Instructions text */}
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Drag tasks between quadrants to reprioritize them as your needs change
        </p>
      </div>
    </div>
  );
};

export default TourTaskMoveDemo;