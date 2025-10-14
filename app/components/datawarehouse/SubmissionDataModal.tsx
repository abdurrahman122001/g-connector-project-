// app/components/submissions/SubmissionDataModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiDownload, FiFilter, FiRefreshCw, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { getNodeSubmissionData, NodeSubmissionData } from '../../services/dataWarehouseApi';

interface SubmissionDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string;
  nodeName: string;
  selectedFields: string[];
}

const SubmissionDataModal: React.FC<SubmissionDataModalProps> = ({
  isOpen,
  onClose,
  nodeId,
  nodeName,
  selectedFields
}) => {
  const [submissionData, setSubmissionData] = useState<NodeSubmissionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSubmissionData = async () => {
    if (!nodeId || selectedFields.length === 0) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getNodeSubmissionData(nodeId, selectedFields);
      setSubmissionData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch submission data');
      toast.error('Failed to load submission data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && nodeId && selectedFields.length > 0) {
      fetchSubmissionData();
    }
  }, [isOpen, nodeId, selectedFields]);

  const formatCellValue = (field: any): string => {
    if (Array.isArray(field)) {
      if (field.every(v => typeof v !== 'object' || v === null)) {
        return field.join(', ');
      }
      return field
        .map(obj =>
          typeof obj === 'object' && obj !== null
            ? Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(' | ')
            : String(obj)
        )
        .join(' || ');
    }
    if (typeof field === 'object' && field !== null) {
      return Object.entries(field).map(([k, v]) => `${k}: ${v}`).join(' | ');
    }
    return field?.toString() || '';
  };

  const handleDownload = (format: 'csv' | 'excel') => {
    if (!submissionData) return;

    try {
      const metadataFields = ['Form Name', 'Created Date'];
      const allHeaders = [...metadataFields, ...submissionData.requestedFields];
      const headers = allHeaders.join(',');

      const rows = submissionData.data
        .map(record => {
          const metadataValues = [
            `"${record.formName || ''}"`,
            `"${new Date(record.createdAt).toLocaleDateString()}"`,
          ];
          const fieldValues = submissionData.requestedFields.map(field =>
            `"${formatCellValue(record[field]).replace(/"/g, '""')}"`
          );
          return [...metadataValues, ...fieldValues].join(',');
        })
        .join('\n');

      const content = headers + '\n' + rows;
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${nodeName}_submission_data.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Data exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error('Failed to export data');
    }
  };

  // ✅ Filtering + Pagination
  const filteredData = submissionData
    ? submissionData.data.filter(record =>
        submissionData.requestedFields.some(field =>
          formatCellValue(record[field])
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        )
      )
    : [];

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  useEffect(() => {
    // Reset to page 1 whenever search changes
    setCurrentPage(1);
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Submission Data: {nodeName}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Showing {selectedFields.length} selected fields
              {submissionData && ` • ${submissionData.totalRecords} total records`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchSubmissionData()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
              title="Refresh"
            >
              <FiRefreshCw size={18} />
            </button>
            <div className="flex gap-1">
              <button
                onClick={() => handleDownload('csv')}
                className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors flex items-center gap-1"
                disabled={!submissionData}
              >
                <FiDownload size={12} />
                CSV
              </button>
              <button
                onClick={() => handleDownload('excel')}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
                disabled={!submissionData}
              >
                <FiDownload size={12} />
                Excel
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-gray-200 bg-white flex items-center gap-2">
          <FiSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="Search submissions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading submission data...</span>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-red-600 text-sm font-medium">Error</div>
                </div>
                <div className="text-red-600 text-sm mt-1">{error}</div>
                <button
                  onClick={fetchSubmissionData}
                  className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : !submissionData || filteredData.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <FiFilter size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No submission data found</p>
              <p className="text-sm text-gray-400 mt-1">
                This node doesn't have any matching submission data
              </p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {submissionData.requestedFields.map((field: string, index: number) => (
                        <th
                          key={index}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                        >
                          {field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentData.map((record: any, recordIndex: number) => (
                      <tr key={startIndex + recordIndex} className="hover:bg-gray-50">
                        {submissionData.requestedFields.map((field: string, fieldIndex: number) => (
                          <td
                            key={fieldIndex}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                          >
                            <div
                              className="max-w-xs truncate"
                              title={formatCellValue(record[field])}
                            >
                              {formatCellValue(record[field])}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-700">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of{' '}
                      {filteredData.length} records
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionDataModal;
