import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { getFirestore, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export default function HistoryView() {
  const [history, setHistory] = useState([]);
  const { user } = useAuth();
  const isProd = import.meta.env.PROD;

  useEffect(() => {
    if (isProd && user) {
      console.log('Setting up history listener for user:', user.uid);
      const db = getFirestore();
      const historyRef = collection(db, `users/${user.uid}/taskHistory`);
      const historyQuery = query(historyRef, orderBy('timestamp', 'desc'));
      
      const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
        console.log('History snapshot received:', snapshot.size, 'documents');
        const historyData = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('History entry:', data);
          return {
            id: doc.id,
            ...data
          };
        });
        setHistory(historyData);
      }, (error) => {
        console.error('Error in history listener:', error);
      });

      return () => unsubscribe();
    } else {
      // Load history from localStorage
      const localHistory = localStorage.getItem('taskHistory');
      if (localHistory) {
        setHistory(JSON.parse(localHistory));
      }
    }
  }, [user, isProd]);

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Task History</h1>
      
      <div className="space-y-4">
        {history.map((entry) => (
          <div key={entry.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded text-sm font-medium ${getActionColor(entry.action)}`}>
                {entry.action}
              </span>
              <span className="text-gray-500">
                {format(new Date(entry.timestamp), 'PPpp')}
              </span>
            </div>
            
            <div className="text-gray-700">
              <h3 className="font-medium">{entry.ticketData.title}</h3>
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
          </div>
        ))}
      </div>
    </div>
  );
} 