import React, { useEffect, useState } from 'react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { getFirestore, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export default function HistoryView() {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });
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

  const handleExportHistory = (filtered = false) => {
    try {
      // Get all history
      const allHistory = JSON.parse(localStorage.getItem('taskHistory') || '[]');
      
      // Filter by date range if needed
      const historyToExport = filtered && dateRange.from && dateRange.to
        ? allHistory.filter(entry => {
            const entryDate = parseISO(entry.timestamp);
            return isWithinInterval(entryDate, {
              start: parseISO(dateRange.from),
              end: parseISO(dateRange.to)
            });
          })
        : allHistory;
      
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Task History</h1>
        <button
          onClick={() => setShowExport(!showExport)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 
                   transition-colors duration-200 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export History
        </button>
      </div>

      {/* Export Panel */}
      {showExport && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Export Options</h2>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleExportHistory(true)}
              disabled={!dateRange.from || !dateRange.to}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 
                       transition-colors duration-200 disabled:opacity-50 
                       disabled:cursor-not-allowed"
            >
              Export Selected Range
            </button>
            <button
              onClick={() => handleExportHistory(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 
                       transition-colors duration-200"
            >
              Export All
            </button>
          </div>
        </div>
      )}
      
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