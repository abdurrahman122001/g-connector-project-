'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { FormElement, AccumulatedFormData } from '@/app/Interfaces';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';

// Define the types of fields that can be added inside a repeater
const repeaterFieldTypes = [
  { type: 'text', label: 'Text' },
  { type: 'number', label: 'Number' },
  { type: 'date', label: 'Date' },
  { type: 'email', label: 'Email' },
  { type: 'textarea', label: 'Text Area' },
  { type: 'checkbox', label: 'Checkboxes' },
  { type: 'radio', label: 'Radio Buttons' },
  { type: 'select', label: 'Select List' },
];

export default function FormBuilder() {
  const router = useRouter();

  // Form meta
  const [formTitle, setFormTitle] = useState('Untitled Form');
  const [formDescription, setFormDescription] = useState(
    'This is my form. Please fill it out. Thanks!'
  );

  // Design options
  const [bgColor, setBgColor] = useState('#ffffff');
  const [fontFamily, setFontFamily] = useState('sans-serif');
  const [textColor, setTextColor] = useState('#000000');
  const [textAlign, setTextAlign] = useState('inherit');

  // Builder state
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

  // Available elements
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
    { type: 'repeater', label: 'Repeater Group' },
  ];

  const networkElements = [{ type: 'submit', label: 'Submit Button' }];

  const addElement = (type: string, label: string) => {
    const machineName = label.toLowerCase().replace(/\s+/g, '_');
    const newElement: FormElement = {
      id: `element-${Date.now()}`,
      type,
      label,
      name: machineName,
      required: false,
      options:
        type === 'checkbox' || type === 'radio' || type === 'select'
          ? ['Option 1', 'Option 2']
          : undefined,
      placeholder: type === 'file' ? undefined : `Enter ${label.toLowerCase()}`,
    };

    if (type === 'repeater') {
      newElement.name = 'item_list';
      newElement.fields = [
        {
          name: 'item_name',
          label: 'Item Name',
          type: 'text',
          placeholder: 'Enter item name',
        },
      ];
    }

    setFormElements([...formElements, newElement]);
    setSelectedElement(newElement);
  };

  const updateElement = (id: string, updates: Partial<FormElement>) => {
    setFormElements(
      formElements.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
    if (selectedElement?.id === id) {
      setSelectedElement({ ...selectedElement, ...updates });
    }
  };

  const removeElement = (id: string) => {
    setFormElements(formElements.filter((el) => el.id !== id));
    if (selectedElement?.id === id) {
      setSelectedElement(null);
    }
  };

  // ✅ Drag reorder handler
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(formElements);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setFormElements(items);
  };

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
            <label className="block text-sm font-medium mb-1">
              {element.label}
              {element.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              placeholder={element.placeholder}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled
              rows={3}
            />
          </div>
        );
      case 'checkbox':
      case 'radio':
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              {element.label}
              {element.required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              {element.options?.map((option, i) => (
                <div key={i} className="flex items-center">
                  <input type={element.type} className="mr-2" disabled />
                  <span>{option}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'select':
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {element.label}
              {element.required && <span className="text-red-500">*</span>}
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled
            >
              {element.options?.map((option, i) => (
                <option key={i} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );
      case 'submit':
        return (
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled
          >
            {element.label}
          </button>
        );
      case 'file':
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {element.label}
              {element.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="file"
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled
            />
          </div>
        );
      case 'repeater':
        return (
          <div className="mb-4 p-4 border rounded-md bg-gray-50">
            <label className="block text-sm font-medium mb-2">
              {element.label}
              {element.required && <span className="text-red-500">*</span>}
            </label>
            <div className="border p-4 rounded-md bg-white">
              <div className="space-y-4">
                {(element.fields || []).map((field, index) => (
                  <div key={index}>
                    <label className="block text-xs text-gray-600 mb-1">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder || field.label}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      disabled
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    const separatedData = formElements.reduce(
      (accumulator: AccumulatedFormData, element: FormElement) => {
        if (element.type === 'repeater') {
          accumulator.repeatable.push({
            name: element.name,
            label: element.label,
            id: element.id,
            type: 'repeatable',
            required: element.required || false,
            repeatable: {
              fields: (element.fields || []).map((subField) => ({
                name: subField.name,
                label: subField.label,
                type: subField.type,
                placeholder: subField.placeholder || '',
                required: subField.required || false,
                options: subField.options || [],
              })),
            },
          });
        } else {
          accumulator.fields.push({
            name: element.name,
            label: element.label,
            id: element.id,
            type: element.type,
            placeholder: element.placeholder,
            required: element.required || false,
            options: element.options || [],
          });
        }
        return accumulator;
      },
      { fields: [], repeatable: [] } as AccumulatedFormData
    );

    const formData = {
      name: formTitle,
      description: formDescription,
      shareWith: shareWith,
      customUsers: customUsers.map((item) => item._id),
      fields: separatedData.fields,
      repeatable: separatedData.repeatable,
    };

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/forms`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.success) {
        toast.success('Form submitted successfully!');
        router.push('/g-connector/form');
      } else {
        toast.error(response.data.message || 'Submission failed');
      }
    } catch (error) {
      toast.error('Submission failed');
    }
  };

  useEffect(() => {
    if (shareWith === 'custom' && searchQuery.trim().length > 1) {
      const delayDebounce = setTimeout(async () => {
        try {
          const res = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/users/search?q=${searchQuery}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            }
          );
          setSearchResults(res.data.data);
        } catch (err) {
          console.error('User search failed', err);
        }
      }, 300);

      return () => clearTimeout(delayDebounce);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, shareWith]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Form Preview */}
      <div
        className="flex-1 p-8 flex flex-col items-center justify-start"
        style={{
          backgroundColor: bgColor,
          fontFamily: fontFamily,
          color: textColor,
          textAlign: textAlign as any,
        }}
      >
        <div className="w-full max-w-2xl">
          <h1
            className="text-3xl font-bold mb-4"
            contentEditable
            suppressContentEditableWarning={true}
            onBlur={(e) =>
              setFormTitle(e.target.textContent || 'Untitled Form')
            }
          >
            {formTitle}
          </h1>
          <p
            className="text-lg mb-8"
            contentEditable
            suppressContentEditableWarning={true}
            onBlur={(e) =>
              setFormDescription(
                e.target.textContent ||
                  'This is my form. Please fill it out. Thanks!'
              )
            }
          >
            {formDescription}
          </p>
          <div className="border-t border-gray-300 my-6"></div>

          {/* ✅ Drag-and-drop */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="formElements">
              {(provided) => (
                <div
                  className="space-y-6"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {formElements.map((element, index) => (
                    <Draggable
                      key={element.id}
                      draggableId={element.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`p-4 rounded-lg cursor-pointer ${
                            snapshot.isDragging
                              ? 'bg-yellow-50'
                              : selectedElement?.id === element.id
                              ? 'ring-2 ring-blue-500 bg-blue-50'
                              : 'bg-white'
                          }`}
                          onClick={() => setSelectedElement(element)}
                        >
                          {renderElement(element)}
                          {selectedElement?.id === element.id && (
                            <div className="mt-2 flex justify-end">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeElement(element.id);
                                }}
                                className="text-red-500 hover:text-red-700 text-sm"
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
        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'design'
                ? 'cursor-pointer text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('design')}
          >
            Design
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'elements'
                ? 'cursor-pointer text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('elements')}
          >
            Elements
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'shareWith'
                ? 'cursor-pointer text-blue-600 border-b-2 border-blue-600'
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

        <button
          onClick={handleSubmit}
          className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Submit Form
        </button>
      </div>
      <ToastContainer />
    </div>
  );
}
