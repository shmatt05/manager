import React from 'react';
import { TourProvider as ContextProvider } from '../../contexts/TourContext';
import TourDialog from './TourDialog';
import TourOverlay from './TourOverlay';

/**
 * TourProvider component
 * Main wrapper component for the tour functionality
 */
const TourProvider = ({ children }) => {
  return (
    <ContextProvider>
      {children}
      <TourOverlay />
      <TourDialog />
    </ContextProvider>
  );
};

export default TourProvider;