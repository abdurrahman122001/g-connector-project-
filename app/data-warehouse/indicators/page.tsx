"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiPlus } from 'react-icons/fi';
import IndicatorCharts from '../../components/indicator/IndicatorCharts';
import IndicatorOutputManager from '../../components/indicator/IndicatorOutputManager';
import { Indicator, getAnalyticsOutputs } from '../../services/dataWarehouseApi';
import AnalyticsIndicatorOutputs from '../../components/dashboard/AnalyticsIndicatorOutputs';

export default function IndicatorsPage() {
  const router = useRouter();
  const [showOutputManager, setShowOutputManager] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null);



  const handleEditIndicator = (indicator: Indicator) => {
    // Navigate to warehouse page for editing
    router.push('/data-warehouse/warehouse');
  };

  const handleViewOutput = (indicator: Indicator) => {
    setSelectedIndicator(indicator);
    setShowOutputManager(true);
  };

  const handleIndicatorDeleted = () => {
    // Refresh the page or refetch data
    window.location.reload();
  };

  return (
    <div className="container mx-auto px-4 py-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            <FiArrowLeft /> Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Indicator Analytics</h1>
        </div>
        <button 
          onClick={() => router.push('/data-warehouse/warehouse')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
        >
          <FiPlus className="w-4 h-4" />
          Create Indicator
        </button>
      </div>



      {/* Indicator Charts */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Indicator Management</h3>
        <IndicatorCharts 
          onEditIndicator={handleEditIndicator}
          onViewOutput={handleViewOutput}
          onDeleteIndicator={handleIndicatorDeleted}
        />
      </div>

      {/* Analytics Indicator Outputs */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Analytics Chart Outputs</h3>
        <AnalyticsIndicatorOutputs />
      </div>

      {/* Indicator Output Manager Modal */}
      {selectedIndicator && (
        <IndicatorOutputManager
          indicatorId={selectedIndicator.id}
          indicatorName={selectedIndicator.name}
          isOpen={showOutputManager}
          onClose={() => {
            setShowOutputManager(false);
            setSelectedIndicator(null);
          }}
        />
      )}
    </div>
  );
} 