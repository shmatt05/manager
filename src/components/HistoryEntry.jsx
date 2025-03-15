import { formatDistanceToNow } from 'date-fns';

export default function HistoryEntry({ entry }) {
  const { action, timestamp, ticketData, changes, userId } = entry;
  
  const getActionColor = () => {
    switch(action) {
      case 'CREATE': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'UPDATE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'DELETE': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      case 'COMPLETE': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
      case 'REOPEN': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
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

  // Map action types to Material Design inspired colors
  const getActionColorMaterial = () => {
    switch(action) {
      case 'CREATE': return 'bg-success/10 text-success dark:bg-success/20 dark:text-success/90';
      case 'UPDATE': return 'bg-primary-500/10 text-primary-700 dark:bg-primary-500/20 dark:text-primary-400';
      case 'DELETE': return 'bg-error/10 text-error dark:bg-error/20 dark:text-error/90';
      case 'COMPLETE': return 'bg-primary-900/10 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300';
      case 'REOPEN': return 'bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning/90';
      default: return 'bg-surface-200 text-surface-700 dark:bg-dark-surface-4 dark:text-dark-text-secondary';
    }
  };

  return (
    <div className="bg-white dark:bg-dark-surface-2 shadow-dp1 dark:shadow-dp1 hover:shadow-dp2 dark:hover:shadow-none rounded-lg overflow-hidden transition-all duration-200">
      <div className="border-l-4 border-transparent hover:border-primary-500 dark:hover:border-primary-400 transition-colors duration-200">
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <span className={`inline-block px-2 py-0.5 rounded-pill text-xs font-medium ${getActionColorMaterial()} select-none`}>
                {getActionText()}
              </span>
              <h3 className="text-lg font-medium mt-1 text-surface-800 dark:text-dark-text-primary">
                {ticketData?.title || 'Unknown Task'}
              </h3>
            </div>
            <div className="text-sm text-surface-500 dark:text-dark-text-secondary">
              {formatTime(timestamp)}
            </div>
          </div>
          
          {changes && changes.length > 0 && (
            <div className="mt-3 text-sm">
              <h4 className="font-medium text-surface-700 dark:text-dark-text-secondary select-none">Changes:</h4>
              <ul className="mt-1 space-y-1 pl-2 border-l-2 border-surface-200 dark:border-dark-surface-6">
                {changes.map((change, index) => (
                  <li key={index} className="text-surface-600 dark:text-dark-text-secondary">
                    <span className="font-medium">{change.field}: </span>
                    <span className="line-through text-error/80 dark:text-error/70">
                      {typeof change.oldValue === 'object' 
                        ? JSON.stringify(change.oldValue) 
                        : String(change.oldValue || '')}
                    </span>
                    {' → '}
                    <span className="text-success/80 dark:text-success/70">
                      {typeof change.newValue === 'object' 
                        ? JSON.stringify(change.newValue) 
                        : String(change.newValue || '')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-2 text-xs text-surface-500 dark:text-dark-text-secondary flex items-center">
            <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>ID: {ticketData?.id || 'Unknown'}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 