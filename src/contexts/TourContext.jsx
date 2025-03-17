import React, { createContext, useReducer, useContext, useCallback } from 'react';

// Initial state for the tour
const initialState = {
  active: false,
  currentStepIndex: 0,
  totalSteps: 0,
  stepHistory: [],
  autoPlay: false,
  completed: false
};

// Action types for the reducer
const ACTIONS = {
  START_TOUR: 'START_TOUR',
  END_TOUR: 'END_TOUR',
  NEXT_STEP: 'NEXT_STEP',
  PREV_STEP: 'PREV_STEP',
  GO_TO_STEP: 'GO_TO_STEP',
  SET_AUTO_PLAY: 'SET_AUTO_PLAY',
  COMPLETE_TOUR: 'COMPLETE_TOUR',
  RESET_TOUR: 'RESET_TOUR',
  EXECUTE_ACTION: 'EXECUTE_ACTION'
};

// Reducer function to handle state updates
function tourReducer(state, action) {
  switch (action.type) {
    case ACTIONS.START_TOUR:
      return {
        ...state,
        active: true,
        currentStepIndex: 0,
        totalSteps: action.payload.totalSteps,
        stepHistory: [0],
        completed: false
      };
    
    case ACTIONS.END_TOUR:
      return {
        ...state,
        active: false,
        autoPlay: false
      };
    
    case ACTIONS.NEXT_STEP:
      const nextIndex = state.currentStepIndex + 1;
      // Don't go beyond the last step
      if (nextIndex >= state.totalSteps) {
        return {
          ...state,
          completed: true,
          autoPlay: false
        };
      }
      
      return {
        ...state,
        currentStepIndex: nextIndex,
        stepHistory: [...state.stepHistory, nextIndex]
      };
    
    case ACTIONS.PREV_STEP:
      const prevIndex = state.currentStepIndex - 1;
      // Don't go before the first step
      if (prevIndex < 0) return state;
      
      return {
        ...state,
        currentStepIndex: prevIndex,
        stepHistory: [...state.stepHistory, prevIndex]
      };
    
    case ACTIONS.GO_TO_STEP:
      const stepIndex = action.payload.stepIndex;
      // Ensure the step index is valid
      if (stepIndex < 0 || stepIndex >= state.totalSteps) return state;
      
      return {
        ...state,
        currentStepIndex: stepIndex,
        stepHistory: [...state.stepHistory, stepIndex]
      };
    
    case ACTIONS.SET_AUTO_PLAY:
      return {
        ...state,
        autoPlay: action.payload.autoPlay
      };
    
    case ACTIONS.COMPLETE_TOUR:
      return {
        ...state,
        active: false,
        completed: true,
        autoPlay: false
      };
    
    case ACTIONS.RESET_TOUR:
      return initialState;
    
    case ACTIONS.EXECUTE_ACTION:
      // This action doesn't change state, it just executes a function
      if (action.payload && typeof action.payload.action === 'function') {
        action.payload.action();
      }
      return state;
    
    default:
      return state;
  }
}

// Create the context
const TourContext = createContext();

// Custom hook to use the tour context
export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}

// Tour Provider component
export function TourProvider({ children, steps }) {
  const [state, dispatch] = useReducer(tourReducer, initialState);
  
  // Calculate total steps from the provided steps array
  const totalSteps = steps ? steps.length : 0;
  
  // Get the current step data
  const currentStep = steps && state.currentStepIndex < totalSteps 
    ? steps[state.currentStepIndex] 
    : null;
  
  // Action creators
  const startTour = useCallback(() => {
    dispatch({ 
      type: ACTIONS.START_TOUR, 
      payload: { totalSteps } 
    });
  }, [totalSteps]);
  
  const endTour = useCallback(() => {
    dispatch({ type: ACTIONS.END_TOUR });
  }, []);
  
  const nextStep = useCallback(() => {
    dispatch({ type: ACTIONS.NEXT_STEP });
  }, []);
  
  const prevStep = useCallback(() => {
    dispatch({ type: ACTIONS.PREV_STEP });
  }, []);
  
  const goToStep = useCallback((stepIndex) => {
    dispatch({ 
      type: ACTIONS.GO_TO_STEP, 
      payload: { stepIndex } 
    });
  }, []);
  
  const setAutoPlay = useCallback((autoPlay) => {
    dispatch({ 
      type: ACTIONS.SET_AUTO_PLAY, 
      payload: { autoPlay } 
    });
  }, []);
  
  const completeTour = useCallback(() => {
    dispatch({ type: ACTIONS.COMPLETE_TOUR });
  }, []);
  
  const resetTour = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_TOUR });
  }, []);
  
  const executeAction = useCallback((action) => {
    if (typeof action === 'function') {
      dispatch({ 
        type: ACTIONS.EXECUTE_ACTION, 
        payload: { action } 
      });
    }
  }, []);
  
  // Combine state and actions to provide through context
  const value = {
    // State
    active: state.active,
    currentStepIndex: state.currentStepIndex,
    totalSteps,
    currentStep,
    stepHistory: state.stepHistory,
    autoPlay: state.autoPlay,
    completed: state.completed,
    
    // Actions
    startTour,
    endTour,
    nextStep,
    prevStep,
    goToStep,
    setAutoPlay,
    completeTour,
    resetTour,
    executeAction
  };
  
  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
}

export default TourContext; 