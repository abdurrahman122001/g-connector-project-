// app/g-connector/api-scripts/upload/page.tsx
'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiUpload, FiX, FiCheck } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PaginatedTable from '@/app/components/PaginatedTable';
import ApiScriptFieldMapping from './ApiScriptFieldMapping';

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  apiType: z.enum(['REST', 'GraphQL', 'WebSocket']),
  format: z.enum(['JSON', 'XML']),
  endpoint: z.string().min(1, 'Endpoint is required'),
  formMapping: z.string().min(1, 'Form mapping is required'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  headers: z.string().optional(),
  body: z.string().optional()
});

type FormData = z.infer<typeof schema>;

const ApiScriptUploadPage = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },

  } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const [dataFormats, setDataFormats] = useState<any[]>(['JSON', 'XML']);

  const apiTypes: any = ['REST', 'GraphQL', 'WebSocket']


  const [forms, setForms] = useState<any[]>([]);
  const [scriptId, setScriptId] = useState<string | null>(null);



  useEffect(() => {
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
    fetchForms();
  }, []);

  const setDataFormatsChange = (event: any) => {

    if (event.target.value === 'GraphQL') {
      setDataFormats(['JSON'])
    }
    else {
      setDataFormats(['JSON', 'XML'])
    }

  }

  const ExecuteScript = async (endpoint: string, id: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/api-scripts/${id}/execute`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ endpoint: endpoint }),
        }
      );

      if (!response.ok) throw new Error('Execution failed');
      const r = await response.json();
      
      return response.json();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Execution failed');
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('apiType', data.apiType);
      formData.append('format', data.format);
      formData.append('formMapping', data.formMapping);
      formData.append('endpoint', data.endpoint);
      formData.append('method', data.method);

      if (data.headers && data.headers !== '') {
        formData.append('headers', data.headers);
      }
      if (data.body && data.body !== '') {
        formData.append('body', data.body);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/api-scripts`, {
        method: 'POST',
        body: formData,
        headers: {

          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Upload failed');

      const data1 = await response.json();
      setScriptId(data1.data._id || data1.data.id);

    } catch (error) {
      alert(error instanceof Error ? error.message : 'Upload failed');
    }
  };


  return (
    <div className="w-full p-0 bg-gray-50 min-h-screen">
      <div className="bg-white shadow-lg rounded-none p-8 w-full">
        <h1 className="text-2xl font-bold mb-6 text-left pl-8 pt-8">Upload API Script</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-8">
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">Script Name</label>
            <input
              {...register('name')}
              type="text"
              className={`input ${errors.name ? 'input-error' : 'input-primary'} rounded-md border-2 border-gray-300 focus:border-blue-500 focus:outline-none`}
              placeholder="My API Integration"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <FiX className="flex-shrink-0" /> {errors.name.message}
              </p>
            )}
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint</label>
            <input
              {...register('endpoint')}
              type="url"
              className={`input ${errors.endpoint ? 'input-error' : 'input-primary'} rounded-md border-2 border-gray-300 focus:border-blue-500 focus:outline-none`}
              placeholder="https://api.example.com/v1/users"
            />
            {errors.endpoint && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <FiX className="flex-shrink-0" /> {errors.endpoint.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">API Type</label>
              <select
                {...register('apiType')}
                className={`input ${errors.apiType ? 'input-error' : 'input-primary'} rounded-md border-2 border-gray-300 focus:border-blue-500 focus:outline-none`}
                onChange={setDataFormatsChange}

              >
                <option value="">Select API Type</option>
                {apiTypes.map((value: any) => (
                  <option key={value} value={value}>{value}</option>
                ))}

              </select>
              {errors.apiType && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <FiX className="flex-shrink-0" /> {errors.apiType.message}
                </p>
              )}
            </div>

            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Format</label>
              <select
                {...register('format')}
                className={`input ${errors.format ? 'input-error' : 'input-primary'} rounded-md border-2 border-gray-300 focus:border-blue-500 focus:outline-none`}
              >
                <option value="">Select Format</option>
                {dataFormats.map((value: any) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
              {errors.format && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <FiX className="flex-shrink-0" /> {errors.format.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">Form Mapping</label>
            <select
              {...register('formMapping')}
              className={`input ${errors.formMapping ? 'input-error' : 'input-primary'} rounded-md border-2 border-gray-300 focus:border-blue-500 focus:outline-none`}
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

          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">HTTP Method</label>
            <select
              {...register('method')}
              defaultValue=""
              className={`input ${errors.method ? 'input-error' : 'input-primary'} rounded-md border-2 border-gray-300 focus:border-blue-500 focus:outline-none`}
            >
              <option value="">Select Method</option>
              <option value="GET" selected>GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
            {errors.method && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <FiX className="flex-shrink-0" /> {errors.method.message}
              </p>
            )}
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">Headers</label>
            <textarea
              {...register('headers')}
              className={`input ${errors.headers ? 'input-error' : 'input-primary'} rounded-md border-2 border-gray-300 focus:border-blue-500 focus:outline-none`}
              placeholder="Key: Value pairs, e.g., Authorization: Bearer token"
            />
            {errors.headers && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <FiX className="flex-shrink-0" /> {errors.headers.message}
              </p>
            )}
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
            <textarea
              {...register('body')}
              className={`input ${errors.body ? 'input-error' : 'input-primary'} rounded-md border-2 border-gray-300 focus:border-blue-500 focus:outline-none`}
              placeholder="Request body content"
            />
            {errors.body && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <FiX className="flex-shrink-0" /> {errors.body.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/g-connector/api-scripts')}
              className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition duration-200"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white py-2 px-4 rounded-md flex items-center gap-2 hover:bg-blue-600 transition duration-200"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">↻</span> Uploading...
                </>
              ) : (
                <>
                  <FiUpload /> Upload Script
                </>
              )}
            </button>
          </div>
        </form>
        {scriptId && (
          <div className="mt-8">
            <ApiScriptFieldMapping scriptId={scriptId} />
          </div>
        )}
      </div>

      {/* {formMapping.length > 0 && tables.map(({ table, data }, index) => {
        const specificMapping = formMapping.find(item => item?.name?.toLowerCase() === table?.toLowerCase());


        return (
          <PaginatedTable
            key={table || `table-${index}`}
            tableName={table}
            url="db-connections"
            rows={data || []}
            setTableData={setData} // Pass state setter
            mappings={specificMapping} // Pass the found mapping (can be undefined)
          />
        );
      })
      } */}
    </div>
  );
};

export default ApiScriptUploadPage;