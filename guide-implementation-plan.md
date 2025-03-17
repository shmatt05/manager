# Guided Tour Implementation Plan

## Overview
This document outlines the implementation plan for adding a guided tour/demo mode to the task management application. The tour will showcase the app's features through interactive overlays and step-by-step instructions.

## Core Components

### 1. Tour Manager
- **Purpose**: Central controller for the tour state and progression
- **Implementation**: React Context + useReducer for state management
- **Key Features**:
  - Track current step
  - Store tour state (active, paused, completed)
  - Manage step transitions
  - Handle tour exit

### 2. Tour Overlay Component
- **Purpose**: Visual overlay highlighting the current feature
- **Implementation**: Absolute positioned component with z-index management
- **Key Features**:
  - Spotlight effect (highlight active element, dim the rest)
  - Animated transitions between steps
  - Responsive design for all screen sizes

### 3. Tour Dialog Component
- **Purpose**: Display instructions and information for each step
- **Implementation**: Material Design styled dialog box
- **Key Features**:
  - Professional copy explaining features
  - Next/Previous navigation
  - Skip/Exit options
  - Progress indicator

### 4. Tour Button Component
- **Purpose**: Entry point to start the tour
- **Implementation**: Button next to "Send All to Backlog"
  
## Tour Flow and Content

### Introduction (1 step)
- **Welcome to Task Manager**
  - Brief overview of the application
  - Explanation of the Eisenhower Matrix concept
  - How to navigate the tour

### Matrix View (5 steps)
1. **Matrix Overview**
   - Explanation of the four quadrants
   - How tasks are categorized
   - The importance of prioritization
   
2. **Creating Tasks**
   - How to add new tasks
   - Quick add vs. detailed add
   
3. **Task Card Features**
   - Explanation of task card elements
   - Status indicators
   - Priority visualization
   
4. **Moving Tasks Between Quadrants**
   - Drag and drop functionality
   - What happens when a task changes quadrant
   - How priority and tags are updated
   
5. **Backlog Section**
   - Purpose of the backlog
   - How to move tasks to/from backlog
   - "Send All to Backlog" feature

### Task Modal (4 steps)
1. **Task Details**
   - How to open the task modal
   - Overview of available fields
   
2. **Special Text Parsing**
   - Using #tags in task titles
   - Setting due dates with @date syntax
   - Priority indicators with !
   
3. **Task Editing**
   - How to edit existing tasks
   - Saving changes
   
4. **Task Actions**
   - Completing tasks
   - Deleting tasks
   - Moving to different quadrants

### Right-Click Menu (2 steps)
1. **Accessing Context Menu**
   - How to right-click on tasks
   - Available options
   
2. **Quick Actions**
   - Moving to quadrants
   - Completing tasks
   - Editing and deleting

### Completed Tasks View (2 steps)
1. **Accessing Completed Tasks**
   - How to navigate to the completed view
   - Filtering options
   
2. **Managing Completed Tasks**
   - Restoring tasks
   - Permanent deletion
   - Viewing completion statistics

### History View (3 steps)
1. **Task History Overview**
   - How to access history
   - What information is tracked
   
2. **Filtering History**
   - Date range selection
   - Task type filters
   - Search functionality
   
3. **Exporting History**
   - Export formats (CSV, JSON)
   - How to use exported data
   - Privacy considerations

### Conclusion (1 step)
- **Tour Complete**
  - Recap of key features
  - Where to find help
  - Option to restart tour later

## Technical Implementation

### State Management
```javascript
// Tour context structure
{
  active: boolean,
  currentStep: number,
  totalSteps: number,
  stepData: {
    [stepId]: {
      title: string,
      description: string,
      targetElement: string, // CSS selector or ref
      position: 'top' | 'right' | 'bottom' | 'left',
      spotlightRadius: number,
      actions: Array<{
        label: string,
        action: 'next' | 'prev' | 'skip' | 'custom',
        handler?: Function
      }>
    }
  }
}
```

### Component Integration
1. Add TourProvider to App component
2. Inject tour-related props to relevant components
3. Add data-tour-id attributes to elements that will be highlighted
4. Create refs for complex elements that need highlighting

### Animation and Transitions
- Use Framer Motion for smooth transitions between steps
- Implement fade in/out effects for overlay and dialog
- Add subtle animations for spotlight effect

### Accessibility Considerations
- Ensure keyboard navigation works throughout the tour
- Add appropriate ARIA attributes
- Ensure color contrast meets WCAG standards
- Provide skip options for users who want to bypass certain steps

## Implementation Phases

### Phase 1: Core Infrastructure
1. Create TourContext and TourProvider
2. Implement basic state management
3. Add tour button to UI
4. Create skeleton overlay and dialog components

### Phase 2: Tour Content
1. Define all tour steps and content
2. Create professional copy for each step
3. Design visual assets needed for the tour

### Phase 3: Visual Implementation
1. Implement spotlight effect
2. Add animations and transitions
3. Style dialog and controls
4. Ensure responsive behavior

### Phase 4: Integration and Testing
1. Connect tour to actual app features
2. Test on different devices and screen sizes
3. Gather feedback and refine
4. Add analytics to track tour completion rates

## Files to Create/Modify

### New Files
1. `src/contexts/TourContext.jsx`
2. `src/components/Tour/TourProvider.jsx`
3. `src/components/Tour/TourOverlay.jsx`
4. `src/components/Tour/TourDialog.jsx`
5. `src/components/Tour/TourButton.jsx`
6. `src/components/Tour/TourSpotlight.jsx`
7. `src/data/tourSteps.js` (tour content)
8. `src/hooks/useTour.js` (custom hook for components to interact with tour)

### Files to Modify
1. `src/App.jsx` (add TourProvider)
2. `src/views/MatrixView.jsx` (add tour button, data-tour-id attributes)
3. `src/components/TaskModal.jsx` (add data-tour-id attributes)
4. `src/views/CompletedView.jsx` (add data-tour-id attributes)
5. `src/views/HistoryView.jsx` (add data-tour-id attributes)

## Next Steps
1. Review this implementation plan
2. Prioritize features for initial implementation
3. Create detailed designs for tour UI components
4. Begin implementation with core infrastructure 