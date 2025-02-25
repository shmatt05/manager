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
      case 'CREATE': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-blue-100 text-blue-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'COMPLETE': return 'bg-purple-100 text-purple-800';
      case 'REOPEN': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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
      <div className="p-6 flex justify-center">
        <div className="animate-pulse">Loading history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Task History</h1>
        
        {history.length > 0 && (
          <button 
            onClick={() => setShowExport(!showExport)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <span>{showExport ? 'Hide Export Options' : 'Export History'}</span>
          </button>
        )}
      </div>
      
      {showExport && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Export Options</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date range selection */}
            <div>
              <h3 className="text-md font-medium mb-3">Date Range</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <input 
                    type="date" 
                    value={dateRange.from}
                    onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <input 
                    type="date" 
                    value={dateRange.to}
                    onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
            
            {/* Action type checkboxes */}
            <div>
              <h3 className="text-md font-medium mb-3">Action Types</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(selectedActions).map(action => (
                  <div key={action} className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id={`action-${action}`}
                      checked={selectedActions[action]}
                      onChange={() => setSelectedActions({
                        ...selectedActions, 
                        [action]: !selectedActions[action]
                      })}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                    <label htmlFor={`action-${action}`} className={`text-sm font-medium ${getActionColor(action)} inline-block px-2 py-1 rounded`}>
                      {action}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex gap-4">
            <button 
              onClick={() => handleExportHistory(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Export All History
            </button>
            <button 
              onClick={() => handleExportHistory(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Export Filtered History
            </button>
          </div>
        </div>
      )}
      
      {history.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-500">
          No history available
        </div>
      ) : (
        <div className="space-y-4">
          {history.map(entry => (
            <HistoryEntry key={entry.id || entry.timestamp} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
} 