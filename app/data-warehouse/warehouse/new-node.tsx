"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewNodePage() {
  const router = useRouter();
  const [run, setRun] = useState(true);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg">
        <h3 className="text-2xl font-bold mb-6 text-center">Create new Node</h3>
        <form className="space-y-4">
          {/* Node name */}
          <div>
            <label className="block text-lg font-semibold mb-1">Node name</label>
            <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {/* Select data Form */}
          <div>
            <label className="block text-lg font-semibold mb-1">Select data Form</label>
            <select className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select Display Mode</option>
              <option value="form1">Form 1</option>
              <option value="form2">Form 2</option>
            </select>
          </div>
          {/* Description */}
          <div>
            <label className="block text-lg font-semibold mb-1">Description</label>
            <textarea className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2}></textarea>
          </div>
          {/* List of variables */}
          <div>
            <label className="block text-lg font-semibold mb-1">Select Variables</label>
            <div className="border border-gray-300 rounded p-2 max-h-32 overflow-y-auto">
              <div>
                <input type="checkbox" id="var1" className="mr-2" />
                <label htmlFor="var1">Var 1</label>
              </div>
              <div>
                <input type="checkbox" id="var2" className="mr-2" />
                <label htmlFor="var2">Var 2</label>
              </div>
              <div>
                <input type="checkbox" id="var3" className="mr-2" />
                <label htmlFor="var3">Var 3</label>
              </div>
              {/* Add more variables as needed */}
            </div>
          </div>
          {/* Command script file */}
          <div>
            <label className="block text-lg font-semibold mb-1">Command script file</label>
            <input type="file" className="block w-full text-sm text-gray-500" />
          </div>
          {/* Run or disable toggle */}
          <div className="flex items-center gap-3">
            <button type="button" className={`w-20 h-8 rounded font-semibold ${run ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`} onClick={() => setRun(!run)}>{run ? 'Run' : 'Disabled'}</button>
            <span className="text-gray-500 text-sm">Run or disable</span>
          </div>
          {/* Action buttons */}
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" className="px-4 py-2 rounded bg-gray-200 text-gray-700" onClick={() => router.back()}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white font-semibold">Create Node</button>
          </div>
        </form>
      </div>
    </div>
  );
} 