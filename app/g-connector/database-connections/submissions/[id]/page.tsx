// app/submissions/[id]/page.tsx
'use client';

import SubmissionManage from '@/app/components/gconector/SubmissionManage';
import SubmissionTable from '@/app/components/submissions/SubmissionTable';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FiSkipBack } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import ConfirmationToastComponent from '../../../../components/ConfirmationToast';

interface ApiScript {
    description: string;
    _id: string;
    name: string;
    createdAt: string; // Changed to string to match what is likely coming from the API, or use Date if you convert it correctly
    script_name?: string; // added script name as optional 
}

const SubmissionDatabaseIndex = () => {
    const router = useRouter();
    const { id } = useParams();
    const [dbId, setDbId] = useState(null);
    const [submissions, setSubmissions] = useState<ApiScript[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewTable, setViewTable] = useState(false);
    const [submissionId, setSubmissionId] = useState<string | null>(null); // submissionID should be a string or null
    const goBack = () => {
        if (viewTable === true) {
            setViewTable(false)
        }
        else {
          router.push('/g-connector/database-connections')
        }
    }
    useEffect(() => {
        const fetchForms = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/db-connections/${id}/getSubmissions`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (!res.ok) throw new Error('Failed to fetch scripts');
                const data = await res.json();
                setSubmissions(data.data.submissions);
                setDbId(data.data.db_id)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchForms();
    }, [id]); // add id to the dependency array, to fix warning

    const handleDelete = async (id: string) => {
        const performDelete = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${id}/submissions`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (!res.ok) throw new Error('Failed to delete script');
                toast.success("Deleted Successfully");
                setSubmissions(prevForms => prevForms.filter((script) => script._id !== id));
            } catch (err) {
                console.error('Error deleting script:', err);
                toast.error("Failed to Delete")
            }
        };
        toast(
            <ConfirmationToastComponent
                onConfirm={performDelete}
            />,
            {
                position: "top-center",
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                closeButton: false,
                className: 'bg-white shadow-xl rounded-lg border border-gray-300 p-0',
                style: { width: '420px' },
            }
        );
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Submission Manage</h1>

                <div className="">
                    <h1 className="text-2xl font-bold"></h1>
                    <button
                        onClick={goBack}
                        className="bg-blue-500 cursor-pointer hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow flex items-center gap-2 transition duration-200"
                    >
                        <FiSkipBack /> Back
                    </button>
                </div>

            </div>

            {viewTable ? (
                <SubmissionTable setViewTable={setViewTable} submissionId={submissionId} />
            ) : (
                isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : error ? (
                    <div className="alert alert-error">{error}</div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        {submissions.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No Forms found. Create your first form to get started.
                            </div>
                        ) : (
                            <SubmissionManage
                            editUrl={`/g-connector/database-connections/submissions/edit/`}
                            query={`?query=${dbId}`}
                                setSubmissionId={setSubmissionId}
                                handleDelete={handleDelete}
                                submissions={submissions}
                                setViewTable={setViewTable}
                            />
                        )}
                    </div>

                )
            )}
            <ToastContainer />
        </div>
    );
};

export default SubmissionDatabaseIndex;