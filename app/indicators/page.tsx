'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IndicatorCard } from '../components/indicator/IndicatorCard';
import { IndicatorFormModal } from '../components/indicator/IndicatorFormModal';
import { FiArrowLeft } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmationToastComponent from '../components/ConfirmationToast';

// Define the shape of the data used when creating or updating an indicator
interface IndicatorData {
  name: string;
  description: string;
  scriptFile?: File;
  [key: string]: any;
}

export default function IndicatorManagement() {
  const router = useRouter();
  const [indicators, setIndicators] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentIndicator, setCurrentIndicator] = useState<any | null>(null);

  const handleCreateIndicator = async (indicatorData: IndicatorData) => {
    try {
      const formData = new FormData();
      Object.entries(indicatorData).forEach(([key, value]) => {
        if (key === 'scriptFile' && value instanceof File) {
          formData.append('file', value);
        } else {
          formData.append(key, value);
        }
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/indicators`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      const result: any = await response.json();
      setIndicators([...indicators, result.data]);
      setIsFormOpen(false);
    } catch (error) {
      console.error('Failed to create indicator:', error);
    }
  };

  const fetchIndicators = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/indicators`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`  
      },
    });
    const result: any = await response.json();
    setIndicators(result.data);
  };

  useEffect(() => { 
    fetchIndicators();
  }, []);

  const handleUpdateIndicator = async (id: string, updates: IndicatorData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/indicators/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();
      setIndicators(indicators.map(ind => ind.id === id ? result : ind));
      setCurrentIndicator(null);
    } catch (error) {
      console.error('Failed to update indicator:', error);
    }
  };

  const handleDeleteIndicator = async (id: string) => {
    const performDelete = async () => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/indicators/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
        });
        setIndicators(indicators.filter(ind => ind.id !== id));
      } catch (error) {
        console.error('Failed to delete indicator:', error);
      }
    };
    toast(
      <ConfirmationToastComponent
        onConfirm={performDelete}
      />, {
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

  return (
    <div className="container mx-auto px-4 py-6 bg-white">
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mr-4">
          <FiArrowLeft /> Back
        </button>
        <h1 className="text-2xl font-bold">Indicator Management</h1>
      </div>
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => {
            setCurrentIndicator(null);
            setIsFormOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create New Indicators
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {indicators.map((indicator) => (
          <IndicatorCard
            key={indicator.id}
            indicator={indicator}
            onEdit={() => {
              setCurrentIndicator(indicator);
              setIsFormOpen(true);
            }}
            onDelete={() => handleDeleteIndicator(indicator.id)}
            onClick={() => router.push(`/indicators/${indicator.id}`)}
          />
        ))}
      </div>

      <IndicatorFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setCurrentIndicator(null);
        }}
        onSubmit={currentIndicator
          ? (data: IndicatorData) => handleUpdateIndicator(currentIndicator.id, data)
          : handleCreateIndicator
        }
        initialData={currentIndicator}
      />
    </div>
  );
}
