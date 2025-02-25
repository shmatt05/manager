import { formatDistanceToNow } from 'date-fns';

export default function HistoryEntry({ entry }) {
  const { action, timestamp, ticketData, changes, userId } = entry;
  
  const getActionColor = () => {
    switch(action) {
      case 'CREATE': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-blue-100 text-blue-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'COMPLETE': return 'bg-purple-100 text-purple-800';
      case 'REOPEN': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getActionText = () => {
    switch(action) {
      case 'CREATE': return 'Created';
      case 'UPDATE': return 'Updated';
      case 'DELETE': return 'Deleted';
      case 'COMPLETE': return 'Completed';
      case 'REOPEN': return 'Reopened';
      default: return action;
    }
  };
  
  const formatTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return 'Unknown time';
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm w-full">
      <div className="flex justify-between items-start">
        <div>
          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getActionColor()}`}>
            {getActionText()}
          </span>
          <h3 className="text-lg font-medium mt-1">
            {ticketData?.title || 'Unknown Task'}
          </h3>
        </div>
        <div className="text-sm text-gray-500">
          {formatTime(timestamp)}
        </div>
      </div>
      
      {changes && changes.length > 0 && (
        <div className="mt-3 text-sm">
          <h4 className="font-medium text-gray-700">Changes:</h4>
          <ul className="mt-1 space-y-1">
            {changes.map((change, index) => (
              <li key={index} className="text-gray-600">
                <span className="font-medium">{change.field}: </span>
                <span className="line-through text-red-600">
                  {typeof change.oldValue === 'object' 
                    ? JSON.stringify(change.oldValue) 
                    : String(change.oldValue || '')}
                </span>
                {' → '}
                <span className="text-green-600">
                  {typeof change.newValue === 'object' 
                    ? JSON.stringify(change.newValue) 
                    : String(change.newValue || '')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-500">
        ID: {ticketData?.id || 'Unknown'}
      </div>
    </div>
  );
} 