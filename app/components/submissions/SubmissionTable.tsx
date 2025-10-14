// app/components/submissions/SubmissionTable.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FiPenTool, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import ConfirmationToastComponent from '../ConfirmationToast';

const SubmissionTable = (props: any) => {
  const [submissions, setSubmissions] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/forms/${props.submissionId}/submissionsIndividual`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      if (!res.ok) throw new Error('Failed to fetch submissions');
      const data = await res.json();
      setSubmissions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleDelete = async (id: string, index: number) => {
    const performDelete = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/forms/${id}/${index}/submissionsIndividual`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }
        );
        if (!res.ok) throw new Error('Failed to delete submission');
        toast.success('Deleted Successfully');
        fetchSubmissions();
      } catch (err) {
        console.error('Error deleting submission:', err);
        toast.error('Failed to delete');
      }
    };
    toast(<ConfirmationToastComponent onConfirm={performDelete} />, {
      position: 'top-center',
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      closeButton: false,
      className: 'bg-white shadow-xl rounded-lg border border-gray-300 p-0',
      style: { width: '420px' },
    });
  };

  const formatCellValue = (field: any): string => {
    if (Array.isArray(field)) {
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

  // ✅ search + pagination logic
  const allRows = submissions?.data?.data || [];

  const filteredRows = allRows.filter((row: any) =>
    row.some((cell: any) =>
      formatCellValue(cell).toLowerCase().includes(props.searchQuery?.toLowerCase() || '')
    )
  );

  const totalRows = filteredRows.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredRows.slice(indexOfFirstRow, indexOfLastRow);

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {!submissions || allRows.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No Submissions found.</div>
          ) : (
            <div>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto rounded-md shadow">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {submissions.data.field_keys.map((key: any) => (
                        <th
                          key={key}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                        >
                          {key}
                        </th>
                      ))}
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentRows.map((row: any, rowIndex: number) => (
                      <tr key={rowIndex}>
                        {row.map((cell: any, cellIndex: number) => (
                          <td
                            key={cellIndex}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                          >
                            {typeof cell === 'string' && cell.startsWith('http') ? (
                              <Link
                                href={cell}
                                className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800"
                              >
                                {formatCellValue(cell)}
                              </Link>
                            ) : (
                              formatCellValue(cell)
                            )}
                          </td>
                        ))}

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex space-x-2">
                            <Link
                              href={`/submissions/edit/${submissions.data._id}?index=${
                                indexOfFirstRow + rowIndex
                              }`}
                              className="px-4 py-2 inline-flex items-center text-white bg-blue-600 hover:bg-blue-700 rounded-full"
                            >
                              <FiPenTool />
                            </Link>
                            <button
                              className="px-4 py-2 inline-flex items-center text-white bg-red-600 hover:bg-red-700 rounded-full"
                              onClick={() =>
                                handleDelete(submissions.data._id, indexOfFirstRow + rowIndex)
                              }
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center p-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default SubmissionTable;
