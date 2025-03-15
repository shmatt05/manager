import React, { useEffect, useState } from 'react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { getFirestore, collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import HistoryEntry from '../components/HistoryEntry';
import { config } from '../config';
import { db, isFirebaseReady } from '../firebase';

export default function HistoryView() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });
  const [selectedActions, setSelectedActions] = useState({
    CREATE: true,
    UPDATE: true,
    DELETE: true,
    COMPLETE: true,
    REOPEN: true
  });
  const { user } = useAuth();
  const [limitCount, setLimitCount] = useState(20);
  const { isProd, useFirebase } = config;

  useEffect(() => {
    // For development or when Firebase is not used
    if (!useFirebase) {
      try {
        const localHistory = JSON.parse(localStorage.getItem('taskHistory') || '[]');
        setHistory(localHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
        setLoading(false);
      } catch (error) {
        console.error('Error loading history from localStorage:', error);
        setError('Failed to load history data');
        setLoading(false);
      }
      return;
    }

    // For production with Firebase
    if (useFirebase && user) {
      if (!isFirebaseReady()) {
        setError('Firebase is not initialized');
        setLoading(false);
        return;
      }

      try {
        const historyRef = collection(db, `users/${user.uid}/taskHistory`);
        const q = query(historyRef, orderBy('timestamp', 'desc'), limit(100));
        
        const unsubscribe = onSnapshot(q, 
          (snapshot) => {
            const historyData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setHistory(historyData);
            setLoading(false);
          }, 
          (error) => {
            console.error('Error fetching history:', error);
            setError('Failed to load history data');
            setLoading(false);
          }
        );
        
        return () => unsubscribe();
      } catch (error) {
        console.error('Error setting up history listener:', error);
        setError('Failed to initialize history view');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [user, useFirebase]);

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'UPDATE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'DELETE': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      case 'COMPLETE': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
      case 'REOPEN': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const handleExportHistory = (filtered = false) => {
    try {
      // Determine which history data to use
      // When using Firebase, export the current loaded data
      // When using localStorage, get all history
      let historyToExport = useFirebase 
        ? [...history] 
        : JSON.parse(localStorage.getItem('taskHistory') || '[]');
      
      // Apply filters if requested
      if (filtered) {
        // Filter by date range if needed
        if (dateRange.from && dateRange.to) {
          historyToExport = historyToExport.filter(entry => {
            const entryDate = parseISO(entry.timestamp);
            return isWithinInterval(entryDate, {
              start: parseISO(dateRange.from),
              end: parseISO(dateRange.to)
            });
          });
        }
        
        // Filter by action types
        historyToExport = historyToExport.filter(entry => 
          entry.action && selectedActions[entry.action]
        );
      }
      
      // Create a Blob with the JSON data
      const historyBlob = new Blob(
        [JSON.stringify(historyToExport, null, 2)], 
        { type: 'application/json' }
      );
      
      // Create download link
      const url = URL.createObjectURL(historyBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `task-history-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting history:', error);
      setError('Failed to export history');
    }
  };

  const loadMore = () => {
    setLimitCount(prev => prev + 20);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-background transition-colors duration-200 p-3 sm:p-4 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-surface-200 border-t-primary-500 dark:border-dark-surface-6 dark:border-t-primary-400 animate-spin mb-4"></div>
          <div className="text-surface-600 dark:text-dark-text-secondary">Loading history...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-background transition-colors duration-200 p-3 sm:p-4">
        <div className="bg-error/5 dark:bg-error/10 border-l-4 border-error dark:border-error/80 text-error dark:text-error/90 px-4 py-3 rounded-r-lg shadow-dp1 flex items-center">
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-3 sm:p-4 overflow-auto dark:bg-dark-background">
      <div className="max-w-6xl mx-auto w-full">
        {/* App bar with Material Design styling */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-surface-200 dark:border-dark-surface-6 sticky top-0 z-10 bg-white/90 dark:bg-dark-background/90 backdrop-blur-sm">
          <h1 className="text-2xl font-medium text-surface-800 dark:text-dark-text-primary select-none">
            Task History
          </h1>
          
          {history.length > 0 && (
            <button 
              onClick={() => setShowExport(!showExport)}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 active:bg-primary-700
                dark:bg-primary-600 dark:hover:bg-primary-500 dark:active:bg-primary-700
                text-white rounded-md shadow-dp1 hover:shadow-dp2 active:shadow-dp1
                text-sm font-medium transition-all duration-200
                flex items-center gap-2 relative overflow-hidden"
            >
              <span className="select-none">{showExport ? 'Hide Export Options' : 'Export History'}</span>
            </button>
          )}
        </div>
      
      {/* Export options with Material Design card styling */}
      {showExport && (
        <div className="bg-surface-50 dark:bg-dark-surface-2 shadow-dp2 dark:shadow-dp1 rounded-lg mb-4 animate-scale-in overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-200 dark:border-dark-surface-6">
            <h2 className="text-lg font-medium text-surface-800 dark:text-dark-text-primary select-none">Export Options</h2>
          </div>
          
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Date range selection with floating labels */}
              <div>
                <h3 className="text-md font-medium mb-3 text-surface-700 dark:text-dark-text-secondary select-none">Date Range</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="absolute left-3 -top-2.5 bg-surface-50 dark:bg-dark-surface-2 px-1 text-xs font-medium text-primary-600 dark:text-primary-400">
                      From
                    </label>
                    <input 
                      type="date" 
                      value={dateRange.from}
                      onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                      className="w-full px-3 py-2.5 border border-surface-300 dark:border-dark-surface-8
                        rounded-md bg-surface-50 dark:bg-dark-surface-3
                        text-surface-800 dark:text-dark-text-primary
                        focus:ring-2 focus:ring-primary-400 dark:focus:ring-primary-400/50 focus:border-primary-400 dark:focus:border-primary-500
                        transition-all duration-200"
                    />
                  </div>
                  <div className="relative">
                    <label className="absolute left-3 -top-2.5 bg-surface-50 dark:bg-dark-surface-2 px-1 text-xs font-medium text-primary-600 dark:text-primary-400">
                      To
                    </label>
                    <input 
                      type="date" 
                      value={dateRange.to}
                      onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                      className="w-full px-3 py-2.5 border border-surface-300 dark:border-dark-surface-8
                        rounded-md bg-surface-50 dark:bg-dark-surface-3
                        text-surface-800 dark:text-dark-text-primary
                        focus:ring-2 focus:ring-primary-400 dark:focus:ring-primary-400/50 focus:border-primary-400 dark:focus:border-primary-500
                        transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
              
              {/* Action type checkboxes with Material Design styling */}
              <div>
                <h3 className="text-md font-medium mb-3 text-surface-700 dark:text-dark-text-secondary select-none">Action Types</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(selectedActions).map(action => {
                    const colorClasses = {
                      CREATE: 'bg-success/10 text-success dark:bg-success/20 dark:text-success/90',
                      UPDATE: 'bg-primary-500/10 text-primary-700 dark:bg-primary-500/20 dark:text-primary-400',
                      DELETE: 'bg-error/10 text-error dark:bg-error/20 dark:text-error/90',
                      COMPLETE: 'bg-primary-900/10 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300',
                      REOPEN: 'bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning/90',
                    }[action] || 'bg-surface-200 text-surface-700 dark:bg-dark-surface-4 dark:text-dark-text-secondary';
                    
                    return (
                      <div key={action} className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id={`action-${action}`}
                          checked={selectedActions[action]}
                          onChange={() => setSelectedActions({
                            ...selectedActions, 
                            [action]: !selectedActions[action]
                          })}
                          className="h-4 w-4 text-primary-500 dark:text-primary-500 rounded border-surface-300 dark:border-dark-surface-6 dark:bg-dark-surface-4 focus:ring-primary-500 dark:focus:ring-primary-400"
                        />
                        <label htmlFor={`action-${action}`} className={`text-sm font-medium ${colorClasses} inline-block px-2 py-0.5 rounded-pill select-none`}>
                          {action}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Action buttons with Material Design styling */}
            <div className="mt-5 flex gap-3 justify-end">
              <button 
                onClick={() => handleExportHistory(false)}
                className="px-4 py-2 bg-surface-200 hover:bg-surface-300 dark:bg-dark-surface-4 dark:hover:bg-dark-surface-6 
                  text-surface-800 dark:text-dark-text-primary rounded-md text-sm font-medium 
                  transition-colors relative overflow-hidden"
              >
                <span className="select-none">Export All History</span>
              </button>
              <button 
                onClick={() => handleExportHistory(true)}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 active:bg-primary-700
                  dark:bg-primary-600 dark:hover:bg-primary-500 dark:active:bg-primary-700
                  text-white rounded-md shadow-dp1 hover:shadow-dp2 active:shadow-dp1
                  text-sm font-medium transition-all duration-200"
              >
                <span className="select-none">Export Filtered History</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* History list with Material Design cards */}
      {history.length === 0 ? (
        <div className="bg-surface-50 dark:bg-dark-surface-2 shadow-dp2 dark:shadow-dp1 rounded-lg p-6 text-center">
          <div className="flex flex-col items-center justify-center py-8 text-surface-500 dark:text-dark-text-secondary">
            <svg className="w-12 h-12 mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm select-none">No history available</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map(entry => (
            <HistoryEntry key={entry.id || entry.timestamp} entry={entry} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
} 