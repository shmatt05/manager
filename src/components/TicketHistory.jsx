import { useEffect, useState } from 'react';
import { format } from 'date-fns';

const TicketHistory = ({ ticketId }) => {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // For now, let's mock some history data
    // Later we'll integrate with your actual history storage
    setHistory([
      {
        timestamp: new Date(),
        action: 'CREATE',
        userId: { name: 'User' },
        ticketData: { title: 'Task Created' }
      }
    ]);
  }, [ticketId]);

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
    <div>
      <h2 className="text-xl font-bold mb-4">Task History</h2>
      <div className="space-y-4">
        {history.map((entry, index) => (
          <div key={index} className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded text-sm font-medium ${getActionColor(entry.action)}`}>
                {entry.action}
              </span>
              <span className="text-gray-500 text-sm">
                {format(new Date(entry.timestamp), 'PPpp')}
              </span>
              <span className="text-sm">
                by {entry.userId.name}
              </span>
            </div>
            
            {entry.changes && entry.changes.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                <div className="font-medium">Changes:</div>
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
    </div>
  );
};

export default TicketHistory; 