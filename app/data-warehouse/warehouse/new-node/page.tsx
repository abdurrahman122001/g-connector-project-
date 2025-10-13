"use client"
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createDataNode,
  getForms,
  getFormStructure,
} from "../../../services/dataWarehouseApi";

type FormVariable = string | { name: string; type?: string };
interface Form {
  id: string;
  name: string;
  variables: FormVariable[];
}

export default function NewNodePage() {
  const router = useRouter();
  const [run, setRun] = useState(true);
  const [loading, setLoading] = useState(false);
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [selectedVariables, setSelectedVariables] = useState<{
    [formId: string]: string[];
  }>({});
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    scriptFile: null as File | null,
  });
  const [formStructures, setFormStructures] = useState<{
    [formId: string]: { name: string; label: string; type?: string }[];
  }>({});

  useEffect(() => {
    fetchForms();
  }, []);

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

  const fetchForms = async () => {
    try {
      const formsData = await getForms();
      setForms(formsData);
    } catch (error) {
      console.error("Error fetching forms:", error);
    }
  };

  const handleFormToggle = (formId: string) => {
    setSelectedForms((prev) =>
      prev.includes(formId)
        ? prev.filter((id) => id !== formId)
        : [...prev, formId]
    );
    setSelectedVariables((prev) => {
      if (selectedForms.includes(formId)) {
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
  if (!formData.name || selectedForms.length === 0) {
    alert("Please fill in all required fields");
    return;
  }

  const variables = selectedForms.map((formId) => ({
    form: formId,
    fields: selectedVariables[formId] || [],
  }));

  // Send the real File object at top-level so the service can switch to FormData
  const nodeData = {
    name: formData.name,
    description: formData.description,
    linkedForms: selectedForms,
    variables,
    status: run ? ("active" as const) : ("inactive" as const),
    scriptFile: formData.scriptFile || undefined,
    scriptColumn: formData.scriptFile
      ? {
          name: formData.scriptFile.name,
          type: "computed" as const,
          source: "python_script" as const,
        }
      : undefined,
  };

  try {
    setLoading(true);
    await createDataNode(nodeData);
    router.push("/data-warehouse/warehouse");
  } catch (error) {
    console.error("Error creating node:", error);
    alert("Failed to create node. Please try again.");
  } finally {
    setLoading(false);
  }
};




  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg">
        <h3 className="text-2xl font-bold mb-6 text-center">Create new Node</h3>
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

          {/* Select data Forms */}
          <div>
            <label className="block text-lg font-semibold mb-1">
              Select data Forms *
            </label>
            <div className="border border-gray-300 rounded p-2 max-h-32 overflow-y-auto">
              {forms.map((form) => (
                <div key={form.id}>
                  <input
                    type="checkbox"
                    id={`form-${form.id}`}
                    className="mr-2"
                    checked={selectedForms.includes(form.id)}
                    onChange={() => handleFormToggle(form.id)}
                  />
                  <label htmlFor={`form-${form.id}`}>{form.name}</label>
                </div>
              ))}
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
                      <div key={`${formId}-${field.label}`}>
                        <input
                          type="checkbox"
                          id={`var-${formId}-${field.label}`}
                          className="mr-2"
                          checked={selectedVariables[formId]?.includes(
                            field.label
                          )}
                          onChange={() =>
                            handleVariableToggle(formId, field.label)
                          }
                        />
                        <label htmlFor={`var-${formId}-${field.label}`}>
                          {field.label}
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
            <input
              type="file"
              className="block w-full text-sm text-gray-500"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  scriptFile: e.target.files?.[0] || null,
                }))
              }
            />
          </div>

          {/* Run toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={`w-20 h-8 rounded font-semibold ${
                run ? "bg-green-500 text-white" : "bg-gray-300 text-gray-600"
              }`}
              onClick={() => setRun(!run)}
            >
              {run ? "Run" : "Disabled"}
            </button>
            <span className="text-gray-500 text-sm">Run or disable</span>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-200 text-gray-700"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white font-semibold disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Node"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

