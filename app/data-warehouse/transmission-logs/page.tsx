"use client";

import React, { useState, useEffect } from 'react';
import { FiDownload, FiActivity } from 'react-icons/fi';
import { getTransmissionLogs, downloadTransmissionLogs, TransmissionLog } from '../../services/dataWarehouseApi';

export default function TransmissionLogsPage() {
  const [logs, setLogs] = useState<TransmissionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = filter === 'all' ? undefined : { status: filter };
      const data = await getTransmissionLogs(filters);
      setLogs(data);
    } catch (err) {
      setError('Failed to load transmission logs');
      console.error('Error fetching transmission logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const filters = filter === 'all' ? undefined : { status: filter };
      const blob = await downloadTransmissionLogs({ ...filters, format: 'csv' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transmission-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading logs:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transmission logs...</p>
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
            onClick={fetchLogs}
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
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><FiActivity /> Transmission Log to the Warehouse</h1>
      <div className="mb-4 flex gap-2">
        <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded px-2 py-1">
          <option value="all">All</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
        <button 
          className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
          onClick={handleDownload}
          disabled={downloading}
        >
          <FiDownload /> {downloading ? 'Downloading...' : 'Download'}
        </button>
      </div>
      
      {logs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No transmission logs found.</p>
        </div>
      ) : (
        <table className="min-w-full border rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Source</th>
              <th className="px-4 py-2">Destination</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Timestamp</th>
              <th className="px-4 py-2">Data Volume</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-t">
                <td className="px-4 py-2">{log.source}</td>
                <td className="px-4 py-2">{log.destination}</td>
                <td className={`px-4 py-2 font-semibold ${
                  log.status === 'success' ? 'text-green-600' : 
                  log.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {log.status}
                </td>
                <td className="px-4 py-2">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="px-4 py-2">{log.dataVolume}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 