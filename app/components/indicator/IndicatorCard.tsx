'use client'
import { Indicator } from './types';
import { PencilIcon, TrashIcon, ChartBarIcon, EyeIcon } from '@heroicons/react/24/outline';

interface IndicatorCardProps {
  indicator: Indicator;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
  onViewOutput?: () => void;
}

export function IndicatorCard({ indicator, onEdit, onDelete, onClick, onViewOutput }: IndicatorCardProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <h3 
            className="text-lg font-medium text-gray-900 mb-2 cursor-pointer hover:text-blue-600"
            onClick={onClick}
          >
            {indicator.name}
          </h3>
          <div className="flex space-x-2">
            {onViewOutput && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewOutput();
                }}
                className="text-gray-500 hover:text-green-500"
                aria-label="View outputs"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-gray-500 hover:text-blue-500"
              aria-label="Edit indicator"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-gray-500 hover:text-red-500"
              aria-label="Delete indicator"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-4">{indicator.description}</p>
        
        <div className="flex items-center text-sm text-gray-500">
          <ChartBarIcon className="h-4 w-4 mr-1" />
          <span className="capitalize">{indicator.enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
        {indicator.nodeName && (
          <div className="text-sm text-gray-500 mt-1">
            <span className="font-medium">Node:</span> {indicator.nodeName}
          </div>
        )}
        {indicator.selectedVariables && indicator.selectedVariables.length > 0 && (
          <div className="text-sm text-gray-500 mt-1">
            <span className="font-medium">Variables:</span> {indicator.selectedVariables.length}
          </div>
        )}
      </div>
      <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
        {indicator.dataCounts && (
          <>
            <div className="text-xs text-gray-500">
              <span className="font-medium">Records:</span> {indicator.dataCounts.totalRecords}
            </div>
            <div className="text-xs text-gray-500">
              <span className="font-medium">Forms:</span> {indicator.dataCounts.totalForms}
            </div>
            <div className="text-xs text-gray-500">
              <span className="font-medium">Fields:</span> {indicator.dataCounts.totalFields}
            </div>
          </>
        )}
        {indicator.lastStatus && (
          <div className="text-xs text-gray-500">
            <span className="font-medium">Status:</span> {indicator.lastStatus}
          </div>
        )}
      </div>
    </div>
  );
}