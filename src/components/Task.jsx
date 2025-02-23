const Task = ({ task, ...props }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="font-medium text-gray-900">{task.title}</h3>
      
      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.map(tag => (
            <span 
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs 
                       font-medium bg-blue-100 text-blue-800"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
      
      {/* ... other task content ... */}
    </div>
  );
}; 