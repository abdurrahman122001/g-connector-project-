'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { useForm } from 'react-hook-form';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: { name: string; email: string; role: 'admin' | 'user'; active: boolean }) => void;
  initialData?: {
    name: string;
    email: string;
    role: 'admin' | 'user';
    active: boolean;
  };
  isCurrentUser?: boolean;
}

export function UserModal({ isOpen, onClose, onSubmit, initialData, isCurrentUser }: UserModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: initialData || {
      name: '',
      email: '',
      role: 'user',
      active: true
    }
  });

  useEffect(() => {
    if (isOpen && initialData) {
      reset(initialData);
    } else if (isOpen) {
      reset({
        name: '',
        email: '',
        role: 'user',
        active: true
      });
    }
  }, [isOpen, initialData, reset]);

  const submitForm = (data: any) => {
    onSubmit(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded bg-white p-6">
          <Dialog.Title className="text-xl font-bold mb-4">
            {initialData ? 'Edit User' : 'Create New User'}
          </Dialog.Title>
          
          <form onSubmit={handleSubmit(submitForm)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name*
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  className={`w-full p-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message as string}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email*
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className={`w-full p-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message as string}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role*
                </label>
                <select
                  id="role"
                  {...register('role', { required: 'Role is required' })}
                  disabled={isCurrentUser}
                  className={`w-full p-2 border rounded-md ${
                    errors.role ? 'border-red-500' : 'border-gray-300'
                  } ${isCurrentUser ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message as string}</p>
                )}
                {isCurrentUser && (
                  <p className="mt-1 text-sm text-gray-500">You cannot change your own role</p>
                )}
              </div>
              
              <div>
                <label htmlFor="active" className="block text-sm font-medium text-gray-700 mb-1">
                  Status*
                </label>
                <select
                  id="active"
                  {...register('active', { required: 'Status is required' })}
                  disabled={isCurrentUser}
                  className={`w-full p-2 border rounded-md ${
                    errors.active ? 'border-red-500' : 'border-gray-300'
                  } ${isCurrentUser ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
                {errors.active && (
                  <p className="mt-1 text-sm text-red-600">{errors.active.message as string}</p>
                )}
                {isCurrentUser && (
                  <p className="mt-1 text-sm text-gray-500">You cannot change your own status</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
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
                {initialData ? 'Update User' : 'Create User'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 