'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { ReferenceList } from '@/app/Interfaces';
import { toast } from 'react-toastify';

export default function ReferenceListsPage() {
  const [lists, setLists] = useState<ReferenceList[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCols, setNewCols] = useState([{ key: 'code', label: 'Code' }, { key: 'name', label: 'Name' }]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const auth = token ? { Authorization: `Bearer ${token}` } : {};

  const load = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/reference-lists`, { headers: auth });
      setLists(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load lists');
    }
  };

  useEffect(() => { load(); }, []);

  const createList = async () => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/reference-lists`, {
        name: newName, description: newDesc, columns: newCols
      }, { headers: { 'Content-Type': 'application/json', ...auth } });
      toast.success('List created');
      setCreating(false);
      setNewName(''); setNewDesc('');
      await load();
    } catch (e:any) {
      toast.error(e?.response?.data?.message || 'Failed to create list');
    }
  };

  const deleteList = async (id: string) => {
    if (!confirm('Delete this list and all rows?')) return;
    await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/reference-lists/${id}`, { headers: auth });
    toast.success('Deleted'); load();
  };

  const importCsv = async (id: string, file: File) => {
    try {
      const fd = new FormData();
      fd.append('file', file);
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/reference-lists/${id}/import`, fd, { headers: auth });
      toast.success('CSV imported successfully');
    } catch (err:any) {
      toast.error('CSV import failed');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Reference Lists</h1>
        <button className="px-3 py-2 bg-blue-600 text-white rounded-md" onClick={() => setCreating(true)}>New List</button>
      </div>

      {creating && (
        <div className="border rounded-md p-4 mb-6 bg-gray-50">
          <h2 className="font-medium mb-3">Create Reference List</h2>
          <div className="grid grid-cols-2 gap-3">
            <input className="border p-2 rounded" placeholder="Name" value={newName} onChange={(e)=>setNewName(e.target.value)} />
            <input className="border p-2 rounded" placeholder="Description" value={newDesc} onChange={(e)=>setNewDesc(e.target.value)} />
          </div>
          <div className="mt-3">
            <p className="text-sm font-medium mb-1">Columns</p>
            {newCols.map((c, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 mb-2">
                <input className="border p-2 rounded" placeholder="key" value={c.key}
                  onChange={(e)=>setNewCols(newCols.map((x,idx)=> idx===i?{...x,key:e.target.value}:x))}/>
                <input className="border p-2 rounded" placeholder="label" value={c.label}
                  onChange={(e)=>setNewCols(newCols.map((x,idx)=> idx===i?{...x,label:e.target.value}:x))}/>
              </div>
            ))}
            <button className="text-sm text-blue-600" onClick={()=>setNewCols([...newCols,{key:'',label:''}])}>+ Add column</button>
          </div>
          <div className="mt-3 flex gap-2">
            <button className="px-3 py-2 bg-blue-600 text-white rounded-md" onClick={createList}>Create</button>
            <button className="px-3 py-2 border rounded-md" onClick={()=>setCreating(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {lists.map((l)=>( 
          <div key={l._id} className="border rounded-md p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium">{l.name}</p>
                <p className="text-sm text-gray-500">{l.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm cursor-pointer">
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e)=> e.target.files && importCsv(l._id, e.target.files[0])}
                  />
                  <span className="px-3 py-1 border rounded cursor-pointer bg-gray-50 hover:bg-gray-100">
                    Import CSV
                  </span>
                </label>
                <button className="px-3 py-1 text-red-600 border rounded hover:bg-red-50" onClick={()=>deleteList(l._id)}>Delete</button>
              </div>
            </div>
            <div className="text-xs text-gray-600">Columns: {l.columns.map(c=>`${c.key} (${c.label})`).join(', ')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
