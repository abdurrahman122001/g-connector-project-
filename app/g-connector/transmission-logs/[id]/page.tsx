// app/g-connector/transmission-logs/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FiActivity, FiAlertCircle, FiCheckCircle, FiClock, FiArrowRight } from 'react-icons/fi';

interface TransmissionLog {
  _id: string;
  source: string;
  destination: string;
  status: 'success' | 'failed';
  timestamp: Date;
  dataSize: number;
  latency?: number;
  error?: string;
  request?: string;
  response?: string;
}

const TransmissionLogDetailsPage = () => {
  const { id } = useParams();
  const [log, setLog] = useState<TransmissionLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transmission-logs/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!res.ok) throw new Error('Failed to fetch log');
        const data = await res.json();
        setLog(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLog();
  }, [id]);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  if (!log) {
    return <div className="alert alert-warning">Log not found</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Transmission Log Details</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${
            log.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            {log.status === 'success' ? (
              <FiCheckCircle size={24} />
            ) : (
              <FiAlertCircle size={24} />
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              {log.status === 'success' ? 'Successful Transmission' : 'Failed Transmission'}
            </h2>
            <p className="text-gray-500">
              {new Date(log.timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-2">Transmission Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={`font-medium ${
                  log.status === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Data Size:</span>
                <span className="font-medium">{formatBytes(log.dataSize)}</span>
              </div>
              {log.latency && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Latency:</span>
                  <span className="font-medium">{log.latency} ms</span>
                </div>
              )}
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-2">Timestamps</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FiClock className="text-gray-500" />
                <span className="text-gray-500">Occurred:</span>
                <span className="font-medium">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="text-center p-4 border rounded-lg">
            <h4 className="font-medium text-gray-700">Source</h4>
            <p className="mt-1 text-gray-900">{log.source}</p>
          </div>
          <FiArrowRight className="text-gray-400" />
          <div className="text-center p-4 border rounded-lg">
            <h4 className="font-medium text-gray-700">Destination</h4>
            <p className="mt-1 text-gray-900">{log.destination}</p>
          </div>
        </div>

        {log.error && (
          <div className="mt-6 border rounded-lg p-4 bg-red-50">
            <h3 className="font-medium text-red-700 mb-2">Error Details</h3>
            <div className="p-3 bg-white rounded text-sm font-mono text-red-700">
              {log.error}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {log.request && (
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-700 mb-2">Request</h3>
              <div className="p-3 bg-gray-50 rounded text-sm font-mono overflow-x-auto">
                <pre>{JSON.stringify(JSON.parse(log.request), null, 2)}</pre>
              </div>
            </div>
          )}
          {log.response && (
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-700 mb-2">Response</h3>
              <div className="p-3 bg-gray-50 rounded text-sm font-mono overflow-x-auto">
                <pre>{JSON.stringify(JSON.parse(log.response), null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransmissionLogDetailsPage;