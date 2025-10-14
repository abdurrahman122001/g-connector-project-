"use client"
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { getDataNodes, DataNode, deleteDataNode } from '../../services/dataWarehouseApi';
import { FiRefreshCw, FiPlay, FiPause, FiTrendingUp, FiTrendingDown, FiEdit, FiTrash2, FiDatabase, FiEye, FiServer } from 'react-icons/fi';
import { toast } from 'react-toastify';
import ConfirmationToastComponent from '../ConfirmationToast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface NodeChartsProps {
  className?: string;
  onEditNode?: (node: DataNode) => void;
  onViewNode?: (node: DataNode) => void;
  onDeleteNode?: () => void;
}

export default function NodeChart({ className = '', onEditNode, onViewNode, onDeleteNode }: NodeChartsProps) {
  const [nodes, setNodes] = useState<DataNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [deletingNode, setDeletingNode] = useState<string | null>(null);

  useEffect(() => {
    fetchNodes();
  }, []);

  const fetchNodes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDataNodes();
      setNodes(data);
    } catch (err) {
      console.error('Error fetching nodes:', err);
      setError('Failed to load nodes');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    const performDelete = async () => {
      try {
        setDeletingNode(nodeId);
        await deleteDataNode(nodeId);
        setNodes(prev => prev.filter(node => node.id !== nodeId));
        
        // Call the callback to refresh dashboard outputs
        if (onDeleteNode) {
          onDeleteNode();
        }
        
        toast.success('Node deleted successfully');
      } catch (err) {
        console.error('Error deleting node:', err);
        toast.error('Failed to delete node');
      } finally {
        setDeletingNode(null);
      }
    };

    toast(
      <ConfirmationToastComponent
        onConfirm={performDelete}
      />,
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
        className: 'bg-white shadow-xl rounded-lg border border-gray-300 p-0',
        style: { width: '420px' },
      }
    );
  };

  const handleEditNode = (node: DataNode) => {
    if (onEditNode) {
      onEditNode(node);
    }
  };

  const handleViewNode = (node: DataNode) => {
    if (onViewNode) {
      onViewNode(node);
    }
  };

  const getNodeStatusData = () => {
    const active = nodes.filter(node => node.status === 'active').length;
    const inactive = nodes.filter(node => node.status === 'inactive').length;
    const pending = nodes.filter(node => node.status === 'pending').length;
    return [
      { name: 'Active', value: active, color: '#00C49F' },
      { name: 'Inactive', value: inactive, color: '#FF8042' },
      { name: 'Pending', value: pending, color: '#FFBB28' }
    ];
  };

  const getNodeVariableDistribution = () => {
    const variableCounts = nodes.reduce((acc, node) => {
      const count = node.variables?.length || 0;
      acc[count] = (acc[count] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Object.entries(variableCounts).map(([count, nodes]) => ({
      name: `${count} Variables`,
      value: nodes,
      count: parseInt(count)
    })).sort((a, b) => a.count - b.count);
  };

  const getFormUsageData = () => {
    const formUsage = nodes.reduce((acc, node) => {
      node.linkedForms?.forEach(formId => {
        acc[formId] = (acc[formId] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(formUsage).map(([formId, count]) => ({
      name: `Form ${formId}`,
      count
    })).sort((a, b) => b.count - a.count).slice(0, 5);
  };

  const getNodeCreationTrend = () => {
    const monthlyData = nodes.reduce((acc, node) => {
      const date = new Date(node.created);
      const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthlyData).map(([month, count]) => ({
      month,
      count
    })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  };

  const getVariableTypeData = () => {
    const typeCounts = nodes.reduce((acc, node) => {
      node.variables?.forEach(variable => {
        // Count by form type or variable type
        const type = variable.form || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCounts).map(([type, count]) => ({
      name: type,
      count
    })).sort((a, b) => b.count - a.count).slice(0, 5);
  };

  const getNodePerformanceData = () => {
    return nodes.map(node => ({
      name: node.name,
      variables: node.variables?.length || 0,
      forms: node.linkedForms?.length || 0,
      status: node.status
    })).sort((a, b) => b.variables - a.variables).slice(0, 10);
  };

  if (error) {
    return (
      <div className={`bg-white p-6 rounded-xl shadow-md ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <div className="text-sm text-gray-500 mb-4">
              <p>API Error Details:</p>
              <p>Endpoint: {process.env.NEXT_PUBLIC_API_URL}/api/data-warehouse/nodes</p>
              <p>Check browser console for more details</p>
            </div>
            <button 
              onClick={fetchNodes}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className={`bg-white p-6 rounded-xl shadow-md ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-600 mb-4">No data nodes found</p>
            <p className="text-sm text-gray-500 mb-4">Create your first data node to see analytics here</p>
            <div className="text-xs text-gray-400">
              <p>API Response: {nodes.length} nodes</p>
              <p>Loading state: {loading ? 'Loading' : 'Not loading'}</p>
              <p>Error state: {error ? 'Has error' : 'No error'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Node Analytics</h2>
        <button 
          onClick={fetchNodes}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
        >
          <FiRefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Nodes</p>
              <p className="text-2xl font-bold">{nodes.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiServer className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Nodes</p>
              <p className="text-2xl font-bold">{nodes.filter(node => node.status === 'active').length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiPlay className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Variables</p>
              <p className="text-2xl font-bold">
                {nodes.reduce((sum, node) => sum + (node.variables?.length || 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FiDatabase className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Forms</p>
              <p className="text-2xl font-bold">
                {nodes.reduce((sum, node) => sum + (node.linkedForms?.length || 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Variables/Node</p>
              <p className="text-2xl font-bold">
                {nodes.length > 0 
                  ? (nodes.reduce((sum, node) => sum + (node.variables?.length || 0), 0) / nodes.length).toFixed(1)
                  : '0'
                }
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FiTrendingDown className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Node Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Node Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={getNodeStatusData()} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={80} 
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {getNodeStatusData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Node Creation Trend */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Node Creation Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getNodeCreationTrend()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Variable Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Variable Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getNodeVariableDistribution()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Form Usage */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Most Used Forms</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getFormUsageData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Variable Types */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Variable Types Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={getVariableTypeData()} 
                  dataKey="count" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={80} 
                  label={({ name, count }) => `${name}: ${count}`}
                >
                  {getVariableTypeData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Node Performance */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Top Nodes by Variables</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getNodePerformanceData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="variables" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Nodes Table */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Nodes</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variables
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Forms
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {nodes.slice(0, 5).map((node) => (
                <tr key={node.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{node.name}</div>
                      <div className="text-sm text-gray-500">{node.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {node.variables?.length || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {node.linkedForms?.length || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      node.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : node.status === 'inactive'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {node.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {node.created 
                      ? new Date(node.created).toLocaleDateString()
                      : 'Unknown'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {onViewNode && (
                        <button
                          onClick={() => handleViewNode(node)}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="View node"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEditNode(node)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="Edit node"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNode(node.id)}
                        disabled={deletingNode === node.id}
                        className="text-red-600 hover:text-red-900 p-1 rounded disabled:opacity-50"
                        title="Delete node"
                      >
                        {deletingNode === node.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <FiTrash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
