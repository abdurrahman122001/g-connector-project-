// app/g-connector/database-connections/new/page.tsx
'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios'
import { FiX, FiServer, FiCheck } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import React, { useState, useEffect, useCallback } from 'react';
import PaginatedTable from '../../../components/PaginatedTable';
import { processFile, updateSubmissionId } from '@/app/components/gconector/Common';

import { TableInfo, FormMappingItem, TableData, ConfiguredTargetField } from '@/app/Interfaces';

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  dbType: z.enum(['MySQL', 'PostgreSQL', 'MSSQL', 'MongoDB']),
  host: z.string().min(1, 'Host is required'),
  port: z.number().min(1, 'Port must be between 1 and 65535').max(65535),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  database: z.string().min(1, 'Database name is required'),
  formMapping: z.string().min(1, 'Form mapping is required'),


});

type FormData = z.infer<typeof schema>;

const NewConnectionPage = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      port: 3306
    }
  });

  const [tables, setTables] = useState<TableInfo[]>([]); // List of available tables
  
  const [forms, setForms] = useState<any[]>([]);
  const [formMapping, setFormMapping] = useState<any[]>([]);
  const [datas, setData] = useState<TableData>({}); // Data prepared for submission  const [id, setId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false); // Specific state for saving data
  
  const [submissionId, setSubmissionId] = useState<string>('');
  const [columnKeys, setColumnKeys] = useState<ConfiguredTargetField[]>([]);
  const [id, setId] = useState<string>('');

  const [error, setError] = useState<string | null>(null);

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

    fetchForms();
  }, []);

  const getFormsForMapping = useCallback(async (mapIdData: any, tableInfo: TableInfo[], currentApiMappings: FormMappingItem[]): Promise<FormMappingItem[]> => {
    // This function now *returns* the final mappings instead of setting state directly



    if (!mapIdData || !Array.isArray(tableInfo) || tableInfo.length === 0) {


      return currentApiMappings; // Return existing mappings if nothing to do
    }


    const existingMappings = Array.isArray(currentApiMappings) ? currentApiMappings : [];

    const firstValidMapping = existingMappings.find(m => m.formId && Array.isArray(m.formId.fields) && m.formId.fields.length > 0);

    let finalMappings = existingMappings; // Start with current mappings


    if (tableInfo.length > 0 && existingMappings[0] && (tableInfo.length !== existingMappings[0].fieldMappings?.length || !firstValidMapping && tableInfo.length > 0)) {
      if (!firstValidMapping && tableInfo.length > 0) {
        return existingMappings; // Return original mappings as we can't proceed
      }
      const mappingsToUpdate: FormMappingItem[] = [];
      for (const currentTable of tableInfo) {
        let mappingToUse: FormMappingItem | undefined = undefined;
        if (typeof currentTable.table !== 'undefined') {
          mappingToUse = existingMappings.find(m => m.name?.toLowerCase() === currentTable.table?.toLowerCase());
        }
        if (!mappingToUse && firstValidMapping) { // Create only if template exists
          mappingToUse = {
            ...firstValidMapping,
            name: currentTable?.table,
            fieldMappings: [{
              ...(firstValidMapping.fieldMappings?.[0] || {}),
              fields: firstValidMapping.formId?.fields?.[0]?.label ? [firstValidMapping.formId.fields[0].label] : [],
            }],
            // Copy other relevant fields from firstValidMapping, avoid copying specific data
          };
        } else if (!mappingToUse && !firstValidMapping) {
          console.warn(`Skipping mapping for table ${currentTable.table} - no template found.`);
          continue; // Skip if no template
        }

        if (mappingToUse && mappingToUse.formId) {
          // Ensure fieldMappings structure is valid before pushing
          if (!Array.isArray(mappingToUse.fieldMappings)) {
            mappingToUse.fieldMappings = []; // Initialize if missing
          }
          if (mappingToUse.fieldMappings.length === 0) {
            mappingToUse.fieldMappings.push({ fields: [] }); // Ensure at least one mapping object exists
          }
          if (!Array.isArray(mappingToUse.fieldMappings[0].fields)) {
            mappingToUse.fieldMappings[0].fields = []; // Ensure fields array exists
          }
          mappingsToUpdate.push(mappingToUse);
        } else {
          console.warn(`Could not create/find valid mapping structure for table: ${currentTable.table}`);
        }
      }




      if (mappingsToUpdate.length > 0 && mappingsToUpdate.length === tableInfo.length) {


        const body = { formMappings: mappingsToUpdate };
        try {


          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/db-connections/${id}/formMappingUpdate`, {
            method: "PUT",
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(body)
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Mapping update failed' }));

          }

          const updatedData = await res.json();
          
          
          if (updatedData.success && Array.isArray(updatedData.data?.formMappings)) {
            toast.info("Form mappings updated.");
            finalMappings = updatedData.data.formMappings; // API returned the definitive list
          }
        } catch (error) {
          console.error(" :", error);
          toast.error(`Failed to update mappings: ${error instanceof Error ? error.message : 'Unknown error'}`);
          // Return the mappings we *tried* to send, as API update failed
          finalMappings = mappingsToUpdate;
        }
      } else {
        console.log("Generated mappings array length mismatch or empty, using existing/previous mappings.");
        finalMappings = existingMappings; // Fallback if something went wrong during generation
      }
    }
    else {
      console.log("Mappings appear consistent with tables. No update needed.");

      finalMappings = existingMappings; // No changes needed
    }

    

    return finalMappings; // Return the determined final mappings

  }, [id])


  useEffect(() => {
     processFile(id as string, setTables, setFormMapping, getFormsForMapping);
      
  }, [id, formMapping.length]);


  const saveData = async () => {
    setIsSaving(true); // Indicate saving state
    setError(null);
    let savedCount = 0;
    let failedCount = 0;
    const submissionsToMake: { formId: string; body: any; tableName: string }[] = [];

    
    try {
      // Iterate through the prepared data
      //  in the 'datas' state


      for (const [tableName, tableRows] of Object.entries(datas)) {
        if (!tableRows || tableRows.length === 0) {
          console.warn(`No data rows found for table: ${tableName}`);
          continue;
        }

        const firstRow = tableRows[0];
        const form_id = firstRow?.form_id;
        const script_name = firstRow?.script_name; // Should match tableName
        const field_keys = firstRow?.field_keys;

        if (!form_id || !script_name || !field_keys || !Array.isArray(field_keys) || field_keys.length === 0) {
          toast.warn(`Incomplete mapping info for table: ${tableName}. Skipping submission.`);
          console.warn(`Incomplete mapping info for table: ${tableName}`, { form_id, script_name, field_keys });
          failedCount++; // Count as failed if mapping is bad
          continue;
        }

        // Prepare the data array: array of arrays, ordered by field_keys
        const submissionData = tableRows.map(row =>
          field_keys.map((key: string) => row[key] ?? '') // Use nullish coalescing
        );

        if (submissionData.length === 0) {
          console.warn(`No valid data rows prepared for submission for table: ${tableName}`);
          continue;
        }


        const body = {
          data: submissionData,
          name: script_name,
          field_keys: field_keys,
          uploaded_column_keys: firstRow?.uploaded_column_keys,
          all_column_keys : firstRow?.all_column_keys
        };



        submissionsToMake.push({ formId: form_id, body, tableName });
      } // End loop through datas

      if (submissionsToMake.length === 0 && failedCount === 0) {
        toast.info("No data prepared for submission.");
        setIsSaving(false);
        return;
      }

      
      // Send requests using Promise.allSettled to handle individual failures
      const results = await Promise.allSettled(
        submissionsToMake.map(({ formId, body, tableName }) =>
          axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/api/forms/${formId}/submissions`,
            body,
            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
          ).then(response => ({ // Wrap success/error for consistent handling
            status: 'fulfilled',
            tableName: tableName,
            success: response.data.success,
            message: response.data.message || 'Saved successfully.',
            id: response.data.data._id
          })).catch(err => {
            const errorMessage = err.response?.data?.message || err.message || `Save failed for ${tableName}`;
            console.error(`Submission error for ${tableName}:`, err.response?.data || err);
            return {
              status: 'rejected',
              tableName: tableName,
              success: false,
              message: errorMessage,
              id: null
            };
          })
        )
      );

      const submissionId: string[] = []
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.success) {
          submissionId.push(result.value.id)
          

          savedCount++;
          // toast.success(`Data for ${result.value.tableName} saved.`); // Maybe too many toasts?
        } else {
          failedCount++;
          const tableName = result.status === 'fulfilled' ? result.value.tableName : result.reason.tableName;
          const message = result.status === 'fulfilled' ? result.value.message : result.reason.message;
          
        }
        
      });
      updateSubmissionId(submissionId, `${process.env.NEXT_PUBLIC_API_URL}/api/db-connections/${id}/update_submission_id`);

      // Final summary toast
      if (savedCount > 0 && failedCount === 0) {
        toast.success(`All ${savedCount} table(s) saved successfully!`);
        router.push('/g-connector/database-connections')
      } else if (savedCount > 0 && failedCount > 0) {
        toast.warn(`${savedCount} table(s) saved, ${failedCount} failed.`);
      } else if (savedCount === 0 && failedCount > 0) {
        toast.error(`All ${failedCount} submission(s) failed.`);
      }

    } catch (error) {
      console.error("Error in saveData function:", error);
      setError("An unexpected error occurred during the save process.");
      toast.error("An unexpected error occurred during save.");
    } finally {
      setIsSaving(false);
    }

  };



  const onSubmit = async (data: FormData) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/db-connections`, {
        name: data.name,
        dbType: data.dbType,
        host: data.host,
        port: data.port,
        username: data.username,
        user: data.username,
        password: data.password,
        database: data.database,

        formMapping: data.formMapping

      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result: any = response.data;

      if (!result.success) {
        toast.error(result.message || 'Connection failed');
      }


      setId(result.data._id);


    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // Handle 400 error specifically
        if (error.response.status === 400) {
          toast.error(error.response.data.error || 'Bad Request');
        } else {
          toast.error('Connection failed');
        }
      } else {
        toast.error('Connection failed');
      }
    }
  };


  const setDefaultPort = (dbType: string) => {
    switch (dbType) {
      case 'MySQL': setValue('port', 3306); break;
      case 'PostgreSQL': setValue('port', 5432); break;
      case 'MSSQL': setValue('port', 1433); break;
      case 'MongoDB': setValue('port', 27017); break;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">New Database Connection</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-8 rounded-xl shadow-md">
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
              {isSubmitting ? (
                <>
                  <span className="animate-spin">↻</span> Connecting...
                </>
              ) : (
                <>
                  <FiServer /> Connect Database
                </>
              )}
            </button>
          </div>
        </form>

      </div>


      {formMapping.length > 0 && tables.map(({ table, data }, index) => {
        const specificMapping = formMapping.find(item => item?.name?.toLowerCase() === table?.toLowerCase());

        
        return (
          <PaginatedTable
            key={table || `table-${index}`}
            tableName={table}
            url="db-connections"
            rows={data || []}
            setTableData={setData}
            mappings={specificMapping}
            columnKeys={columnKeys}
            setColumnKeys={setColumnKeys}
          />
        );
      })
      }
      {formMapping.length > 0 &&
        < div className="flex justify-end gap-3 pt-4 border-t mt-6">
          <button
            type="button"
            onClick={() => router.push('/g-connector/api-scripts')}
            className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition duration-200 cursor-pointer"
          >
            Back
          </button>
          <button
            type="button"
            onClick={saveData}
            disabled={isSaving ||  Object.keys(datas).length === 0}
            className="bg-green-500 text-white py-2 px-4 rounded-md flex items-center gap-2 hover:bg-green-600 transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiCheck /> Save Data
          </button>
        </div>
      }
      <ToastContainer />
    </div >
  );
};

export default NewConnectionPage;