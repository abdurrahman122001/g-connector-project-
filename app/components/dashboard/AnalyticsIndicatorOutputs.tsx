"use client"
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { getAnalyticsOutputs, IndicatorOutput } from '../../services/dataWarehouseApi';
import { FiTrendingUp, FiTrendingDown, FiMinus, FiRefreshCw } from 'react-icons/fi';

interface AnalyticsIndicatorOutputsProps {
  className?: string;
  ref?: React.Ref<{ refresh: () => void }>;
}

interface AnalyticsOutput {
  id: string;
  name: string;
  type: string;
  description: string;
  data: any;
  indicatorName: string;
  lastUpdated: string;
}

const AnalyticsIndicatorOutputs = forwardRef<{ refresh: () => void }, AnalyticsIndicatorOutputsProps>(
  ({ className = '' }, ref) => {
    const [outputs, setOutputs] = useState<AnalyticsOutput[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalyticsOutputs = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAnalyticsOutputs();
        
        // Transform the data structure to match our expected format
        const transformedOutputs: AnalyticsOutput[] = [];
        
        if (data.analyticsOutputs && Array.isArray(data.analyticsOutputs)) {
          data.analyticsOutputs.forEach((indicatorGroup: any) => {
            if (indicatorGroup.outputs && Array.isArray(indicatorGroup.outputs)) {
              indicatorGroup.outputs.forEach((output: any) => {
                // Only include outputs that are visible on analytics
                if (output.isVisibleOnAnalytics) {
                  transformedOutputs.push({
                    id: output.id,
                    name: output.name,
                    type: output.type,
                    description: output.description,
                    data: output.data,
                    indicatorName: indicatorGroup.indicatorName,
                    lastUpdated: output.lastUpdated
                  });
                }
              });
            }
          });
        }
        
        setOutputs(transformedOutputs);
      } catch (err) {
        console.error('Error fetching analytics outputs:', err);
        setError(`Failed to load analytics outputs: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchAnalyticsOutputs();
    }, []);

    useImperativeHandle(ref, () => ({
      refresh: fetchAnalyticsOutputs
    }));

    const formatNumericValue = (data: any) => {
      const { value, unit, format, precision = 0, trendDirection } = data;
      
      let formattedValue = value;
      if (format === 'percentage') {
        formattedValue = `${value.toFixed(precision)}%`;
      } else if (format === 'number') {
        formattedValue = value.toFixed(precision);
      } else if (format === 'ratio') {
        formattedValue = value.toFixed(precision);
      }

      const trendIcon = trendDirection === 'up' ? <FiTrendingUp className="text-green-500" /> :
                       trendDirection === 'down' ? <FiTrendingDown className="text-red-500" /> :
                       <FiMinus className="text-gray-500" />;

      return (
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-800 mb-2">
            {formattedValue}
            {unit && <span className="text-lg text-gray-600 ml-1">{unit}</span>}
          </div>
          {trendDirection && (
            <div className="flex items-center justify-center gap-1">
              {trendIcon}
              <span className="text-sm text-gray-600">vs previous period</span>
            </div>
          )}
        </div>
      );
    };

    const renderChart = (output: AnalyticsOutput) => {
      const { type, data } = output;

      // Add safety checks for data
      if (!data) {
        return (
          <div className="text-center p-4 text-gray-500">
            <div className="bg-gray-100 rounded-lg p-4 mb-2">
              <div className="text-lg font-semibold text-gray-700 mb-2">No Data Available</div>
              <div className="text-sm text-gray-600">Chart type: {type}</div>
            </div>
          </div>
        );
      }

      switch (type) {
        case 'numeric_value':
          return (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              {formatNumericValue(data)}
            </div>
          );

        case 'pie_chart':
        case 'donut_chart':
          const pieData = data.labels?.map((label: string, index: number) => ({
            name: label,
            value: data.values[index],
            color: data.colors?.[index] || `#${Math.floor(Math.random()*16777215).toString(16)}`
          })) || [];
          
          return (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="text-sm font-medium text-gray-700 mb-2">{output.name}</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={type === 'donut_chart' ? 40 : 0}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          );

        case 'bar_chart':
        case 'column_chart':
          const barData = data.categories?.map((category: string, index: number) => ({
            name: category,
            value: data.values[index],
            color: data.colors?.[index] || '#3b82f6'
          })) || [];
          
          return (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="text-sm font-medium text-gray-700 mb-2">{output.name}</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          );

        case 'line_chart':
          const lineData = data.categories?.map((category: string, index: number) => ({
            name: category,
            value: data.values[index]
          })) || [];
          
          return (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="text-sm font-medium text-gray-700 mb-2">{output.name}</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );

        case 'area_chart':
          const areaData = data.categories?.map((category: string, index: number) => ({
            name: category,
            value: data.values[index]
          })) || [];
          
          return (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="text-sm font-medium text-gray-700 mb-2">{output.name}</h4>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={areaData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          );

        case 'stacked_bar_chart':
          const stackedData = data.categories?.map((category: string, index: number) => ({
            name: category,
            ...data.series?.reduce((acc: any, series: any, seriesIndex: number) => {
              acc[series.name] = series.values[index];
              return acc;
            }, {})
          })) || [];
          
          return (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="text-sm font-medium text-gray-700 mb-2">{output.name}</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stackedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {data.series?.map((series: any, index: number) => (
                    <Bar key={series.name} dataKey={series.name} stackId="a" fill={series.color || `#${Math.floor(Math.random()*16777215).toString(16)}`} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          );

        case 'radar_chart':
          const radarData = data.categories?.map((category: string, index: number) => ({
            subject: category,
            value: data.values[index]
          })) || [];
          
          return (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="text-sm font-medium text-gray-700 mb-2">{output.name}</h4>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis />
                  <Radar name={output.name} dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          );

        case 'map_chart':
        case 'heatmap_chart':
        case 'choropleth_chart':
        case 'scatter_chart':
        case 'scatter_plot':
        case 'bubble_chart':
        case 'funnel_chart':
          return (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="text-sm font-medium text-gray-700 mb-2">{output.name}</h4>
              <div className="text-center p-4 text-gray-500">
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="text-lg font-semibold text-gray-700 mb-2">Chart Type: {type}</div>
                  <div className="text-sm text-gray-600">This chart type is not yet implemented</div>
                </div>
              </div>
            </div>
          );

        default:
          return (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="text-sm font-medium text-gray-700 mb-2">{output.name}</h4>
              <div className="text-center p-4 text-gray-500">
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="text-lg font-semibold text-gray-700 mb-2">Unsupported Chart Type</div>
                  <div className="text-sm text-gray-600">Chart type: {type}</div>
                </div>
              </div>
            </div>
          );
      }
    };

    if (loading) {
      return (
        <div className={`${className}`}>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Loading analytics outputs...</p>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className={`${className}`}>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{error}</p>
            <button 
              onClick={fetchAnalyticsOutputs}
              className="mt-2 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
            >
              <FiRefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (outputs.length === 0) {
      return (
        <div className={`${className}`}>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-gray-600 text-sm">No analytics outputs available</p>
            <p className="text-xs text-gray-500 mt-1">Create indicators and set them visible on analytics to see outputs here</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {outputs.map((output) => (
            <div key={output.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-3 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-900">{output.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{output.description}</p>
                <p className="text-xs text-gray-400 mt-1">From: {output.indicatorName}</p>
              </div>
              <div className="p-3">
                {renderChart(output)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

AnalyticsIndicatorOutputs.displayName = 'AnalyticsIndicatorOutputs';

export default AnalyticsIndicatorOutputs; 