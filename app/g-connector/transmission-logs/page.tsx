// app/g-connector/transmission-logs/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiActivity, FiAlertCircle, FiCheckCircle, FiFilter, FiArrowLeft } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface TransmissionLog {
  _id: string;
  source: string;
  destination: string;
  status: 'success' | 'failed';
  createdAt: Date;
  dataVolume : {
    size : number
  }
  dataSize: number;
  error?: string;
}

const TransmissionLogsPage = () => {
  const [logs, setLogs] = useState<TransmissionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const router = useRouter();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const url = filter === 'all' ? `${process.env.NEXT_PUBLIC_API_URL}/api/transmission-logs` : `${process.env.NEXT_PUBLIC_API_URL}/api/transmission-logs?status=${filter}`;
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!res.ok) throw new Error('Failed to fetch logs');
        const data = await res.json();
        setLogs(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [filter]);

  // Pagination logic
  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = logs.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToPreviousPage = () => {
    goToPage(currentPage - 1);
  };

  const goToNextPage = () => {
    goToPage(currentPage + 1);
  };

  // Reset to first page when logs/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [logs, filter]);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mr-4">
          <FiArrowLeft /> Back
        </button>
        <h1 className="text-2xl font-bold">Transmission Logs</h1>
        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-gray-300">
            <FiFilter className="text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'success' | 'failed')}
              className="bg-transparent focus:outline-none"
            >
              <option value="all">All</option>
              <option value="success">Successful</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FiActivity className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No transmission logs</h3>
              <p className="mt-1 text-sm text-gray-500">
                Logs will appear here when data transmissions occur.
              </p>
            </div>
          ) : (
            <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentLogs.map((log) => (
                  <tr key={log._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{log.source}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{log.destination}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.status === 'success' ? (
                        <span className="badge-success flex items-center gap-1">
                          <FiCheckCircle /> Success
                        </span>
                      ) : (
                        <span className="badge-error flex items-center gap-1">
                          <FiAlertCircle /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatBytes(log.dataVolume.size)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/g-connector/transmission-logs/${log._id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(endIndex, logs.length)}</span> of{' '}
                      <span className="font-medium">{logs.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        &#8592;
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        const isCurrentPage = page === currentPage;
                        return (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              isCurrentPage
                                ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        &#8594;
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TransmissionLogsPage;