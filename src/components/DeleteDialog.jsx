import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function DeleteDialog({ isOpen, onClose, onConfirm, taskTitle }) {
  // Ripple effect for buttons
  const [ripplePos, setRipplePos] = useState({ delete: null, cancel: null });
  const [showRipple, setShowRipple] = useState({ delete: false, cancel: false });
  
  const handleBtnMouseDown = (buttonType, e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setRipplePos({ ...ripplePos, [buttonType]: { x, y } });
    setShowRipple({ ...showRipple, [buttonType]: true });
    
    setTimeout(() => {
      setShowRipple({ ...showRipple, [buttonType]: false });
    }, 600);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Google Material Design backdrop with subtle blur */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-225"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-195"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-225"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-195"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-dark-surface-2 text-left shadow-dp16 dark:shadow-dp8 transition-all sm:my-8 sm:w-full sm:max-w-lg animate-scale-in">
                {/* Header section with Material Design styling */}
                <div className="bg-surface-50 dark:bg-dark-surface-3 px-5 py-4 border-b border-surface-200 dark:border-dark-surface-6">
                  <Dialog.Title as="h3" className="text-lg font-medium text-surface-800 dark:text-dark-text-primary select-none">
                    Delete Task
                  </Dialog.Title>
                </div>
                
                {/* Content section with Material Design spacing */}
                <div className="px-5 py-4 sm:p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-error/10 dark:bg-error/15 mr-4">
                      <ExclamationTriangleIcon className="h-6 w-6 text-error dark:text-error/90" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-surface-700 dark:text-dark-text-secondary mb-1 select-none">
                        Are you sure you want to delete this task?
                      </p>
                      <p className="text-sm text-surface-600 dark:text-dark-text-secondary select-none">
                        <span className="font-medium">"{taskTitle}"</span> will be permanently removed.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Action buttons with Material Design styling */}
                <div className="bg-surface-50 dark:bg-dark-surface-3 px-5 py-3 flex justify-end gap-3 border-t border-surface-200 dark:border-dark-surface-6">
                  {/* Cancel button with ripple effect */}
                  <button
                    type="button"
                    className="px-5 py-2.5 text-surface-600 dark:text-dark-text-primary bg-surface-50 dark:bg-dark-surface-4 hover:bg-surface-100 dark:hover:bg-dark-surface-6 rounded-md transition-colors font-medium relative overflow-hidden"
                    onClick={onClose}
                    onMouseDown={(e) => handleBtnMouseDown('cancel', e)}
                  >
                    <span className="select-none">Cancel</span>
                    {showRipple.cancel && (
                      <span 
                        className="absolute rounded-full animate-ripple bg-surface-500/10 dark:bg-white/10 pointer-events-none"
                        style={{
                          left: ripplePos.cancel.x - 50,
                          top: ripplePos.cancel.y - 50,
                          width: 100,
                          height: 100
                        }}
                      />
                    )}
                  </button>
                  
                  {/* Delete button with ripple effect */}
                  <button
                    type="button"
                    className="px-6 py-2.5 bg-error text-white rounded-md hover:bg-error/90 shadow-sm dark:bg-error dark:hover:bg-error/90 transition-colors font-medium relative overflow-hidden"
                    onClick={onConfirm}
                    onMouseDown={(e) => handleBtnMouseDown('delete', e)}
                  >
                    <span className="select-none">Delete</span>
                    {showRipple.delete && (
                      <span 
                        className="absolute rounded-full animate-ripple bg-white/20 pointer-events-none"
                        style={{
                          left: ripplePos.delete.x - 50,
                          top: ripplePos.delete.y - 50,
                          width: 100,
                          height: 100
                        }}
                      />
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 