// app/g-connector/api-scripts/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiUpload, FiFileText, FiCode, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import ConfirmationToastComponent from '../../components/ConfirmationToast';
import { toast, ToastContainer } from 'react-toastify';


interface ApiScript {
  _id: string;
  name: string;
  apiType: string;
  format: string;
  createdAt: Date;
  formMappings?: { formId?: { name?: string } }[];
}

const ApiScriptsPage = () => {
  const [scripts, setScripts] = useState<ApiScript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/api-scripts`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!res.ok) throw new Error('Failed to fetch scripts');
        const data = await res.json();
        setScripts(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchScripts();
  }, []);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'REST': return <FiCode className="text-blue-500" />;
      case 'GraphQL': return <FiCode className="text-pink-500" />;
      case 'WebSocket': return <FiCode className="text-green-500" />;
      default: return <FiFileText className="text-gray-500" />;
    }
  };

  const handleDelete = async (id: string) => {
    const performDelete = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/api-scripts/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!res.ok) throw new Error('Failed to delete script');
        setScripts(scripts.filter((script) => script._id !== id));
      } catch (err) {
        console.error('Error deleting script:', err);
      }
    };
    // Show confirmation dialog
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
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mr-4">
          <FiArrowLeft /> Back
        </button>
        <h1 className="text-2xl font-bold">API Scripts</h1>
      </div>

      <div className="flex justify-between items-center mb-6">
        <Link
          href="/g-connector/api-scripts/upload"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-md flex items-center gap-2"
        >
          <FiUpload /> Upload New Script
        </Link>
      </div>

     
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {scripts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No API scripts found. Upload your first script to get started.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form Associated</th>
                  
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scripts.map((script) => (
                  <tr key={script._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/g-connector/api-scripts/${script._id}`}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                      >
                        {getIconForType(script.apiType)} {script.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {script.apiType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" >
                    {Array.isArray(script.formMappings) && script.formMappings.length > 0
                        ? Array.from(new Set(script.formMappings.map((mapping: any) => mapping?.formId?.name || '').filter(Boolean))).join(', ')
                        : '-'}
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap">{script.format}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(script.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        className="cursor-pointer bg-red-600 hover:bg-red-700 text-white text-bold font-medium text-sm px-4 py-2 rounded-md flex items-center gap-2"
                        onClick={() => handleDelete(script._id)}
                      >
                        <FiTrash2 />

                      </button>
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

export default ApiScriptsPage;