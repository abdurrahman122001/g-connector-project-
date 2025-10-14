'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { ReferenceList } from '@/app/Interfaces';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { FormElement, AccumulatedFormData } from '@/app/Interfaces';

export default function FormBuilder() {
  const router = useRouter();

  // 🔹 Form meta
  const [formTitle, setFormTitle] = useState('Untitled Form');
  const [formDescription, setFormDescription] = useState(
    'This is my form. Please fill it out. Thanks!'
  );

  // 🔹 Design
  const [bgColor, setBgColor] = useState('#ffffff');
  const [fontFamily, setFontFamily] = useState('sans-serif');
  const [textColor, setTextColor] = useState('#000000');
  const [textAlign, setTextAlign] = useState('inherit');

  // 🔹 State
  const [activeTab, setActiveTab] = useState('elements');
  const [formElements, setFormElements] = useState<FormElement[]>([]);
  const [selectedElement, setSelectedElement] =
    useState<FormElement | null>(null);

  const [shareWith, setShareWith] = useState<'none' | 'all' | 'custom'>('none');
  const [customUsers, setCustomUsers] = useState<
    { _id: string; name: string; email: string }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    { _id: string; name: string; email: string }[]
  >([]);
  const [referenceLists, setReferenceLists] = useState<ReferenceList[]>([]);

  // 🔹 Element types
  const elementTypes = [
    { type: 'text', label: 'Text Field' },
    { type: 'number', label: 'Number Field' },
    { type: 'date', label: 'Date Field' },
    { type: 'file', label: 'File Field' },
    { type: 'email', label: 'Email Field' },
    { type: 'textarea', label: 'Text Area' },
    { type: 'checkbox', label: 'Checkboxes' },
    { type: 'radio', label: 'Radio Buttons' },
    { type: 'select', label: 'Select List' },
    { type: 'linkedSelect', label: 'Linked Select' },
    { type: 'toggle', label: 'Toggle Switch' },
    { type: 'qrcode', label: 'QR Code' },
    { type: 'gps', label: 'GPS Location' },
    { type: 'repeater', label: 'Repeater Group' },
  ];

  const networkElements = [{ type: 'submit', label: 'Submit Button' }];
  useEffect(() => {
    const loadLists = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/reference-lists`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReferenceLists(res.data.data);
      } catch (err) {
        console.error('Reference list load failed', err);
      }
    };
    loadLists();
  }, []);

  // ✅ Add new element
  const addElement = (type: string, label: string) => {
    const machineName = label.toLowerCase().replace(/\s+/g, '_');
    const newElement: FormElement = {
      id: `element-${Date.now()}`,
      type,
      label,
      name: machineName,
      required: false,
      options:
        ['checkbox', 'radio', 'select', 'linkedSelect'].includes(type)
          ? ['Option 1', 'Option 2']
          : undefined,
      placeholder: ['file', 'toggle', 'qrcode', 'gps'].includes(type)
        ? undefined
        : `Enter ${label.toLowerCase()}`,
    };

    if (type === 'repeater') {
      newElement.fields = [
        { name: 'item_name', label: 'Item Name', type: 'text', placeholder: 'Enter item name' },
      ];
    }

    if (type === 'toggle') newElement.value = false;
    if (type === 'qrcode') newElement.value = '';
    if (type === 'gps') {
      newElement.latitude = '';
      newElement.longitude = '';
    }

    setFormElements([...formElements, newElement]);
    setSelectedElement(newElement);
  };

  // ✅ Update field
  const updateElement = (id: string, updates: Partial<FormElement>) => {
    setFormElements((prev) => prev.map((el) => (el.id === id ? { ...el, ...updates } : el)));
    if (selectedElement?.id === id) setSelectedElement({ ...selectedElement, ...updates });
  };

  // ✅ Add option
  const addOption = (id: string, newOption: string) => {
    if (!newOption.trim()) return;
    setFormElements((prev) =>
      prev.map((el) =>
        el.id === id
          ? { ...el, options: [...(el.options || []), newOption.trim()] }
          : el
      )
    );
    if (selectedElement?.id === id) {
      setSelectedElement({
        ...selectedElement,
        options: [...(selectedElement.options || []), newOption.trim()],
      });
    }
  };

  // ✅ Edit option inline
  const editOption = (elementId: string, index: number, newValue: string) => {
    setFormElements((prev) =>
      prev.map((el) =>
        el.id === elementId
          ? {
            ...el,
            options: el.options?.map((opt, i) => (i === index ? newValue : opt)),
          }
          : el
      )
    );
    if (selectedElement?.id === elementId) {
      setSelectedElement({
        ...selectedElement,
        options: selectedElement.options?.map((opt, i) =>
          i === index ? newValue : opt
        ),
      });
    }
  };

  // ✅ Delete option
  const deleteOption = (elementId: string, index: number) => {
    setFormElements((prev) =>
      prev.map((el) =>
        el.id === elementId
          ? { ...el, options: el.options?.filter((_, i) => i !== index) }
          : el
      )
    );
    if (selectedElement?.id === elementId) {
      setSelectedElement({
        ...selectedElement,
        options: selectedElement.options?.filter((_, i) => i !== index),
      });
    }
  };

  // ✅ Remove element
  const removeElement = (id: string) => {
    setFormElements(formElements.filter((el) => el.id !== id));
    if (selectedElement?.id === id) setSelectedElement(null);
  };

  // ✅ Drag reorder
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(formElements);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setFormElements(items);
  };

  // ✅ Render element
  const renderElement = (element: FormElement) => {
    switch (element.type) {
      case 'text':
      case 'number':
      case 'email':
      case 'date':
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {element.label}
              {element.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={element.type}
              placeholder={element.placeholder}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled
            />
          </div>
        );

      case 'textarea':
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">{element.label}</label>
            <textarea
              placeholder={element.placeholder}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled
            />
          </div>
        );

      case 'checkbox':
      case 'radio':
      case 'select':
      case 'linkedSelect':
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">{element.label}</label>
            <div className="space-y-2">
              {element.options?.map((opt, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                >
                  {selectedElement?.id === element.id ? (
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => editOption(element.id, i, e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-1 text-sm mr-2"
                    />
                  ) : (
                    <span className="text-sm">{opt}</span>
                  )}
                  {selectedElement?.id === element.id && (
                    <button
                      type="button"
                      onClick={() => deleteOption(element.id, i)}
                      className="text-red-500 text-xs hover:text-red-700 ml-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* ✅ Add Option */}
            {selectedElement?.id === element.id && (
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="text"
                  placeholder="Add new option"
                  className="w-full border p-2 rounded-md text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addOption(element.id, e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <button
                  type="button"
                  className="bg-blue-500 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-600"
                  onClick={(e) => {
                    const input = (e.currentTarget.previousSibling as HTMLInputElement);
                    if (input.value.trim()) {
                      addOption(element.id, input.value);
                      input.value = '';
                    }
                  }}
                >
                  +
                </button>
              </div>
            )}
            {/* 🔹 Reference List Link */}
            {selectedElement?.id === element.id && (
              <div className="mt-2 border-t pt-2">
                <label className="block text-sm mb-1">Link to Reference List</label>
                <select
                  className="w-full border p-2 rounded-md text-sm"
                  value={element.linkedListId || ''}
                  onChange={async (e) => {
                    const listId = e.target.value;
                    updateElement(element.id, { linkedListId: listId });
                    if (listId) {
                      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/reference-lists/${listId}/items`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                      });
                      const firstCol = Object.keys(res.data.data[0] || {})[0];
                      updateElement(element.id, {
                        options: res.data.data.map((row: any) => row[firstCol]),
                      });
                      toast.success('Loaded from reference list');
                    }
                  }}
                >
                  <option value="">-- None --</option>
                  {referenceLists.map((l) => (
                    <option key={l._id} value={l._id}>{l.name}</option>
                  ))}
                </select>
              </div>
            )}

          </div>
        );

      case 'toggle':
        return (
          <div className="mb-4 flex items-center space-x-3">
            <span>{element.label}</span>
            <div
              className={`w-10 h-5 rounded-full ${element.value ? 'bg-green-500' : 'bg-gray-400'
                }`}
            />
          </div>
        );

      case 'qrcode':
        return (
          <div className="mb-4 border p-3 rounded text-center">
            <span className="block text-sm font-medium mb-1">{element.label}</span>
            <div className="font-mono bg-gray-100 p-2 rounded text-xs">
              {element.value || 'QR CODE VALUE'}
            </div>
          </div>
        );

      case 'gps':
        return (
          <div className="mb-4 border p-3 rounded-md">
            <label className="block text-sm font-medium mb-1">{element.label}</label>
            <p className="text-xs text-gray-500">
              Lat: {element.latitude || '—'} | Lng: {element.longitude || '—'}
            </p>
          </div>
        );

      case 'file':
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">{element.label}</label>
            <input type="file" disabled className="w-full border p-2 rounded-md" />
          </div>
        );

      case 'repeater':
        return (
          <div className="mb-4 p-4 border rounded-md bg-gray-50">
            <label className="block text-sm font-medium mb-2">{element.label}</label>
            {(element.fields || []).map((field, i) => (
              <input
                key={i}
                placeholder={field.placeholder}
                disabled
                className="w-full border p-2 rounded-md mb-2"
              />
            ))}
          </div>
        );

      case 'submit':
        return (
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded-md w-full"
            disabled
          >
            {element.label}
          </button>
        );

      default:
        return null;
    }
  };

  // ✅ Submit
  const handleSubmit = async () => {
    const separated = formElements.reduce(
      (acc: AccumulatedFormData, el) => {
        if (el.type === 'repeater') {
          acc.repeatable.push({
            name: el.name,
            label: el.label,
            id: el.id,
            type: 'repeatable',
            required: el.required || false,
            repeatable: {
              fields: (el.fields || []).map((f) => ({
                name: f.name,
                label: f.label,
                type: f.type,
                placeholder: f.placeholder,
                required: f.required || false,
              })),
            },
          });
        } else {
          acc.fields.push({
            name: el.name,
            label: el.label,
            id: el.id,
            type: el.type,
            placeholder: el.placeholder,
            required: el.required || false,
            options: el.options || [],
          });
        }
        return acc;
      },
      { fields: [], repeatable: [] } as AccumulatedFormData
    );

    const payload = {
      name: formTitle,
      description: formDescription,
      shareWith,
      customUsers: customUsers.map((u) => u._id),
      fields: separated.fields,
      repeatable: separated.repeatable,
    };

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/forms`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (res.data.success) {
        toast.success('Form submitted successfully!');
        router.push('/g-connector/form');
      } else toast.error(res.data.message || 'Submission failed');
    } catch {
      toast.error('Submission failed');
    }
  };

  // ✅ Search users
  useEffect(() => {
    if (shareWith === 'custom' && searchQuery.trim().length > 1) {
      const delay = setTimeout(async () => {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/search?q=${searchQuery}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setSearchResults(res.data.data);
      }, 300);
      return () => clearTimeout(delay);
    } else setSearchResults([]);
  }, [searchQuery, shareWith]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Form Preview */}
      <div
        className="flex-1 p-8 flex flex-col items-center"
        style={{ backgroundColor: bgColor, color: textColor, fontFamily, textAlign }}
      >
        <div className="w-full max-w-2xl">
          <h1
            className="text-3xl font-bold mb-4"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => setFormTitle(e.currentTarget.textContent || 'Untitled Form')}
          >
            {formTitle}
          </h1>
          <p
            className="text-lg mb-6"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => setFormDescription(e.currentTarget.textContent || '')}
          >
            {formDescription}
          </p>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="formElements">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-5">
                  {formElements.map((el, i) => (
                    <Draggable key={el.id} draggableId={el.id} index={i}>
                      {(prov, snap) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                          className={`p-4 rounded-md cursor-pointer ${snap.isDragging
                            ? 'bg-yellow-50'
                            : selectedElement?.id === el.id
                              ? 'ring-2 ring-blue-500 bg-blue-50'
                              : 'bg-white'
                            }`}
                          onClick={() => setSelectedElement(el)}
                        >
                          {renderElement(el)}
                          {selectedElement?.id === el.id && (
                            <div className="mt-2 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeElement(el.id);
                                }}
                                className="text-red-500 text-sm hover:text-red-700"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-96 bg-white p-4 border-l border-gray-200 overflow-y-auto">
        <div className="flex border-b mb-4">
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'design'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500'
              }`}
            onClick={() => setActiveTab('design')}
          >
            Design
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'elements'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500'
              }`}
            onClick={() => setActiveTab('elements')}
          >
            Elements
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'shareWith'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500'
              }`}
            onClick={() => setActiveTab('shareWith')}
          >
            Share With
          </button>
        </div>

        {activeTab === 'elements' && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Form Elements</h2>
            <div className="grid grid-cols-2 gap-3">
              {elementTypes.map((el) => (
                <button
                  key={el.type}
                  className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 text-left text-sm"
                  onClick={() => addElement(el.type, el.label)}
                >
                  {el.label}
                </button>
              ))}
            </div>

            <h2 className="text-lg font-semibold mt-6 mb-3">Network</h2>
            <div className="grid grid-cols-2 gap-3">
              {networkElements.map((el) => (
                <button
                  key={el.type}
                  className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 text-left text-sm"
                  onClick={() => addElement(el.type, el.label)}
                >
                  {el.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'design' && (
          <div className="space-y-3">
            <label className="block text-sm">Background Color</label>
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
            <label className="block text-sm">Text Color</label>
            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
            <label className="block text-sm">Font Family</label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full border p-2 rounded-md"
            >
              <option value="sans-serif">Sans Serif</option>
              <option value="serif">Serif</option>
              <option value="monospace">Monospace</option>
            </select>
            <label className="block text-sm">Text Align</label>
            <select
              value={textAlign}
              onChange={(e) => setTextAlign(e.target.value)}
              className="w-full border p-2 rounded-md"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        )}

        {activeTab === 'shareWith' && (
          <div className="space-y-4">
            <select
              value={shareWith}
              onChange={(e) => setShareWith(e.target.value as any)}
              className="w-full border p-2 rounded-md"
            >
              <option value="none">Private</option>
              <option value="all">All Users</option>
              <option value="custom">Custom</option>
            </select>

            {shareWith === 'custom' && (
              <>
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full border p-2 rounded-md"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="space-y-2">
                  {searchResults.map((u) => (
                    <div
                      key={u._id}
                      className="p-2 border rounded-md flex justify-between items-center"
                    >
                      <span className="text-sm">{u.name}</span>
                      <button
                        className="text-blue-600 text-xs"
                        onClick={() => setCustomUsers([...customUsers, u])}
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>

                {customUsers.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Selected Users:</p>
                    {customUsers.map((u) => (
                      <div key={u._id} className="flex justify-between text-sm">
                        <span>{u.name}</span>
                        <button
                          className="text-red-500 text-xs"
                          onClick={() =>
                            setCustomUsers(customUsers.filter((x) => x._id !== u._id))
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <button
          onClick={handleSubmit}
          className="w-full mt-5 bg-blue-600 text-white rounded-md py-2 hover:bg-blue-700"
        >
          Submit Form
        </button>
        <ToastContainer />
      </div>
    </div>
  );
}
