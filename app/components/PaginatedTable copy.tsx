'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { FiPlus, FiX, FiArrowUp, FiArrowDown, FiEdit2, FiDownload, FiArrowRight } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import { useParams } from 'next/navigation';
import 'react-toastify/dist/ReactToastify.css';
import { utils, writeFile } from 'xlsx'; // For Excel export

// --- Interface Definitions ---
// Represents a target field configuration in the right-hand panel
interface ConfiguredTargetField {
  id: string; // Unique ID for React list keys and stable operations
  name: string; // The user-defined name for this target field (e.g., table column header)
  mappedSourceField: string | null; // The name of the source field (from left panel) mapped to this target, or null
}

// Represents an initial field mapping provided via props
interface InitialMappingFromProps {
  label: string; // The desired name for the target field
  sourceApiField?: string | null; // The API/source field that should initially map to this label
}

// Main prop for initial mappings
interface MappingInfo {
  name: string[];
  formId?: {
    id: string | number;
    fields?: InitialMappingFromProps[];
  };
}

interface FileInfo {
  fileType: 'json' | 'csv' | 'xlsx' | 'xls' | 'txt' | 'sql' | string; // Added more specific types
}

type ProcessedRow = Record<string, unknown>;

type MappedTableRow = ProcessedRow & {
  script_name: string;
  field_keys: string[]; // Ordered names of the ConfiguredTargetField
  form_id: string;
};

type TableDataState = Record<string, MappedTableRow[]>;

interface PaginatedTableProps {
  tableName: string | null;
  rows: unknown[];
  mappings?: MappingInfo | null;
  file?: FileInfo | null;
  url?: string;
  itemsPerPage?: number;
  setTableData?: React.Dispatch<React.SetStateAction<TableDataState>>;
}

const generateUniqueId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

// --- Helper Functions ---
function flattenObject(obj: any, parent = "", res: Record<string, unknown> = {}): Record<string, unknown> {
  if (typeof obj !== 'object' || obj === null) { return res; }
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const propName = parent ? `${parent}.${key}` : key;
      const value = obj[key];
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        flattenObject(value, propName, res);
      } else { res[propName] = value; }
    }
  }
  return res;
}

function getAllUniqueKeys(input: unknown): string[] {
  const keys = new Set<string>();
  const items = Array.isArray(input) ? input : (input ? [input] : []);
  items.forEach(item => {
    if (typeof item === 'object' && item !== null) {
      const flat = flattenObject(item);
      Object.keys(flat).forEach(key => keys.add(key));
    }
  });
  return Array.from(keys);
}

function getHeadersAndValues(data: unknown[]): { headers: string[]; tableData: ProcessedRow[] } {
  let headers: string[] = [];
  let tableData: ProcessedRow[] = [];
  const dataArray = Array.isArray(data) ? data : [];

  if (dataArray.length > 0) {
    headers = getAllUniqueKeys(dataArray);
    tableData = dataArray.map((item: unknown): ProcessedRow => {
      if (typeof item === 'object' && item !== null) {
        const flatItem = flattenObject(item);
        const rowObject: ProcessedRow = {};
        headers.forEach((header) => {
          rowObject[header] = flatItem[header] ?? "";
        });
        return rowObject;
      }
      return {};
    });
  }
  return { headers, tableData };
}

function findDataRootObject(jsonData: unknown): unknown[] | null {
  if (!Array.isArray(jsonData) || jsonData.length === 0 || typeof jsonData[0] !== 'object' || jsonData[0] === null) {
    if (Array.isArray(jsonData) && jsonData.every(item => typeof item === 'object' && item !== null)) { return jsonData; }
    return null;
  }
  const rootObject = jsonData[0];
  for (const key in rootObject) {
    if (Object.prototype.hasOwnProperty.call(rootObject, key)) {
      // @ts-ignore
      const value = rootObject[key];
      if (Array.isArray(value)) { return value; }
    }
  }
  return null;
}

function moveItemInArray<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const newArray = [...array];
  const [item] = newArray.splice(fromIndex, 1);
  newArray.splice(toIndex, 0, item);
  return newArray;
}

function escapeCsvCell(cell: any): string {
  const cellString = String(cell == null ? '' : cell);
  if (cellString.includes(',') || cellString.includes('"') || cellString.includes('\n') || cellString.includes('\r')) {
    return `"${cellString.replace(/"/g, '""')}"`;
  }
  return cellString;
}


const PaginatedTable: React.FC<PaginatedTableProps> = ({
  tableName = null,
  rows = [],
  mappings = null,
  file = null,
  url = 'file-uploads',
  itemsPerPage = 10,
  setTableData,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : undefined;

  const processedData = useMemo<{ headers: string[]; tableData: ProcessedRow[] }>(() => {

    if (!Array.isArray(rows) || rows.length === 0) return { headers: [], tableData: [] };
    if (file?.fileType === 'json') {
      const dataArray = findDataRootObject(rows);
      return getHeadersAndValues(dataArray || rows);
    } else {
      return getHeadersAndValues(rows);
    }
  }, [rows, file?.fileType]);

  const sourceFieldNamesFromFile = useMemo(() => processedData.headers, [processedData.headers]);
  const internalTableData = useMemo(() => processedData.tableData, [processedData.tableData]);

  const [displayableSourceFields, setDisplayableSourceFields] = useState<string[]>([]);
  const [targetFieldConfigurations, setTargetFieldConfigurations] = useState<ConfiguredTargetField[]>([]);
  const [newTargetFieldName, setNewTargetFieldName] = useState('');
  const [editingTargetConfig, setEditingTargetConfig] = useState<{ id: string; currentName: string } | null>(null);

  useEffect(() => {
    setDisplayableSourceFields(sourceFieldNamesFromFile);
    const initialTargetsFromProps: ConfiguredTargetField[] = [];
    const usedSourceFieldsForInitialMapping = new Set<string>();

    (mappings?.formId?.fields || []).forEach(propField => {

      let mappedSource: string | null = null;

      if (propField.sourceApiField && sourceFieldNamesFromFile.includes(propField.sourceApiField)) {
        if (!usedSourceFieldsForInitialMapping.has(propField.sourceApiField)) {
          mappedSource = propField.sourceApiField;
          usedSourceFieldsForInitialMapping.add(propField.sourceApiField);
        }
      }
      
      initialTargetsFromProps.push({
        id: generateUniqueId(),
        name: propField.label,
        mappedSourceField: mappedSource,
      });
    });

    setTargetFieldConfigurations(initialTargetsFromProps);


  }, [sourceFieldNamesFromFile, mappings]);

  useEffect(() => {
    if (setTableData && tableName) {
      const orderedTargetNames = targetFieldConfigurations.map(tf => tf.name);
      const dataToSet: MappedTableRow[] = internalTableData.map((row): MappedTableRow => {
        const mappedRowData: ProcessedRow = {};
        targetFieldConfigurations.forEach(targetConfig => {
          if (targetConfig.mappedSourceField && row.hasOwnProperty(targetConfig.mappedSourceField)) {
            mappedRowData[targetConfig.name] = row[targetConfig.mappedSourceField] ?? "";
          } else {
            mappedRowData[targetConfig.name] = "";
          }
        });
        return {
          ...mappedRowData,
          script_name: tableName,
          field_keys: orderedTargetNames,
          form_id: String(mappings?.formId?.id ?? ""),
        };
      });
      setTableData((prev) => ({ ...prev, [tableName]: dataToSet }));
    }
  }, [targetFieldConfigurations, internalTableData, tableName, mappings?.formId?.id, setTableData]);

  useEffect(() => {
    const initialSetupFromProps = (mappings?.formId?.fields || []).map(f => ({
      label: f.label,
      sourceApiField: (f.sourceApiField && sourceFieldNamesFromFile.includes(f.sourceApiField)) ? f.sourceApiField : null,
    }));
    const currentSetup = targetFieldConfigurations.map(f => ({
      label: f.name,
      sourceApiField: f.mappedSourceField,
    }));
    const hasChanged = JSON.stringify(initialSetupFromProps) !== JSON.stringify(currentSetup);


    if (id && hasChanged) {

      const payload = targetFieldConfigurations.map(tf =>
        tf.name,
      );


      updateBackendWithMappings(payload, mappings?.name ?? [], id);
    }
  }, [targetFieldConfigurations, id, mappings, sourceFieldNamesFromFile]);

  const updateBackendWithMappings = async (
    fieldsToSync: { label: string; sourceApiField: string | null }[],
    mappingName: string[],
    recordId: string
  ) => {
    if (!recordId) { toast.error("Missing Record ID for update."); return; }
    const body = { fields: fieldsToSync, name: mappingName, form_id: mappings?.formId?.id };
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${url}/${recordId}/map-to-form`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token') ?? ''}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errorText = await res.text();
        toast.error(`Mapping update failed: ${errorText || res.statusText}`);
      }
    } catch (error) {
      toast.error('An error occurred while updating mappings.');
    }
  };

  const handleTargetSourceMappingChange = (
    targetFieldId: string,
    selectedSourceFieldName: string | null
  ) => {

    setTargetFieldConfigurations(prevTargets =>
      prevTargets.map(tf =>
        tf.id === targetFieldId
          ? { ...tf, mappedSourceField: selectedSourceFieldName }
          : tf
      )
    );
  };

  const handleAddTargetFieldConfiguration = () => {
    const newName = newTargetFieldName.trim();
    if (!newName) { toast.error("Target field name cannot be empty."); return; }
    if (targetFieldConfigurations.some(tf => tf.name === newName)) {
      toast.warn(`Target field "${newName}" already exists.`);
      setNewTargetFieldName('');
      return;
    }
    const newTarget: ConfiguredTargetField = {
      id: generateUniqueId(), name: newName, mappedSourceField: null,
    };
    setTargetFieldConfigurations(prev => [...prev, newTarget]);
    setNewTargetFieldName('');
  };

  const handleHideSourceFieldFromDisplay = (sourceFieldToHide: string) => {

    setDisplayableSourceFields(prev => prev.filter(field => field !== sourceFieldToHide));
    setTargetFieldConfigurations(prevTargets =>
      prevTargets.map(tf =>
        tf.mappedSourceField === sourceFieldToHide ? { ...tf, mappedSourceField: null } : tf
      )
    );
  };

  const handleRemoveTargetFieldConfiguration = (targetIdToRemove: string) => {
    setTargetFieldConfigurations(prev => prev.filter(tf => tf.id !== targetIdToRemove));
    if (editingTargetConfig?.id === targetIdToRemove) setEditingTargetConfig(null);
  };

  const handleMoveTargetFieldConfiguration = (targetId: string, direction: 'up' | 'down') => {
    setTargetFieldConfigurations(prev => {
      const index = prev.findIndex(tf => tf.id === targetId);
      if (index === -1) return prev;
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      return moveItemInArray(prev, index, newIndex);
    });
  };

  const handleSaveTargetFieldNameEdit = () => {
    if (!editingTargetConfig) return;
    const { id, currentName } = editingTargetConfig;
    const newTrimmedName = currentName.trim();
    if (!newTrimmedName) { toast.error("Target field name cannot be empty."); return; }
    if (targetFieldConfigurations.some(tf => tf.name === newTrimmedName && tf.id !== id)) {
      toast.error(`Target field name "${newTrimmedName}" already exists.`); return;
    }
    setTargetFieldConfigurations(prev => prev.map(tf => (tf.id === id ? { ...tf, name: newTrimmedName } : tf)));
    setEditingTargetConfig(null);
  };


  const escapeSqlValue = (value: any) => {
    if (value === null || typeof value === 'undefined') {
      return "NULL";
    }
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'boolean') {
      return value ? 'TRUE' : 'FALSE'; // Or 1 and 0 depending on your SQL dialect
    }
    // For strings, escape single quotes by doubling them, and wrap in single quotes
    return `'${String(value).replace(/'/g, "''")}'`;
  };



  const handleExportData = () => {
    if (!targetFieldConfigurations || targetFieldConfigurations.length === 0) {
      toast.error("No target fields are configured. Cannot export data."); return;
    }
    if (!internalTableData || internalTableData.length === 0) {
      toast.info("No data to export."); return;
    }

    const headers = targetFieldConfigurations.map(tf => tf.name);
    const dataToExport = internalTableData.map(row => {
      const exportRow: Record<string, any> = {};
      targetFieldConfigurations.forEach(targetConfig => {
        if (targetConfig.mappedSourceField && row.hasOwnProperty(targetConfig.mappedSourceField)) {
          exportRow[targetConfig.name] = row[targetConfig.mappedSourceField] ?? "";
        } else {
          exportRow[targetConfig.name] = "";
        }
      });
      return exportRow;
    });

    let exportFileType = 'csv';
    let originalExtension = 'csv';

    if (file?.fileType) {
      const originalType = file.fileType.toLowerCase();
      if (['csv', 'json', 'xlsx', 'xls'].includes(originalType)) {
        exportFileType = originalType === 'xls' ? 'xlsx' : originalType;
        originalExtension = originalType;
      } else if (['txt', 'sql'].includes(originalType)) {
        originalExtension = originalType; // Keep original for filename, export as csv
        exportFileType = originalType;
      }
    }

    const safeTableName = tableName?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'exported_data';
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `${safeTableName}_${timestamp}.${exportFileType}`; // Use determined exportFileType for actual extension


    if (exportFileType === 'csv') {
      const csvHeader = headers.map(escapeCsvCell).join(',') + '\r\n';
      const csvRows = dataToExport.map(dataRow =>
        headers.map(header => escapeCsvCell(dataRow[header])).join(',')
      ).join('\r\n');
      const csvContent = csvHeader + csvRows;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url); link.setAttribute("download", filename);
        link.style.visibility = 'hidden'; document.body.appendChild(link);
        link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
      }
    }

    else if (exportFileType === 'sql') {
      // Sanitize column names for SQL (though targetFieldConfigurations.name should ideally be safe)
      const sqlColumnNames = headers.map(h => `\`${h.replace(/`/g, '``')}\``).join(', '); // Example for MySQL quoting

      const insertStatements = dataToExport.map(row => {
        const values = headers.map(header => escapeSqlValue(row[header])).join(', ');
        return `INSERT INTO \`${safeTableName}\` (${sqlColumnNames}) VALUES (${values});`;
      }).join('\r\n');

      // You might want to add CREATE TABLE statement here if desired
      // For example:
      // const createTableStatement = `CREATE TABLE IF NOT EXISTS \`${safeTableName}\` (\n` +
      //   headers.map(h => `  \`${h}\` TEXT`).join(',\n') + // Assuming TEXT for simplicity
      //   `\n);\n\n`;
      // const sqlContent = createTableStatement + insertStatements;
      const sqlContent = insertStatements; // For now, just INSERTs

      const blob = new Blob([sqlContent], { type: 'application/sql;charset=utf-8;' });
      const link = document.createElement("a");

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        toast.error("File download is not supported by your browser.");
      }
    }
    else if (exportFileType === 'json') {
      const jsonContent = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url); link.setAttribute("download", filename);
        link.style.visibility = 'hidden'; document.body.appendChild(link);
        link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
      }
    } else if (exportFileType === 'xlsx') {
      try {
        const worksheetData = [headers, ...dataToExport.map(row => headers.map(header => row[header]))];
        const ws = utils.aoa_to_sheet(worksheetData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Data");
        writeFile(wb, filename);
      } catch (err) {
        toast.error("Failed to export to Excel. Check console.");
      }
    }
  };

  const totalPages = useMemo(() => Math.ceil(internalTableData.length / itemsPerPage), [internalTableData, itemsPerPage]);
  const paginatedRows = useMemo<ProcessedRow[]>(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return internalTableData.slice(startIndex, startIndex + itemsPerPage);
  }, [internalTableData, currentPage, itemsPerPage]);

  return (
    <div className="my-6 p-4 bg-white shadow rounded-lg">
      <div className="container mx-auto p-4 mb-6 border rounded-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Map Data Fields</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/2 p-3 border rounded bg-gray-50">
            <h4 className="font-medium text-gray-700 mb-3">Base Columns</h4>
            <div className="h-96 overflow-y-auto pr-1 space-y-1">
              {targetFieldConfigurations.length > 0 ? targetFieldConfigurations.map(sourceField => (
                <div key={sourceField.id} className="p-2 border rounded bg-white shadow-sm flex justify-between items-center">
                  <span className="text-sm text-gray-800 truncate" title={sourceField.name}>{sourceField.name}</span>
                  <button title={`Hide "${sourceField.id}"`}
                    className="btn-icon-xs text-gray-400 hover:text-grey-500"> <FiArrowRight /> </button>
                </div>
              )) : <div className="text-sm text-gray-500 italic p-2">No source data fields found.</div>}
            </div>
          </div>
          <div className="w-full md:w-1/2 p-3 border rounded bg-gray-50">
            <h4 className="font-medium text-gray-700 mb-3">Uploaded Columns</h4>

            <div className="h-[20.5rem] overflow-y-auto pr-1 space-y-1">
              {targetFieldConfigurations.length > 0 ? targetFieldConfigurations.map((targetConfig, index) => (
                <div key={targetConfig.id} className="bg-white">
                  <div className="flex items-center justify-between mb-1.5">
                    {editingTargetConfig?.id === targetConfig.id && (
                      <input type="text" value={editingTargetConfig.currentName}
                        onChange={(e) => setEditingTargetConfig(prev => prev ? { ...prev, currentName: e.target.value } : null)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTargetFieldNameEdit(); if (e.key === 'Escape') setEditingTargetConfig(null); }}
                        onBlur={handleSaveTargetFieldNameEdit} autoFocus
                        className="input-class text-sm py-1 flex-grow mr-2" />
                    )}

                  </div>
                  <select value={targetConfig.mappedSourceField ?? ''}
                    onChange={(e) => handleTargetSourceMappingChange(targetConfig.id, e.target.value || null)}
                    className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                    aria-label={`Map source to ${targetConfig.name}`}>
                    <option value="">-- Select Option --</option>
                    {displayableSourceFields.map(sourceName => (
                      <option key={sourceName} value={sourceName}>{sourceName}</option>
                    ))}
                  </select>
                </div>
              )) : <div className="text-sm text-gray-500 italic p-2">No target fields. Add target fields.</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-3 mt-6">
        <h2 className="text-xl font-semibold text-gray-800">
          {tableName ? `Preview Data: ${tableName}` : "Data Preview"}
        </h2>
        {(internalTableData.length > 0 && targetFieldConfigurations.length > 0) && (
          <button onClick={handleExportData} className="btn-secondary-sm"
            title="Export the current table data">
            <FiDownload className="inline -ml-1 mr-1.5" size={16} /> Export Data
          </button>
        )}
      </div>

      {(internalTableData.length > 0 && targetFieldConfigurations.length > 0) ? (
        <>
          <div className="overflow-x-auto border rounded-md">
            <table className="min-w-full table-auto border-collapse">
              <thead className="bg-gray-100 text-gray-700">
                <tr>{targetFieldConfigurations.map(tf => <th key={tf.id} className="th-class">{tf.name}</th>)}</tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedRows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="tr-class">
                    {targetFieldConfigurations.map(targetConfig => {
                      const cellValue = targetConfig.mappedSourceField && row.hasOwnProperty(targetConfig.mappedSourceField)
                        ? (row[targetConfig.mappedSourceField] ?? "") : "";
                      return (
                        <td key={targetConfig.id} className="td-class">
                          {typeof cellValue === 'object' && cellValue !== null
                            ? (JSON.stringify(cellValue).length > 75 ? JSON.stringify(cellValue).substring(0, 75) + '...' : JSON.stringify(cellValue))
                            : String(cellValue)}

                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-1 py-3 sm:px-2 mt-4">
            <div className="text-sm text-gray-600">Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span> ({internalTableData.length} total rows)</div>
            {totalPages > 1 && (
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="pagination-btn rounded-l-md">Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2)).map(p => (
                  <button key={p} onClick={() => setCurrentPage(p)} aria-current={currentPage === p ? 'page' : undefined} className={`pagination-btn ${currentPage === p ? 'pagination-btn-active' : ''}`}>{p}</button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="pagination-btn rounded-r-md">Next</button>
              </nav>
            )}
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500 py-8">
          {internalTableData.length === 0 ? "No data rows to display." : "No target fields configured."}
        </div>
      )}
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <style jsx global>{`
        .input-class { box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); border: 1px solid #cbd5e0; border-radius: 0.25rem; padding: 0.5rem 0.75rem; color: #4a5568; line-height: 1.25; transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out; }
        .input-class:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 0.2rem rgba(102,126,234,0.25); }
        .btn-icon-xs { padding: 0.2rem; border-radius: 0.25rem; display:inline-flex; align-items:center; justify-content:center; }
        .btn-icon-xs:hover:not(:disabled) { background-color: #edf2f7; }
        .btn-primary-sm { background-color: #4299e1; color:white;font-weight:500;font-size:0.875rem;padding:0.4rem 0.8rem;border-radius:0.25rem;white-space:nowrap; transition: background-color 0.15s ease-in-out; display:inline-flex; align-items:center; }
        .btn-primary-sm:hover { background-color: #2b6cb0; }
        .btn-secondary-sm { background-color: #e2e8f0; color:#4a5568;font-weight:500;font-size:0.875rem;padding:0.4rem 0.8rem;border-radius:0.25rem;white-space:nowrap; transition: background-color 0.15s ease-in-out; display:inline-flex; align-items:center; }
        .btn-secondary-sm:hover { background-color: #cbd5e0; }
        .th-class { padding: 0.75rem 1rem; border-bottom: 2px solid #e2e8f0; text-align: left; font-size: 0.875rem; font-weight: 600; color: #4a5568; text-transform: capitalize; }
        .td-class { padding: 0.75rem 1rem; white-space: normal; word-break: break-word; border-bottom: 1px solid #edf2f7; font-size: 0.875rem; color: #718096; }
        .tr-class:hover .td-class { background-color: #f7fafc; }
        .disabled\\:opacity-20:disabled { opacity: 0.4; cursor:not-allowed !important; }
        .pagination-btn { position:relative; display:inline-flex; align-items:center; padding: 0.5rem 0.75rem; margin-left: -1px; border:1px solid #e2e8f0; background-color:white; font-size:0.875rem; font-weight:500; color:#4a5568; transition: background-color 0.15s ease-in-out, color 0.15s ease-in-out; }
        .pagination-btn:hover:not(:disabled) { background-color:#ebf8ff; color:#2c5282; }
        .pagination-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .pagination-btn.rounded-l-md { margin-left:0; border-top-left-radius:0.25rem; border-bottom-left-radius:0.25rem; }
        .pagination-btn.rounded-r-md { border-top-right-radius:0.25rem; border-bottom-right-radius:0.25rem; }
        .pagination-btn-active { z-index:10; background-color:#63b3ed; border-color:#63b3ed; color:white; }
      `}</style>
    </div>
  );
};

export default PaginatedTable;