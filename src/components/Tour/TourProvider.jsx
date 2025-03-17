import React from 'react';
import { TourProvider as ContextProvider } from '../../contexts/TourContext';
import TourOverlay from './TourOverlay';
import TourDialog from './TourDialog';

/**
 * TourProvider component
 * Wraps the application with the tour context and renders the tour components
 */
const TourProvider = ({ children }) => {
  console.log('Rendering TourProvider');
  
  return (
    <ContextProvider>
      {children}
      <TourOverlay />
      <TourDialog />
    </ContextProvider>
  );
};

export default TourProvider; 