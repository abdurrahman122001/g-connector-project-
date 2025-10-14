'use client'
import { useState, useEffect } from 'react';

interface Sector {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
}

interface SectorFilterProps {
  selectedSector: string;
  selectedSubcategory: string;
  onSectorChange: (sectorId: string) => void;
  onSubcategoryChange: (subcategoryId: string) => void;
}

export function SectorFilter({
  selectedSector,
  selectedSubcategory,
  onSectorChange,
  onSubcategoryChange,
}: SectorFilterProps) {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSectors() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`);
        if (!res.ok) throw new Error('Failed to fetch sectors');
        const data: any = await res.json();
        setSectors(data.data);
      } catch (error) {
        console.error('Failed to fetch sectors:', error);
        setSectors([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSectors();
  }, []);

  useEffect(() => {
    async function fetchSubcategories() {
      if (!selectedSector) {
        setSubcategories([]);
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${selectedSector}/subcategories`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          });
        if (!res.ok) throw new Error('Failed to fetch subcategories');
        const data: any = await res.json();
        setSubcategories(data.data);
      } catch (error) {
        console.error('Failed to fetch subcategories:', error);
        setSubcategories([]);
      }
    }
    fetchSubcategories();
  }, [selectedSector]);

  if (loading) {
    return (
      <div className="flex space-x-4">
        <div className="w-1/2 h-10 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-1/2 h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
          <select
            value={selectedSector}
            onChange={(e) => onSectorChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">All Sectors</option>
            {sectors.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
          <select
            value={selectedSubcategory}
            onChange={(e) => onSubcategoryChange(e.target.value)}
            disabled={!selectedSector}
            className="w-full p-2 border border-gray-300 rounded-md disabled:opacity-50"
          >
            <option value="">All Subcategories</option>
            {subcategories.map((subcat) => (
              <option key={subcat.id} value={subcat.id}>
                {subcat.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}