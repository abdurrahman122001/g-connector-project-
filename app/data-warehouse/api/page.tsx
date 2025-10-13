"use client";

import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiLink, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { getApiPoints, createApiPoint, updateApiPoint, deleteApiPoint, ApiPoint } from '../../services/dataWarehouseApi';

const API_TYPES = ['JSON', 'XML', 'CSV', 'REST', 'SOAP'];
const initialVariable = { name: '', type: '', description: '', required: false };

function CreateApiPointModal({ onClose, onCreated }: { onClose: () => void, onCreated: () => void }) {
  const [form, setForm] = useState({
    type: 'JSON',
    url: '',
    user: '',
    passkey: '',
    enabled: true,
    variables: [{ ...initialVariable }]
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleVarChange = (idx: number, field: string, value: any) => {
    setForm(f => ({
      ...f,
      variables: f.variables.map((v, i) => i === idx ? { ...v, [field]: value } : v)
    }));
  };

  const addVariable = () => setForm(f => ({ ...f, variables: [ ...f.variables, { ...initialVariable } ] }));
  const removeVariable = (idx: number) => setForm(f => ({ ...f, variables: f.variables.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!form.type || !form.url || !form.user || !form.passkey) {
      setError('All fields except variable description are required.');
      return;
    }
    if (!form.variables.length || form.variables.some(v => !v.name || !v.type)) {
      setError('Each variable must have a name and type.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/data-warehouse/api-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(form)
      });
      if (!response.ok) throw new Error('Failed to create API point');
      onCreated && onCreated();
      onClose && onClose();
    } catch (err: any) {
      setError(err.message || 'Error creating API point');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl">
        <h3 className="text-xl font-bold mb-4">Create New API Point</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Type *</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                required
              >
                {API_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">URL *</label>
              <input
                type="url"
                className="w-full border rounded px-3 py-2"
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">User *</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={form.user}
                onChange={e => setForm(f => ({ ...f, user: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Passkey *</label>
              <input
                type="password"
                className="w-full border rounded px-3 py-2"
                value={form.passkey}
                onChange={e => setForm(f => ({ ...f, passkey: e.target.value }))}
                required
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <label className="font-semibold">Enabled</label>
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-2">Variables *</label>
            {form.variables.map((v, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Name"
                  className="border rounded px-2 py-1 w-1/4"
                  value={v.name}
                  onChange={e => handleVarChange(idx, 'name', e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Type"
                  className="border rounded px-2 py-1 w-1/4"
                  value={v.type}
                  onChange={e => handleVarChange(idx, 'type', e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Description"
                  className="border rounded px-2 py-1 w-1/3"
                  value={v.description}
                  onChange={e => handleVarChange(idx, 'description', e.target.value)}
                />
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={v.required}
                    onChange={e => handleVarChange(idx, 'required', e.target.checked)}
                  />
                  Required
                </label>
                {form.variables.length > 1 && (
                  <button
                    type="button"
                    className="text-red-600 font-bold px-2"
                    onClick={() => removeVariable(idx)}
                  >×</button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded"
              onClick={addVariable}
            >+ Add Variable</button>
          </div>

          {error && <div className="text-red-600">{error}</div>}

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-200 text-gray-700"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white font-semibold disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create API Point'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ApiSpecificationPage() {
  const [apiPoints, setApiPoints] = useState<ApiPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingApi, setEditingApi] = useState<ApiPoint | null>(null);

  useEffect(() => {
    fetchApiPoints();
  }, []);

  const fetchApiPoints = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getApiPoints();
      setApiPoints(data);
    } catch (err) {
      setError('Failed to load API points');
      console.error('Error fetching API points:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (api: ApiPoint) => {
    try {
      await updateApiPoint(api.id, { enabled: !api.enabled });
      await fetchApiPoints(); // Refresh the list
    } catch (err) {
      console.error('Error toggling API point:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this API point?')) {
      try {
        await deleteApiPoint(id);
        await fetchApiPoints(); // Refresh the list
      } catch (err) {
        console.error('Error deleting API point:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API points...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchApiPoints}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Data Warehouse API Specification</h1>
      <button 
        className="mb-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={() => setShowCreateModal(true)}
      >
        <FiPlus /> Add API Point
      </button>
      
      {apiPoints.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No API points found. Create your first API point to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {apiPoints.map((api) => (
            <div key={api.id} className="border rounded-lg p-4 bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-2">
                <FiLink className="text-blue-500" />
                <span className="font-semibold">{api.type}:</span>
                <a href={api.url} className="text-blue-700 underline" target="_blank" rel="noopener noreferrer">{api.url}</a>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <span>User: <b>{api.user}</b></span>
                <span>Passkey: <b>{api.passkey}</b></span>
                <span>Variables: {Array.isArray(api.variables) ? api.variables.map(v => v.name).join(', ') : ''}</span>
                <button 
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                  onClick={() => setEditingApi(api)}
                >
                  <FiEdit /> Edit
                </button>
                <button 
                  className="flex items-center gap-1 text-red-600 hover:underline"
                  onClick={() => handleDelete(api.id)}
                >
                  <FiTrash2 /> Delete
                </button>
                <button 
                  className="flex items-center gap-1 text-gray-600 hover:underline"
                  onClick={() => handleToggleEnabled(api)}
                >
                  {api.enabled ? <FiToggleRight className="text-green-500" /> : <FiToggleLeft className="text-gray-400" />} {api.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateApiPointModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchApiPoints}
        />
      )}
    </div>
  );
} 