'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FiDatabase,
  FiPlus,
  FiTrash2,
  FiPenTool,
  FiArrowLeft
} from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/navigation';
import ConfirmationToastComponent from '../../components/ConfirmationToast';

interface FormMapping {
  formId?: { name?: string };
  tableName?: string;
  fieldMappings?: { formField: string; dbField: string }[];
}

interface DbConnection {
  _id: string;
  name: string;
  dbType: string;
  host: string;
  port: number;
  active: true | false | 'error';
  lastActivity: Date;
  formMappings?: FormMapping[];
}

const DatabaseConnectionsPage = () => {
  const [connections, setConnections] = useState<DbConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        };

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/g-connector/db-connections`,
          { headers }
        );
        if (!res.ok) throw new Error('Failed to fetch connections');
        const data: any = await res.json();
        setConnections(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchConnections();
  }, []);

  const getStatusBadge = (status: string | boolean) => {
    const baseClasses =
      'inline-block px-2 py-0.5 text-xs font-semibold rounded-full';

    switch (status) {
      case true:
        return (
          <span className={`${baseClasses} text-white bg-green-600`}>
            Active
          </span>
        );
      case false:
        return (
          <span className={`${baseClasses} text-white bg-yellow-500`}>
            Inactive
          </span>
        );
      case 'error':
        return (
          <span className={`${baseClasses} text-white bg-red-600`}>
            Error
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} text-white bg-gray-500`}>
            Unknown
          </span>
        );
    }
  };

  const handleDisconnect = async (id: string) => {
    const performDelete = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/g-connector/db-connections/${id}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        if (!res.ok) throw new Error('Failed to disconnect');
        const data: any = await res.json();
        setConnections(connections.filter(conn => conn._id !== id));
        toast.success(data.message);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
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
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mr-4"
        >
          <FiArrowLeft /> Back
        </button>
        <h1 className="text-2xl font-bold">Database Connections</h1>
        <Link
          href="/g-connector/database-connections/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ml-auto"
        >
          <FiPlus />
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
          {connections.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FiDatabase className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No database connections
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new database connection.
              </p>
              <div className="mt-6">
                <Link
                  href="/g-connector/database-connections/new"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <FiPlus /> New Connection
                </Link>
              </div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Host
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Form Associated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table Mapped
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {connections.map(conn => (
                  <tr key={conn._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/g-connector/database-connections/submissions/${conn._id}`}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                      >
                        <FiDatabase className="text-gray-500" /> {conn.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {conn.dbType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {conn.host}:{conn.port}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(conn.active)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                      {Array.isArray(conn.formMappings) && conn.formMappings.length > 0
                        ? conn.formMappings
                            .map(m => m?.formId?.name || '')
                            .filter(Boolean)
                            .join(', ')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                      {Array.isArray(conn.formMappings) && conn.formMappings.length > 0
                        ? conn.formMappings
                            .map(m => m?.tableName || '')
                            .filter(Boolean)
                            .join(', ')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {conn.lastActivity
                        ? new Date(conn.lastActivity).toLocaleString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Link
                          href={`database-connections/${conn._id}`}
                          className="bg-blue-500 hover:bg-blue-700 cursor-pointer text-white font-bold py-1 px-2 rounded text-sm shadow flex items-center gap-2 transition duration-200"
                        >
                          <FiPenTool />
                        </Link>
                        <button
                          className="cursor-pointer bg-red-600 hover:bg-red-700 text-white text-bold font-medium text-sm px-4 py-2 rounded-md flex items-center gap-2"
                          onClick={() => handleDisconnect(conn._id)}
                        >
                          <FiTrash2 />
                        </button>
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

export default DatabaseConnectionsPage;
