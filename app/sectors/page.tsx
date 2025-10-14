'use client';

import { useState, useEffect } from 'react';
import { SectorModal } from '../components/sectors/SectorModal';
import { SubcategoryModal } from '../components/sectors/SubcategoryModal';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';
import { TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import ConfirmationToastComponent from '../components/ConfirmationToast';
import { Pagination } from '../components/Pagination';
import { useRouter } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';

interface Sector {
  id: string;
  name: string;
  description: string;
}

interface Subcategory {
  id: string;
  name: string;
  description: string;
  parentCategory: string;
}

export default function SectorManagement() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const router = useRouter();

  const handleCreateSector = async (newSector: Omit<Sector, 'id'>) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`

        },
        body: JSON.stringify(newSector),
      });
      const result: any = await response.json();
      toast.success("Created Successfully");

      setSectors([...sectors, result.data]);
    } catch (error) {
      console.error('Failed to create sector:', error);
    }
  };

  

  const fetchSubCategories = async (sector: Sector) => {
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${sector.id}/subcategories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
       
      });
      const result: any = await response.json();
      setSubcategories( result.data);
    } catch (error) {
      console.error('Failed to create subcategory:', error);
    }
  };
    
  const fetchSector = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`

        },
        
      });
      const result: any = await response.json();
      setSectors(result.data);
    } catch (error) {
      console.error('Failed to create sector:', error);
    }
  };

  useEffect(() => {
    fetchSector();
    
  }, []);


  const handleCreateSubcategory = async (newSubcategory: Omit<Subcategory, 'id' | 'parentCategory'>) => {
    
    if (!selectedSector) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${selectedSector.id}/subcategories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...newSubcategory,
          parentCategory: selectedSector.id,
        }),
      });
      const result: any = await response.json();
      setSubcategories([...subcategories, result.data]);
      toast.success("Created Successfully");
    } catch (error) {
      console.error('Failed to create subcategory:', error);
    }
  };

  const handleClickSector = (sector: Sector) => {
    setSelectedSector(sector);
    fetchSubCategories(sector);
  };

  const handleEditSector = async (sector: Sector) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${sector.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result: any = await response.json();
      setEditingSector(result.data);
      setIsSectorModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch sector details:', error);
      setEditingSector(sector);
      setIsSectorModalOpen(true);
    }
  };

  const handleDeleteSector = (sectorId: string) => {
    
    const performDelete = async () => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${sectorId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setSectors(sectors.filter(sec => sec.id !== sectorId));
        if (selectedSector?.id === sectorId) {
          setSelectedSector(null);
          setSubcategories([]);
          toast.success("Deleted Successfully");

        }
      } catch (error) {
        console.error('Failed to delete sector:', error);
      }
    }

      toast(
        <ConfirmationToastComponent
          onConfirm={performDelete}
          
        // closeToast prop will be automatically passed by react-toastify
        />,
        {
          position: "top-center",
          autoClose: false, // Don't auto-close confirmation
          closeOnClick: false, // Don't close on background click
          draggable: false,
          closeButton: false, // Hide default close button, using custom buttons
          className: 'bg-white shadow-xl rounded-lg border border-gray-300 p-0', // Combined styles
          style: { width: '420px' }, // Optional: define a width for the confirmation toast
        }
      );
    
  };

  const handleEditSubcategory = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    setIsSubcategoryModalOpen(true);
  };

  const handleUpdateSubcategory = async (updatedSubcategory: { name: string; description: string }) => {
    if (!editingSubcategory) return;
    try {
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${editingSubcategory.parentCategory}/subcategories/${editingSubcategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...updatedSubcategory,
          id: editingSubcategory.id,
          parentCategory: editingSubcategory.parentCategory,
        }),
      });
      const result: any = await response.json();
      setSubcategories(subcategories.map(sub => sub.id === editingSubcategory.id ? result.data : sub));
      setEditingSubcategory(null);
      toast.success("Updated Successfully");
      setIsSubcategoryModalOpen(false);
    } catch (error) {
      console.error('Failed to update subcategory:', error);
    }
  };

  const handleDeleteSubcategory = (subcategoryId: string) => {
    const performDelete = async () => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${selectedSector?.id}/subcategories/${subcategoryId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        toast.success("Deleted Successfully");

        setSubcategories(subcategories.filter(sub => sub.id !== subcategoryId));
      } catch (error) {
        console.error('Failed to delete subcategory:', error);
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

  const handleUpdateSector = async (updatedSector: Omit<Sector, 'id'>) => {
    if (!editingSector) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${editingSector.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedSector),
      });
      const result: any = await response.json();
      setSectors(sectors.map(sec => sec.id === editingSector.id ? result.data : sec));
      setEditingSector(null);
      setIsSectorModalOpen(false);
      toast.success("Updated Successfully");

    } catch (error) {
      console.error('Failed to update sector:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mr-4">
          <FiArrowLeft /> Back
        </button>
        <h1 className="text-2xl font-bold">Sector & Subcategory Management</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sectors Panel */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Sectors</h2>
            <button
              onClick={() => {setIsSectorModalOpen(true);
                setEditingSector(null)


              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add Sector
            </button>
          </div>

          <Pagination
            data={sectors}
            itemsPerPage={10}
            emptyMessage="No sectors available"
            renderItem={(sector: Sector) => (
              <div
                key={sector.id}
                className={`p-4 border rounded-lg cursor-pointer ${
                  selectedSector?.id === sector.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => {handleClickSector(sector)}}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{sector.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{sector.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditSector(sector); }}
                      className="text-blue-600 hover:underline"
                    >                      <PencilSquareIcon className="h-5 w-5" />
</button>
                    <button
                      onClick={() => handleDeleteSector(sector.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          />
        </div>

        {/* Subcategories Panel */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {selectedSector ? `${selectedSector.name} Subcategories` : 'Subcategories'}
            </h2>
            <button
              onClick={() => { setEditingSubcategory(null); setIsSubcategoryModalOpen(true); }}
              disabled={!selectedSector}
              className={`px-4 py-2 rounded ${
                selectedSector
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Add Subcategory
            </button>
          </div>

          {selectedSector ? (
            <Pagination
              data={subcategories}
              itemsPerPage={10}
              emptyMessage="No subcategories available for this sector"
              renderItem={(subcategory: Subcategory) => (
                <div key={subcategory.id} className="p-4 border border-gray-200 rounded-lg flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{subcategory.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{subcategory.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditSubcategory(subcategory)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSubcategory(subcategory.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              Select a sector to view or create subcategories
            </div>
          )}
        </div>
      </div>

      <SectorModal
        isOpen={isSectorModalOpen}
        onClose={() => setIsSectorModalOpen(false)}
        onSubmit={editingSector ? handleUpdateSector : handleCreateSector}
        initialData={editingSector ? { name: editingSector.name, description: editingSector.description } : undefined}
      />

      <SubcategoryModal
        isOpen={isSubcategoryModalOpen}
        onClose={() => { setIsSubcategoryModalOpen(false); setEditingSubcategory(null); }}
        onSubmit={editingSubcategory ? handleUpdateSubcategory : handleCreateSubcategory}
        initialData={editingSubcategory ? { name: editingSubcategory.name, description: editingSubcategory.description } : undefined}
      />

      <ToastContainer position="top-right" />
    </div>
  );
}
