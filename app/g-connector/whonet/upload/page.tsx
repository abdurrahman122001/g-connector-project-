// src/app/g-connector/file-uploads/page.tsx (or your actual path)
'use client';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiUpload, FiX, FiCheck, FiServer } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect, useState } from 'react';
import FileManager from '@/app/components/gconector/FileManager'; // Adjust path as needed
import FileUploadFetch from '@/app/components/gconector/FileUploadFetch';

// --- Helper Functions (copied from FileManager for formatBytes) ---
const formatBytes = (bytes: number = 0, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};


// Schema: Now 'file' is always the target, serverFilePath is for internal state before fetch
const fileProcessingSchema = z.object({
  description: z.string().max(200, 'Description must be less than 200 characters').optional(),
  formMapping: z.string().min(1, { message: 'Form mapping is required' }),
  // This 'file' will hold either the client-uploaded FileList or the fetched server file as a File object
  file: z.custom<FileList | File>(
    (val) => (val instanceof FileList && val.length > 0) || val instanceof File,
    "File is required."
  )
  .refine((fileOrFileList) => {
      const file = fileOrFileList instanceof FileList ? fileOrFileList[0] : fileOrFileList;
      if (!file) return false;
      const allowedExtensions = ['.csv', '.xls', '.xlsx', '.json', '.sql', '.sqlite', '.txt'];
      const fileName = file.name.toLowerCase() || '';
      return allowedExtensions.some(ext => fileName.endsWith(ext));
    }, 'Invalid file type. Allowed: CSV, Excel, JSON, SQL, SQLite, TXT.'
  )
  .refine((fileOrFileList) => {
    const file = fileOrFileList instanceof FileList ? fileOrFileList[0] : fileOrFileList;
    if (!file) return false;
    return file.size <= 10 * 1024 * 1024; // 10MB
  }, 'File size exceeds 10MB limit.'),
  // serverFilePath is now internal state, not part of the submitted form data schema for file content
});

type FormDataSchema = z.infer<typeof fileProcessingSchema>;

const FileUploadPage = () => {
  const router = useRouter();
  const {
    register, // We won't directly register 'file' if it's programmatically set from server fetch
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    getValues, // To get current form values
    clearErrors,
    reset,
    trigger, // To manually trigger validation
  } = useForm<FormDataSchema>({
    resolver: zodResolver(fileProcessingSchema),
    defaultValues: {
      description: '',
      formMapping: '',
      // 'file' will be set programmatically or by client upload
    }
  });

  const [forms, setForms] = useState<any[]>([]);
  const [fileId, setFileId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Internal state to hold info about the selected server file before it's fetched
  const [selectedServerFileInfo, setSelectedServerFileInfo] = useState<{ path: string; name: string } | null>(null);
  // State to hold the client-uploaded FileList
  const [clientFileList, setClientFileList] = useState<FileList | null>(null);


  useEffect(() => {
    const fetchFormsList = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error('Failed to fetch forms');
        const data = await response.json();
        setForms(data.data || []);
      } catch (error) {
        console.error("Error fetching forms:", error);
        toast.error(error instanceof Error ? error.message : 'Could not load forms.');
      }
    };
    fetchFormsList();
  }, []);

  const onSubmit = async (data: FormDataSchema) => {
    // 'data.file' should now correctly hold the File object (either client or fetched server file)
    // thanks to pre-submission logic.
    try {
      const formDataPayload = new FormData();

      if (data.description) formDataPayload.append('description', data.description);
      formDataPayload.append('formMapping', data.formMapping);

      // The 'file' field in 'data' is now consistently the File object to upload
      if (data.file instanceof File) {
        formDataPayload.append('file', data.file, data.file.name);
      } else if (data.file instanceof FileList && data.file.length > 0) { // Should not happen if pre-logic is correct
        formDataPayload.append('file', data.file[0], data.file[0].name);
      } else {
        toast.error('File object is missing or invalid.');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/file-uploads`, {
        method: 'POST',
        body: formDataPayload,
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'File submission failed');
      }

      toast.success(responseData.message || 'File processing initiated!');
      setFileId(responseData.data?._id || null);
      // Reset states
      reset(); // Resets RHF controlled fields
      setClientFileList(null);
      setSelectedServerFileInfo(null);
      setValue('file', undefined as any, {shouldValidate: false}); // Clear the file in RHF state

    } catch (error) {
      console.error("Submit error:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(errorMessage);
    }
  };

  // This function will be called right before the actual RHF handleSubmit
  const handlePreSubmit = async () => {
    if (selectedServerFileInfo) {
      // A server file was selected, fetch its content
      toast.info(`Fetching server file: ${selectedServerFileInfo.name}...`);
      try {
        const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/filemanager/download?path=${encodeURIComponent(selectedServerFileInfo.path)}`;
        const response = await fetch(downloadUrl, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } // Add auth if download is protected
        });
        if (!response.ok) {
          throw new Error(`Failed to download server file: ${response.statusText}`);
        }
        const blob = await response.blob();
        const serverFileObject = new File([blob], selectedServerFileInfo.name, { type: blob.type });

        setValue('file', serverFileObject, { shouldValidate: true });
        // Clear client file list if server file is chosen
        setClientFileList(null);

      } catch (error) {
        console.error("Error fetching server file content:", error);
        toast.error(error instanceof Error ? error.message : "Could not fetch server file.");
        return false; // Prevent form submission
      }
    } else if (clientFileList && clientFileList.length > 0) {
      // Client file is already in state, set it to RHF 'file' field
      setValue('file', clientFileList[0], { shouldValidate: true });
    } else {
        // No file selected, let Zod handle this via setValue triggering validation
        setValue('file', undefined as any, { shouldValidate: true });
    }
    // Manually trigger validation for the whole form AFTER file is set
    const isValid = await trigger();
    return isValid; // Continue to onSubmit if valid
  };


  const handleServerFileSelected = (filePath: string, fileName: string) => {
    setSelectedServerFileInfo({ path: filePath, name: fileName });
    setClientFileList(null); // Clear client file selection
    // Don't setValue('file') here yet, do it in handlePreSubmit
    clearErrors('file');
    setShowModal(false);
    toast.success(`Server file staged: ${fileName}. Content will be fetched on submit.`);
  };

  const handleClientFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setClientFileList(files);
      setSelectedServerFileInfo(null); // Clear server file selection
      // Don't setValue('file') here yet for client file, do it in handlePreSubmit
      clearErrors('file');
    } else {
      setClientFileList(null);
    }
  };

  // Display info for the file that's *currently* selected/staged
  const currentFileToDisplay = selectedServerFileInfo
    ? { name: selectedServerFileInfo.name, source: 'Server' }
    : clientFileList?.[0]
    ? { name: clientFileList[0].name, size: clientFileList[0].size, source: 'Computer' }
    : null;


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8 text-center">Upload File for Mapping</h1>

        {/* We wrap the RHF handleSubmit with our pre-submit logic */}
        <form onSubmit={async (e) => {
          e.preventDefault(); // Prevent default RHF submission initially
          const canSubmit = await handlePreSubmit();
          if (canSubmit) {
            handleSubmit(onSubmit)(); // Manually call RHF's submit handler
          }
        }} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">File Source</label>
            <div className={`flex flex-col sm:flex-row gap-4 justify-center p-4 sm:p-6 border-2 border-dashed rounded-md ${errors.file ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}>
              {/* Client File Upload */}
              <div className="flex-1 p-4 border border-gray-200 rounded-lg bg-white text-center hover:border-blue-500 transition-colors duration-150">
                <label htmlFor="file-upload-client" className="flex flex-col items-center justify-center cursor-pointer h-full">
                  <FiUpload className="w-10 h-10 text-blue-500 mb-2" />
                  <span className="text-sm font-medium text-blue-600 hover:underline">Upload from Computer</span>
                  <span className="text-xs text-gray-500 mt-1">(CSV, Excel, JSON, etc.)</span>
                  <input
                    id="file-upload-client"
                    type="file"
                    className="sr-only"
                    onChange={handleClientFileChange} // Use our custom handler
                    // RHF register is not directly used for this input anymore due to programmatic setting
                  />
                </label>
              </div>

              <div className="my-2 sm:my-0 self-center text-gray-500 font-semibold text-sm">OR</div>

              {/* Server File Selection */}
              <div
                className="flex-1 p-4 border border-gray-200 rounded-lg bg-white text-center hover:border-purple-500 transition-colors duration-150 cursor-pointer"
                onClick={() => setShowModal(true)}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <FiServer className="w-10 h-10 text-purple-500 mb-2" />
                  <span className="text-sm font-medium text-purple-600 hover:underline">Select from Server</span>
                  <span className="text-xs text-gray-500 mt-1">(Browse existing files)</span>
                </div>
              </div>
            </div>

            {currentFileToDisplay && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200 text-sm">
                <p className="font-medium text-gray-700 mb-1">Staged File:</p>
                {currentFileToDisplay.source === 'Computer' && currentFileToDisplay.size !== undefined && (
                  <div className="flex items-center text-green-700">
                    <FiCheck className="mr-1.5 flex-shrink-0" /> {currentFileToDisplay.source}: {currentFileToDisplay.name} ({formatBytes(currentFileToDisplay.size)})
                  </div>
                )}
                {currentFileToDisplay.source === 'Server' && (
                  <div className="flex items-center text-purple-700">
                    <FiServer className="mr-1.5 flex-shrink-0" /> {currentFileToDisplay.source}: {currentFileToDisplay.name} (Content will be fetched)
                  </div>
                )}
              </div>
            )}
            {errors.file && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <FiX className="flex-shrink-0" /> {errors.file.message}
              </p>
            )}
          </div>

          {/* Description Field (RHF Controlled) */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              placeholder="Brief description of the file and its purpose"
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 text-sm transition ${errors.description ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-300'}`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <FiX className="flex-shrink-0" /> {errors.description.message}
              </p>
            )}
          </div>

          {/* Form Mapping Field (RHF Controlled) */}
          <div>
            <label htmlFor="formMapping" className="block text-sm font-medium text-gray-700 mb-1">Form Mapping</label>
            <select
              id="formMapping"
              {...register('formMapping')}
              className={`w-full px-3 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 text-sm transition ${errors.formMapping ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-300'}`}
            >
              <option value="">Select a Form Mapping</option>
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

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit" // This button now triggers our wrapped submit logic
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition disabled:opacity-60"
              disabled={isSubmitting || (!clientFileList && !selectedServerFileInfo)}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Processing...
                </>
              ) : (
                <>
                  <FiUpload className="text-base" />
                  Submit for Mapping
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal and FileUploadFetch remain similar */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-xl font-semibold text-gray-800">Select File from Server</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-red-500 text-2xl leading-none p-1"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-0 sm:p-2">
              <FileManager onFileSelectForMapping={handleServerFileSelected} />
            </div>
            <div className="flex justify-end items-center gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {fileId && (
        
            <FileUploadFetch fileId={fileId} />
          
      )}
    </div>
  );
};

export default FileUploadPage;