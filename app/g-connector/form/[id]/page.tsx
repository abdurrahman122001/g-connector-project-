'use client';
// components/FormBuilder.tsx
// components/FormBuilder.tsx
// components/FormBuilder.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { useParams, useRouter } from 'next/navigation';
import { FormElement, AccumulatedFormData } from '@/app/Interfaces';
 


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
        { type: 'file', label: 'File Field' },
        { type: 'repeater', label: 'Repeater Group' },

    ];

    const { id } = useParams();



    const fetchForm = async () => {
        const fetch = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${id}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (fetch.data) {
            const fetchArray: any = [];
            const resp = fetch.data.data;

            if (fetch.data.data) {
                // Handle regular fields
                fetch.data.data.fields.forEach((el: any) => {
                    const fet = {
                        id: el.id,
                        label: el.label,
                        name: el.name,
                        options: el.options,
                        type: el.type,
                        placeholder: el.placeholder,
                        required: el.required
                    };
                    fetchArray.push(fet);
                });

                // Handle repeatable groups
                if (fetch.data.data.repeatable) {
                    fetch.data.data.repeatable.forEach((group: any) => {
                        const repeaterElement = {
                            id: group.id,
                            label: group.label,
                            name: group.name,
                            type: 'repeater',
                            required: false,
                            fields: group.fields.map((field: any) => ({
                                name: field.name,
                                label: field.label,
                                type: field.type,
                                placeholder: field.placeholder,
                                required: field.required,
                                options: field.options || []
                            }))
                        };
                        fetchArray.push(repeaterElement);
                    });
                }
            }

            setFormElements(fetchArray);
            setFormTitle(resp.name);
            setShareWith(resp.formPermission.access);
            setCustomUsers(resp.formPermission.users);
            setFormDescription(resp.description);
        }
    };


    useEffect(() => {

        fetchForm()
    }, [])

    const networkElements = [
        { type: 'submit', label: 'Submit Button' },
    ];

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

    const addElement = (type: string, label: string, name: string) => {
        const machineName = label.toLowerCase().replace(/\s+/g, '_');
        const newElement: FormElement = {
            id: `element-${Date.now()}`,
            type,
            label,
            name: machineName,
            required: false,
            options: type === 'checkbox' || type === 'radio' || type === 'select'
                ? ['Option 1', 'Option 2']
                : undefined,
            placeholder: type === 'file' ? undefined : `Enter ${label.toLowerCase()}`
        };

        if (type === 'repeater') {
            newElement.name = 'item_list'; // Default name for a repeater
            newElement.fields = [
                { name: 'item_name', label: 'Item Name', type: 'text', placeholder: 'Enter item name' },
            ];
        }

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
                        <select className="w-full p-2 border border-gray-300 rounded-md">
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
                                <label className="block text-xs text-gray-600 mb-1">{field.label}</label>
                                {field.type === 'select' || field.type === 'radio' || field.type === 'checkbox' ? (
                                  <div className="space-y-1 pl-1">
                                    {(field.options || []).map((opt, optIndex) => (
                                      <div key={optIndex} className="flex items-center">
                                        <input type={field.type} className="mr-2" />
                                        <span>{opt}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <input
                                    type={field.type}
                                    placeholder={field.placeholder || field.label}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                  />
                                )}
                                {(selectedElement?.id === element.id && selectedElement.type === 'repeater') && (
                                    <div className="mt-2 flex justify-end">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newFields = (element.fields || []).filter((_, i) => i !== index);
                                                updateElement(element.id, { fields: newFields });
                                            }}
                                            className="text-red-500 hover:text-red-700 text-sm"
                                        >
                                            Remove Field
                                        </button>
                                    </div>
                                )}
                              </div>
                            ))}
                          </div>
                          {(selectedElement?.id === element.id && selectedElement.type === 'repeater') && (
                              <div className="mt-4">
                                  <select
                                      onChange={(e) => {
                                          const newFieldType = e.target.value;
                                          const newFieldLabel = repeaterFieldTypes.find(t => t.type === newFieldType)?.label || 'New Field';
                                          const newFieldName = newFieldLabel.toLowerCase().replace(/\s+/g, '_');
                                          const newField = {
                                              name: newFieldName,
                                              label: newFieldLabel,
                                              type: newFieldType,
                                              placeholder: `Enter ${newFieldLabel.toLowerCase()}`,
                                              required: false,
                                              options: (newFieldType === 'checkbox' || newFieldType === 'radio' || newFieldType === 'select') ? ['Option 1'] : []
                                          };
                                          updateElement(element.id, { fields: [...(element.fields || []), newField] });
                                      }}
                                      className="w-full p-2 border border-gray-300 rounded-md"
                                  >
                                      <option value="">Add New Field</option>
                                      {repeaterFieldTypes.map(ft => (
                                          <option key={ft.type} value={ft.type}>{ft.label}</option>
                                      ))}
                                  </select>
                              </div>
                          )}
                        </div>
                      </div>
                    );
            default:
                return null;
        }
    };

    const [shareWith, setShareWith] = useState<'none' | 'all' | 'custom'>('none');
    const [customUsers, setCustomUsers] = useState<{ _id: string, name: string, email: string }[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ _id: string, name: string, email: string }[]>([]);


    const handleSubmit = async () => {

        const separatedData = formElements.reduce(
            (accumulator: AccumulatedFormData, element: FormElement): AccumulatedFormData => {
              // If the element is a 'repeater', we process it and push it into the 'repeatable' array.
              if (element.type === 'repeater') {
                accumulator.repeatable.push({
                  name: element.name,
                  label: element.label,
                  id: element.id,
                  type: 'repeatable', // Use the backend-friendly type name
                  required: element.required || false,
                  // The nested 'repeatable' object with its own fields
                  repeatable: {
                    fields: (element.fields || []).map(subField => ({
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
                // If it's any other type of element, we push it into the 'fields' array.
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
            { fields: [], repeatable: [] } as AccumulatedFormData // The starting value for our accumulator object
          );


        const formData = {
            name: formTitle,
            description: formDescription,
            shareWith: shareWith,
            customUsers: customUsers.map(item => item._id),
            fields: separatedData.fields,
            repeatable: separatedData.repeatable,
        };

        try {
            const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${id}`, formData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data.success) {
                toast.success('Form updated successfully!');
                router.push('/g-connector/form');
            } else {
                toast.error(response.data.message || 'Update failed');
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data.message || 'Update failed');
            } else {
                toast.error('Update failed');
            }
        }
    };

    useEffect(() => {
        if (shareWith === 'custom' && searchQuery.trim().length > 1) {
            const delayDebounce = setTimeout(async () => {
                try {
                    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/search?q=${searchQuery}`, {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    setSearchResults(res.data.data);
                } catch (err) {
                    console.error("User search failed", err);
                }
            }, 300); // debounce

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
                                className={`p-4 rounded-lg ${element.id !== null && typeof element.id !== 'undefined' && selectedElement?.id === element.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'}`}
                                onClick={() => setSelectedElement(element)}
                            >
                                {renderElement(element)}
                                {element.id !== null && typeof element.id !== 'undefined' && selectedElement?.id === element.id && (
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
                    <button
                        className={`py-2 px-4 font-medium ${activeTab === 'shareWith' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                        onClick={() => setActiveTab('shareWith')}
                    >
                        Share With
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

                                    {/* NEW: Repeater Field Settings in Element Settings */}
                                    {selectedElement?.type === 'repeater' && (
                                        <div className="border-t pt-4">
                                            <h2 className="text-lg font-semibold mb-3">Repeater Field Settings</h2>
                                            <div className="space-y-4">
                                                {(selectedElement.fields || []).map((field, index) => (
                                                    <div key={index} className="p-3 border rounded-md bg-gray-50">
                                                        <h3 className="font-medium mb-2">Field: {field.label || 'Untitled Field'}</h3>
                                                        <div>
                                                            <label className="block text-sm font-medium mb-1">Label</label>
                                                            <input
                                                                type="text"
                                                                value={field.label}
                                                                onChange={(e) => {
                                                                    const newFields = [...(selectedElement.fields || [])];
                                                                    newFields[index] = { ...field, label: e.target.value };
                                                                    updateElement(selectedElement.id, { fields: newFields });
                                                                }}
                                                                className="w-full p-2 border border-gray-300 rounded-md"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium mb-1">Placeholder</label>
                                                            <input
                                                                type="text"
                                                                value={field.placeholder || ''}
                                                                onChange={(e) => {
                                                                    const newFields = [...(selectedElement.fields || [])];
                                                                    newFields[index] = { ...field, placeholder: e.target.value };
                                                                    updateElement(selectedElement.id, { fields: newFields });
                                                                }}
                                                                className="w-full p-2 border border-gray-300 rounded-md"
                                                            />
                                                        </div>
                                                        <div className="flex items-center mt-2">
                                                            <input
                                                                type="checkbox"
                                                                id={`repeater-field-required-${index}`}
                                                                checked={field.required || false}
                                                                onChange={(e) => {
                                                                    const newFields = [...(selectedElement.fields || [])];
                                                                    newFields[index] = { ...field, required: e.target.checked };
                                                                    updateElement(selectedElement.id, { fields: newFields });
                                                                }}
                                                                className="mr-2"
                                                            />
                                                            <label htmlFor={`repeater-field-required-${index}`} className="text-sm">Required</label>
                                                        </div>
                                                        {(field.type === 'checkbox' || field.type === 'radio' || field.type === 'select') && (
                                                            <div className="mt-2">
                                                                <label className="block text-sm font-medium mb-1">Options</label>
                                                                <div className="space-y-2">
                                                                    {(field.options || []).map((option, optIndex) => (
                                                                        <div key={optIndex} className="flex">
                                                                            <input
                                                                                type="text"
                                                                                value={option}
                                                                                onChange={(e) => {
                                                                                    const newOptions = [...(field.options || [])];
                                                                                    newOptions[optIndex] = e.target.value;
                                                                                    const newFields = [...(selectedElement.fields || [])];
                                                                                    newFields[index] = { ...field, options: newOptions };
                                                                                    updateElement(selectedElement.id, { fields: newFields });
                                                                                }}
                                                                                className="flex-1 p-2 border border-gray-300 rounded-md"
                                                                            />
                                                                            <button
                                                                                onClick={() => {
                                                                                    const newOptions = [...(field.options || [])];
                                                                                    newOptions.splice(optIndex, 1);
                                                                                    const newFields = [...(selectedElement.fields || [])];
                                                                                    newFields[index] = { ...field, options: newOptions };
                                                                                    updateElement(selectedElement.id, { fields: newFields });
                                                                                }}
                                                                                className="ml-2 text-red-500"
                                                                            >
                                                                                ×
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                    <button
                                                                        onClick={() => {
                                                                            const newOptions = [...(field.options || []), 'New Option'];
                                                                            const newFields = [...(selectedElement.fields || [])];
                                                                            newFields[index] = { ...field, options: newOptions };
                                                                            updateElement(selectedElement.id, { fields: newFields });
                                                                        }}
                                                                        className="text-sm text-blue-500 hover:text-blue-700"
                                                                    >
                                                                        + Add Option
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                const newFields = (selectedElement.fields || []).filter((_, i) => i !== index);
                                                                updateElement(selectedElement.id, { fields: newFields });
                                                            }}
                                                            className="mt-3 text-red-500 hover:text-red-700 text-sm"
                                                        >
                                                            Remove Repeater Field
                                                        </button>
                                                    </div>
                                                ))}

                                                <div className="mt-4">
                                                    <h3 className="font-medium mb-2">Add New Repeater Field</h3>
                                                    <select
                                                        onChange={(e) => {
                                                            const newFieldType = e.target.value;
                                                            const newFieldLabel = repeaterFieldTypes.find(t => t.type === newFieldType)?.label || 'New Field';
                                                            const newFieldName = newFieldLabel.toLowerCase().replace(/\s+/g, '_');
                                                            const newField = {
                                                                name: newFieldName,
                                                                label: newFieldLabel,
                                                                type: newFieldType,
                                                                placeholder: `Enter ${newFieldLabel.toLowerCase()}`,
                                                                required: false,
                                                                options: (newFieldType === 'checkbox' || newFieldType === 'radio' || newFieldType === 'select') ? ['Option 1'] : []
                                                            };
                                                            updateElement(selectedElement.id, { fields: [...(selectedElement.fields || []), newField] });
                                                            e.target.value = ''; // Reset select after adding
                                                        }}
                                                        className="w-full p-2 border border-gray-300 rounded-md"
                                                    >
                                                        <option value="">Select Field Type</option>
                                                        {repeaterFieldTypes.map(ft => (
                                                            <option key={ft.type} value={ft.type}>{ft.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'shareWith' && (
                    <div className="mt-6 mb-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shared With</label>
                        <div className="flex gap-2 mb-4 cursor-pointer">
                            {['none', 'all', 'custom'].map(value => (
                                <button
                                    key={value}
                                    onClick={() => {
                                        setShareWith(value as 'none' | 'all' | 'custom');

                                        setCustomUsers([]);

                                    }}
                                    className={`px-4 cursor-pointer py-2 rounded-md text-sm font-medium transition ${shareWith === value
                                        ? 'bg-blue-700 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    {value === 'none' ? 'None' : value === 'all' ? 'Everyone' : 'Specific Users'}
                                </button>
                            ))}
                        </div>

                        {shareWith === 'custom' && (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="Search users by name or email"
                                    name="shareWith"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                />
                                {searchResults.length > 0 && (
                                    <ul className="bg-white border border-gray-300 rounded-md max-h-40 overflow-auto">
                                        {searchResults.map(user => (
                                            <li
                                                key={user._id}
                                                onClick={() => {
                                                    if (!customUsers.find(u => u._id === user._id)) {
                                                        setCustomUsers([...customUsers, user]);
                                                        setSearchResults([]);
                                                        setSearchQuery("")
                                                    }
                                                }}
                                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                            >
                                                {user.name} ({user.email})
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                <div className="flex flex-wrap gap-2">
                                    {customUsers.map(user => (
                                        <div
                                            key={user._id}
                                            className="bg-blue-100 text-sm text-blue-800 px-3 py-1 rounded-full flex items-center gap-2"
                                        >
                                            {user.name}
                                            <button
                                                onClick={() => setCustomUsers(customUsers.filter(u => u._id !== user._id))}
                                                className="text-red-600 hover:text-red-800 font-bold cursor-pointer"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
                >
                    Submit Form
                </button>
            </div>

            <ToastContainer />
        </div>
    );
}