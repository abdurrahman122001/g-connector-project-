'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { FiDownload, FiArrowRight, FiSearch, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import { useParams } from 'next/navigation';
import 'react-toastify/dist/ReactToastify.css';
import { utils, writeFile } from 'xlsx';
import { generateUniqueId } from "./gconector/Common";
import { ConfiguredTargetField } from '@/app/Interfaces';
import { useSelector } from 'react-redux';
import { RootState } from "@/store/store";

// --- Improved Sync Scroll Hook with Better Performance ---
const useSyncScroll = () => {
  const tableRefs = useRef<Map<string, HTMLElement>>(new Map());
  const scrollSourceRef = useRef<string | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastScrollPositionRef = useRef<{ left: number; top: number }>({ left: 0, top: 0 });

  const registerTable = useCallback((id: string, element: HTMLElement | null) => {
    if (element) {
      tableRefs.current.set(id, element);
    } else {
      tableRefs.current.delete(id);
    }
  }, []);

  const syncScroll = useCallback((sourceId: string, scrollLeft: number, scrollTop: number) => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      tableRefs.current.forEach((element, id) => {
        if (id !== sourceId) {
          if (element.scrollLeft !== scrollLeft || element.scrollTop !== scrollTop) {
            scrollSourceRef.current = id;
            element.scrollLeft = scrollLeft;
            element.scrollTop = scrollTop;
            
            Promise.resolve().then(() => {
              if (scrollSourceRef.current === id) {
                scrollSourceRef.current = null;
              }
            });
          }
        }
      });
      
      lastScrollPositionRef.current = { left: scrollLeft, top: scrollTop };
      rafIdRef.current = null;
    });
  }, []);

  const handleScroll = useCallback((sourceId: string, event: Event) => {
    if (scrollSourceRef.current === sourceId) {
      return;
    }

    const element = event.target as HTMLElement;
    const scrollLeft = element.scrollLeft;
    const scrollTop = element.scrollTop;

    if (scrollLeft !== lastScrollPositionRef.current.left || 
        scrollTop !== lastScrollPositionRef.current.top) {
      scrollSourceRef.current = sourceId;
      syncScroll(sourceId, scrollLeft, scrollTop);
      
      setTimeout(() => {
        if (scrollSourceRef.current === sourceId) {
          scrollSourceRef.current = null;
        }
      }, 10);
    }
  }, [syncScroll]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return { registerTable, handleScroll };
};

// --- Interfaces ---
interface InitialMappingFromProps {
  label: string;
  sourceApiField?: string | null;
}

interface MappingInfo {
  name: string[];
  formId?: {
    id: string | number;
    fields?: InitialMappingFromProps[];
  };
}

interface FileInfo {
  name: string;
  size: number;
  fileType?: string;
}

type ProcessedRow = Record<string, unknown>;

type MappedTableRow = ProcessedRow & {
  script_name: string;
  field_keys: string[];
  form_id: string;
};

type TableDataState = Record<string, MappedTableRow[]>;

interface PaginatedTableProps {
  tableName: string;
  url: string;
  columnKeys: ConfiguredTargetField[];
  setColumnKeys: (keys: ConfiguredTargetField[]) => void;
  rows: any[];
  setTableData: React.Dispatch<React.SetStateAction<Record<string, MappedTableRow[]>>>;
  mappings?: {
    formId?: {
      id: string | number;
      fields?: InitialMappingFromProps[];
    };
    type: string;
    fields?: string[];
    options?: string[];
  };
  file?: FileInfo | null;
  itemsPerPage?: number;
  index?: number;
  searchTerm?: string;
}

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
      const value = rootObject[key];
      if (Array.isArray(value)) { return value; }
    }
  }
  return null;
}

function escapeCsvCell(cell: any): string {
  const cellString = String(cell == null ? '' : cell);
  if (cellString.includes(',') || cellString.includes('"') || cellString.includes('\n') || cellString.includes('\r')) {
    return `"${cellString.replace(/"/g, '""')}"`;
  }
  return cellString;
}

const PaginatedTable: React.FC<PaginatedTableProps> = ({
  tableName,
  setColumnKeys,
  rows = [],
  mappings,
  file = null,
  url = 'file-Uploads',
  itemsPerPage = 10,
  columnKeys = [],
  setTableData,
  index = 0,
  searchTerm = '',
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const AllColumns = useSelector((state: RootState) => state.fileUpload.mapColumns);
  const [internalSearchTerm, setInternalSearchTerm] = useState(searchTerm);
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : undefined;

  // Initialize sync scroll hook
  const { registerTable, handleScroll } = useSyncScroll();
  const baseColumnsRef = useRef<HTMLDivElement>(null);
  const uploadedColumnsRef = useRef<HTMLDivElement>(null);

  // Memoized processed data
  const processedData = useMemo<{ headers: string[]; tableData: ProcessedRow[] }>(() => {
    if (!Array.isArray(rows) || rows.length === 0) return { headers: [], tableData: [] };
    let parsedResult;

    if (file?.fileType === 'json') {
      const dataArray = findDataRootObject(rows);
      parsedResult = getHeadersAndValues(dataArray || rows);
    } else {
      parsedResult = getHeadersAndValues(rows);
    }

    if (AllColumns?.length > 0 && Array.isArray(AllColumns[index])) {
      parsedResult.headers = AllColumns[index] as string[];
    }

    return parsedResult;
  }, [rows, file?.fileType, AllColumns, index]);

  const sourceFieldNamesFromFile = useMemo(() => processedData.headers, [processedData.headers]);
  const internalTableData = useMemo(() => processedData.tableData, [processedData.tableData]);

  const [displayableSourceFields, setDisplayableSourceFields] = useState<string[]>([]);
  const [targetFieldConfigurations, setTargetFieldConfigurations] = useState<ConfiguredTargetField[]>([]);
  const [editingTargetConfig, setEditingTargetConfig] = useState<{ id: string; currentName: string } | null>(null);

  const filteredData = useMemo(() => {
    if (!internalSearchTerm) return internalTableData;
    
    return internalTableData.filter(row => 
      Object.values(row).some(value => 
        value && value.toString().toLowerCase().includes(internalSearchTerm.toLowerCase())
      )
    );
  }, [internalTableData, internalSearchTerm]);

  useEffect(() => {
    if (JSON.stringify(displayableSourceFields) !== JSON.stringify(sourceFieldNamesFromFile)) {
      setDisplayableSourceFields(sourceFieldNamesFromFile);
    }
  }, [sourceFieldNamesFromFile]);

  useEffect(() => {
    if (columnKeys.length > 0) {
      setTargetFieldConfigurations(columnKeys);
    } else if (mappings?.formId?.fields) {
      const initialTargetsFromProps: ConfiguredTargetField[] = [];
      const usedSourceFieldsForInitialMapping = new Set<string>();

      (mappings.formId.fields as InitialMappingFromProps[]).forEach(propField => {
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
    }
  }, [mappings?.formId?.fields, sourceFieldNamesFromFile, columnKeys.length]);

  const transformTableData = useCallback((data: ProcessedRow[]): MappedTableRow[] => {
    if (!tableName) return [];
    
    const column_keys = targetFieldConfigurations.map((map: ConfiguredTargetField) => map.mappedSourceField || '');
    const orderedTargetNames = targetFieldConfigurations.map((tf: ConfiguredTargetField) => tf.name || '');

    return data.map((row: ProcessedRow): MappedTableRow => {
      const mappedRowData: Record<string, unknown> = {};
      targetFieldConfigurations.forEach((targetConfig: ConfiguredTargetField) => {
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
        uploaded_column_keys: column_keys,
        all_column_keys: displayableSourceFields,
      };
    });
  }, [targetFieldConfigurations, tableName, mappings?.formId?.id, displayableSourceFields]);

  const transformedData = useMemo(() => transformTableData(filteredData), [transformTableData, filteredData]);

  useEffect(() => {
    if (setTableData && tableName && transformedData.length > 0) {
      setTableData(prev => {
        const newData = { ...prev, [tableName]: transformedData };
        if (JSON.stringify(prev[tableName]) !== JSON.stringify(transformedData)) {
          return newData;
        }
        return prev;
      });
    }
  }, [setTableData, tableName, transformedData]);

  const handleTargetSourceMappingChange = useCallback((
    targetFieldId: string,
    selectedSourceFieldName: string | null
  ) => {
    const newConfigurations = targetFieldConfigurations.map(tf =>
      tf.id === targetFieldId
        ? { ...tf, mappedSourceField: selectedSourceFieldName }
        : tf
    );

    setTargetFieldConfigurations(newConfigurations);
    if (setColumnKeys) {
      setColumnKeys(newConfigurations);
    }
  }, [targetFieldConfigurations, setColumnKeys]);

  const handleSaveTargetFieldNameEdit = () => {
    if (!editingTargetConfig) return;
    const { id, currentName } = editingTargetConfig;
    const newTrimmedName = currentName.trim();
    if (!newTrimmedName) { toast.error("Target field name cannot be empty."); return; }
    if (targetFieldConfigurations.some(tf => tf.name === newTrimmedName && tf.id !== id)) {
      toast.error(`Target field name "${newTrimmedName}" already exists.`); return; }
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
      return value ? 'TRUE' : 'FALSE';
    }
    return `'${String(value).replace(/'/g, "''")}'`;
  };

  const handleExportData = () => {
    if (!targetFieldConfigurations || targetFieldConfigurations.length === 0) {
      toast.error("No target fields are configured. Cannot export data."); return;
    }
    if (!filteredData || filteredData.length === 0) {
      toast.info("No data to export."); return;
    }

    const headers = targetFieldConfigurations.map(tf => tf.name);
    const dataToExport = filteredData.map(row => {
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
        originalExtension = originalType;
        exportFileType = originalType;
      }
    }

    const safeTableName = tableName?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'exported_data';
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `${safeTableName}_${timestamp}.${exportFileType}`;

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
    } else if (exportFileType === 'sql') {
      const sqlColumnNames = headers.map(h => `\`${h.replace(/`/g, '``')}\``).join(', ');
      const insertStatements = dataToExport.map(row => {
        const values = headers.map(header => escapeSqlValue(row[header])).join(', ');
        return `INSERT INTO \`${safeTableName}\` (${sqlColumnNames}) VALUES (${values});`;
      }).join('\r\n');

      const sqlContent = insertStatements;
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
    } else if (exportFileType === 'json') {
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

  const totalPages = useMemo(() => Math.ceil(filteredData.length / itemsPerPage), [filteredData, itemsPerPage]);
  const paginatedRows = useMemo<ProcessedRow[]>(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  // Register and setup scroll listeners
  useEffect(() => {
    const baseElement = baseColumnsRef.current;
    const uploadedElement = uploadedColumnsRef.current;

    if (baseElement) {
      registerTable('baseColumns', baseElement);
    }
    if (uploadedElement) {
      registerTable('uploadedColumns', uploadedElement);
    }

    const handleBaseScroll = (e: Event) => handleScroll('baseColumns', e);
    const handleUploadedScroll = (e: Event) => handleScroll('uploadedColumns', e);

    if (baseElement) {
      baseElement.addEventListener('scroll', handleBaseScroll, { passive: true });
    }
    if (uploadedElement) {
      uploadedElement.addEventListener('scroll', handleUploadedScroll, { passive: true });
    }

    return () => {
      if (baseElement) {
        baseElement.removeEventListener('scroll', handleBaseScroll);
      }
      if (uploadedElement) {
        uploadedElement.removeEventListener('scroll', handleUploadedScroll);
      }
      registerTable('baseColumns', null);
      registerTable('uploadedColumns', null);
    };
  }, [registerTable, handleScroll]);

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {tableName || "Data Mapping Preview"}
            </h1>
            <p className="text-gray-600">
              Map your source data fields to target columns and preview the results
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 sm:flex-none">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search across all data..."
                value={internalSearchTerm}
                onChange={(e) => setInternalSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleExportData}
              disabled={filteredData.length === 0 || targetFieldConfigurations.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiDownload size={18} />
              Export Data
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-800">Total Records</div>
            <div className="text-2xl font-bold text-blue-900">{internalTableData.length}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm font-medium text-green-800">Filtered Records</div>
            <div className="text-2xl font-bold text-green-900">{filteredData.length}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm font-medium text-purple-800">Target Fields</div>
            <div className="text-2xl font-bold text-purple-900">{targetFieldConfigurations.length}</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-sm font-medium text-orange-800">Source Fields</div>
            <div className="text-2xl font-bold text-orange-900">{displayableSourceFields.length}</div>
          </div>
        </div>
      </div>

      {/* Mapping Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Field Mapping Configuration</h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {targetFieldConfigurations.filter(tf => tf.mappedSourceField).length} of {targetFieldConfigurations.length} fields mapped
          </span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Base Columns */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-700">Base Columns (Target)</h3>
              <span className="text-sm text-gray-500">{targetFieldConfigurations.length} fields</span>
            </div>
            <div
              ref={baseColumnsRef}
              className="h-80 overflow-auto border border-gray-200 rounded-lg bg-gray-50 p-2 space-y-2"
            >
              {targetFieldConfigurations.length > 0 ? (
                targetFieldConfigurations.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-2 h-8 rounded-full ${
                        field.mappedSourceField ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      <span className="text-sm font-medium text-gray-900 truncate" title={field.name}>
                        {field.name}
                      </span>
                    </div>
                    <FiArrowRight className="text-gray-400 flex-shrink-0" />
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-sm">No target fields configured</div>
                </div>
              )}
            </div>
          </div>

          {/* Uploaded Columns */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-700">Uploaded Columns (Source)</h3>
              <span className="text-sm text-gray-500">{displayableSourceFields.length} fields</span>
            </div>
            <div
              ref={uploadedColumnsRef}
              className="h-80 overflow-auto border border-gray-200 rounded-lg bg-gray-50 p-2 space-y-3"
            >
              {targetFieldConfigurations.length > 0 ? (
                targetFieldConfigurations.map((targetConfig) => (
                  <div key={targetConfig.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1">
                        {editingTargetConfig?.id === targetConfig.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={editingTargetConfig.currentName}
                              onChange={(e) =>
                                setEditingTargetConfig(prev =>
                                  prev ? { ...prev, currentName: e.target.value } : null
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveTargetFieldNameEdit();
                                if (e.key === 'Escape') setEditingTargetConfig(null);
                              }}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                              autoFocus
                            />
                            <button
                              onClick={handleSaveTargetFieldNameEdit}
                              className="p-1 text-green-600 hover:text-green-800"
                            >
                              <FiSave size={14} />
                            </button>
                            <button
                              onClick={() => setEditingTargetConfig(null)}
                              className="p-1 text-red-600 hover:text-red-800"
                            >
                              <FiX size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {targetConfig.name}
                            </span>
                            <button
                              onClick={() => setEditingTargetConfig({ 
                                id: targetConfig.id, 
                                currentName: targetConfig.name 
                              })}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <FiEdit2 size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <select
                      value={targetConfig.mappedSourceField ?? ''}
                      onChange={(e) => handleTargetSourceMappingChange(targetConfig.id, e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">-- Select Source Field --</option>
                      {displayableSourceFields.map(sourceName => (
                        <option key={sourceName} value={sourceName}>
                          {sourceName}
                        </option>
                      ))}
                    </select>
                    {targetConfig.mappedSourceField && (
                      <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Mapped to: {targetConfig.mappedSourceField}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-sm">Configure target fields first</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Data Preview Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Data Preview</h2>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
            </span>
            {internalSearchTerm && (
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                Filtered from {internalTableData.length} total
              </span>
            )}
          </div>
        </div>

        {filteredData.length > 0 && targetFieldConfigurations.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {targetFieldConfigurations.map(tf => (
                      <th 
                        key={tf.id} 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        <div className="flex items-center gap-2">
                          <span>{tf.name}</span>
                          {tf.mappedSourceField && (
                            <span className="text-xs text-green-600 bg-green-100 px-1 rounded" title={`Mapped to: ${tf.mappedSourceField}`}>
                              ✓
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                      {targetFieldConfigurations.map(targetConfig => {
                        const cellValue = targetConfig.mappedSourceField && row.hasOwnProperty(targetConfig.mappedSourceField)
                          ? (row[targetConfig.mappedSourceField] ?? "") : "";
                        return (
                          <td key={targetConfig.id} className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {typeof cellValue === 'object' && cellValue !== null
                              ? (JSON.stringify(cellValue).length > 100
                                ? JSON.stringify(cellValue).substring(0, 100) + '...'
                                : JSON.stringify(cellValue))
                              : String(cellValue)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 text-sm rounded-lg ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">
              {internalTableData.length === 0
                ? "No data available to display"
                : internalSearchTerm
                ? "No matching records found"
                : "Configure field mappings to preview data"}
            </div>
            <div className="text-sm text-gray-400">
              {internalTableData.length > 0 && targetFieldConfigurations.length === 0 && 
                "Set up your field mappings in the configuration section above"}
            </div>
          </div>
        )}
      </div>

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default PaginatedTable;