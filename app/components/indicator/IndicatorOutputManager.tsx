"use client"
import React, { useState, useEffect } from 'react';
import { 
  getIndicatorOutputs, 
  updateIndicatorOutputVisibility, 
  executeIndicatorScript,
  IndicatorOutput,
  IndicatorConfig
} from '../../services/dataWarehouseApi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FiEye, 
  FiEyeOff, 
  FiPlay, 
  FiRefreshCw, 
  FiSettings, 
  FiX,
  FiCheck,
  FiAlertCircle,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus
} from 'react-icons/fi';
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart
} from 'recharts';

interface IndicatorOutputManagerProps {
  indicatorId: string;
  indicatorName: string;
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function IndicatorOutputManager({ 
  indicatorId, 
  indicatorName, 
  isOpen, 
  onClose 
}: IndicatorOutputManagerProps) {
  const [outputs, setOutputs] = useState<IndicatorOutput[]>([]);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastExecuted, setLastExecuted] = useState<string | null>(null);
  const [executionStatus, setExecutionStatus] = useState<string>('pending');
  const [showConfig, setShowConfig] = useState(false);
  const [executionConfig, setExecutionConfig] = useState<IndicatorConfig>({
    data_limits: {
      submissions: 1000,
      data_nodes: 200
    },
    processing: {
      data_quality_threshold: 90,
      enable_data_validation: true
    },
    output: {
      max_outputs: 10,
      include_charts: true,
      include_tables: true
    }
  });

  useEffect(() => {
    if (isOpen && indicatorId) {
      fetchOutputs();
    }
  }, [isOpen, indicatorId]);

  const fetchOutputs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getIndicatorOutputs(indicatorId);
      setOutputs(data.scriptOutputs);
      setLastExecuted(data.lastExecuted);
      setExecutionStatus(data.executionStatus);
    } catch (err) {
      setError('Failed to load indicator outputs');
      console.error('Error fetching outputs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteScript = async () => {
    try {
      setExecuting(true);
      setError(null);
      
      // Execute with default configuration
      await executeIndicatorScript(indicatorId, executionConfig);
      
      await fetchOutputs(); // Refresh outputs after execution
    } catch (err) {
      setError('Failed to execute indicator script');
      console.error('Error executing script:', err);
    } finally {
      setExecuting(false);
    }
  };

  const handleToggleVisibility = (outputId: string, type: 'dashboard' | 'analytics') => {
    setOutputs(prev => prev.map(output => {
      if (output.id === outputId) {
        return {
          ...output,
          [type === 'dashboard' ? 'isVisibleOnDashboard' : 'isVisibleOnAnalytics']: 
            !output[type === 'dashboard' ? 'isVisibleOnDashboard' : 'isVisibleOnAnalytics']
        };
      }
      return output;
    }));
  };

  const handleSaveVisibility = async () => {
    try {
      setSaving(true);
      setError(null);
      const visibilityData = outputs.map(output => ({
        id: output.id,
        isVisibleOnDashboard: output.isVisibleOnDashboard,
        isVisibleOnAnalytics: output.isVisibleOnAnalytics,
        order: output.order
      }));
      
      await updateIndicatorOutputVisibility(indicatorId, visibilityData);
      toast.success('Visibility settings saved successfully');
    } catch (err) {
      setError('Failed to save visibility settings');
      toast.error('Failed to save visibility settings');
      console.error('Error saving visibility:', err);
    } finally {
      setSaving(false);
    }
  };

  const renderTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <FiTrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <FiTrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <FiMinus className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatNumericValue = (data: any) => {
    const { value, unit, format, precision, trendDirection, previousValue, currentValue } = data;
    
    let formattedValue = value;
    if (precision !== undefined) {
      formattedValue = Number(value).toFixed(precision);
    }

    switch (format) {
      case 'percentage':
        return `${formattedValue}%`;
      case 'ratio':
        return formattedValue;
      case 'trend':
        return (
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{formattedValue}%</span>
            {renderTrendIcon(trendDirection)}
            {previousValue !== undefined && currentValue !== undefined && (
              <div className="text-xs text-gray-500">
                {previousValue} → {currentValue}
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1">
            <span className="text-3xl font-bold">{formattedValue}</span>
            {unit && <span className="text-lg text-gray-600">{unit}</span>}
          </div>
        );
    }
  };

  const renderChart = (output: IndicatorOutput) => {
    const { type, data } = output;

    switch (type) {
      case 'numeric_value':
        return (
          <div className="text-center p-4">
            {formatNumericValue(data)}
          </div>
        );

      case 'pie_chart':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.labels?.map((label: string, index: number) => ({
                  name: label,
                  value: data.values[index],
                  color: data.colors?.[index] || COLORS[index % COLORS.length]
                }))}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={60}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {data.labels?.map((_: string, index: number) => (
                  <Cell key={`cell-${index}`} fill={data.colors?.[index] || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'donut_chart':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.labels?.map((label: string, index: number) => ({
                  name: label,
                  value: data.values[index],
                  color: data.colors?.[index] || COLORS[index % COLORS.length]
                }))}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={60}
                innerRadius={data.innerRadius || 30}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {data.labels?.map((_: string, index: number) => (
                  <Cell key={`cell-${index}`} fill={data.colors?.[index] || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'bar_chart':
        const chartData = data.categories?.map((cat: string, index: number) => ({
          category: cat,
          value: data.values[index]
        }));
        
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} layout={data.orientation === 'horizontal' ? 'horizontal' : 'vertical'}>
              <CartesianGrid strokeDasharray="3 3" />
              {data.orientation === 'horizontal' ? (
                <>
                  <XAxis type="number" />
                  <YAxis dataKey="category" type="category" />
                </>
              ) : (
                <>
                  <XAxis dataKey="category" />
                  <YAxis />
                </>
              )}
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'column_chart':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.categories?.map((cat: string, index: number) => ({
              category: cat,
              value: data.values[index]
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line_chart':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.labels?.map((label: string, index: number) => ({
              label,
              ...data.datasets?.reduce((acc: any, dataset: any, datasetIndex: number) => {
                acc[`value${datasetIndex}`] = dataset.data?.[index] || 0;
                return acc;
              }, {})
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              {data.datasets?.map((dataset: any, index: number) => (
                <Line 
                  key={index}
                  type="monotone" 
                  dataKey={`value${index}`} 
                  stroke={dataset.borderColor || COLORS[index % COLORS.length]}
                  fill={dataset.backgroundColor}
                  name={dataset.label}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area_chart':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.labels?.map((label: string, index: number) => ({
              label,
              ...data.datasets?.reduce((acc: any, dataset: any, datasetIndex: number) => {
                acc[`value${datasetIndex}`] = dataset.data?.[index] || 0;
                return acc;
              }, {})
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              {data.datasets?.map((dataset: any, index: number) => (
                <Area 
                  key={index}
                  type="monotone" 
                  dataKey={`value${index}`} 
                  stroke={dataset.borderColor || COLORS[index % COLORS.length]}
                  fill={dataset.backgroundColor || `rgba(0, 136, 254, 0.3)`}
                  name={dataset.label}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'stacked_bar_chart':
        const stackedData = data.categories?.map((cat: string, index: number) => {
          const item: any = { category: cat };
          data.datasets?.forEach((dataset: any, datasetIndex: number) => {
            item[dataset.label] = dataset.data?.[index] || 0;
          });
          return item;
        });

        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stackedData} layout={data.orientation === 'horizontal' ? 'horizontal' : 'vertical'}>
              <CartesianGrid strokeDasharray="3 3" />
              {data.orientation === 'horizontal' ? (
                <>
                  <XAxis type="number" />
                  <YAxis dataKey="category" type="category" />
                </>
              ) : (
                <>
                  <XAxis dataKey="category" />
                  <YAxis />
                </>
              )}
              <Tooltip />
              <Legend />
              {data.datasets?.map((dataset: any, index: number) => (
                <Bar 
                  key={index}
                  dataKey={dataset.label} 
                  stackId="a" 
                  fill={dataset.backgroundColor || COLORS[index % COLORS.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'radar_chart':
        const radarData = data.labels?.map((label: string, index: number) => {
          const item: any = { label };
          data.datasets?.forEach((dataset: any, datasetIndex: number) => {
            item[dataset.label] = dataset.data?.[index] || 0;
          });
          return item;
        });

        return (
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="label" />
              <PolarRadiusAxis />
              <Tooltip />
              <Legend />
              {data.datasets?.map((dataset: any, index: number) => (
                <Radar 
                  key={index}
                  name={dataset.label}
                  dataKey={dataset.label}
                  stroke={dataset.borderColor || COLORS[index % COLORS.length]}
                  fill={dataset.backgroundColor || `rgba(0, 136, 254, 0.2)`}
                  fillOpacity={0.6}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        );

      case 'map_chart':
        return (
          <div className="p-4">
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <div className="text-gray-600 mb-2">🗺️ Map Visualization</div>
              <div className="text-sm text-gray-500">
                {data.points?.length || 0} location(s) mapped
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Center: {data.center?.[0]?.toFixed(4)}, {data.center?.[1]?.toFixed(4)}
              </div>
            </div>
          </div>
        );

      case 'heatmap_chart':
        return (
          <div className="p-4">
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <div className="text-gray-600 mb-2">🔥 Heatmap Visualization</div>
              <div className="text-sm text-gray-500">
                {data.points?.length || 0} data points
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Intensity range: {Math.min(...(data.intensities || [0]))} - {Math.max(...(data.intensities || [0]))}
              </div>
            </div>
          </div>
        );

      case 'choropleth_chart':
        return (
          <div className="p-4">
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <div className="text-gray-600 mb-2">🎨 Choropleth Map</div>
              <div className="text-sm text-gray-500">
                {data.regions?.length || 0} regions
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Value range: {data.minValue} - {data.maxValue}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center p-4 text-gray-500">
            <FiAlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>Unsupported chart type: {type}</p>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Output Management</h2>
            <p className="text-gray-600 mt-1">{indicatorName}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Configuration Button */}
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm"
            >
              <FiSettings className="w-4 h-4" />
              Configuration
            </button>
            <button
              onClick={handleExecuteScript}
              disabled={executing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
            >
              {executing ? (
                <FiRefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FiPlay className="w-4 h-4" />
              )}
              {executing ? 'Executing...' : 'Execute Script'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Configuration Panel */}
        {showConfig && (
          <div className="bg-gray-50 border-b border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Data Limits */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Data Limits</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm text-gray-600">Submissions</label>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      defaultValue="1000"
                      className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                      onChange={(e) => setExecutionConfig(prev => ({
                        ...prev,
                        data_limits: { ...prev.data_limits, submissions: parseInt(e.target.value) || 1000 }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Data Nodes</label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      defaultValue="200"
                      className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                      onChange={(e) => setExecutionConfig(prev => ({
                        ...prev,
                        data_limits: { ...prev.data_limits, data_nodes: parseInt(e.target.value) || 200 }
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Processing Options */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Processing</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm text-gray-600">Quality Threshold (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      defaultValue="90"
                      className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                      onChange={(e) => setExecutionConfig(prev => ({
                        ...prev,
                        processing: { ...prev.processing, data_quality_threshold: parseInt(e.target.value) || 90 }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Max Outputs</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      defaultValue="10"
                      className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                      onChange={(e) => setExecutionConfig(prev => ({
                        ...prev,
                        output: { ...prev.output, max_outputs: parseInt(e.target.value) || 10 }
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Output Options */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Output Options</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="mr-2"
                      onChange={(e) => setExecutionConfig(prev => ({
                        ...prev,
                        output: { ...prev.output, include_charts: e.target.checked }
                      }))}
                    />
                    <span className="text-sm text-gray-600">Include Charts</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="mr-2"
                      onChange={(e) => setExecutionConfig(prev => ({
                        ...prev,
                        output: { ...prev.output, include_tables: e.target.checked }
                      }))}
                    />
                    <span className="text-sm text-gray-600">Include Tables</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FiRefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading outputs...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchOutputs}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Retry
              </button>
            </div>
          ) : outputs.length === 0 ? (
            <div className="text-center py-12">
              <FiAlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No outputs found</p>
              <p className="text-sm text-gray-500">Execute the script to generate outputs</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Last Executed</p>
                    <p className="font-medium">
                      {lastExecuted ? new Date(lastExecuted).toLocaleString() : 'Never'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      executionStatus === 'success' 
                        ? 'bg-green-100 text-green-800'
                        : executionStatus === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {executionStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Outputs Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {outputs.map((output) => (
                  <div key={output.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    {/* Output Header */}
                    <div className="flex justify-between items-center p-4 border-b border-gray-200">
                      <div>
                        <h3 className="font-semibold text-gray-900">{output.name}</h3>
                        <p className="text-sm text-gray-600">{output.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Dashboard Visibility Toggle */}
                        <button
                          onClick={() => handleToggleVisibility(output.id, 'dashboard')}
                          className={`p-2 rounded-md transition-colors ${
                            output.isVisibleOnDashboard
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                          title={output.isVisibleOnDashboard ? 'Hide from Dashboard' : 'Show on Dashboard'}
                        >
                          {output.isVisibleOnDashboard ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
                        </button>
                        
                        {/* Analytics Visibility Toggle */}
                        <button
                          onClick={() => handleToggleVisibility(output.id, 'analytics')}
                          className={`p-2 rounded-md transition-colors ${
                            output.isVisibleOnAnalytics
                              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                          title={output.isVisibleOnAnalytics ? 'Hide from Analytics' : 'Show on Analytics'}
                        >
                          {output.isVisibleOnAnalytics ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Chart/Output Display */}
                    <div className="p-4">
                      {renderChart(output)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={handleSaveVisibility}
                  disabled={saving}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md text-sm disabled:opacity-50"
                >
                  {saving ? (
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FiCheck className="w-4 h-4" />
                  )}
                  {saving ? 'Saving...' : 'Save Visibility Settings'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Toast Container */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
} 