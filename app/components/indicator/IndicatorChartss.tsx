"use client"
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { getAllIndicators, Indicator, deleteIndicator } from '../../services/dataWarehouseApi';
import { FiRefreshCw, FiPlay, FiPause, FiTrendingUp, FiTrendingDown, FiEdit, FiTrash2, FiDatabase, FiEye } from 'react-icons/fi';
import { toast } from 'react-toastify';
import ConfirmationToastComponent from '../ConfirmationToast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface IndicatorChartsProps {
  className?: string;
  onEditIndicator?: (indicator: Indicator) => void;
  onViewOutput?: (indicator: Indicator) => void;
  onDeleteIndicator?: () => void;
}

export default function IndicatorChartss({ className = '', onEditIndicator, onViewOutput, onDeleteIndicator }: IndicatorChartsProps) {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);
  const [deletingIndicator, setDeletingIndicator] = useState<string | null>(null);

  useEffect(() => {
    fetchIndicators();
  }, []);

  const fetchIndicators = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllIndicators();
      setIndicators(data);
    } catch (err) {
      console.error('Error fetching indicators:', err);
      setError('Failed to load indicators');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIndicator = async (indicatorId: string) => {
    const performDelete = async () => {
      try {
        setDeletingIndicator(indicatorId);
        await deleteIndicator(indicatorId);
        setIndicators(prev => prev.filter(ind => ind.id !== indicatorId));
        
        // Call the callback to refresh dashboard outputs
        if (onDeleteIndicator) {
          onDeleteIndicator();
        }
        
        toast.success('Indicator deleted successfully');
      } catch (err) {
        console.error('Error deleting indicator:', err);
        toast.error('Failed to delete indicator');
      } finally {
        setDeletingIndicator(null);
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

  const handleEditIndicator = (indicator: Indicator) => {
    if (onEditIndicator) {
      onEditIndicator(indicator);
    }
  };

  const getIndicatorStatusData = () => {
    const enabled = indicators.filter(ind => ind.enabled).length;
    const disabled = indicators.filter(ind => !ind.enabled).length;
    return [
      { name: 'Enabled', value: enabled, color: '#00C49F' },
      { name: 'Disabled', value: disabled, color: '#FF8042' }
    ];
  };

  const getExecutionTrendData = () => {
    // Group by month for the last 6 months
    const months: Array<{ month: string; records: number }> = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        records: 0
      });
    }

    // Count records per month (simplified - you might want to use actual execution data)
    indicators.forEach(indicator => {
      if (indicator.dataCounts?.lastAnalyzed) {
        const execDate = new Date(indicator.dataCounts.lastAnalyzed);
        const monthIndex = months.findIndex(m => {
          const monthDate = new Date(execDate.getFullYear(), execDate.getMonth(), 1);
          return monthDate.getMonth() === execDate.getMonth() && 
                 monthDate.getFullYear() === execDate.getFullYear();
        });
        if (monthIndex !== -1) {
          months[monthIndex].records += indicator.dataCounts?.totalRecords || 0;
        }
      }
    });

    return months;
  };

  const getFormUsageData = () => {
    const formCounts: { [key: string]: number } = {};
    indicators.forEach(indicator => {
      if (indicator.selectedVariables && Array.isArray(indicator.selectedVariables)) {
        indicator.selectedVariables.forEach(variable => {
          const formName = variable.formName || 'Unknown Form';
          formCounts[formName] = (formCounts[formName] || 0) + 1;
        });
      }
    });

    return Object.entries(formCounts).map(([form, count]) => ({
      name: form,
      count: count
    })).sort((a, b) => b.count - a.count).slice(0, 5);
  };

  const getVariableTypeData = () => {
    const typeCounts: { [key: string]: number } = {};
    indicators.forEach(indicator => {
      if (indicator.selectedVariables && Array.isArray(indicator.selectedVariables)) {
        indicator.selectedVariables.forEach(variable => {
          const type = variable.type || 'unknown';
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
      }
    });

    return Object.entries(typeCounts).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      count: count
    })).sort((a, b) => b.count - a.count);
  };

  const getPerformanceData = () => {
    return indicators.map(indicator => ({
      name: indicator.name,
      records: indicator.dataCounts?.totalRecords || 0,
      variables: indicator.selectedVariables?.length || 0,
      enabled: indicator.enabled ? 1 : 0
    })).sort((a, b) => b.records - a.records).slice(0, 10);
  };

  const getRecordsData = () => {
    return indicators
      .filter(indicator => indicator.dataCounts?.totalRecords > 0)
      .map(indicator => ({
        name: indicator.name,
        records: indicator.dataCounts?.totalRecords || 0,
        forms: indicator.dataCounts?.totalForms || 0
      }))
      .sort((a, b) => b.records - a.records)
      .slice(0, 8);
  };

  if (loading) {
    return (
      <div className={`bg-white p-6 rounded-xl shadow-md ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading indicator data...</p>
            <p className="text-xs text-gray-400 mt-2">Debug: Loading state active</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white p-6 rounded-xl shadow-md ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <div className="text-sm text-gray-500 mb-4">
              <p>API Error Details:</p>
              <p>Endpoint: {process.env.NEXT_PUBLIC_API_URL}/api/data-warehouse/indicators</p>
              <p>Check browser console for more details</p>
            </div>
            <button 
              onClick={fetchIndicators}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (indicators.length === 0) {
    return (
      <div className={`bg-white p-6 rounded-xl shadow-md ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-600 mb-4">No indicators found</p>
            <p className="text-sm text-gray-500 mb-4">Create your first indicator to see analytics here</p>
            <div className="text-xs text-gray-400">
              <p>API Response: {indicators.length} indicators</p>
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
        <h2 className="text-2xl font-bold text-gray-800">Indicator Analytics</h2>
        <button 
          onClick={fetchIndicators}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
        >
          <FiRefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Indicators</p>
              <p className="text-2xl font-bold">{indicators.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Indicators</p>
              <p className="text-2xl font-bold">{indicators.filter(ind => ind.enabled).length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiPlay className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="text-2xl font-bold">
                {indicators.reduce((sum, ind) => sum + (ind.dataCounts?.totalRecords || 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FiDatabase className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div> */}

        {/* <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Executions</p>
              <p className="text-2xl font-bold">
                {indicators.reduce((sum, ind) => sum + (ind.executionCount || 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div> */}

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Variables</p>
              <p className="text-2xl font-bold">
                {indicators.reduce((sum, ind) => sum + (ind.selectedVariables?.length || 0), 0)}
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
        {/* Indicator Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Indicator Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={getIndicatorStatusData()} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={80} 
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {getIndicatorStatusData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Records Trend */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Records Trend (Last 6 Months)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getExecutionTrendData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="records" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                />
              </AreaChart>
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
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Variable Types */}
        {/* <div className="bg-white p-6 rounded-xl shadow-md">
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
        </div> */}

        {/* Records Distribution */}
        {/* <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Records by Indicator</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getRecordsData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="records" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div> */}
      </div>
    </div>
  );
} 