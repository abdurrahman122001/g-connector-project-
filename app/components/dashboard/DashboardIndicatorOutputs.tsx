"use client";
import React, { useState, useEffect, useImperativeHandle } from 'react';
import { getDashboardOutputs, DashboardOutput } from '../../services/dataWarehouseApi';
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart
} from 'recharts';
import { FiRefreshCw, FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82CA9D'];

interface DashboardIndicatorOutputsProps {
  className?: string;
  ref?: React.Ref<{ refresh: () => void }>;
}

const DashboardIndicatorOutputs = React.forwardRef<{ refresh: () => void }, DashboardIndicatorOutputsProps>(
  ({ className = '' }, ref) => {
  const [outputs, setOutputs] = useState<DashboardOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardOutputs();
  }, []);

  // Expose refresh function via ref
  useImperativeHandle(ref, () => ({
    refresh: fetchDashboardOutputs
  }));

  const fetchDashboardOutputs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardOutputs();
      
      // Transform the data structure to match our expected format
      const transformedOutputs: DashboardOutput[] = [];
      
      if (data.dashboardOutputs && Array.isArray(data.dashboardOutputs)) {
        data.dashboardOutputs.forEach((indicatorGroup: any) => {
          if (indicatorGroup.outputs && Array.isArray(indicatorGroup.outputs)) {
            indicatorGroup.outputs.forEach((output: any) => {
              // Only include outputs that are visible on dashboard
              if (output.isVisibleOnDashboard) {
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
      console.error('Error fetching dashboard outputs:', err);
      setError(`Failed to load dashboard outputs: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

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

  const renderChart = (output: DashboardOutput) => {
    const { type, data, id } = output;

    // Add safety checks for data
    if (!data) {
      return (
        <div key={`no-data-${id}`} className="text-center p-4 text-gray-500">
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
          <div key={`numeric-${id}`} className="text-center p-4">
            {formatNumericValue(data)}
          </div>
        );

      case 'pie_chart':
        return (
          <ResponsiveContainer key={`pie-${id}`} width="100%" height={200}>
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
                  <Cell key={`cell-${id}-${index}`} fill={data.colors?.[index] || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'donut_chart':
        return (
          <ResponsiveContainer key={`donut-${id}`} width="100%" height={200}>
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
                  <Cell key={`cell-${id}-${index}`} fill={data.colors?.[index] || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'bar_chart':
      case 'column_chart':
        const barData = data.categories?.map((category: string, index: number) => ({
          name: category,
          value: data.values[index],
          color: data.colors?.[index] || '#3b82f6'
        })) || [];
        
        return (
          <div key={`bar-${id}`} className="bg-white p-4 rounded-lg shadow-sm">
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
        return (
          <ResponsiveContainer key={`line-${id}`} width="100%" height={200}>
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
                  key={`line-${id}-${index}`}
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
          <ResponsiveContainer key={`area-${id}`} width="100%" height={200}>
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
                  key={`area-${id}-${index}`}
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
          <ResponsiveContainer key={`stacked-${id}`} width="100%" height={200}>
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
                  key={`stacked-${id}-${index}`}
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
          <ResponsiveContainer key={`radar-${id}`} width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="label" />
              <PolarRadiusAxis />
              <Tooltip />
              <Legend />
              {data.datasets?.map((dataset: any, index: number) => (
                <Radar 
                  key={`radar-${id}-${index}`}
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
          <div key={`map-${id}`} className="p-4">
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
          <div key={`heatmap-${id}`} className="p-4">
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
          <div key={`choropleth-${id}`} className="p-4">
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
        console.log('Unsupported chart type:', type, 'Data:', data);
        
        // Safely stringify data with error handling
        let dataString = 'No data available';
        try {
          if (data !== undefined && data !== null) {
            const stringified = JSON.stringify(data);
            dataString = stringified ? stringified.substring(0, 200) + '...' : 'Empty data';
          }
        } catch (error) {
          dataString = 'Data contains circular references or is not serializable';
        }
        
        return (
          <div key={`unsupported-${id}`} className="text-center p-4 text-gray-500">
            <div className="bg-gray-100 rounded-lg p-4 mb-2">
              <div className="text-lg font-semibold text-gray-700 mb-2">Unsupported Chart Type</div>
              <div className="text-sm text-gray-600 mb-2">Type: "{type}" (length: {type?.length || 0})</div>
              <div className="text-xs text-gray-500">
                Available data: {Object.keys(data || {}).join(', ')}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Raw data: {dataString}
              </div>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className={`bg-white p-6 rounded-xl shadow-md ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <FiRefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading indicator outputs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white p-6 rounded-xl shadow-md ${className}`}>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardOutputs}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
          >
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
          <p className="text-gray-600 text-sm">No dashboard outputs available</p>
          <p className="text-xs text-gray-500 mt-1">Create indicators and set them visible on dashboard to see outputs here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {outputs.map((output, index) => (
          <div key={`dashboard-output-${output.id}-${index}`} className="bg-white rounded-lg shadow-sm border border-gray-200">
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
});

DashboardIndicatorOutputs.displayName = 'DashboardIndicatorOutputs';

export default DashboardIndicatorOutputs;