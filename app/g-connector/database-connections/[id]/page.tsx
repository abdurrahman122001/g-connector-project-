// app/g-connector/database-connections/[id]/page.tsx
'use client';

import { useState, useEffect  } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiServer, FiX } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast, ToastContainer } from 'react-toastify';

import { TableInfo, FormMappingItem } from '@/app/Interfaces';
  
interface DbConnection {
  active: boolean;
  _id: string;
  name: string;
  dbType: string;
  host: string;
  port: number;
  username: string;
  database: string;
  status: 'active' | 'inactive' | 'error';
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

const editSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  dbType: z.enum(['MySQL', 'PostgreSQL', 'MSSQL', 'MongoDB']),
  host: z.string().min(1, 'Host is required'),
  port: z.number().min(1, 'Port must be between 1 and 65535').max(65535),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  database: z.string().min(1, 'Database name is required'),
  formMapping: z.string().min(1, 'Form mapping is required'),
});

type EditFormData = z.infer<typeof editSchema>;



const DatabaseConnectionDetailsPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  


  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      port: 3306
    }
  });
   const [forms, setForms] = useState<any[]>([]);

  const fetchForms = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    if (response.ok) {
      setForms(data.data);
    }
  };

  useEffect(() => {

    const fetchConnection = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/db-connections/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!res.ok) throw new Error('Failed to fetch connection');
        const data = await res.json();
        const data_result = data.data

        reset({
          name: data_result.name,
          dbType: data_result.dbType,
          host : data_result.host,
          port : data_result.port,
          username : data_result.username,
          database : data_result.database,
          formMapping: data_result.formMappings?.[0]?.formId?._id,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } 
    };
    fetchConnection();

    fetchForms();


  }, [])



  const setDefaultPort = (dbType: string) => {
    switch (dbType) {
      case 'MySQL': setValue('port', 3306); break;
      case 'PostgreSQL': setValue('port', 5432); break;
      case 'MSSQL': setValue('port', 1433); break;
      case 'MongoDB': setValue('port', 27017); break;
    }
  };


  

  const handleEdit = async (data: EditFormData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/db-connections/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`

        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Update failed');

            
      router.push("/g-connector/database-connections")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    }
  };

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  

  return (
    <div className="container mx-auto p-6">
   

      <div className="bg-white rounded-lg shadow p-6">
        
            <form onSubmit={handleSubmit(handleEdit)} className="space-y-8 bg-white p-8 rounded-xl shadow-md">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Connection Name</label>
              <input
                {...register('name')}
                type="text"
                className={`w-full rounded-md border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Production Database"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <FiX className="flex-shrink-0" /> {errors.name.message}
                </p>
              )}
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Database Type</label>
              <select
                {...register('dbType', { onChange: (e) => setDefaultPort(e.target.value) })}
                className={`w-full rounded-md border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.dbType ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select Database Type</option>
                <option value="MySQL">MySQL</option>
                <option value="PostgreSQL">PostgreSQL</option>
                <option value="MSSQL">Microsoft SQL Server</option>
                <option value="MongoDB">MongoDB</option>
              </select>
              {errors.dbType && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <FiX className="flex-shrink-0" /> {errors.dbType.message}
                </p>
              )}
            </div>
  
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Host</label>
                <input
                  {...register('host')}
                  type="text"
                  className={`w-full rounded-md border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.host ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="localhost or 192.168.1.100"
                />
                {errors.host && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <FiX className="flex-shrink-0" /> {errors.host.message}
                  </p>
                )}
              </div>
  
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Port</label>
                <input
                  {...register('port', { valueAsNumber: true })}
                  type="number"
                  className={`w-full rounded-md border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.port ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="3306"
                />
                {errors.port && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <FiX className="flex-shrink-0" /> {errors.port.message}
                  </p>
                )}
              </div>
            </div>
  
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Username</label>
                <input
                  {...register('username')}
                  type="text"
                  className={`w-full rounded-md border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.username ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="database_user"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <FiX className="flex-shrink-0" /> {errors.username.message}
                  </p>
                )}
              </div>
  
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Password</label>
                <input
                  {...register('password')}
                  type="password"
                  className={`w-full rounded-md border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <FiX className="flex-shrink-0" /> {errors.password.message}
                  </p>
                )}
              </div>
            </div>
  
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Database Name</label>
                <input
                  {...register('database')}
                  type="text"
                  className={`w-full rounded-md border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.database ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="my_database"
                />
                {errors.database && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <FiX className="flex-shrink-0" /> {errors.database.message}
                  </p>
                )}
              </div>
  
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Form Mapping</label>
                <select
                  {...register('formMapping')}
                  className={`w-full rounded-md border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.formMapping ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select Form Mapping</option>
                  {forms.map((form) => (
                    <option key={form._id} value={form._id}>{form.name}</option>
                  ))}
                </select>
                {errors.formMapping && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <FiX className="flex-shrink-0" /> {errors.formMapping.message}
                  </p>
                )}
              </div>
            </div>
  
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.push('/g-connector/database-connections')}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-md shadow transition duration-200"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md shadow flex items-center gap-2 transition duration-200"
                disabled={isSubmitting}
              >
                
                  <>
                    <FiServer /> Update
                  </>
                
              </button>
            </div>
          </form>
        
      </div>
      <ToastContainer />
    </div>
  );
};

export default DatabaseConnectionDetailsPage;