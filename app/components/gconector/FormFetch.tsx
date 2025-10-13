// app/g-connector/api-scripts/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

import { FiCrosshair, FiEye, FiPlus, FiTrash2 } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import ConfirmationToastComponent from '@/app/components/ConfirmationToast';
interface ApiScript {
  description: string;
  _id: string;
  name: string;
  apiType: string;
  format: string;
  createdAt: Date;
}

const FormFetch = () => {
  const [forms, setForms] = useState<ApiScript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!res.ok) throw new Error('Failed to fetch scripts');

        const json = await res.json();

        // Try common shapes, fallback to []
        const list =
          Array.isArray(json?.data) ? json.data :
            Array.isArray(json) ? json :
              Array.isArray(json?.data?.items) ? json.data.items :
                Array.isArray(json?.data?.docs) ? json.data.docs :
                  Array.isArray(json?.forms) ? json.forms :
                    [];

        setForms(list as ApiScript[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setForms([]); // keep it an array to avoid map crash
      } finally {
        setIsLoading(false);
      }
    };
    fetchForms();
  }, []);



  const handleDelete = async (id: string) => {
    const performDelete = async () => {

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!res.ok) throw new Error('Failed to delete script');
        setForms(forms.filter((script) => script._id !== id));
      } catch (err) {
        console.error('Error deleting script:', err);
      }
    };
    toast(
      <ConfirmationToastComponent
        onConfirm={performDelete}

      // closeToast prop will be automatically passed by react-toastify
      />,
      {
        position: "top-center",
        autoClose: false, // Don't auto-close confirmation
        closeOnClick: false, // Don't close on background click
        draggable: false,
        closeButton: false, // Hide default close button, using custom buttons
        className: 'bg-white shadow-xl rounded-lg border border-gray-300 p-0', // Combined styles
        style: { width: '420px' }, // Optional: define a width for the confirmation toast
      }
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Form Manage</h1>
        <Link
          href="/g-connector/form/create"
          className="bg-blue-500 cursor-pointer hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow flex items-center gap-2 transition duration-200"
        >
          <FiPlus /> Create
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden" style={{ overflowX: 'auto', overflowY: "auto" }}>
          {forms.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No Forms found. Create your first form to get started.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {forms.map((script) => (
                  <tr key={script._id}>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/submissions/${script._id}`} className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {script.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{script.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(script.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">

                      <div className="flex space-x-2">
                        <Link
                          href={`/g-connector/form/${script._id}`}
                          className="bg-green-500 hover:bg-green-700 cursor-pointer text-white font-bold py-1 px-2 rounded text-sm shadow flex items-center gap-2 transition duration-200"

                        >
                          <FiEye />
                        </Link>
                        <button
                          className="bg-red-500 hover:bg-red-700 cursor-pointer text-white font-bold py-1 px-2 rounded text-sm shadow flex items-center gap-2 transition duration-200"
                          onClick={() => handleDelete(script._id)}
                        >
                          <FiTrash2 />
                        </button>
                        <Link
                          href={`/g-connector/form/conditional-rules/${script._id}`}
                          className="bg-blue-500 hover:bg-blue-700 cursor-pointer text-white font-bold py-1 px-2 rounded text-sm shadow flex items-center gap-2 transition duration-200"

                        >
                          <FiCrosshair />
                        </Link>
                      </div>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default FormFetch;