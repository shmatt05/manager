import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseReady } from '../firebase';

const TicketHistory = ({ ticketId }) => {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const isProd = import.meta.env.PROD;

  useEffect(() => {
    if (!ticketId) return;

    // Get all history and filter for this ticket
    const loadHistory = () => {
      try {
        const allHistory = JSON.parse(localStorage.getItem('taskHistory') || '[]');
        // Filter history for this specific ticket
        const ticketHistory = allHistory.filter(entry => 
          entry.ticketData.id === ticketId
        );
        console.log('Ticket specific history:', ticketHistory);
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
        console.log('No user authenticated');
        setHistory([]);
        return;
      }

      try {
        console.log('Setting up history listener for ticket:', ticketId);
        const historyRef = collection(db, `users/${user.uid}/taskHistory`);
        const q = query(historyRef, where('ticketData.id', '==', ticketId));
        
        const unsubscribe = onSnapshot(q, 
          (snapshot) => {
            console.log('History snapshot received:', snapshot.size, 'documents');
            const historyData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log('Processed history data:', historyData);
            setHistory(historyData);
          }, 
          (error) => {
            console.error('Firestore error:', error);
            setError(`Failed to load history: ${error.message}`);
          }
        );

        return () => {
          console.log('Cleaning up history listener');
          unsubscribe();
        };
      } catch (error) {
        console.error('Error setting up history listener:', error);
        setError(`Failed to initialize history: ${error.message}`);
      }
    }
  }, [ticketId, user, isProd]);

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

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="max-h-[400px] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 sticky top-0 bg-white z-10 py-2">Task History</h2>
      {history.length === 0 ? (
        <p className="text-gray-500">No history available</p>
      ) : (
        <div className="space-y-4 pr-2">
          {history.map((entry) => (
            <div key={entry.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded text-sm font-medium ${getActionColor(entry.action)}`}>
                  {entry.action}
                </span>
                <span className="text-gray-500">
                  {format(new Date(entry.timestamp), 'PPpp')}
                </span>
              </div>
              
              {entry.changes && entry.changes.length > 0 && (
                <div className="mt-2 text-sm">
                  <p className="font-medium text-gray-600">Changes:</p>
                  {entry.changes.map((change, idx) => (
                    <div key={idx} className="ml-4">
                      {change.field}: <span className="line-through text-red-600">{change.oldValue}</span> → 
                      <span className="text-green-600">{change.newValue}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TicketHistory; 