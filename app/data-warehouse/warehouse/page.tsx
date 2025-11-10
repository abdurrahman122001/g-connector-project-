"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useRouter } from "next/navigation";
import {
  getDashboardData,
  getDataNodes,
  executeIndicatorScript,
  deleteDataNode,
  IndicatorConfig,
} from "../../services/dataWarehouseApi";
import EnhancedIndicatorForm from "../../components/indicator/EnhancedIndicatorForm";
import IndicatorOutputManager from "../../components/indicator/IndicatorOutputManager";
import IndicatorCharts from "../../components/indicator/IndicatorCharts";
import DashboardIndicatorOutputs from "../../components/dashboard/DashboardIndicatorOutputs";
import AnalyticsIndicatorOutputs from "../../components/dashboard/AnalyticsIndicatorOutputs";
import {
  getApiPoints,
  ApiPoint,
} from "../../services/dataWarehouseApi";

import {
  FiEdit,
  FiTrash2,
  FiDownload,
  FiSettings,
  FiEye,
  FiCopy,
  FiPlus,
} from "react-icons/fi";
import ConfirmationToastComponent from "../../components/ConfirmationToast";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import SubmissionDataModal from "../../components/datawarehouse/SubmissionDataModal";

const API_TYPES = ["JSON", "XML", "CSV", "REST", "SOAP"];
const initialVariable = {
  name: "",
  type: "",
  description: "",
  required: false,
  defaultValue: null,
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];
const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://localhost:8000/api";

/** -----------------------------------------------------------
 * Modal: Create API Point (node-aware + loads variables)
 *  - Now scrollable: overlay and modal are capped with overflow-y-auto
 * ----------------------------------------------------------*/
/** -----------------------------------------------------------
 * Modal: Create API Point (node-aware + loads variables)
 *  - Sends variables as string[] to match backend schema [String]
 * ----------------------------------------------------------*/
function CreateApiPointModal({
  nodeId,
  nodeName,
  onClose,
  onCreated,
}: {
  nodeId: string | null;
  nodeName?: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const initialVariable = {
    name: "",
    type: "string",
    description: "",
    required: false,
    defaultValue: null as any,
  };

  const [form, setForm] = useState({
    slug: "",               // <-- NEW
    type: "JSON",
    url: "",
    user: "",
    passkey: "",
    enabled: true,
    variables: [{ ...initialVariable }],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadingFields, setLoadingFields] = useState(false);
  const [loadedFieldCount, setLoadedFieldCount] = useState<number | null>(null);

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api`
    : "http://localhost:8000/api";

  // Load fields for this node and pre-populate variables
  useEffect(() => {
    const loadNodeFields = async () => {
      if (!nodeId) return;
      try {
        setLoadingFields(true);
        setError("");
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const resp = await fetch(`${BASE_URL}/data-warehouse/nodes/${nodeId}/fields`, {
          headers: { Authorization: `Bearer ${token || ""}` },
        });

        const j = await resp.json();
        if (resp.ok && j?.success) {
          const cleaned = (j.data?.fields || []).filter(
            (f: string) => f && typeof f === "string" && f.trim().length > 0
          );

          const prefilled = cleaned.map((name: string) => ({
            name,
            type: "string",
            description: "",
            required: false,
            defaultValue: null,
          }));

          setForm((prev) => ({
            ...prev,
            variables: prefilled.length ? prefilled : prev.variables,
          }));
          setLoadedFieldCount(prefilled.length);
        } else {
          setLoadedFieldCount(0);
        }
      } catch {
        setLoadedFieldCount(0);
        setError("Failed to load node variables");
      } finally {
        setLoadingFields(false);
      }
    };
    loadNodeFields();
  }, [nodeId]);

  const handleVarChange = (idx: number, field: string, value: any) => {
    setForm((f) => ({
      ...f,
      variables: f.variables.map((v, i) => (i === idx ? { ...v, [field]: value } : v)),
    }));
  };

  const addVariable = () =>
    setForm((f) => ({
      ...f,
      variables: [...f.variables, { ...initialVariable }],
    }));

  const removeVariable = (idx: number) =>
    setForm((f) => ({
      ...f,
      variables: f.variables.filter((_, i) => i !== idx),
    }));

  function sanitizeVariablesInput(input: unknown): Array<{
    name: string;
    type: string;
    description?: string;
    required?: boolean;
    defaultValue?: any;
  }> {
    if (Array.isArray(input)) {
      if (input.length === 1 && typeof input[0] === "string") {
        return sanitizeVariablesInput(input[0]);
      }
      return input
        .map((v: any) => {
          if (v && typeof v === "object" && !Array.isArray(v)) {
            return {
              name: String(v.name ?? "").trim(),
              type: String(v.type ?? "string").trim(),
              description: typeof v.description === "string" ? v.description.trim() : "",
              required: Boolean(v.required),
              defaultValue: v.defaultValue !== undefined ? v.defaultValue : null,
            };
          }
          if (typeof v === "string") {
            const name = v.trim();
            return name
              ? { name, type: "string", description: "", required: false, defaultValue: null }
              : null;
          }
          return null;
        })
        .filter(Boolean) as any[];
    }

    if (typeof input === "string") {
      let s = input.trim();

      // remove "' + \n" glue and strip outer quotes
      s = s.replace(/\\n'\s*\+\s*'|'\s*\+\s*\\n/g, "");
      s = s.replace(/^['"]+|['"]+$/g, "");

      // If it looks like an array, coerce to JSON: single→double, quote keys, remove trailing commas
      if (/^\[.*\]$/.test(s)) {
        let tryStr = s.replace(/'/g, '"');
        tryStr = tryStr.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":');
        tryStr = tryStr.replace(/,(\s*[}\]])/g, "$1");
        try {
          return sanitizeVariablesInput(JSON.parse(tryStr));
        } catch {
          return [];
        }
      }

      // Fallback: treat as list of names
      const names = s.split(/[\r\n,]+/).map(t => t.trim()).filter(Boolean);
      return names.map(name => ({
        name,
        type: "string",
        description: "",
        required: false,
        defaultValue: null,
      }));
    }

    return [];
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Basic required fields
    if (!form.slug || !form.type || !form.url || !form.user || !form.passkey) {
      setError("Type, URL, Username and Passkey are required.");
      return;
    }

    // Normalize and validate variables (send as array of objects)
    const normalizedVars = sanitizeVariablesInput(form.variables)
      .filter((v) => v && v.name && String(v.name).trim().length > 0)
      .map((v) => ({
        name: String(v.name).trim(),
        type: String(v.type ?? "string").trim(),
        description: typeof v.description === "string" ? v.description.trim() : "",
        required: Boolean(v.required),
        defaultValue: v.defaultValue !== undefined ? v.defaultValue : null,
      }));

    if (normalizedVars.length === 0) {
      setError("Variables are invalid. Add at least one variable name (or paste a list/JSON).");
      return;
    }

    const payload = {
      slug: form.slug,   // <--- include slug
      type: form.type,
      url: form.url,
      user: form.user,          // backend controller maps this to ApiPoint.username
      passkey: form.passkey,
      enabled: Boolean(form.enabled),
      variables: normalizedVars, // send objects (backend expects this)
    };

    setSubmitting(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

      const res = await fetch(`${BASE_URL}/data-warehouse/api-points`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let message = "Failed to create API point";
        try {
          const j = await res.json();
          if (j?.error) message = j.error;
          else if (j?.message) message = j.message;
        } catch {
          /* ignore JSON parse errors */
        }
        throw new Error(message);
      }

      if (typeof onCreated === "function") onCreated();
      if (typeof onClose === "function") onClose();
    } catch (err: any) {
      setError(err?.message || "Error creating API point");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-30 overflow-y-auto" aria-modal="true" role="dialog">
      <div className="min-h-full w-full p-4 flex items-center justify-center">
        <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
            <h3 className="text-xl font-bold">Create New API Point</h3>
            {nodeName && (
              <p className="text-sm text-gray-500 mt-1">
                For node: <span className="font-medium text-gray-700">{nodeName}</span>
              </p>
            )}
            {loadingFields ? (
              <div className="flex items-center gap-3 text-sm text-gray-600 mt-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Loading node variables…
              </div>
            ) : loadedFieldCount !== null ? (
              <div className="text-xs text-gray-500 mt-2">
                Loaded <span className="font-semibold">{loadedFieldCount}</span>{" "}
                variable{loadedFieldCount === 1 ? "" : "s"} from node
              </div>
            ) : null}
          </div>

          {/* Body */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Slug *</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    placeholder="ecoli"
                    value={form.slug}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().trim() }))
                    }
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Public path will be <code>/api/{form.slug || 'your-slug'}</code>
                  </p>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Type *</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    required
                  >
                    {["JSON", "XML", "CSV", "REST", "SOAP"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">URL *</label>
                  <input
                    type="url"
                    className="w-full border rounded px-3 py-2"
                    value={form.url}
                    onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">User *</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={form.user}
                    onChange={(e) => setForm((f) => ({ ...f, user: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Passkey *</label>
                  <input
                    type="password"
                    className="w-full border rounded px-3 py-2"
                    value={form.passkey}
                    onChange={(e) => setForm((f) => ({ ...f, passkey: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <label className="font-semibold">Enabled</label>
                  <input
                    type="checkbox"
                    checked={form.enabled}
                    onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
                  />
                </div>
              </div>

              {/* Variables editor (UI keeps objects; submit maps to string[]) */}
              <div>
                <label className="block font-semibold mb-2">Variables *</label>
                <div className="max-h-[40vh] overflow-y-auto pr-1">
                  {form.variables.map((v, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Name"
                        className="border rounded px-2 py-1 w-1/3"
                        value={v.name}
                        onChange={(e) => handleVarChange(idx, "name", e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Type"
                        className="border rounded px-2 py-1 w-1/4"
                        value={v.type}
                        onChange={(e) => handleVarChange(idx, "type", e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        className="border rounded px-2 py-1 w-1/3"
                        value={v.description}
                        onChange={(e) => handleVarChange(idx, "description", e.target.value)}
                      />
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={v.required}
                          onChange={(e) => handleVarChange(idx, "required", e.target.checked)}
                        />
                        Required
                      </label>
                      {form.variables.length > 1 && (
                        <button
                          type="button"
                          className="text-red-600 font-bold px-2"
                          onClick={() => removeVariable(idx)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded"
                    onClick={addVariable}
                  >
                    + Add Variable
                  </button>
                  {loadedFieldCount !== null && loadedFieldCount === 0 && (
                    <span className="text-xs text-gray-500">
                      No variables were detected for this node. You can add them manually.
                    </span>
                  )}
                </div>
              </div>

              {error && <div className="text-red-600">{error}</div>}

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200 text-gray-700"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white font-semibold disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Create API Point"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}


/** -----------------------------------------------------------
 * Page: Data Warehouse
 * ----------------------------------------------------------*/
export default function Indicator() {
  const [showIndicatorModal, setShowIndicatorModal] = useState(false);
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingIndicator, setCreatingIndicator] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<any>(null);
  const router = useRouter();
  const [nodes, setNodes] = useState<any[]>([]);
  const [loadingNodes, setLoadingNodes] = useState(false);
  const [deletingNodeId, setDeletingNodeId] = useState<string | null>(null);
  const [showFieldsModal, setShowFieldsModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [nodeFields, setNodeFields] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);

  // API Point modal control + selected node for API modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedNodeForApi, setSelectedNodeForApi] = useState<any | null>(null);

  const [apiPoints, setApiPoints] = useState<ApiPoint[]>([]);
  const [showOutputManager, setShowOutputManager] = useState(false);
  const [selectedIndicatorForOutput, setSelectedIndicatorForOutput] =
    useState<any>(null);

  const dashboardOutputsRef = useRef<any>(null);

  useEffect(() => {
    fetchDashboardData();
    fetchNodes();
  }, []);

  const fetchApiPoints = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getApiPoints();
      setApiPoints(data);
    } catch (err) {
      setError("Failed to load API points");
      console.error("Error fetching API points:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardData();
      setDashboardData(data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchNodes = async () => {
    try {
      setLoadingNodes(true);
      const data = await getDataNodes();
      setNodes(data);
    } catch (err) {
      console.error("Error fetching nodes:", err);
    } finally {
      setLoadingNodes(false);
    }
  };

  const handleCreateIndicator = async (formData: {
    name: string;
    description: string;
    enabled: boolean;
    scriptFile: File | null;
    selectedNode: string;
    selectedVariables: string[];
  }) => {
    try {
      setCreatingIndicator(true);

      let response;
      let createdIndicatorId: string | null = null;

      if (editingIndicator) {
        if (formData.scriptFile) {
          const data = new FormData();
          data.append("name", formData.name);
          data.append("description", formData.description);
          data.append("enabled", formData.enabled ? "true" : "false");
          data.append("scriptFile", formData.scriptFile);
          data.append("nodeId", formData.selectedNode);
          data.append(
            "selectedVariables",
            JSON.stringify(formData.selectedVariables)
          );

          response = await fetch(
            `${BASE_URL}/data-warehouse/indicators/${editingIndicator.id}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
              },
              body: data,
            }
          );
        } else {
          response = await fetch(
            `${BASE_URL}/data-warehouse/indicators/${editingIndicator.id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
              },
              body: JSON.stringify({
                name: formData.name,
                description: formData.description,
                enabled: formData.enabled,
                nodeId: formData.selectedNode,
                selectedVariables: formData.selectedVariables,
              }),
            }
          );
        }
        createdIndicatorId = editingIndicator.id;
      } else {
        if (formData.scriptFile) {
          const data = new FormData();
          data.append("name", formData.name);
          data.append("description", formData.description);
          data.append("enabled", formData.enabled ? "true" : "false");
          data.append("scriptFile", formData.scriptFile);
          data.append("nodeId", formData.selectedNode);
          data.append(
            "selectedVariables",
            JSON.stringify(formData.selectedVariables)
          );

          response = await fetch(`${BASE_URL}/data-warehouse/indicators`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
            body: data,
          });
        } else {
          response = await fetch(`${BASE_URL}/data-warehouse/indicators`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
            body: JSON.stringify({
              name: formData.name,
              description: formData.description,
              enabled: formData.enabled,
              nodeId: formData.selectedNode,
              selectedVariables: formData.selectedVariables,
            }),
          });
        }

        if (response.ok) {
          const result = await response.json();
          createdIndicatorId = result.data.id;
        }
      }

      if (!response.ok)
        throw new Error(
          editingIndicator
            ? "Failed to update indicator"
            : "Failed to create indicator"
        );

      if (createdIndicatorId) {
        try {
          await executeIndicatorScript(createdIndicatorId, {
            data_limits: { submissions: 1000, data_nodes: 200 },
            processing: { data_quality_threshold: 90 },
            output: { max_outputs: 5, include_charts: true },
          });
        } catch (executeError) {
          console.warn("Script execution failed, but indicator was created:", executeError);
        }
      }

      setShowIndicatorModal(false);
      setEditingIndicator(null);
      await fetchDashboardData();
    } catch (error) {
      alert(
        editingIndicator
          ? "Failed to update indicator. Please try again."
          : "Failed to create indicator. Please try again."
      );
    } finally {
      setCreatingIndicator(false);
    }
  };

  const handleEditIndicator = (indicator: any) => {
    setEditingIndicator(indicator);
    setShowIndicatorModal(true);
  };

  const handleViewOutput = (indicator: any) => {
    setSelectedIndicatorForOutput(indicator);
    setShowOutputManager(true);
  };

  const handleIndicatorDeleted = () => {
    if (dashboardOutputsRef.current) {
      dashboardOutputsRef.current.refresh();
    }
  };

  const fetchNodeFields = async (nodeId: string) => {
    try {
      setLoadingFields(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/data-warehouse/nodes/${nodeId}/fields`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const filteredFields = response.data.data.fields.filter(
          (field: string) =>
            field && typeof field === "string" && field.trim().length > 0
        );
        setNodeFields(filteredFields);
        setSelectedFields([]);

        setSelectedNode((prev: any) => ({
          ...prev,
          totalFields: response.data.data.totalFields,
          nodeStatus: response.data.data.nodeStatus,
        }));
      }
    } catch (error) {
      console.error("Error fetching node fields:", error);
      toast.error("Failed to load node fields");
    } finally {
      setLoadingFields(false);
    }
  };

  const handleViewNode = async (node: any) => {
    setSelectedNode(node);
    setShowFieldsModal(true);
    await fetchNodeFields(node.id);
  };

  const handleFieldToggle = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleDeleteNode = async (id: string) => {
    const performDelete = async () => {
      try {
        setDeletingNodeId(id);
        await deleteDataNode(id);
        await fetchNodes();
        toast.success("Node deleted successfully");
      } catch (err) {
        toast.error("Failed to delete node.");
      } finally {
        setDeletingNodeId(null);
      }
    };

    toast(<ConfirmationToastComponent onConfirm={performDelete} />, {
      position: "top-center",
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      closeButton: false,
      className: "bg-white shadow-xl rounded-lg border border-gray-300 p-0",
      style: { width: "420px" },
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container mx-auto px-4 py-6 bg-white min-h-screen flex items-center justify-center">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-4xl font-extrabold mb-1">Data warehouse</h1>
        </div>
        <div className="flex items-center gap-2 mt-2 md:mt-0">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm border border-black"
            onClick={() => router.push("/data-warehouse/warehouse/new-node")}
          >
            New Data Node
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
            onClick={() => setShowIndicatorModal(true)}
          >
            New Indicator
          </button>
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
            onClick={() => router.push("/data-warehouse/indicators")}
          >
            View Analytics
          </button>
          <div className="ml-4 flex items-center gap-2">
            <span className="text-xs text-gray-400">
              Last updated:{" "}
              {new Date(dashboardData.lastUpdated).toLocaleString()}
            </span>
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs"
              onClick={fetchDashboardData}
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-100 p-6 rounded-xl shadow-md text-center">
          <div className="text-lg font-semibold mb-2">Total Data Nodes</div>
          <div className="text-4xl font-bold">
            {dashboardData.totalDataNodes}
          </div>
        </div>
        <div className="bg-gray-100 p-6 rounded-xl shadow-md text-center">
          <div className="text-lg font-semibold mb-2">Total Records</div>
          <div className="text-4xl font-bold">{dashboardData.totalRecords}</div>
        </div>
        <div className="bg-gray-100 p-6 rounded-xl shadow-md text-center">
          <div className="text-lg font-semibold mb-2">Total Variables</div>
          <div className="text-4xl font-bold">
            {dashboardData.totalVariables}
          </div>
        </div>
      </div>

      {/* Data dictionary section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Data dictionary
        </h3>
        <p className="text-sm text-blue-700">
          Comprehensive data management interface with node structure
          visualization (no edits). Also includes data download in csv and excel
        </p>
      </div>

      {/* Data Nodes Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Data Nodes</h2>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2"
            onClick={() => router.push("/data-warehouse/warehouse/new-node")}
          >
            Create
          </button>
        </div>

        {loadingNodes ? (
          <div className="p-6 text-gray-500">Loading nodes...</div>
        ) : nodes.length === 0 ? (
          <div className="p-6 text-gray-500">No data nodes found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Data node name
                  </th>
                  {/* <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Node Count
                  </th> */}
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Linked forms created
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {nodes.map((node) => (
                  <tr key={node.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-blue-600">
                        {node.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {node.status === "active"
                          ? "This form is repeatable"
                          : "This form is inactive"}
                      </div>
                    </td>
                    {/* <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {node.fields ? node.fields.length : 0}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Variables</div>
                    </td> */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {node.description || "No description"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {node.linkedForms && node.linkedForms.length > 0 ? (
                          node.linkedForms.slice(0, 3).map((form: any, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {typeof form === "string" ? form : form.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">
                            No forms linked
                          </span>
                        )}
                        {node.linkedForms && node.linkedForms.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{node.linkedForms.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          className="w-7 h-7 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-colors"
                          title="View"
                          onClick={() => handleViewNode(node)}
                        >
                          <FiEye size={12} />
                        </button>
                        <button
                          className="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                          title="Delete"
                          disabled={deletingNodeId === node.id}
                          onClick={() => handleDeleteNode(node.id)}
                        >
                          <FiTrash2 size={12} />
                        </button>

                        {/* Plus: Create API Point for this node (opens scrollable modal) */}
                        <button
                          className="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                          title="Create API Point"
                          onClick={() => {
                            setSelectedNodeForApi(node);
                            setShowCreateModal(true);
                          }}
                        >
                          <FiPlus size={12} />
                        </button>

                        <button
                          className="w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
                          title="Edit"
                          onClick={() =>
                            router.push(
                              `/data-warehouse/warehouse/new-node/edit-node/${node.id}`
                            )
                          }
                        >
                          <FiEdit size={12} />
                        </button>
                        <button
                          className="w-7 h-7 bg-purple-500 hover:bg-purple-600 text-white rounded-full flex items-center justify-center transition-colors"
                          title="Download"
                          onClick={() => {
                            /* TODO: Implement download functionality */
                          }}
                        >
                          <FiDownload size={12} />
                        </button>
                        <button
                          className="w-7 h-7 bg-gray-500 hover:bg-gray-600 text-white rounded-full flex items-center justify-center transition-colors"
                          title="Settings"
                          onClick={() => {
                            /* TODO: Implement settings functionality */
                          }}
                        >
                          <FiSettings size={12} />
                        </button>
                        <button
                          className="w-7 h-7 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center transition-colors"
                          title="Copy"
                          onClick={() => {
                            /* TODO: Implement copy functionality */
                          }}
                        >
                          <FiCopy size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer text */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>View metadata</span>
            <span>To the settings of each</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Data Transfer Analysis
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.transferData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sent" fill="#8884d8" name="Data Sent" />
                <Bar dataKey="received" fill="#82ca9d" name="Data Received" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Variable Distribution
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.variableDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {dashboardData.variableDistribution.map(
                    (entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    )
                  )}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div> 
         <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Metadata Indicator
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.metadataIndicator}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Indicator Analytics Section */}
      <div className="mt-12">
        <IndicatorCharts
          onEditIndicator={handleEditIndicator}
          onViewOutput={handleViewOutput}
          onDeleteIndicator={handleIndicatorDeleted}
        />
      </div>

      {/* Dashboard Indicator Outputs Section */}
      <div className="mt-12">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Dashboard Chart Outputs
          </h3>
          <DashboardIndicatorOutputs ref={dashboardOutputsRef} />
        </div>
      </div>

      {/* Enhanced Indicator Form Modal */}
      <EnhancedIndicatorForm
        isOpen={showIndicatorModal}
        onClose={() => {
          setShowIndicatorModal(false);
          setEditingIndicator(null);
        }}
        onSubmit={handleCreateIndicator}
        loading={creatingIndicator}
        editData={editingIndicator}
      />

      {/* Indicator Output Manager Modal */}
      {selectedIndicatorForOutput && (
        <IndicatorOutputManager
          indicatorId={selectedIndicatorForOutput.id}
          indicatorName={selectedIndicatorForOutput.name}
          isOpen={showOutputManager}
          onClose={() => {
            setShowOutputManager(false);
            setSelectedIndicatorForOutput(null);
          }}
        />
      )}

      {/* Node Fields Modal (now scrollable) */}
      {showFieldsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="min-h-full w-full p-4 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Node Fields: {selectedNode?.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Select fields to view or work with
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowFieldsModal(false);
                    setSelectedNode(null);
                    setNodeFields([]);
                    setSelectedFields([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                {loadingFields ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading fields...</span>
                  </div>
                ) : nodeFields.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No fields found for this node
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm text-gray-600">
                        Found {nodeFields.length} fields in this node
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedFields([...nodeFields])}
                          className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => setSelectedFields([])}
                          className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    {/* Make the checklist scrollable if long */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[45vh] overflow-y-auto pr-1">
                      {nodeFields.map((field, index) => (
                        <div key={index} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`field-${index}`}
                            checked={selectedFields.includes(field)}
                            onChange={() => handleFieldToggle(field)}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor={`field-${index}`}
                            className="text-sm text-gray-900 cursor-pointer flex-1 hover:text-blue-600 transition-colors"
                          >
                            {field}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
                <div className="text-sm text-gray-600">
                  {selectedFields.length} of {nodeFields.length} fields selected
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowFieldsModal(false);
                      setSelectedNode(null);
                      setNodeFields([]);
                      setSelectedFields([]);
                    }}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (selectedFields.length > 0 && selectedNode) {
                        setShowFieldsModal(false);
                        setShowSubmissionModal(true);
                      }
                    }}
                    disabled={selectedFields.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    View Submission Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submission Data Modal */}
      <SubmissionDataModal
        isOpen={showSubmissionModal}
        onClose={() => {
          setShowSubmissionModal(false);
        }}
        nodeId={selectedNode?.id || ""}
        nodeName={selectedNode?.name || ""}
        selectedFields={selectedFields}
      />

      {/* Create API Point Modal (scrollable) */}
      {showCreateModal && (
        <CreateApiPointModal
          nodeId={selectedNodeForApi?.id || null}
          nodeName={selectedNodeForApi?.name || null}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedNodeForApi(null);
          }}
          onCreated={fetchApiPoints}
        />
      )}

      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
}
