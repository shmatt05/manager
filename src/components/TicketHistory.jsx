import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseReady } from '../firebase';

export default function TicketHistory({ taskId }) {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const isProd = import.meta.env.PROD;

  useEffect(() => {
    if (!taskId) return;

    // Get all history and filter for this ticket
    const loadHistory = () => {
      try {
        const allHistory = JSON.parse(localStorage.getItem('taskHistory') || '[]');
        // Filter history for this specific ticket
        const ticketHistory = allHistory.filter(entry => 
          entry.ticketData.id === taskId
        );
        setHistory(ticketHistory);
      } catch (error) {
        console.error('Error loading ticket history:', error);
        setError('Failed to load history');
      }
    };

    // Use localStorage for local development
    if (!isProd) {
      loadHistory();
      return;
    }

    // Use Firestore for production
    if (isProd) {
      if (!isFirebaseReady()) {
        console.error('Firebase is not initialized');
        setError('Firebase initialization error');
        return;
      }

      if (!user) {
        setHistory([]);
        return;
      }

      try {
        const historyRef = collection(db, `users/${user.uid}/taskHistory`);
        const q = query(historyRef, where('ticketData.id', '==', taskId));
        
        const unsubscribe = onSnapshot(q, 
          (snapshot) => {
            const historyData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setHistory(historyData);
          }, 
          (error) => {
            console.error('Firestore error:', error);
            setError(`Failed to load history: ${error.message}`);
          }
        );

        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error('Error setting up history listener:', error);
        setError(`Failed to initialize history: ${error.message}`);
      }
    }
  }, [taskId, user, isProd]);

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'UPDATE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'DELETE': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'COMPLETE': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'REOPEN': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (error) {
    return <div className="text-red-600 p-4 rounded-md bg-red-50 dark:bg-red-900/20">{error}</div>;
  }

  return (
    <div className="max-h-[60vh] overflow-y-auto pr-2 scrollbar-subtle">
      {history.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No history available for this task</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((entry) => (
            <div key={entry.id} className="bg-white dark:bg-dark-surface-3 border border-gray-200 dark:border-dark-surface-6 rounded-lg p-4 shadow-subtle">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${getActionColor(entry.action)}`}>
                  {entry.action}
                </span>
                <span className="text-gray-500 dark:text-dark-text-secondary text-sm">
                  {format(new Date(entry.timestamp), 'MMM d, yyyy • h:mm a')}
                </span>
              </div>
              
              {entry.changes && entry.changes.length > 0 && (
                <div className="mt-3 text-sm border-t border-gray-100 dark:border-dark-surface-6 pt-3">
                  <p className="font-medium text-gray-700 dark:text-dark-text-primary mb-2">Changes:</p>
                  <div className="space-y-2">
                    {entry.changes.map((change, idx) => (
                      <div key={idx} className="pl-3 border-l-2 border-gray-200 dark:border-dark-surface-6">
                        <div className="font-medium text-gray-700 dark:text-dark-text-primary">{change.field}</div>
                        <div className="flex flex-col gap-1 mt-1">
                          <div className="line-through text-red-600 dark:text-red-400 text-sm">
                            {change.oldValue || '(empty)'}
                          </div>
                          <div className="text-green-600 dark:text-green-400 text-sm">
                            {change.newValue || '(empty)'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 