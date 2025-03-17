import React from 'react';
import { useTour } from '../../contexts/TourContext';

/**
 * TourButton component
 * Button to start the guided tour
 */
const TourButton = ({ className }) => {
  const { startTour, active } = useTour();

  const handleStartTour = () => {
    console.log('Starting tour...');
    startTour();
  };

  return (
    <button
      onClick={handleStartTour}
      disabled={active}
      className={`${className || ''} ${
        active ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      data-tour-id="tour-button"
    >
      {/* Info icon */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-3 w-3 mr-1 text-gray-600 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white transition-colors duration-200" 
        viewBox="0 0 20 20" 
        fill="currentColor"
      >
        <path 
          fillRule="evenodd" 
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
          clipRule="evenodd" 
        />
      </svg>
      
      {/* Button text */}
      <span>Guided Tour</span>
    </button>
  );
};

export default TourButton; 