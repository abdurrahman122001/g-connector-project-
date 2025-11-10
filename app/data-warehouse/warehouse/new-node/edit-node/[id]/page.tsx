"use client"
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getDataNodeById,
  updateDataNode,
  getForms,
  getFormStructure,
} from "../../../../../services/dataWarehouseApi";

type FormVariable = string | { name: string; type?: string };
interface Form {
  id: string;
  name: string;
  variables: FormVariable[];
}

interface DataNode {
  id: string;
  name: string;
  description: string;
  linkedForms: string[];
  variables: Array<{
    form: string;
    fields: string[];
  }>;
  status: 'active' | 'inactive';
  scriptColumn?: {
    name: string;
    type: string;
    source: string;
    scriptFile?: string;
    functionName?: string;
  };
  createdColumns?: Array<{
    name: string;
    type: string;
    source: string;
    description?: string;
    status?: string;
  }>;
  fields?: string[];
}

export default function EditNodePage() {
  const router = useRouter();
  const params = useParams();
  const nodeId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [selectedVariables, setSelectedVariables] = useState<{
    [formId: string]: string[];
  }>({});
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    scriptFile: null as File | null,
    existingScriptFile: "",
    existingFunctionName: "",
  });
  const [formStructures, setFormStructures] = useState<{
    [formId: string]: { name: string; label: string; type?: string }[];
  }>({});
  const [run, setRun] = useState(true);
  const [error, setError] = useState("");
  
  // New states for script editor
  const [showScriptEditor, setShowScriptEditor] = useState(false);
  const [scriptContent, setScriptContent] = useState("");
  const [editingScript, setEditingScript] = useState(false);
  const [scriptLoading, setScriptLoading] = useState(false);

  useEffect(() => {
    if (nodeId) {
      fetchNodeData();
      fetchForms();
    }
  }, [nodeId]);

  useEffect(() => {
    // Fetch structure for any newly selected form
    selectedForms.forEach(async (formId) => {
      if (!formStructures[formId]) {
        try {
          const structure = await getFormStructure(formId);
          setFormStructures((prev) => ({
            ...prev,
            [formId]: structure.fields,
          }));
        } catch (e) {
          console.error("Error fetching form structure:", e);
        }
      }
    });
  }, [selectedForms]);

  const fetchNodeData = async () => {
    try {
      setFetching(true);
      setError("");
      const node = await getDataNodeById(nodeId);
      
      // Pre-populate form with existing data
      setFormData({
        name: node.name,
        description: node.description || "",
        scriptFile: null,
        existingScriptFile: node.scriptColumn?.scriptFile || "",
        existingFunctionName: node.scriptColumn?.functionName || ""
      });
      
      setSelectedForms(node.linkedForms || []);
      setRun(node.status === 'active');
      
      // Pre-populate selected variables
      const variablesMap: { [formId: string]: string[] } = {};
      node.variables?.forEach(variable => {
        if (variable.form && variable.fields) {
          variablesMap[variable.form] = variable.fields || [];
        }
      });
      setSelectedVariables(variablesMap);
      
    } catch (error) {
      console.error("Error fetching node data:", error);
      setError("Failed to load node data. Please try again.");
    } finally {
      setFetching(false);
    }
  };

  const fetchForms = async () => {
    try {
      const formsData = await getForms();
      setForms(formsData);
    } catch (error) {
      console.error("Error fetching forms:", error);
      setError("Failed to load forms. Please try again.");
    }
  };

  // Function to load and display script content
  const handleViewScript = async () => {
    if (!formData.existingScriptFile) {
      setError("No script file available to view.");
      return;
    }

    try {
      setScriptLoading(true);
      setError("");
      
      // Fetch the script file content
      const response = await fetch(`/api/data-warehouse/script-content?filePath=${encodeURIComponent(formData.existingScriptFile)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load script file');
      }

      const result = await response.json();
      
      if (result.success) {
        setScriptContent(result.data.content);
        setShowScriptEditor(true);
        setEditingScript(false);
      } else {
        throw new Error(result.error || 'Failed to load script');
      }
    } catch (error) {
      console.error("Error loading script:", error);
      setError("Failed to load script file. Please try again.");
    } finally {
      setScriptLoading(false);
    }
  };

  // Function to save edited script
  const handleSaveScript = async () => {
    if (!formData.existingScriptFile) {
      setError("No script file path available.");
      return;
    }

    try {
      setScriptLoading(true);
      
      const response = await fetch('/api/data-warehouse/update-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          filePath: formData.existingScriptFile,
          content: scriptContent
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save script');
      }

      const result = await response.json();
      
      if (result.success) {
        setEditingScript(false);
        setError("Script updated successfully!");
        // Clear success message after 3 seconds
        setTimeout(() => setError(""), 3000);
      } else {
        throw new Error(result.error || 'Failed to save script');
      }
    } catch (error) {
      console.error("Error saving script:", error);
      setError("Failed to save script. Please try again.");
    } finally {
      setScriptLoading(false);
    }
  };

  // Function to download script file
  const handleDownloadScript = () => {
    if (!formData.existingScriptFile) return;
    
    const link = document.createElement('a');
    link.href = `/api/data-warehouse/download-script?filePath=${encodeURIComponent(formData.existingScriptFile)}`;
    link.download = formData.existingScriptFile.split('/').pop() || 'script.py';
    link.click();
  };

  const handleFormToggle = (formId: string) => {
    setSelectedForms((prev) =>
      prev.includes(formId)
        ? prev.filter((id) => id !== formId)
        : [...prev, formId]
    );
    setSelectedVariables((prev) => {
      if (prev[formId]) {
        // Form is being deselected, remove its variables
        const { [formId]: _, ...rest } = prev;
        return rest;
      } else {
        // Form is being selected, initialize its variables array
        return { ...prev, [formId]: [] };
      }
    });
  };

  const handleVariableToggle = (formId: string, variable: string) => {
    setSelectedVariables((prev) => {
      const current = prev[formId] || [];
      const isCurrentlySelected = current.includes(variable);
      const newSelection = isCurrentlySelected
        ? current.filter((v) => v !== variable)
        : [...current, variable];

      return {
        ...prev,
        [formId]: newSelection,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!formData.name || selectedForms.length === 0) {
      setError("Please fill in all required fields");
      return;
    }

    // Validate that each selected form has at least one variable selected
    const formsWithoutVariables = selectedForms.filter(formId => 
      !selectedVariables[formId] || selectedVariables[formId].length === 0
    );

    if (formsWithoutVariables.length > 0) {
      setError("Please select at least one variable for each form");
      return;
    }

    const variables = selectedForms.map((formId) => ({
      form: formId,
      fields: selectedVariables[formId] || [],
    }));

    const nodeData = {
      name: formData.name,
      description: formData.description,
      linkedForms: selectedForms,
      variables,
      status: run ? "active" : "inactive",
      scriptFile: formData.scriptFile || undefined,
    };

    try {
      setLoading(true);
      await updateDataNode(nodeId, nodeData);
      router.push("/data-warehouse/warehouse");
    } catch (error) {
      console.error("Error updating node:", error);
      setError("Failed to update node. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg">
          <div className="text-center">Loading node data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-4xl"> {/* Increased max width */}
        <h3 className="text-2xl font-bold mb-6 text-center">Edit Node</h3>
        
        {/* Error Message */}
        {error && (
          <div className={`mb-4 p-3 rounded text-sm ${
            error.includes("successfully") 
              ? "bg-green-50 border border-green-200 text-green-700" 
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {error}
          </div>
        )}

        {/* Script Editor Modal */}
        {showScriptEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-11/12 h-5/6 max-w-6xl flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h4 className="text-lg font-semibold">
                  Python Script Editor: {formData.existingScriptFile.split('/').pop()}
                </h4>
                <div className="flex gap-2">
                  {!editingScript && (
                    <button
                      onClick={() => setEditingScript(true)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                  )}
                  {editingScript && (
                    <button
                      onClick={handleSaveScript}
                      disabled={scriptLoading}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {scriptLoading ? "Saving..." : "Save"}
                    </button>
                  )}
                  <button
                    onClick={handleDownloadScript}
                    className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => setShowScriptEditor(false)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="flex-1 p-4">
                {editingScript ? (
                  <textarea
                    value={scriptContent}
                    onChange={(e) => setScriptContent(e.target.value)}
                    className="w-full h-full font-mono text-sm p-4 border rounded resize-none"
                    placeholder="Enter your Python script here..."
                    spellCheck="false"
                  />
                ) : (
                  <pre className="w-full h-full font-mono text-sm p-4 border rounded bg-gray-50 overflow-auto whitespace-pre-wrap">
                    {scriptContent}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Node name */}
          <div>
            <label className="block text-lg font-semibold mb-1">
              Node name *
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          {/* Node description */}
          <div>
            <label className="block text-lg font-semibold mb-1">
              Description
            </label>
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
              placeholder="Enter a description for this data node..."
            />
          </div>

          {/* Select data Forms */}
          <div>
            <label className="block text-lg font-semibold mb-1">
              Select data Forms *
            </label>
            <div className="border border-gray-300 rounded p-2 max-h-32 overflow-y-auto">
              {forms.length === 0 ? (
                <div className="text-gray-400 text-xs">No forms available</div>
              ) : (
                forms.map((form) => (
                  <div key={form.id} className="flex items-center py-1">
                    <input
                      type="checkbox"
                      id={`form-${form.id}`}
                      className="mr-2"
                      checked={selectedForms.includes(form.id)}
                      onChange={() => handleFormToggle(form.id)}
                    />
                    <label htmlFor={`form-${form.id}`} className="text-sm">
                      {form.name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Variables per form */}
          {selectedForms.map((formId) => {
            const form = forms.find((f) => f.id === formId);
            if (!form) return null;
            const fields = formStructures[formId] || [];
            return (
              <div key={formId} className="mt-2">
                <label className="block text-md font-semibold mb-1">
                  Select Variables for {form.name} *
                </label>
                <div className="border border-gray-300 rounded p-2 max-h-32 overflow-y-auto">
                  {fields.length === 0 ? (
                    <div className="text-gray-400 text-xs">Loading fields...</div>
                  ) : (
                    fields.map((field) => (
                      <div key={`${formId}-${field.name}`} className="flex items-center py-1">
                        <input
                          type="checkbox"
                          id={`var-${formId}-${field.name}`}
                          className="mr-2"
                          checked={selectedVariables[formId]?.includes(field.name)}
                          onChange={() => handleVariableToggle(formId, field.name)}
                        />
                        <label htmlFor={`var-${formId}-${field.name}`} className="text-sm">
                          {field.label} {field.name !== field.label && `(${field.name})`}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}

          {/* Command script file */}
          <div>
            <label className="block text-lg font-semibold mb-1">
              Command script file
            </label>
            
            {/* Show existing script info */}
            {formData.existingScriptFile && (
              <div className="mb-2 p-2 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Current script:</strong> {formData.existingScriptFile.split('/').pop()}
                  {formData.existingFunctionName && (
                    <span> (Function: {formData.existingFunctionName})</span>
                  )}
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleViewScript}
                    disabled={scriptLoading}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {scriptLoading ? "Loading..." : "View/Edit Script"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadScript}
                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                  >
                    Download
                  </button>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Upload a new file to replace the existing script
                </p>
              </div>
            )}
            
            <input
              type="file"
              accept=".py"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  scriptFile: e.target.files?.[0] || null,
                }))
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              Only Python (.py) files are allowed. Leave empty to keep current script.
            </p>
          </div>

          {/* Run toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={`w-20 h-8 rounded font-semibold transition-colors ${
                run ? "bg-green-500 text-white" : "bg-gray-300 text-gray-600"
              }`}
              onClick={() => setRun(!run)}
            >
              {run ? "Active" : "Inactive"}
            </button>
            <span className="text-gray-500 text-sm">Set node status</span>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Node"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}