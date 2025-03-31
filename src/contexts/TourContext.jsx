import React, { createContext, useState, useContext, useCallback, useRef, useEffect } from 'react';

const TourContext = createContext();

export const useTour = () => useContext(TourContext);

export const TourProvider = ({ children }) => {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const cooldownRef = useRef(false);
  const hasProcessedStepThreeRef = useRef(false);
  const [lastCreatedTaskId, setLastCreatedTaskId] = useState(null);
  const [tourSteps, setTourSteps] = useState([
    {
      target: '.matrix-container',
      title: 'The Eisenhower Matrix',
      content: 'This is the Eisenhower Matrix. It helps you prioritize tasks based on their urgency and importance. The matrix has four quadrants: Do (urgent & important), Schedule (important, not urgent), Delegate (urgent, not important), and Eliminate (not urgent or important).',
      disableBeacon: true,
      placement: 'center',
      spotlightPadding: 20,
      styles: {
        tooltip: {
          maxWidth: '350px',
          zIndex: 10000,
        },
      },
    },
    {
      target: '.task-create-form',
      title: 'Creating Tasks',
      content: 'Create new tasks here. Type your task title and click "Add" or press Enter. You can add tags with # and set time with @. For example: "Review reports @2pm #do" will create a task in the "Do" quadrant with a due time of 2pm.',
      disableBeacon: true,
      placement: 'bottom',
      spotlightPadding: 5,
      hideFooter: true,
      showSkipButton: true,
      styles: {
        tooltip: {
          maxWidth: '350px',
          zIndex: 10000,
        },
      },
    },
    {
      target: '.matrix-container',
      title: 'Task Details',
      content: 'After creating a task, click on it to open the task details modal where you can edit the title, add a description, set a due date, and manage tags.',
      disableBeacon: true,
      placement: 'center',
      spotlightPadding: 20,
      styles: {
        tooltip: {
          maxWidth: '350px',
          zIndex: 10000,
        },
      },
    },
    {
      target: '.matrix-container',
      title: 'Dragging Tasks',
      content: 'You can drag tasks between quadrants to change their priority. For example, drag a task from "Do" to "Schedule" if it\'s important but not urgent.',
      disableBeacon: true,
      placement: 'center',
      spotlightPadding: 20,
      styles: {
        tooltip: {
          maxWidth: '350px',
          zIndex: 10000,
        },
      },
    },
    {
      target: '#urgent-important',
      title: 'Context Menu',
      content: 'Right-click on a task to open the context menu with more options, including moving to different quadrants, marking as complete, or deleting the task.',
      disableBeacon: true,
      placement: 'right',
      spotlightPadding: 20,
      styles: {
        tooltip: {
          maxWidth: '350px',
          zIndex: 10000,
          position: 'relative',
          left: '50px',
        },
      },
    },
    {
      target: '[data-tour-id="completed-tab"]',
      title: 'Completed Tasks',
      content: 'When you mark a task as complete, it moves to the Completed tab. Here you can see all your completed tasks organized by date.',
      disableBeacon: true,
      placement: 'right',
      spotlightPadding: 20,
      disableOverlay: true,
      showArrow: false,
      styles: {
        tooltip: {
          maxWidth: '350px',
          zIndex: 10000,
          position: 'fixed',
          right: '20px',
          left: 'auto',
          top: '50%',
          transform: 'translateY(-50%)',
        },
        overlay: {
          backgroundColor: 'transparent',
        },
      },
      floaterProps: {
        disableAnimation: true,
        showArrow: false,
        styles: {
          floater: {
            position: 'fixed',
            right: '20px',
            left: 'auto',
            top: '50%',
            transform: 'translateY(-50%)',
          }
        }
      },
    },
    {
      target: '[data-tour-id="history-tab"]',
      title: 'Task History',
      content: 'The History tab shows a log of all actions performed on your tasks, including creation, updates, completion, and deletion.',
      disableBeacon: true,
      placement: 'right',
      spotlightPadding: 20,
      disableOverlay: true,
      showArrow: false,
      styles: {
        tooltip: {
          maxWidth: '350px',
          zIndex: 10000,
          position: 'fixed',
          right: '20px',
          left: 'auto',
          top: '50%',
          transform: 'translateY(-50%)',
        },
        overlay: {
          backgroundColor: 'transparent',
        },
      },
      floaterProps: {
        disableAnimation: true,
        showArrow: false,
        styles: {
          floater: {
            position: 'fixed',
            right: '20px',
            left: 'auto',
            top: '50%',
            transform: 'translateY(-50%)',
          }
        }
      },
    },
    {
      target: '[data-tour-id="export-options"]',
      title: 'Export History',
      content: 'You can export your task history as a JSON file. Click the Export History button to see options for filtering by date range and action types before exporting.',
      disableBeacon: true,
      placement: 'bottom',
      spotlightPadding: 20,
      disableOverlay: true,
      styles: {
        tooltip: {
          maxWidth: '350px',
          zIndex: 10000,
        },
        overlay: {
          backgroundColor: 'transparent',
        },
      },
    }
  ]);

  // Listen for task creation events during the tour
  useEffect(() => {
    const handleTourAddTask = (event) => {
      if (event.detail && event.detail.task && event.detail.task.id) {
        console.log('TourContext: Tracking newly created task:', event.detail.task.id);
        setLastCreatedTaskId(event.detail.task.id);
      }
    };

    // Add event listener
    document.addEventListener('tour:add-task', handleTourAddTask);

    // Clean up
    return () => {
      document.removeEventListener('tour:add-task', handleTourAddTask);
    };
  }, []);

  // Reset the hasProcessedStepThreeRef when the tour step changes
  useEffect(() => {
    if (tourStep !== 2) {
      hasProcessedStepThreeRef.current = false;
    }
  }, [tourStep]);

  // Handle automatic task modal opening for step 3
  useEffect(() => {
    // Only proceed if we're on step 3 and have a last created task
    if (isTourOpen && tourStep === 2 && lastCreatedTaskId) {
      console.log('TourContext: On step 3, attempting to open modal for task:', lastCreatedTaskId);

      // Only proceed if we haven't processed this step yet
      if (hasProcessedStepThreeRef.current) {
        return;
      }

      hasProcessedStepThreeRef.current = true;

      // Give the UI a moment to update
      const timeout = setTimeout(() => {
        // Find the task card for the created task
        const taskCards = document.querySelectorAll('.task-card');
        let targetCard = null;

        console.log('TourContext: Looking for task card with ID:', lastCreatedTaskId);

        // Iterate through cards to find the one with our task
        taskCards.forEach(card => {
          const cardId = card.getAttribute('data-task-id') || card.id;
          console.log('TourContext: Checking card:', cardId);

          if (cardId && (cardId === lastCreatedTaskId || cardId.includes(lastCreatedTaskId))) {
            console.log('TourContext: Found matching task card:', cardId);
            targetCard = card;
          }
        });

        // If we found the card, click it
        if (targetCard) {
          console.log('TourContext: Clicking task card to open modal');
          targetCard.click();

          // Tag the modal for tour targeting
          setTimeout(() => {
            const modal = document.querySelector('.task-modal') || 
                         document.querySelector('.modal') || 
                         document.querySelector('div[role="dialog"]');
            if (modal) {
              console.log('TourContext: Found and tagged modal for tour');

              // Log modal dimensions and position
              const modalRect = modal.getBoundingClientRect();
              console.log('TourContext: Modal dimensions:', {
                top: modalRect.top,
                left: modalRect.left,
                width: modalRect.width,
                height: modalRect.height,
                bottom: modalRect.bottom,
                right: modalRect.right
              });

              modal.setAttribute('data-tour-id', 'task-modal');

              // Update the target for step 3 to be positioned at the top-center of the screen
              const updatedSteps = [...tourSteps];
              updatedSteps[2] = {
                ...updatedSteps[2],
                target: '[data-tour-id="task-modal"]', // Target the modal directly
                placement: 'top',
                floaterProps: {
                  disableAnimation: true,
                  offset: 0,
                  styles: {
                    floater: {
                      position: 'fixed',
                      top: '20px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      margin: 0,
                    }
                  }
                },
                styles: {
                  options: {
                    zIndex: 11000,
                  },
                  tooltip: {
                    maxWidth: '350px',
                    position: 'fixed',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 11000,
                    margin: 0,
                  },
                  overlay: {
                    backgroundColor: 'transparent', // Make overlay completely transparent
                  },
                },
                spotlightClicks: true,
                disableOverlayClose: true,
                disableOverlay: true,
                spotlightPadding: 0,
              };
              setTourSteps(updatedSteps);

              // Add a MutationObserver to track when the tooltip is rendered
              const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                  if (mutation.addedNodes.length) {
                    // Check if any of the added nodes is the tooltip
                    mutation.addedNodes.forEach((node) => {
                      if (node.nodeType === 1 && (
                          node.classList.contains('react-joyride__tooltip') || 
                          node.querySelector('.react-joyride__tooltip')
                      )) {
                        const tooltip = node.classList.contains('react-joyride__tooltip') ? 
                                        node : 
                                        node.querySelector('.react-joyride__tooltip');

                        if (tooltip) {
                          // Log tooltip dimensions and position
                          const tooltipRect = tooltip.getBoundingClientRect();
                          console.log('TourContext: Tooltip rendered with dimensions:', {
                            top: tooltipRect.top,
                            left: tooltipRect.left,
                            width: tooltipRect.width,
                            height: tooltipRect.height,
                            bottom: tooltipRect.bottom,
                            right: tooltipRect.right
                          });

                          // Force position the tooltip at the top of the viewport
                          tooltip.style.position = 'fixed';
                          tooltip.style.top = '20px';
                          tooltip.style.left = '50%';
                          tooltip.style.transform = 'translateX(-50%)';
                          tooltip.style.margin = '0';
                          tooltip.style.zIndex = '11000';

                          console.log('TourContext: Forced tooltip position to top of screen');

                          // Check if tooltip overlaps with modal
                          const isOverlapping = !(
                            tooltipRect.right < modalRect.left || 
                            tooltipRect.left > modalRect.right || 
                            tooltipRect.bottom < modalRect.top || 
                            tooltipRect.top > modalRect.bottom
                          );

                          console.log('TourContext: Tooltip overlaps with modal:', isOverlapping);

                          // Disconnect observer after tooltip is found
                          observer.disconnect();
                        }
                      }
                    });
                  }
                });
              });

              // Start observing the document body for changes
              observer.observe(document.body, { childList: true, subtree: true });
            }
          }, 300);
        } else {
          console.log('TourContext: Could not find task card for created task');
        }
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [isTourOpen, tourStep, lastCreatedTaskId]);

  // Handle automatic context menu opening for step 5
  useEffect(() => {
    // Only proceed if we're on step 5 and have a last created task
    if (isTourOpen && tourStep === 4 && lastCreatedTaskId) {
      console.log('TourContext: On step 5, attempting to open context menu for task:', lastCreatedTaskId);

      // Give the UI a moment to update
      const timeout = setTimeout(() => {
        // Find the task card for the created task
        const taskCards = document.querySelectorAll('.task-card');
        let targetCard = null;

        console.log('TourContext: Looking for task card with ID:', lastCreatedTaskId);

        // Iterate through cards to find the one with our task
        taskCards.forEach(card => {
          const cardId = card.getAttribute('data-task-id') || card.id;
          console.log('TourContext: Checking card:', cardId);

          if (cardId && (cardId === lastCreatedTaskId || cardId.includes(lastCreatedTaskId))) {
            console.log('TourContext: Found matching task card:', cardId);
            targetCard = card;
          }
        });

        // If we found the card, trigger a right-click on it
        if (targetCard) {
          console.log('TourContext: Triggering context menu on task card');

          // Get the position of the card
          const rect = targetCard.getBoundingClientRect();

          // Create a custom event that mimics a right-click
          const contextMenuEvent = new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            view: window,
            button: 2,
            buttons: 2,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2
          });

          // Dispatch the event on the target card
          targetCard.dispatchEvent(contextMenuEvent);
        } else {
          console.log('TourContext: Could not find task card for context menu');
        }
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [isTourOpen, tourStep, lastCreatedTaskId]);

  // Handle completing task and navigating to completed tab for step 6
  useEffect(() => {
    // Only proceed if we're moving from step 5 to step 6
    if (isTourOpen && tourStep === 5 && lastCreatedTaskId) {
      console.log('TourContext: On step 6, completing task and navigating to completed tab');

      // Give the UI a moment to update
      const timeout = setTimeout(() => {
        // Instead of finding and clicking the button, directly dispatch a custom event
        // to complete the task
        console.log('TourContext: Dispatching tour:complete-task event for task:', lastCreatedTaskId);
        document.dispatchEvent(new CustomEvent('tour:complete-task', { 
          detail: { taskId: lastCreatedTaskId } 
        }));

        // Navigate to the completed tab with a shorter timeout
        setTimeout(() => {
          // Dispatch a custom event to change the tab
          console.log('TourContext: Dispatching tour:change-tab event to completed tab');
          document.dispatchEvent(new CustomEvent('tour:change-tab', { 
            detail: { tab: 'completed' } 
          }));
        }, 300); // Reduced from 1500ms to 300ms for quicker transition
      }, 200); // Reduced from 1000ms to 200ms for quicker transition

      return () => clearTimeout(timeout);
    }
  }, [isTourOpen, tourStep, lastCreatedTaskId]);

  // Handle navigating to history tab for step 7
  useEffect(() => {
    // Only proceed if we're moving from step 6 to step 7
    if (isTourOpen && tourStep === 6) {
      console.log('TourContext: On step 7, navigating to history tab');

      // Give the UI a moment to update
      const timeout = setTimeout(() => {
        // Find the history tab button and click it
        const historyTabButton = document.querySelector('button[data-tour-id="history-tab"]');
        if (historyTabButton) {
          console.log('TourContext: Found history tab button, clicking it');
          historyTabButton.click();
        } else {
          // Alternative approach: find the tab by text content
          const tabButtons = document.querySelectorAll('button');
          let foundButton = null;

          tabButtons.forEach(button => {
            if (button.textContent.includes('History')) {
              foundButton = button;
            }
          });

          if (foundButton) {
            console.log('TourContext: Found history tab button (alternative method), clicking it');
            foundButton.click();

            // Add the data-tour-id attribute to the button for future steps
            foundButton.setAttribute('data-tour-id', 'history-tab');
          } else {
            console.log('TourContext: Could not find history tab button');

            // Dispatch a custom event to change the tab
            document.dispatchEvent(new CustomEvent('tour:change-tab', { 
              detail: { tab: 'history' } 
            }));
          }
        }
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [isTourOpen, tourStep]);

  // Handle showing export functionality for step 8
  useEffect(() => {
    // Only proceed if we're moving from step 7 to step 8
    if (isTourOpen && tourStep === 7) {
      console.log('TourContext: On step 8, showing export functionality');

      // Give the UI a moment to update
      const timeout = setTimeout(() => {
        // Find the export button and click it
        const exportButton = document.querySelector('button[data-tour-id="export-options"]');
        if (exportButton) {
          console.log('TourContext: Found export button, clicking it');
          exportButton.click();
        } else {
          // Alternative approach: find the button by text content
          const buttons = document.querySelectorAll('button');
          let foundButton = null;

          buttons.forEach(button => {
            if (button.textContent.includes('Export History')) {
              foundButton = button;
            }
          });

          if (foundButton) {
            console.log('TourContext: Found export button (alternative method), clicking it');
            foundButton.click();

            // Add the data-tour-id attribute to the button for future steps
            foundButton.setAttribute('data-tour-id', 'export-options');

            // Also add data-tour-id to the export options container
            setTimeout(() => {
              const exportOptions = document.querySelector('.bg-surface-50.dark\\:bg-dark-surface-2.shadow-dp2.dark\\:shadow-dp1.rounded-lg.mb-4');
              if (exportOptions) {
                exportOptions.setAttribute('data-tour-id', 'export-options');
              }
            }, 300);
          } else {
            console.log('TourContext: Could not find export button');

            // Dispatch a custom event to show export options
            document.dispatchEvent(new CustomEvent('tour:show-export', {}));
          }
        }
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [isTourOpen, tourStep]);

  const startTour = useCallback(() => {
    setTourStep(0);
    setIsTourOpen(true);
    hasProcessedStepThreeRef.current = false;
  }, []);

  const stopTour = useCallback(() => {
    setIsTourOpen(false);
    setLastCreatedTaskId(null);
    hasProcessedStepThreeRef.current = false;
  }, []);

  const nextStep = useCallback(() => {
    console.log('TourContext: nextStep called, current step:', tourStep);

    // If we're on step 1 and a task was just created, we should always allow advancement
    // This fixes the issue where the second nextStep call is ignored due to cooldown
    const isTaskCreationStep = tourStep === 1;

    if (cooldownRef.current && !isTaskCreationStep) {
      console.log('TourContext: Ignoring nextStep call - cooldown active');
      return;
    }

    // Set cooldown to prevent rapid multiple advancements
    cooldownRef.current = true;

    // Check if we're moving from step 3 to step 4 (index 2 to 3)
    if (tourStep === 2) {
      console.log('TourContext: Moving from step 3 to step 4, dispatching close-modal event');
      // Dispatch a custom event to close the modal
      document.dispatchEvent(new CustomEvent('tour:close-modal'));
    }

    setTourStep(prevStep => {
      const newStep = prevStep + 1;
      console.log('TourContext: Advancing from step', prevStep, 'to', newStep);
      return newStep;
    });

    // Reset cooldown after 1 second
    setTimeout(() => {
      cooldownRef.current = false;
      console.log('TourContext: Step advancement cooldown reset');
    }, 1000);
  }, [tourStep]);

  const prevStep = useCallback(() => {
    if (cooldownRef.current) {
      console.log('TourContext: Ignoring prevStep call - cooldown active');
      return;
    }

    // Set cooldown to prevent rapid multiple advancements
    cooldownRef.current = true;

    setTourStep(prevStep => Math.max(prevStep - 1, 0));

    // Reset cooldown after 1 second
    setTimeout(() => {
      cooldownRef.current = false;
    }, 1000);
  }, []);

  const goToStep = useCallback((step) => {
    if (cooldownRef.current) {
      console.log('TourContext: Ignoring goToStep call - cooldown active');
      return;
    }

    // Set cooldown to prevent rapid multiple advancements
    cooldownRef.current = true;

    setTourStep(step);

    // Reset cooldown after 1 second
    setTimeout(() => {
      cooldownRef.current = false;
    }, 1000);
  }, []);

  const handleJoyrideCallback = useCallback((data) => {
    const { action, index, status, type } = data;

    if (type === 'step:after' && action === 'next') {
      nextStep();
    } else if (type === 'step:after' && action === 'prev') {
      prevStep();
    } else if (status === 'finished' || status === 'skipped') {
      stopTour();
    }
  }, [nextStep, prevStep, stopTour]);

  return (
    <TourContext.Provider
      value={{
        isTourOpen,
        tourStep,
        tourSteps,
        startTour,
        stopTour,
        nextStep,
        prevStep,
        goToStep,
        handleJoyrideCallback,
        lastCreatedTaskId,
        setLastCreatedTaskId,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export default TourContext;
