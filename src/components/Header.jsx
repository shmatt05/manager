import React, { useState, useEffect, useRef } from 'react';
import { config } from '../config';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

function Header({ children, tabs, activeTab, onTabChange, onSendAllToBacklog }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { user, signOut } = useAuth();
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    if (signOut) {
      signOut();
    }
    setMenuOpen(false);
  };

  return (
    <div className="dark:bg-dark-background border-b border-gray-200 dark:border-gray-800">
      <header className="bg-white dark:bg-[#1A1A1F] px-2 py-1">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center">
            <span className="font-['VT323'] text-[1.5rem] mr-1 text-blue-600 dark:text-blue-400 select-none">
              TØ
            </span>
            <h1 className="text-base font-semibold dark:text-dark-text-primary select-none">Task Zero</h1>
          </div>
          
          <div className="flex-1 flex justify-center max-w-2xl mx-4">
            {children} {/* TaskCreate component */}
          </div>
          
          <div className="flex items-center">
            {/* Send All to Backlog button - smaller to match user icon */}
            {activeTab === 'matrix' && onSendAllToBacklog && (
              <button
                onClick={onSendAllToBacklog}
                className="mr-2 h-[26px] px-2 text-[11px] bg-gray-100 hover:bg-white dark:bg-dark-surface-4 dark:hover:bg-dark-surface-3 text-gray-700 hover:text-gray-900 dark:text-dark-text-primary dark:hover:text-dark-text-primary rounded flex items-center transition-all duration-200 hover:shadow-sm group select-none"
                title="Move all tasks from all quadrants to the backlog"
              >
                <svg className="w-3 h-3 mr-1 text-gray-600 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Send All to Backlog
              </button>
            )}
            
            {user && (
              <div ref={menuRef} className="relative flex">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center justify-center p-1 rounded-full border-none cursor-pointer bg-gray-100 dark:bg-gray-700 w-[26px] h-[26px] text-xs dark:text-dark-text-primary select-none"
                >
                  {user.email ? user.email[0].toUpperCase() : 'U'}
                </button>

                {menuOpen && (
                  <div className="absolute top-full mt-1 right-0 bg-white dark:bg-dark-surface-2 rounded-md shadow-medium border border-gray-200 dark:border-gray-700 min-w-[180px] z-50 select-none">
                    <div className="p-1.5 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-dark-text-secondary text-xs select-none">
                      {user.email}
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left p-1.5 border-none bg-transparent cursor-pointer text-red-600 dark:text-red-400 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 select-none"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className="bg-white dark:bg-[#1A1A1F] px-2 pt-0.5 pb-0">
        <div className="max-w-6xl mx-auto w-full flex gap-3">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                "py-1 text-xs font-medium border-b-2 cursor-pointer transition-colors bg-transparent select-none",
                activeTab === tab.id 
                  ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400" 
                  : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default Header; 