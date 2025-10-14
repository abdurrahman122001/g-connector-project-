// src/pages/Warehouse.js
'use client'
import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import StatusItem from "../components/gconector/statusItem"
import MetricCard from '../components/gconector/metricbard';
import { useRouter } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';

const Warehouse = () => {
  const router = useRouter();

  const [stats, setStats] = useState({
    totalConnections: 0,
    successfulConnections: 0,
    failedConnections: 0,
    totalTransmissions: 0,
    dataVolume: 0, // in MB
    // recentConnections: [
    //   { id: 1, name: 'API 1', type: 'REST', status: 'success', timestamp: '2023-05-15 14:30' },
    //   { id: 2, name: 'DB Connection', type: 'MySQL', status: 'success', timestamp: '2023-05-15 14:25' },
    //   { id: 3, name: 'API 2', type: 'GraphQL', status: 'failed', timestamp: '2023-05-15 14:20' },
    //   { id: 4, name: 'File Import', type: 'CSV', status: 'success', timestamp: '2023-05-15 14:15' },
    // ],
    recentConnections: [],
    systemStatus: [],
    transferData: [],
    connectionTypes: [],
    performanceData: [],

    successfulTransmissions: 0,
    failedTransmissions: 0,
    totalDataVolume: 0,
    totalLatency: 0,
    totalErrors: 0,


  });

  // Sample data - replace with real API data


  const fetchStats = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transmission-logs`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();


    if (data.count > 0) {

      const connectionTypesCount = data.data.reduce((acc: any, item: any) => {
        const type = item.connectionType;
        if (!acc[type]) {
          acc[type] = { name: type, value: 0 };
        }
        acc[type].value += 1;
        return acc;
      }, {});

      // Convert the object back to an array
      const connectionTypes = Object.values(connectionTypesCount);
      const resultData = {
        totalConnections: data.data.length,
        successfulConnections: data.data.filter((item: any) => item.status === 'success').length,
        failedConnections: data.data.filter((item: any) => item.status === 'failed').length,
        totalTransmissions: data.data.length,
        successfulTransmissions: data.data.filter((item: any) => item.status === 'success').length,
        dataVolume: data.data.reduce((acc: number, item: any) => acc + item.dataVolume.records, 0),
        recentConnections: data.data.slice(0, 5).map((item: any) => ({
          id: item._id,
          name: item.destination,
          type: item.connectionType,
          status: item.status,
          timestamp: item.createdAt.toLocaleString()
        })),
        transferData: data.data.map((item: any) => ({
          name: item.destination,
          sent: item.dataVolume.records,
          received: item.dataVolume.records
        })),
        systemStatus: data.data.map((item: any) => ({
          name: item.destination,
          status: item.status,
          timestamp: item.createdAt.toLocaleString()
        })),
        connectionTypes: connectionTypes,
        performanceData: data.data.map((item: any) => ({
          hour: new Date(item.createdAt).getHours(), // Extract hour from createdAt
          latency: item.duration
        }))
      }
      setStats(resultData as any);
    }


  }

  useEffect(() => {
    fetchStats();

    
  }, []);

  useEffect(() => {
    console.log(stats);
  }, [stats]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    setLastUpdated(new Date().toLocaleString());
  }, []);
  return (
    <div className="container mx-auto px-4 py-6 bg-white">
      <div className="flex items-center mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mr-4">
          <FiArrowLeft /> Back
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Data Warehouse</h1>
        <div className="flex items-center space-x-4">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm">New data node</button>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm" >New indicator</button>
          <span className="text-sm text-gray-500">Last updated: 6/20/2025, 2:02:16 PM</span>
          
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm">
            Refresh Data
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Data Nodes"
          value="100"
          icon="🔗"
          trend="up"
          change="12%"
        />
        <MetricCard
          title="Number of Records"
          value="100"
          icon="✅"
          trend="up"
          change="8%"
          color="green"
        />
        <MetricCard
          title="Number of Variables"
          value="900"
          icon="❌"
          trend="down"
          change="3%"
          color="red"
        />
        <MetricCard
          title="Data Volume (MB)"
          value="200"
          icon="📊"
          trend="up"
          change="22%"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Data Transfer Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Data Transfer Analysis</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.transferData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sent" fill="#8884d8" name="Data Sent (MB)" />
                <Bar dataKey="received" fill="#82ca9d" name="Data Received (MB)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Connection Types Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Connection Types</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.connectionTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {stats?.connectionTypes?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Line Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Performance Metrics</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="latency" stroke="#ff7300" name="Latency" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

     
      </div>
    
  );
};

export default Warehouse;