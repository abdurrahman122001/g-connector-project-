'use client';
// components/FormBuilder.tsx
// components/FormBuilder.tsx
// components/FormBuilder.tsx
import { useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { useRouter } from 'next/navigation';

type FormElement = {
  name: string;
  id: string;
  type: string;
  label: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
};


export default function FormBuilder() {
  const router = useRouter();
  // Form meta
  const [formTitle, setFormTitle] = useState('Untitled Form');
  const [formDescription, setFormDescription] = useState('This is my form. Please fill it out. Thanks!');
  
  // Design options
  const [bgColor, setBgColor] = useState('#ffffff');
  const [fontFamily, setFontFamily] = useState('sans-serif');
  const [textColor, setTextColor] = useState('#000000');
  const [textAlign, setTextAlign] = useState('inherit');
  
  // Builder state
  const [activeTab, setActiveTab] = useState('elements');
  const [formElements, setFormElements] = useState<FormElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<FormElement | null>(null);
  const [elementName, setElementName] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedLabel, setSelectedLabel] = useState<string>('');

  // Available elements
  const elementTypes = [
    { type: 'text', label: 'Text Field' },
    { type: 'number', label: 'Number Field' },
    { type: 'date', label: 'Date Field' },
    { type: 'email', label: 'Email Field' },
    { type: 'textarea', label: 'Text Area' },
    { type: 'checkbox', label: 'Checkboxes' },
    { type: 'radio', label: 'Radio Buttons' },
    { type: 'select', label: 'Select List' },
  ];

  const networkElements = [
    { type: 'submit', label: 'Submit Button' },
  ];

  const addElement = (type: string, label: string, name: string) => {
    const newElement: FormElement = {
      id: `element-${Date.now()}`,
      type,
      label,
      name,
      required: false,
      options: type === 'checkbox' || type === 'radio' || type === 'select' 
        ? ['Option 1', 'Option 2'] 
        : undefined,
      placeholder: `Enter ${label.toLowerCase()}`
    };
    
    setFormElements([...formElements, newElement]);
    setSelectedElement(newElement);
  };

  const updateElement = (id: string, updates: Partial<FormElement>) => {
    setFormElements(formElements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
    if (selectedElement?.id === id) {
      setSelectedElement({ ...selectedElement, ...updates });
    }
  };

  const removeElement = (id: string) => {
    setFormElements(formElements.filter(el => el.id !== id));
    if (selectedElement?.id === id) {
      setSelectedElement(null);
    }
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
                  <input
                    type={element.type}
                    className="mr-2"
                    disabled
                  />
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
            <select className="w-full p-2 border border-gray-300 rounded-md" disabled>
              {element.options?.map((option, i) => (
                <option key={i} value={option}>{option}</option>
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
      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    const formData = {
      name: formTitle,
      description: formDescription,
      fields: formElements.map(element => ({
        label: element.label,
        type: element.type,
        name: element.name,
        required: element.required || false,
        options: element.options || [],
      })),
    };

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/forms`, formData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Handle success response
      if (response.data.success) {
        toast.success('Form submitted successfully!');
        router.push('/g-connector/form');
      } else {
        toast.error(response.data.message || 'Submission failed');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || 'Submission failed');
      } else {
        toast.error('Submission failed');
      }
    }
  };

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
            onBlur={(e) => setFormTitle(e.target.textContent || 'Untitled Form')}
          >
            {formTitle}
          </h1>
          <p 
            className="text-lg mb-8"
            contentEditable
            onBlur={(e) => setFormDescription(e.target.textContent || 'This is my form. Please fill it out. Thanks!')}
          >
            {formDescription}
          </p>
          <div className="border-t border-gray-300 my-6"></div>
          
          {/* Rendered Form Elements */}
          <div className="space-y-6">
            {formElements.map((element) => (
              <div 
                key={element.id}
                className={`p-4 rounded-lg ${selectedElement?.id === element.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'}`}
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
            ))}
          </div>
        </div>
      </div>

      {/* Controls Sidebar */}
      <div className="w-96 bg-white p-4 border-l border-gray-200 overflow-y-auto">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'design' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('design')}
          >
            Design
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'elements' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('elements')}
          >
            Elements
          </button>
        </div>

        {activeTab === 'design' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Global</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                <div className="flex items-center">
                  <input 
                    type="color" 
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 mr-2"
                  />
                  <input 
                    type="text" 
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            <h2 className="text-lg font-semibold mb-4">Text</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                >
                  <option value="sans-serif">Sans Serif</option>
                  <option value="serif">Serif</option>
                  <option value="monospace">Monospace</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                <div className="flex items-center">
                  <input 
                    type="color" 
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-8 h-8 mr-2"
                  />
                  <input 
                    type="text" 
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Text Alignment</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={textAlign}
                  onChange={(e) => setTextAlign(e.target.value)}
                >
                  <option value="inherit">Inherit</option>
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'elements' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Form Elements</h2>
              <div className="grid grid-cols-2 gap-3">
                {elementTypes.map((el) => (
                  <button
                    key={el.type}
                    className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 text-left text-sm"
                    onClick={() => addElement(el.type, el.label, el.label)}
                  >
                    {el.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Network</h2>
              <div className="grid grid-cols-2 gap-3">
                {networkElements.map((el) => (
                  <button
                    key={el.type}
                    className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 text-left text-sm"
                    onClick={() => addElement(el.type, el.label, el.label)}
                  >
                    {el.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedElement && (
              <div className="border-t pt-4">
                <h2 className="text-lg font-semibold mb-3">Element Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Label</label>
                    <input
                      type="text"
                      value={selectedElement.label}
                      onChange={(e) => updateElement(selectedElement.id, { label: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Placeholder</label>
                    <input
                      type="text"
                      value={selectedElement.placeholder || ''}
                      onChange={(e) => updateElement(selectedElement.id, { placeholder: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`required-${selectedElement.id}`}
                      checked={selectedElement.required || false}
                      onChange={(e) => updateElement(selectedElement.id, { required: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor={`required-${selectedElement.id}`} className="text-sm">
                      Required
                    </label>
                  </div>

                  {(selectedElement.type === 'checkbox' || 
                    selectedElement.type === 'radio' || 
                    selectedElement.type === 'select') && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Options</label>
                      <div className="space-y-2">
                        {selectedElement.options?.map((option, i) => (
                          <div key={i} className="flex">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...(selectedElement.options || [])];
                                newOptions[i] = e.target.value;
                                updateElement(selectedElement.id, { options: newOptions });
                              }}
                              className="flex-1 p-2 border border-gray-300 rounded-md"
                            />
                            <button
                              onClick={() => {
                                const newOptions = [...(selectedElement.options || [])];
                                newOptions.splice(i, 1);
                                updateElement(selectedElement.id, { options: newOptions });
                              }}
                              className="ml-2 text-red-500"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newOptions = [...(selectedElement.options || []), 'New Option'];
                            updateElement(selectedElement.id, { options: newOptions });
                          }}
                          className="text-sm text-blue-500 hover:text-blue-700"
                        >
                          + Add Option
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Submit Form
        </button>
      </div>
      <ToastContainer />
    </div>
  );
}