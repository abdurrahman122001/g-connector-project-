// app/g-connector/database-connections/[id]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { FiDatabase, FiEdit, FiTrash2, FiServer, FiActivity, FiCheckCircle, FiCheck, FiX } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast, ToastContainer } from 'react-toastify';
import PaginatedTable from '@/app/components/PaginatedTable'; // Adjust path if needed
import axios from 'axios';
import { getSubmissions, processFile, generateUniqueId } from '@/app/components/gconector/Common';
import { TableInfo, FormMappingItem, TableData, ConfiguredTargetField } from '@/app/Interfaces';

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





// --- Interfaces and Schemas (Keep existing definitions) ---
interface FileUpload {
  _id: string;
  originalName: string;
  fileType: string;
  filePath: string;
  fileSize: number;
  description?: string;
  createdAt: Date;
  updatedAt?: Date; // Add if available
}


const DatabaseConnectionDetailsPage = () => {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const query = searchParams.get('query');
  const router = useRouter();
  const [tables, setTables] = useState<TableInfo[]>([]); // Extracted table data
  const [formMapping, setFormMapping] = useState<FormMappingItem[]>([]); // Mapping configuration

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
const [columnKeys, setColumnKeys] = useState<any[]>([]);

  const [isProcessing, setIsProcessing] = useState(false); // Specific state for file processing
  const [isSaving, setIsSaving] = useState(false); // Specific state for saving data


  const {

    reset,
    setValue
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      port: 3306
    }
  });
  const [datas, setData] = useState<TableData>({}); // Data prepared for submission




  useEffect(() => {

    const formatted =  (fields : any)  => {
      return fields.map((key: any, index: any) => ({
        id: generateUniqueId(),
        name: key,
        mappedSourceField: key || null
      }));
    }
    getSubmissions(id as string).then(res => setColumnKeys(formatted(res.data.uploaded_column_keys)));

    processFile(query as string, setTables, setFormMapping, getFormsForMapping);

  }, [id, reset, isEditing, isLoading]);



  const getFormsForMapping = useCallback(async (mapIdData: any, tableInfo: TableInfo[], currentApiMappings: FormMappingItem[]): Promise<FormMappingItem[]> => {
    // This function now *returns* the final mappings instead of setting state directly



    if (!mapIdData || !Array.isArray(tableInfo) || tableInfo.length === 0) {


      return currentApiMappings; // Return existing mappings if nothing to do
    }


    const existingMappings = Array.isArray(currentApiMappings) ? currentApiMappings : [];

    const firstValidMapping = existingMappings.find(m => m.formId && Array.isArray(m.formId.fields) && m.formId.fields.length > 0);

    let finalMappings = existingMappings; // Start with current mappings


    if (
      tableInfo.length > 0 &&
      existingMappings[0] &&
      (tableInfo.length !== existingMappings[0].fieldMappings?.length ||
        (!firstValidMapping && tableInfo.length > 0))
    ) {
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



  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }



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

          field_keys: field_keys,
          uploaded_column_keys: columnKeys.map(r => r.mappedSourceField),
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
        submissionsToMake.map(({ body, tableName }) =>

          axios.put(
            `${process.env.NEXT_PUBLIC_API_URL}/api/forms/${id}/submissions_update`,
            body,
            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
          ).then(response => ({ // Wrap success/error for consistent handling
            status: 'fulfilled',
            tableName: tableName,
            success: response.data.success,
            message: response.data.message || 'Saved successfully.'
          })).catch(err => {
            const errorMessage = err.response?.data?.message || err.message || `Save failed for ${tableName}`;
            console.error(`Submission error for ${tableName}:`, err.response?.data || err);
            return {
              status: 'rejected',
              tableName: tableName,
              success: false,
              message: errorMessage
            };
          })
        )
      );

      // Process results
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.success) {
          savedCount++;
          // toast.success(`Data for ${result.value.tableName} saved.`); // Maybe too many toasts?
        } else {
          failedCount++;
          const tableName = result.status === 'fulfilled' ? result.value.tableName : result.reason.tableName;
          const message = result.status === 'fulfilled' ? result.value.message : result.reason.message;
          
        }
      });

      // Final summary toast
      if (savedCount > 0 && failedCount === 0) {
        toast.success(`All ${savedCount} table(s) saved successfully!`);
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



  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Database Connection</h1>

      </div>

      <div className="bg-white rounded-lg shadow p-6">

        <div className="space-y-4">


          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
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
              disabled={isSaving || isProcessing || Object.keys(datas).length === 0}
              className="bg-green-500 text-white py-2 px-4 rounded-md flex items-center gap-2 hover:bg-green-600 transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiCheck /> Save Data


            </button>
          </div>



          {tables.map(({ table, data }, index) => {
            const specificMapping = formMapping.find(item => item?.name?.toLowerCase() === table?.toLowerCase());
            const formattedMapping = specificMapping ? {
              ...specificMapping,
              type: 'form' // Add the required type field
            } : undefined;

            return (
              <PaginatedTable
                key={table || `table-${index}`}
                tableName={table}
                url="db-connections"
                columnKeys={columnKeys}
                setColumnKeys={setColumnKeys}
                rows={data || []}
                setTableData={setData}
                mappings={formattedMapping}
              />
            );
          })
          }
        </div>

      </div>
      <ToastContainer />
    </div>
  );
};

export default DatabaseConnectionDetailsPage;