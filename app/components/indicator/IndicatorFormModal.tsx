import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { useForm } from 'react-hook-form';

interface Sector {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
}

interface IndicatorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export function IndicatorFormModal({ isOpen, onClose, onSubmit, initialData }: IndicatorFormModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedSector, setSelectedSector] = useState('');
  const [scriptFile, setScriptFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
      
      fetchSectors();
      if (initialData) {
        setSelectedSector(initialData.sector_id);
        reset({
          name: initialData.name,
          description: initialData.description,
          subcategoryId: initialData.subcategory_id,
          displayMode: initialData.display_mode
        });
      } else {
        reset();
        setSelectedSector('');
        setScriptFile(null);
      }
    }
  }, [isOpen, initialData, reset]);

  useEffect(() => {
    if (selectedSector) {
      fetchSubcategories(selectedSector);
    } else {
      setSubcategories([]);
    }
  }, [selectedSector]);

  const fetchSectors = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`);
      const data: any = await res.json();
      setSectors(data.data);
    } catch (error) {
      console.error('Failed to fetch sectors:', error);
    }
  };

  const fetchSubcategories = async (sectorId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${sectorId}/subcategories`);
      const data: any = await res.json();
      setSubcategories(data.data);
    } catch (error) {
      console.error('Failed to fetch subcategories:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setScriptFile(e.target.files[0]);
    }
  };

  const submitForm = (data: any) => {
    const formData = {
      ...data,
      scriptFile: scriptFile
    };
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl rounded bg-white p-6 max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-xl font-bold mb-4">
            {initialData ? 'Edit Indicator' : 'Create New Indicators'}
          </Dialog.Title>
          
          <form onSubmit={handleSubmit(submitForm)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Indicator Name*
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  className={`w-full p-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message as string}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="sector" className="block text-sm font-medium text-gray-700 mb-1">
                  Sector*
                </label>
                <select
                  id="sector"
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Sector</option>
                  {sectors.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategory*
                </label>
                <select
                  id="subcategory"
                  {...register('subcategoryId', { required: 'Subcategory is required' })}
                  disabled={!selectedSector}
                  className={`w-full p-2 border rounded-md ${!selectedSector ? 'bg-gray-100' : ''} ${errors.subcategoryId ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select Subcategory</option>
                  {subcategories.map((subcat) => (
                    <option key={subcat.id} value={subcat.id}>
                      {subcat.name}
                    </option>
                  ))}
                </select>
                {errors.subcategoryId && (
                  <p className="mt-1 text-sm text-red-600">{errors.subcategoryId.message as string}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="displayMode" className="block text-sm font-medium text-gray-700 mb-1">
                  Display Mode*
                </label>
                <select
                  id="displayMode"
                  {...register('displayMode', { required: 'Display mode is required' })}
                  className={`w-full p-2 border rounded-md ${errors.displayMode ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select Display Mode</option>
                  <option value="bar_chart">Bar Chart</option>
                  <option value="line_chart">Line Chart</option>
                  <option value="pie_chart">Pie Chart</option>
                  <option value="numeric">Numeric Value</option>
                </select>
                {errors.displayMode && (
                  <p className="mt-1 text-sm text-red-600">{errors.displayMode.message as string}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  {...register('description')}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              {!initialData && (
                <div className="md:col-span-2">
                  <label htmlFor="scriptFile" className="block text-sm font-medium text-gray-700 mb-1">
                    Indicator Script File*
                  </label>
                  <input
                    id="scriptFile"
                    type="file"
                    onChange={handleFileChange}
                    accept=".js,.py,.r"
                    required={!initialData}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Upload the script file that calculates this indicator
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {initialData ? 'Update Indicator' : 'Create Indicator'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}