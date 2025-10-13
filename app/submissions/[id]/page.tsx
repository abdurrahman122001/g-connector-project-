'use client';

import SubmissionManage from '@/app/components/gconector/SubmissionManage';
import SubmissionTable from '@/app/components/submissions/SubmissionTable';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FiSkipBack } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import ConfirmationToastComponent from '../../components/ConfirmationToast';

interface ApiScript {
  description: string;
  _id: string;
  name: string;
  createdAt: string;
  script_name?: string;
}

const SubmissionIndex = () => {
  const router = useRouter();
  const { id } = useParams();
  const [submissions, setSubmissions] = useState<ApiScript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewTable, setViewTable] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(''); // search state

  const goBack = () => {
    if (viewTable) {
      setViewTable(false);
      setSubmissionId(null);
      setSearchQuery('');
    } else {
      router.push('/g-connector/form');
    }
  };

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/forms/${id}/submissions`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        if (!res.ok) throw new Error('Failed to fetch submissions');
        const data = await res.json();
        setSubmissions(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchForms();
  }, [id]);

  const handleDelete = async (id: string) => {
    const performDelete = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/forms/${id}/submissions`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        if (!res.ok) throw new Error('Failed to delete submission');
        toast.success('Deleted Successfully');
        setSubmissions(prev =>
          prev.filter(submission => submission._id !== id)
        );
      } catch (err) {
        console.error('Error deleting submission:', err);
        toast.error('Failed to Delete');
      }
    };
    toast(<ConfirmationToastComponent onConfirm={performDelete} />, {
      position: 'top-center',
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      closeButton: false,
      className: 'bg-white shadow-xl rounded-lg border border-gray-300 p-0',
      style: { width: '420px' }
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Submission Manage</h1>
        <button
          onClick={goBack}
          className="bg-blue-500 cursor-pointer hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow flex items-center gap-2 transition duration-200"
        >
          <FiSkipBack /> Back
        </button>
      </div>

      {viewTable ? (
        <div>
          {/* 🔎 Search field for submission details */}
          <div className="mb-4 flex justify-between">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search submissions..."
              className="border border-gray-300 rounded px-3 py-2 w-1/3"
            />
          </div>
          <SubmissionTable
            setViewTable={setViewTable}
            submissionId={submissionId}
            searchQuery={searchQuery}
          />
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {submissions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No Submissions found.</div>
          ) : (
            <SubmissionManage
              setSubmissionId={setSubmissionId}
              handleDelete={handleDelete}
              submissions={submissions}
              setViewTable={setViewTable}
            />
          )}
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default SubmissionIndex;
