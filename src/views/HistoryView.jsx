import React, { useEffect, useState } from 'react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { getFirestore, collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import HistoryEntry from '../components/HistoryEntry';

export default function HistoryView() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });
  const { user } = useAuth();
  const [limitCount, setLimitCount] = useState(20);

  useEffect(() => {
    if (!user) {
      // Handle local storage history for non-authenticated users
      const localHistory = JSON.parse(localStorage.getItem('taskHistory') || '[]');
      setHistory(localHistory);
      setLoading(false);
      return;
    }

    const db = getFirestore();
    const historyRef = collection(db, `users/${user.uid}/taskHistory`);
    const historyQuery = query(
      historyRef,
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
      const historyData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      setHistory(historyData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, limitCount]);

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

  const loadMore = () => {
    setLimitCount(prev => prev + 20);
  };

  if (loading) {
    return <div className="p-6">Loading history...</div>;
  }

  if (history.length === 0) {
    return <div className="p-6">No history available.</div>;
  }

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
        {history.map(entry => (
          <HistoryEntry key={entry.id} entry={entry} />
        ))}
      </div>
      
      {history.length >= limitCount && (
        <button 
          onClick={loadMore}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Load More
        </button>
      )}
    </div>
  );
} 