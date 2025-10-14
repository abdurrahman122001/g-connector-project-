import React, { useEffect, useState, useCallback } from 'react';
import PaginatedTable from '@/app/components/PaginatedTable';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface ApiScriptFieldMappingProps {
  scriptId: string;
}

interface FormMappingItem {
  _id?: string;
  name: string | undefined;
  formId: {
    id: string;
    fields: { label: string; [key: string]: any }[];
    [key: string]: any;
  };
  fieldMappings: {
    fields: string[];
    [key: string]: any;
  }[];
  [key: string]: any;
}

interface TableInfo {
  table: string;
  data: any[];
}

const ApiScriptFieldMapping: React.FC<ApiScriptFieldMappingProps> = ({ scriptId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [formMapping, setFormMapping] = useState<FormMappingItem[]>([]);
  const [datas, setData] = useState<Record<string, any[]>>({});
  const [columnKeys, setColumnKeys] = useState<any[]>([]);
  const [script, setScript] = useState<any>(null);

  // Fetch script and process API data for mapping
  useEffect(() => {
    const fetchAndProcess = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch script details
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/api-scripts/${scriptId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!res.ok) throw new Error('Failed to fetch script');
        const data = await res.json();
        setScript(data.data);
        // Execute script to get sample data
        const execRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/api-scripts/${scriptId}/execute`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ endpoint: data.data.endpoint }),
        });
        if (!execRes.ok) throw new Error('Failed to execute script');
        const execData = await execRes.json();
        // Try to extract tables from the returned data
        let responseData = execData.data?.data || {};
        let mainArrayKey = Object.keys(responseData).find(
          (key) => Array.isArray(responseData[key])
        );
        let dataArray = responseData?.[mainArrayKey || ''] || responseData || [];
        if (!Array.isArray(dataArray)) dataArray = [];
        // For mapping UI, treat as a single table
        setTables([{ table: data.data.name || 'API Data', data: dataArray }]);
        // Fetch form fields for mapping
        const formId = data.data?.formMapping?.formId?.id;
        let formFields: { label: string }[] = [];
        if (formId) {
          const formRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${formId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
          const formData = await formRes.json();
          formFields = formData.data?.fields || [];
        }
        // Set up initial mapping structure
        setFormMapping([
          {
            name: data.data.name || 'API Data',
            formId: {
              id: formId,
              fields: formFields,
            },
            fieldMappings: [
              {
                fields: formFields.map(f => f.label),
              },
            ],
          },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch or process API script');
        toast.error(err instanceof Error ? err.message : 'Failed to fetch or process API script');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAndProcess();
  }, [scriptId]);

  // Save mapped data handler (same as FileUploadFetch)
  const saveData = async () => {
    setIsSaving(true);
    try {
      const body = {
        data: datas[script?.name || 'API Data'] || [],
        name: script?.name,
        field_keys: formMapping[0]?.formId?.fields?.map((f: any) => f.label) || [],
      };
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/forms/${formMapping[0]?.formId?.id}/submissions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );
      if (!response.ok) throw new Error('Save failed');
      toast.success('Data saved successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-40">Loading...</div>;
  }
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }
  if (!script) {
    return <div className="text-red-500">Script not found.</div>;
  }

  return (
    <div className="w-full px-0 py-0 bg-gray-50 rounded-none shadow-none">
      <h2 className="text-2xl font-semibold mb-6 text-left pl-8 pt-8">Map API Script Fields</h2>
      <div className="w-full">
        <PaginatedTable
          tableName={script.name || 'API Data'}
          rows={tables[0]?.data || []}
          file={{
            name: script.name || 'API Data',
            size: 0,
            fileType: script.format || 'json',
          }}
          setTableData={setData}
          mappings={formMapping[0] ? {
            formId: formMapping[0].formId,
            type: 'default',
            fields: formMapping[0].fields,
            options: formMapping[0].options,
          } : undefined}
          setColumnKeys={setColumnKeys}
          columnKeys={columnKeys}
          url="api-scripts"
        />
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t mt-6 px-8 pb-8">
        <button
          type="button"
          onClick={saveData}
          disabled={isSaving || isProcessing || Object.keys(datas).length === 0}
          className="bg-green-500 text-white py-2 px-4 rounded-md flex items-center gap-2 hover:bg-green-600 transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Data
        </button>
      </div>
    </div>
  );
};

export default ApiScriptFieldMapping; 