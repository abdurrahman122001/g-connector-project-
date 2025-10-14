// app/g-connector/file-uploads/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiUpload, FiFile, FiFileText, FiFileMinus, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import { toast, ToastContainer, Id as ToastId } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import CSS for react-toastify
import ConfirmationToastComponent from '@/app/components/ConfirmationToast';
import { useRouter } from 'next/navigation';

interface FileUpload {
  _id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  createdAt: Date;
  description: string;
  formMappings?: { formId?: { name?: string } }[]; // Only this line should remain
}


const FileUploadsPage = () => {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null); // For specific delete loading state
  const router = useRouter();

  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found. Please log in.');
        }
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/file-uploads`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Unauthorized. Please check your login session.');
          }
          const errorData = await res.json().catch(() => ({ message: `Failed to fetch files (status ${res.status})` }));
          throw new Error(errorData.message || `Failed to fetch files (status ${res.status})`);
        }
        
        const data = await res.json();
        
        setFiles(data.data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching files.';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFiles();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('csv')) return <FiFileText className="text-green-500" />;
    if (fileType.includes('excel') || fileType.includes('spreadsheetml.sheet')) return <FiFileText className="text-green-700" />;
    if (fileType.includes('json')) return <FiFileText className="text-yellow-500" />;
    if (fileType.includes('sql')) return <FiFileMinus className="text-blue-500" />;
    return <FiFile className="text-gray-500" />;
  };

  const handleDelete = (fileId: string, fileName: string) => {
    const performDelete = async () => {
      setDeletingFileId(fileId);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Authentication token not found. Please log in.');
          setDeletingFileId(null);
          return;
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/file-uploads/${fileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to delete file' }));
          throw new Error(errorData.message || 'Failed to delete file');
        }

        setFiles(files.filter((file) => file._id !== fileId));
        toast.success("Deleted successfully.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to delete file');
      } finally {
        setDeletingFileId(null);
      }
    };

    // Show confirmation toast
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
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mr-4">
          <FiArrowLeft /> Back
        </button>
        <h1 className="text-2xl font-bold">WHONET/FILE UPLOAD</h1>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="flex justify-between items-center mb-6">
        <Link
          href="/g-connector/whonet/upload"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
        >
          <FiUpload className="text-lg" />
          Upload File
        </Link>
      </div>

      {isLoading && files.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error && files.length === 0 ? (
         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {files.length === 0 && !isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No files uploaded</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by uploading your first file.
              </p>
              <div className="mt-6">
                <Link
                  href="/g-connector/whonet/upload"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                >
                  <FiUpload className="text-lg" />
                  Upload File
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form Associated</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {files.map((file) => (
                    <tr key={file._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/g-connector/whonet/${file._id}`} // Assuming this is the detail page
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-2 group"
                        >
                          {getFileIcon(file.fileType)}
                          <span className="group-hover:underline">{file.filename}</span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {file.fileType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(file.fileSize)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={file.description}>
                        {file.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={file.description}>
                      {Array.isArray(file.formMappings) && file.formMappings.length > 0
                        ? Array.from(new Set(file.formMappings.map((mapping: any) => mapping?.formId?.name || '').filter(Boolean))).join(', ')
                        : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(file.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDelete(file._id, file.filename)}
                          disabled={deletingFileId === file._id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition disabled:opacity-60 cursor-pointer"
                        >
                          {deletingFileId === file._id ? (
                            <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <FiTrash2 className="text-base" />
                          )}
                          {deletingFileId === file._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploadsPage;