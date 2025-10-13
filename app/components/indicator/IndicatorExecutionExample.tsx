import React, { useState } from 'react';
import { executeIndicatorScript, IndicatorConfig } from '../../services/dataWarehouseApi';

interface IndicatorExecutionExampleProps {
  indicatorId: string;
}

export default function IndicatorExecutionExample({ indicatorId }: IndicatorExecutionExampleProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Default configuration
  const [config, setConfig] = useState<IndicatorConfig>({
    data_limits: {
      submissions: 1000,
      data_nodes: 200,
      transmission_logs: 500,
      forms: 75,
      users: 50
    },
    processing: {
      max_records_per_source: 2000,
      include_metadata: true,
      data_quality_threshold: 85,
      enable_data_validation: true,
      timeout_seconds: 45
    },
    output: {
      max_outputs: 8,
      include_charts: true,
      include_tables: true,
      include_summary: true,
      chart_colors: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"]
    }
  });

  const handleExecute = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await executeIndicatorScript(indicatorId, config);
      setResult(response);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (section: keyof IndicatorConfig, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Indicator Execution Configuration
      </h3>
      
      {/* Configuration Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Data Limits */}
        <div>
          <h4 className="font-medium text-gray-700 mb-3">Data Limits</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Submissions</label>
              <input
                type="number"
                min="1"
                max="10000"
                value={config.data_limits?.submissions || 1000}
                onChange={(e) => updateConfig('data_limits', 'submissions', parseInt(e.target.value) || 1000)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Data Nodes</label>
              <input
                type="number"
                min="1"
                max="500"
                value={config.data_limits?.data_nodes || 200}
                onChange={(e) => updateConfig('data_limits', 'data_nodes', parseInt(e.target.value) || 200)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Transmission Logs</label>
              <input
                type="number"
                min="1"
                max="1000"
                value={config.data_limits?.transmission_logs || 500}
                onChange={(e) => updateConfig('data_limits', 'transmission_logs', parseInt(e.target.value) || 500)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        </div>

        {/* Processing Options */}
        <div>
          <h4 className="font-medium text-gray-700 mb-3">Processing</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Quality Threshold (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={config.processing?.data_quality_threshold || 85}
                onChange={(e) => updateConfig('processing', 'data_quality_threshold', parseInt(e.target.value) || 85)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Timeout (seconds)</label>
              <input
                type="number"
                min="10"
                max="300"
                value={config.processing?.timeout_seconds || 45}
                onChange={(e) => updateConfig('processing', 'timeout_seconds', parseInt(e.target.value) || 45)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.processing?.include_metadata || true}
                  onChange={(e) => updateConfig('processing', 'include_metadata', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">Include Metadata</span>
              </label>
            </div>
          </div>
        </div>

        {/* Output Options */}
        <div>
          <h4 className="font-medium text-gray-700 mb-3">Output</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Max Outputs</label>
              <input
                type="number"
                min="1"
                max="20"
                value={config.output?.max_outputs || 8}
                onChange={(e) => updateConfig('output', 'max_outputs', parseInt(e.target.value) || 8)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.output?.include_charts || true}
                  onChange={(e) => updateConfig('output', 'include_charts', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">Include Charts</span>
              </label>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.output?.include_tables || true}
                  onChange={(e) => updateConfig('output', 'include_tables', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">Include Tables</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Execute Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={handleExecute}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Executing...' : 'Execute Indicator'}
        </button>
      </div>

      {/* Results */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h4 className="text-red-800 font-medium mb-2">Execution Error</h4>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-green-800 font-medium mb-2">Execution Results</h4>
          <div className="text-sm text-green-700 space-y-1">
            <p><strong>Status:</strong> {result.status}</p>
            <p><strong>Execution Time:</strong> {result.executionTime}</p>
            <p><strong>Outputs Generated:</strong> {result.outputs?.length || 0}</p>
            <p><strong>Executed At:</strong> {new Date(result.executedAt).toLocaleString()}</p>
          </div>
          
          {result.outputs && result.outputs.length > 0 && (
            <div className="mt-4">
              <h5 className="text-green-800 font-medium mb-2">Generated Outputs:</h5>
              <div className="space-y-2">
                {result.outputs.map((output: any, index: number) => (
                  <div key={index} className="text-sm text-green-700 bg-green-100 p-2 rounded">
                    <strong>{output.name}</strong> ({output.type})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Configuration JSON Preview */}
      <div className="mt-6">
        <h4 className="font-medium text-gray-700 mb-2">Configuration Preview</h4>
        <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
          {JSON.stringify({ parameters: config }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
