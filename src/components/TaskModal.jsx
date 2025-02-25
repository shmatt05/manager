import React, { useEffect, useRef, useState } from 'react';
import { Dialog } from '@headlessui/react';
import TicketHistory from './TicketHistory';

function TabPanel({ children, value, index }) {
  if (value !== index) return null;
  return <div className="py-4">{children}</div>;
}

export default function TaskModal({ task, isOpen, onClose, onSave }) {
  const titleRef = useRef(null);
  const detailsRef = useRef(null);
  const [tabValue, setTabValue] = useState(0);
  const [editedTask, setEditedTask] = useState(null);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setEditedTask(null);
    } else if (isOpen && task) {
      setEditedTask(task);
      setTabValue(0);
    }
  }, [isOpen, task]);

  useEffect(() => {
    if (isOpen && titleRef.current) {
      setTimeout(() => {
        titleRef.current?.focus();
      }, 50);
    }
  }, [isOpen, editedTask]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim() || !editedTask) return;
    setEditedTask(prev => ({
      ...prev,
      tags: [...new Set([...(prev.tags || []), newTag.trim()])]
    }));
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove) => {
    if (!editedTask) return;
    setEditedTask(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSave = () => {
    if (!editedTask) return;
    const updatedTask = {
      ...editedTask,
      title: titleRef.current.value,
      details: detailsRef.current.value,
      description: detailsRef.current.value, // Make sure we update both fields for consistency
      tags: editedTask.tags || []
    };
    onSave(updatedTask);
  };

  if (!isOpen || !editedTask) return null;

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      className="relative z-[100]"
    >
      <div className="fixed inset-0 bg-black/30 z-[90]" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4 z-[100]">
        <Dialog.Panel className="mx-auto max-w-xl w-full bg-white rounded-lg shadow-xl">
          <div className="border-b">
            <div className="flex">
              <button
                className={`px-4 py-2 ${tabValue === 0 ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                onClick={() => setTabValue(0)}
              >
                Details
              </button>
              <button
                className={`px-4 py-2 ${tabValue === 1 ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                onClick={() => setTabValue(1)}
              >
                History
              </button>
            </div>
          </div>

          <div className="p-6">
            <TabPanel value={tabValue} index={0}>
              <h2 className="text-xl font-bold mb-4">Edit Task</h2>
              <input
                ref={titleRef}
                type="text"
                defaultValue={editedTask.title}
                className="w-full p-2 border rounded mb-4"
                placeholder="Task title"
                onKeyDown={handleKeyDown}
              />
              <textarea
                ref={detailsRef}
                defaultValue={editedTask.details || ''}
                className="w-full p-2 border rounded mb-4 min-h-[100px]"
                placeholder="Add details (Shift + Enter for new line)"
                onKeyDown={handleKeyDown}
              />
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(editedTask.tags || []).map(tag => (
                    <span 
                      key={tag} 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm 
                               font-medium bg-blue-100 text-blue-800"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add tag..."
                    className="flex-1 px-3 py-2 border rounded-md"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save
                </button>
              </div>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <TicketHistory ticketId={editedTask.id} />
            </TabPanel>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 