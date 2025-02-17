import React, { useEffect, useRef } from 'react';

export default function TaskModal({ task, isOpen, onClose, onSave }) {
  const titleRef = useRef(null);
  const detailsRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      titleRef.current?.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSave({
        ...task,
        title: titleRef.current.value,
        details: detailsRef.current.value
      });
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Edit Task</h2>
        <input
          ref={titleRef}
          type="text"
          defaultValue={task.title}
          className="w-full p-2 border rounded mb-4"
          placeholder="Task title"
          onKeyDown={handleKeyDown}
        />
        <textarea
          ref={detailsRef}
          defaultValue={task.details || ''}
          className="w-full p-2 border rounded mb-4 min-h-[100px]"
          placeholder="Add details (Shift + Enter for new line)"
          onKeyDown={handleKeyDown}
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({
              ...task,
              title: titleRef.current.value,
              details: detailsRef.current.value
            })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
} 