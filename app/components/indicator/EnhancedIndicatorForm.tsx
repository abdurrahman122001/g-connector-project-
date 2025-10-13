"use client"
import React, { useState, useEffect } from 'react';
import { getDataNodes, getIndicatorById, getNodeFieldKeys } from '../../services/dataWarehouseApi';

interface EnhancedIndicatorFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    name: string;
    description: string;
    enabled: boolean;
    scriptFile: File | null;
    selectedNode: string;
    selectedVariables: string[];
    sector: string | null;
    subcategory: string | null;
    // NEW: where should results appear?
    displayChannels: {
      dashboard: boolean;
      amr: boolean;
      amu: boolean;
      amc: boolean;
    };
  }) => void;
  loading?: boolean;
  editData?: any; // Indicator data for editing
}

export default function EnhancedIndicatorForm({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  editData
}: EnhancedIndicatorFormProps) {
  const [nodes, setNodes] = useState<any[]>([]);
  const [loadingNodes, setLoadingNodes] = useState(false);
  const [loadingIndicator, setLoadingIndicator] = useState(false);
  const [loadingFieldKeys, setLoadingFieldKeys] = useState(false);
  const [fieldKeys, setFieldKeys] = useState<Array<{
    key: string;
    label: string;
    type?: string;
    formName: string;
  }>>([]);

  // Sector & subcategory
  const [sectors, setSectors] = useState<{ id: number; name: string }[]>([]);
  const [subcategories, setSubcategories] = useState<{ id: number; name: string }[]>([]);
  const [loadingSectors, setLoadingSectors] = useState(false);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);

  // Form state (+ NEW displayChannels)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    enabled: true,
    scriptFile: null as File | null,
    selectedNode: '',
    selectedVariables: [] as string[],
    sector: null as string | null,
    subcategory: null as string | null,
    displayChannels: {
      dashboard: true, // default: show on Dashboard
      amr: false,
      amu: false,
      amc: false,
    }
  });

  useEffect(() => {
    if (isOpen) {
      fetchNodes();
      fetchSectors();

      if (editData?.id) {
        fetchIndicatorData(editData.id);
      } else {
        // reset for new indicator
        setFormData({
          name: '',
          description: '',
          enabled: true,
          scriptFile: null,
          selectedNode: '',
          selectedVariables: [],
          sector: null,
          subcategory: null,
          displayChannels: {
            dashboard: true,
            amr: false,
            amu: false,
            amc: false,
          }
        });
        setFieldKeys([]);
      }
    }
  }, [isOpen, editData]);

  useEffect(() => {
    if (formData.sector) {
      fetchSubcategories(formData.sector);
    } else {
      setSubcategories([]);
      setFormData(prev => ({ ...prev, subcategory: null }));
    }
  }, [formData.sector]);

  useEffect(() => {
    if (formData.selectedNode) {
      fetchNodeFieldKeys(formData.selectedNode);
    } else {
      setFieldKeys([]);
      setFormData(prev => ({ ...prev, selectedVariables: [] }));
    }
  }, [formData.selectedNode]);

  const fetchIndicatorData = async (indicatorId: string) => {
    try {
      setLoadingIndicator(true);
      const indicatorData = await getIndicatorById(indicatorId);

      let selectedVarKeys: string[] = [];
      if (indicatorData.selectedVariables && Array.isArray(indicatorData.selectedVariables)) {
        selectedVarKeys = indicatorData.selectedVariables.map((v: any) =>
          typeof v === 'string' ? v : v.key
        );
      }

      // Try to hydrate displayChannels from indicator (if present), else default
      const displayChannels = (indicatorData as any).displayChannels || {
        dashboard: true,
        amr: false,
        amu: false,
        amc: false,
      };

      setFormData({
        name: indicatorData.name || '',
        description: indicatorData.description || '',
        enabled: indicatorData.enabled ?? true,
        scriptFile: null,
        selectedNode: typeof (indicatorData as any).nodeId === 'string' ? (indicatorData as any).nodeId : '',
        selectedVariables: selectedVarKeys,
        sector: (indicatorData as any).sector || null,
        subcategory: (indicatorData as any).subcategory || null,
        displayChannels
      });
    } catch (error) {
      console.error('Error fetching indicator data:', error);
      alert('Failed to load indicator data for editing');
    } finally {
      setLoadingIndicator(false);
    }
  };

  const fetchNodes = async () => {
    try {
      setLoadingNodes(true);
      const nodesData = await getDataNodes();
      setNodes(nodesData);
    } catch (error) {
      console.error('Error fetching nodes:', error);
    } finally {
      setLoadingNodes(false);
    }
  };

  const fetchNodeFieldKeys = async (nodeId: string) => {
    try {
      setLoadingFieldKeys(true);
      const response = await getNodeFieldKeys(nodeId);
      setFieldKeys(response.fieldKeys);
    } catch (error) {
      console.error('Error fetching field keys:', error);
    } finally {
      setLoadingFieldKeys(false);
    }
  };

  const fetchSectors = async () => {
    try {
      setLoadingSectors(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setSectors(data.data || []);
    } catch (error) {
      console.error('Error fetching sectors:', error);
      setSectors([]);
    } finally {
      setLoadingSectors(false);
    }
  };

  const fetchSubcategories = async (sectorId: string) => {
    try {
      setLoadingSubcategories(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${sectorId}/subcategories`);
      if (!response.ok) throw new Error('Failed to fetch subcategories');
      const data = await response.json();
      setSubcategories(data.data || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubcategories([]);
    } finally {
      setLoadingSubcategories(false);
    }
  };

  const handleVariableToggle = (variableKey: string) => {
    setFormData(prev => {
      const current = prev.selectedVariables || [];
      const isCurrentlySelected = current.includes(variableKey);
      const newSelection = isCurrentlySelected
        ? current.filter(v => v !== variableKey)
        : [...current, variableKey];

      return { ...prev, selectedVariables: newSelection };
    });
  };

  // NEW: toggle individual display channel
  const toggleChannel = (key: 'dashboard' | 'amr' | 'amu' | 'amc') => {
    setFormData(prev => ({
      ...prev,
      displayChannels: {
        ...prev.displayChannels,
        [key]: !prev.displayChannels[key],
      }
    }));
  };

  // NEW: select all / clear all helpers
  const selectAllChannels = () => {
    setFormData(prev => ({
      ...prev,
      displayChannels: { dashboard: true, amr: true, amu: true, amc: true }
    }));
  };
  const clearAllChannels = () => {
    setFormData(prev => ({
      ...prev,
      displayChannels: { dashboard: false, amr: false, amu: false, amc: false }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }
    if (!formData.selectedNode) {
      alert('Please select a data node');
      return;
    }
    if (formData.selectedVariables.length === 0) {
      alert('Please select at least one variable');
      return;
    }
    if (formData.subcategory && !formData.sector) {
      alert('Please select a sector when selecting a subcategory');
      return;
    }

    // NEW: require at least one channel selected
    const { dashboard, amr, amu, amc } = formData.displayChannels;
    if (!dashboard && !amr && !amu && !amc) {
      alert('Please choose at least one place to display results (Dashboard, AMR, AMU, or AMC).');
      return;
    }

    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      enabled: true,
      scriptFile: null,
      selectedNode: '',
      selectedVariables: [],
      sector: null,
      subcategory: null,
      displayChannels: {
        dashboard: true,
        amr: false,
        amu: false,
        amc: false,
      }
    });
    setFieldKeys([]);
    setSubcategories([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-6">
          {editData ? 'Edit Indicator' : 'Create New Indicator'}
        </h3>

        {loadingIndicator ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading indicator data...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Indicator Name */}
            <div>
              <label className="block text-sm font-semibold mb-1">Indicator Name *</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold mb-1">Description *</label>
              <textarea
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>

            {/* Sector */}
            <div>
              <label className="block text-sm font-semibold mb-1">Sector</label>
              {loadingSectors ? (
                <div className="text-sm text-gray-500">Loading sectors...</div>
              ) : (
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.sector || ''}
                  onChange={e => setFormData(prev => ({ ...prev, sector: e.target.value || null }))}
                >
                  <option value="">Select a sector (optional)</option>
                  {sectors.map(sector => (
                    <option key={sector.id} value={sector.id}>{sector.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Subcategory */}
            <div>
              <label className="block text-sm font-semibold mb-1">Subcategory</label>
              {loadingSubcategories ? (
                <div className="text-sm text-gray-500">Loading subcategories...</div>
              ) : (
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.subcategory || ''}
                  onChange={e => setFormData(prev => ({ ...prev, subcategory: e.target.value || null }))}
                  disabled={!formData.sector || subcategories.length === 0}
                >
                  <option value="">Select a subcategory (optional)</option>
                  {subcategories.map(subcategory => (
                    <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Node */}
            <div>
              <label className="block text-sm font-semibold mb-1">Select Data Node *</label>
              {loadingNodes ? (
                <div className="text-sm text-gray-500">Loading nodes...</div>
              ) : (
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.selectedNode}
                  onChange={e => setFormData(prev => ({ ...prev, selectedNode: e.target.value }))}
                  required
                >
                  <option value="">Select a node</option>
                  {nodes.map(node => (
                    <option key={node.id} value={node.id}>{node.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Variables */}
            {formData.selectedNode && (
              <div>
                <label className="block text-sm font-semibold mb-1">Select Variables *</label>
                {loadingFieldKeys ? (
                  <div className="text-sm text-gray-500">Loading variables...</div>
                ) : fieldKeys.length > 0 ? (
                  <div className="border border-gray-300 rounded p-3 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {fieldKeys.map((field) => (
                        <div key={field.key} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`var-${field.key}`}
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            checked={formData.selectedVariables?.includes(field.key)}
                            onChange={() => handleVariableToggle(field.key)}
                          />
                          <label
                            htmlFor={`var-${field.key}`}
                            className="text-sm text-gray-900 cursor-pointer flex-1 hover:text-blue-600 transition-colors"
                          >
                            <div className="font-medium">{field.label}</div>
                            <div className="text-xs text-gray-500">
                              {field.formName} {field.type ? `(${field.type})` : ''}
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                    {formData.selectedVariables && formData.selectedVariables.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-600">
                          Selected: {formData.selectedVariables.length} variable(s)
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No variables available for this node</div>
                )}
              </div>
            )}

            {/* Script File */}
            <div>
              <label className="block text-sm font-semibold mb-1">Script File</label>
              <input
                type="file"
                className="block w-full text-sm text-gray-500"
                onChange={(e) => setFormData(prev => ({ ...prev, scriptFile: e.target.files?.[0] || null }))}
                accept=".py,.r,.js,.ts"
              />
              <p className="text-xs text-gray-500 mt-1">Upload Python/R/JS/TS script (optional)</p>
            </div>

            {/* NEW: Display Channels */}
            <div className="border border-gray-200 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold">Display results in *</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllChannels}
                    className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={clearAllChannels}
                    className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.displayChannels.dashboard}
                    onChange={() => toggleChannel('dashboard')}
                  />
                  <span>Dashboard</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.displayChannels.amr}
                    onChange={() => toggleChannel('amr')}
                  />
                  <span>View AMR analytics</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.displayChannels.amu}
                    onChange={() => toggleChannel('amu')}
                  />
                  <span>View AMU analytics</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.displayChannels.amc}
                    onChange={() => toggleChannel('amc')}
                  />
                  <span>View AMC analytics</span>
                </label>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Choose where this indicator’s outputs should appear after execution.
              </p>
            </div>

            {/* Enabled Toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={`w-20 h-8 rounded font-semibold ${formData.enabled ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}
                onClick={() => setFormData(prev => ({ ...prev, enabled: !prev.enabled }))}
              >
                {formData.enabled ? 'Enabled' : 'Disabled'}
              </button>
              <span className="text-gray-500 text-sm">Enable/Disable indicator</span>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-200 text-gray-700"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-blue-600 text-white font-semibold disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (editData ? 'Updating...' : 'Creating...') : (editData ? 'Update Indicator' : 'Create Indicator')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
