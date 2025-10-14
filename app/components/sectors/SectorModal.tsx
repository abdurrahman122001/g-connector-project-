'use client'
import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';

interface SectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (sector: { name: string; description: string }) => void;
  initialData?: { name: string; description: string };
}

export function SectorModal({ isOpen, onClose, onSubmit, initialData }: SectorModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
    } else {
      setName('');
      setDescription('');
    }

    
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description });
    setName('');
    setDescription('');
    onClose();
  };

  const isEditing = !!initialData;

  
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded bg-white p-6">
          <Dialog.Title className="text-xl font-bold mb-4">
            {isEditing ? 'Edit Sector' : 'Create New Sector'}
          </Dialog.Title>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="sector-name" className="block text-sm font-medium text-gray-700 mb-1">
                Sector Name
              </label>
              <input
                id="sector-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="sector-desc" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="sector-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {isEditing ? 'Update Sector' : 'Create Sector'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}