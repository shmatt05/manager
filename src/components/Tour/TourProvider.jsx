import React from 'react';
import { TourProvider as ContextProvider } from '../../contexts/TourContext';
import TourOverlay from './TourOverlay';
import TourDialog from './TourDialog';
import tourSteps from '../../data/tourSteps';

/**
 * TourProvider component
 * Wraps the application with the tour context and renders the tour components
 */
const TourProvider = ({ children }) => {
  return (
    <ContextProvider steps={tourSteps}>
      {children}
      <TourOverlay />
      <TourDialog />
    </ContextProvider>
  );
};

export default TourProvider; 