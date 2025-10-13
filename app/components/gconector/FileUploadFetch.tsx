// app/g-connector/file-uploads/[id]/page.tsx
'use client';
import { useState, useEffect, useCallback } from 'react'; // Import useCallback
import { useRouter } from 'next/navigation';
import { FiFile, FiDownload, FiTrash2, FiEdit, FiClock, FiCheck, FiUpload, FiX } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PaginatedTable from '@/app/components/PaginatedTable'; // Adjust path if needed
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Ensure CSS is imported
import axios from 'axios';
import { ConfiguredTargetField, FileUpload } from '@/app/Interfaces'; // Add ConfiguredTargetField import
import { updateSubmissionId } from './Common';
import { useDispatch } from 'react-redux';
import { mapColumns } from "../../../store/slices/FileUploadFetchSlice"
import ConfirmationToastComponent from '../ConfirmationToast';

// More specific type for form mapping items
type FormMappingItem = {
  _id?: string;
  name: string | undefined; // Allow name to be undefined
  formId: {
    id: string;
    fields: { label: string;[key: string]: any }[];
    [key: string]: any;
  };
  fieldMappings: {
    fields: string[];
    [key: string]: any;
  }[];
  [key: string]: any;
};

// Type for data extracted from file
type TableInfo = {
  table: string;
  data: any[];
};

// Type for data prepared by PaginatedTable for saving
type TableData = {
  [tableName: string]: any[];
};

// Schema for the edit form
const editSchema = z.object({
  // Make file optional for editing only description
  file: z.custom<FileList>()
    .optional() // Make file optional
    .refine((files) => !files || files.length <= 1, 'Only one file allowed')
    .refine((files) => {
      if (!files || files.length === 0) return true; // Allow empty
      const allowedExtensions = ['.csv', '.xls', '.xlsx', '.json', '.sql', '.sqlite', '.txt'];
      const fileName = files[0]?.name.toLowerCase() || '';
      return allowedExtensions.some(ext => fileName.endsWith(ext));
    }, 'Only CSV, Excel, JSON, SQL, and text files allowed')
    .refine((files) => {
      if (!files || files.length === 0) return true; // Allow empty
      return files[0]?.size <= 10 * 1024 * 1024; // 10MB
    }, 'File size must be less than 10MB'),
  description: z.string().max(200, 'Description must be less than 200 characters').optional(),
});

type EditFormData = z.infer<typeof editSchema>;

// Define interfaces for the component
interface FileUploadFetchProps {
  fileId: string;
}

const FileUploadFetch: React.FC<FileUploadFetchProps> = ({ fileId }) => {

  const dispatch  =useDispatch();
  const router = useRouter();

  // State management using useState hooks
  const [file, setFile] = useState<FileUpload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [formMapping, setFormMapping] = useState<FormMappingItem[]>([]);
  const [datas, setData] = useState<TableData>({});
  const [columnKeys, setColumnKeys] = useState<ConfiguredTargetField[]>([]);

  // Form handling with react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      description: '',
      file: undefined
    }
  });

  const watchedFile = watch('file');

  // --- API Calls and Logic Functions ---

  const getFormsForMapping = useCallback(async (mapIdData: any, tableInfo: TableInfo[], currentApiMappings: FormMappingItem[]): Promise<FormMappingItem[]> => {
    // This function now *returns* the final mappings instead of setting state directly


    if (!mapIdData || !Array.isArray(tableInfo) || tableInfo.length === 0) {


      return currentApiMappings; // Return existing mappings if nothing to do
    }


    const existingMappings = Array.isArray(currentApiMappings) ? currentApiMappings : [];
    const firstValidMapping = existingMappings.find(m => m.formId && Array.isArray(m.formId.fields) && m.formId.fields.length > 0);

    let finalMappings = existingMappings; // Start with current mappings

    if (tableInfo.length > 0 && (tableInfo.length !== existingMappings[0].fieldMappings.length || !firstValidMapping && tableInfo.length > 0)) {
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
              fields: firstValidMapping.formId.fields[0]?.label ? [firstValidMapping.formId.fields[0].label] : [],
            }],
            // Ensure we don't reuse IDs, backend should generate new ones if needed
            _id: undefined, // Explicitly remove _id for creation
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

          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/file-uploads/${fileId}/formMappingUpdate`, {
            method: "PUT",
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(body)
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Mapping update failed' }));
            throw new Error(errorData.message || 'Failed to update form mappings');
          }

          const updatedData = await res.json();
          if (updatedData.success && Array.isArray(updatedData.data?.formMappings)) {
            toast.info("Form mappings updated.");
            finalMappings = updatedData.data.formMappings; // API returned the definitive list
          }
        } catch (error) {
          
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

  }, [fileId]); // Dependency: fileId


  const processFile = useCallback(async () => {
    dispatch(mapColumns([]))

    if (!fileId) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/file-uploads/${fileId}/process`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Processing failed with status: ' + res.status }));
        throw new Error(errorData.message || 'Failed to process file');
      }

      const data = await res.json();



      if (!data.success || !data.data) {
        throw new Error(data.message || 'Processing completed but returned no data.');
      }

      // Ensure data_records is an array
      const processedTables = Array.isArray(data.data.data_records)
        ? (Array.isArray(data.data.data_records[0])
          ? data.data.data_records[0]  // It's an array of arrays (tables)
          : data.data.data_records) // It's a single array of records, so wrap it in an array to treat it as a single "table"
        : [];      // Get initial mappings from the API response
      const initialApiMappings = Array.isArray(data.data.mapId?.formMappings) ? data.data.mapId.formMappings : [];




      const finalMappings = await getFormsForMapping(data.data.mapId, processedTables, initialApiMappings);



      setTables(processedTables);
      setFormMapping(finalMappings); // Set the final, potentially updated mappings


    } catch (err) {
      console.error("Error processing file:", err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown processing error';
      setError(`Processing Error: ${errorMsg}`);
      toast.error(`Error processing file: ${errorMsg}`);
      // Reset tables and mappings on error?
      // setTables([]);
      // setFormMapping([]);
    } finally {
      setIsProcessing(false);
    }
  }, [fileId, getFormsForMapping]); // Dependencies


  // --- Initial Data Fetching Effect ---
  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      if (!fileId) {
        setError("File ID is missing.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setIsProcessing(true); // Indicate processing starts immediately after fetch
      setError(null); // Clear previous errors
      setTables([]); // Clear previous data
      setFormMapping([]); // Clear previous mappings

      try {
        // Fetch file details first
        const fileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/file-uploads/${fileId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!isMounted) return; // Check before state update
        if (!fileRes.ok) throw new Error('Failed to fetch file details');
        const fileData = await fileRes.json();

        if (!fileData.success || !fileData.data) {
          throw new Error(fileData.message || 'File data not found');
        }

        if (isMounted) {


          setFile(fileData.data);
          reset({ // Reset form with fetched data
            description: fileData.data.description || '',
            file: undefined // Don't pre-fill file input
          });
        }

        // Now process the file (which will set tables and mappings)
        // processFile() handles its own loading state (isProcessing) and errors
        await processFile();

      } catch (err) {
        if (isMounted) {
          console.error("Error during initial load:", err);
          const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
          setError(`Load Error: ${errorMsg}`);
          toast.error(`Error loading details: ${errorMsg}`);
        }
      } finally {
        // Overall loading is false when both fetch and initial process attempt are done
        // isProcessing might still be true if processFile runs longer, but the initial load sequence is complete
        if (isMounted) {
          setIsLoading(false);
          // Ensure isProcessing is false if fetch failed before processFile started
          if (error && !isProcessing) setIsProcessing(false);
        }
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false; // Cleanup
    };
  }, [fileId, reset, processFile]); // Include processFile in dependencies


  // --- Action Handlers ---

  const handleEditSubmit = async (data: EditFormData) => {
    // Handles the form submission when in editing mode
    if (!file) return;

    const formData = new FormData();
    let requiresReprocessing = false;

    // Append file only if a new one is selected
    if (data.file && data.file.length > 0) {
      formData.append('file', data.file[0]);
      requiresReprocessing = true; // New file means reprocessing needed
    }

    // Append description if it exists or changed (check against original file state)
    if (data.description !== undefined && data.description !== (file.description || '')) {
      formData.append('description', data.description);
    }

    // Check if anything was actually added to FormData
    let hasChanges = false;
    for (const _ of formData.entries()) { // Iterate to check if it has entries
      hasChanges = true;
      break;
    }

    if (!hasChanges) {
      toast.info("No changes detected to update.");
      setIsEditing(false); // Exit editing mode anyway
      return;
    }


    setIsLoading(true); // Use general loading indicator for the update action
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/file-uploads/${fileId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          // Content-Type is set automatically by browser for FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Update failed' }));
        throw new Error(errorData.message || 'Update failed');
      }

      const updatedFileData = await response.json();

      if (updatedFileData.success && updatedFileData.data) {
        setFile(updatedFileData.data); // Update file state
        reset({ // Reset form with new data
          description: updatedFileData.data.description || '',
          file: undefined // Clear file input
        });
        setIsEditing(false); // Exit editing mode
        toast.success('File details updated successfully!');

        if (requiresReprocessing) {
          toast.info("New file uploaded. Reprocessing...");
          // Clear old tables/mappings before reprocessing
          setTables([]);
          setFormMapping([]);
          await processFile(); // Trigger reprocessing
        }

      } else {
        throw new Error(updatedFileData.message || 'Update succeeded but returned no data.');
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error(`Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };


  const handleDelete = async () => {
    const performDelete = async () => {
      setIsLoading(true); // Show loading indicator
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/file-uploads/${fileId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Deletion failed' }));
          throw new Error(errorData.message || 'Deletion failed');
        }
        toast.success('File deleted successfully.');
        router.push('/g-connector/file-uploads'); // Navigate away
      } catch (error) {
        console.error("Deletion error:", error);
        toast.error(`Deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsLoading(false); // Stop loading only if deletion failed
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

  const handleDownload = async () => {
    // (Keep existing handleDownload logic - seems okay)
    if (!file) return;
    setIsLoading(true); // Show loading indicator during download prep
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/file-uploads/${fileId}/preview`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Download failed with status: ${response.status}` }))
        throw new Error(errorData.message || 'Download failed');
      };

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download started.");
    } catch (error) {
      console.error("Download error:", error);
      toast.error(`Download failed: ${error instanceof Error ? error.message : 'Download failed'}`);
    } finally {
      setIsLoading(false); // Hide loading indicator
    }
  };



  // --- Save Mapped Data Handler ---
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
      updateSubmissionId(submissionId, `${process.env.NEXT_PUBLIC_API_URL}/api/file-uploads/${fileId}/update_submission_id`);

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


  const formatFileSize = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // --- Render Logic ---

  // Initial Loading State (before file details are fetched)
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading File Details...</span>
      </div>
    );
  }

  // Error State (if initial fetch failed)
  if (error && !file) {
    return <div className="alert alert-error p-4 bg-red-100 text-red-700 rounded m-4">{error}</div>;
  }

  // File Not Found State
  if (!file) {
    return <div className="alert alert-warning p-4 bg-yellow-100 text-yellow-700 rounded m-4">File not found or access denied.</div>;
  }

  // Add this inside the FileUploadFetch component, before the return statement:
  const safeSetColumnKeys = (keys: ConfiguredTargetField[]) => {
    setColumnKeys(
      keys.map(k => ({
        ...k,
        mappedSourceField: k.mappedSourceField ?? null,
      }))
    );
  };

  // --- Main Render ---
  return (
    <div className="container mx-auto p-4 md:p-6 relative">
      {/* Global Loaders/Overlays */}
      {(isSaving || isProcessing) && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50 flex-col">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-300"></div>
          <span className="text-white mt-3 font-semibold">{isSaving ? 'Saving Data...' : 'Processing File...'}</span>
        </div>
      )}
      <ToastContainer position="top-right" autoClose={5000} />

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800"></h1>
        <div className="flex gap-2 flex-wrap">
          {/* Edit/Cancel Button */}
          <button
            onClick={() => {
              setIsEditing(!isEditing);
              if (!isEditing) { // Entering edit mode
                reset({ description: file.description || '', file: undefined }); // Reset form
              }
            }}
            disabled={isProcessing || isSaving}
            className={`flex items-center gap-2 cursor-pointer px-4 py-2 text-sm font-medium text-white ${isEditing ? "bg-yellow-600 hover:bg-yellow-700" : "bg-blue-600 hover:bg-blue-700"} rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${isEditing ? "focus:ring-yellow-500" : "focus:ring-blue-500"} transition disabled:opacity-50`}
          >
            {isEditing ? <FiX /> : <FiEdit />}
            {isEditing ? 'Cancel Edit' : 'Edit'}
          </button>
          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={isLoading || isProcessing || isSaving}
            className="flex items-center cursor-pointer gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition disabled:opacity-50"
          >
            <FiDownload /> Download
          </button>
          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={isLoading || isProcessing || isSaving}
            className="flex items-center cursor-pointer gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition disabled:opacity-50"
          >
            <FiTrash2 /> Delete
          </button>
        </div>
      </div>

      {/* Display Potential Top-Level Errors */}
      {error && <div className="alert alert-error p-4 bg-red-100 text-red-700 rounded mb-4">{error}</div>}

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        {isEditing ? (
          // --- Edit Form ---
          <form onSubmit={handleSubmit(handleEditSubmit)} className="space-y-6">
            {/* File Input - Optional for replacing file */}
            <div>
              <label htmlFor="file-upload-input" className="block text-sm font-medium text-gray-700 mb-1">Replace File (Optional)</label>
              <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${errors.file ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-400'} transition`}>
                <div className="space-y-1 text-center w-full">
                  <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label
                      htmlFor="file-upload-input"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a file</span>
                      <input id="file-upload-input" type="file" className="sr-only" {...register('file')} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">CSV, Excel, JSON, SQL, TXT up to 10MB</p>
                  {/* Display selected file name */}
                  {watchedFile?.[0] && (
                    <div className="mt-2 text-sm text-green-600 flex items-center justify-center gap-1">
                      <FiCheck /> Selected: {watchedFile[0].name} ({formatFileSize(watchedFile[0].size)})
                    </div>
                  )}
                </div>
              </div>
              {errors.file && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <FiX className="flex-shrink-0" /> {errors.file.message}
                </p>
              )}
            </div>

            {/* Description Input */}
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={4}
                placeholder="Brief description of the file contents"
                className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 text-sm transition ${errors.description ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <FiX className="flex-shrink-0" /> {errors.description.message}
                </p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-500 text-white cursor-pointer rounded-md hover:bg-gray-600 transition"
                disabled={isSubmitting || isLoading} // Disable while react-hook-form is submitting or general loading
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                disabled={isSubmitting || isLoading} // Disable while react-hook-form is submitting or general loading
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Saving...
                  </>
                ) : (
                  <> <FiCheck /> Update Details </>
                )}
              </button>
            </div>
          </form>
        ) : (
          // --- Display Mode ---
          <div className="space-y-6">
            {/* File Header Info */}
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 flex-shrink-0">
                <FiFile size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold break-all text-gray-800">{file.originalName}</h2>
                <p className="text-gray-500 text-sm">{formatFileSize(file.fileSize)} • {file.fileType}</p>
              </div>
            </div>

            {/* File Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* File Information */}
              <div className="border rounded-lg p-4 bg-white">
                <h3 className="font-medium text-gray-700 mb-2 text-base">File Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Filename:</span>
                    <span className="font-medium break-all text-right">{file.originalName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type:</span>
                    <span className="font-medium">{file.fileType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Size:</span>
                    <span className="font-medium">{formatFileSize(file.fileSize)}</span>
                  </div>
                </div>
              </div>
              {/* Timestamps */}
              <div className="border rounded-lg p-4 bg-white">
                <h3 className="font-medium text-gray-700 mb-2 text-base">Timestamps</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FiClock className="text-gray-500 flex-shrink-0" />
                    <span className="text-gray-500">Uploaded:</span>
                    <span className="font-medium">
                      {new Date(file.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiClock className="text-gray-500 flex-shrink-0" />
                    <span className="text-gray-500">Last Updated:</span>
                    <span className="font-medium">
                      {new Date(file.updatedAt || file.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Display */}
            {file.description && (
              <div className="border rounded-lg p-4 mt-4 bg-white">
                <h3 className="font-medium text-gray-700 mb-2 text-base">Description</h3>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{file.description}</p>
              </div>
            )}



            {/* Data Tables and Mapping Area */}
            <div className="mt-6">
              {/* Show processing indicator here specifically */}
              {isProcessing && (
                <div className="flex justify-center items-center h-40 flex-col">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600 mt-2">Processing File Data...</span>
                </div>
              )}

              {/* Only render tables if NOT processing and tables exist */}
              {!isProcessing && tables.length === 0 && (
                <p className="text-center text-gray-500 italic p-4 border rounded-md bg-gray-50">
                  No data tables found or processing failed. Check errors above or file content.
                </p>
              )}

              {!isProcessing && tables.length > 0 && (
                <div className="space-y-6">
                  {/* Render tables based on file type */}
                  {['sql', 'sqlite', 'xls', 'xlsx'].includes(file.fileType?.toLowerCase() || '') ? (
                    tables.map(({ table, data }, index) => {
                      
                      return (
                        <PaginatedTable
                          key={table || `table-${index}`}
                          tableName={table}
                          rows={data || []}
                          file={{
                            name: file.originalName,
                            size: file.fileSize,
                            fileType: file.fileType,
                          }}
                          setTableData={setData}
                          mappings={formMapping[0]
                            ? {
                                formId: formMapping[0].formId,
                                type: (formMapping[0] as any).type || 'default',
                                fields: (formMapping[0] as any).fields,
                                options: (formMapping[0] as any).options,
                              }
                            : undefined}
                          setColumnKeys={safeSetColumnKeys}
                          columnKeys={columnKeys}
                          url="file-uploads"
                        />
                      );
                    })
                  ) : (
                    // For other file types, assume single table structure
                    tables.length > 0 && (
                      <PaginatedTable
                        key={file.originalName.split('.')[0] || 'data-table'}
                        tableName={file.originalName.split('.')[0] || 'Data'}
                        rows={tables}
                        file={{
                          name: file.originalName,
                          size: file.fileSize,
                          fileType: file.fileType,
                        }}
                        setTableData={setData}
                        mappings={formMapping[0]
                          ? {
                              formId: formMapping[0].formId,
                              type: (formMapping[0] as any).type || 'default',
                              fields: (formMapping[0] as any).fields,
                              options: (formMapping[0] as any).options,
                            }
                          : undefined}
                        setColumnKeys={safeSetColumnKeys}
                        columnKeys={columnKeys}
                        url="file-uploads"
                      />
                    )
                  )}
                </div>

              )}
              {/* Action Buttons (Save Data) */}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadFetch;