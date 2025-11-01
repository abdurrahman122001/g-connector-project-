'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { useParams, useRouter } from 'next/navigation';
import { ReferenceList, FormElement, AccumulatedFormData } from '@/app/Interfaces';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';

export default function FormBuilder() {
    const router = useRouter();
    const { id } = useParams();

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

    // Share settings
    const [shareWith, setShareWith] = useState<'none' | 'all' | 'custom'>('none');
    const [customUsers, setCustomUsers] = useState<{ _id: string, name: string, email: string }[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ _id: string, name: string, email: string }[]>([]);
    const [referenceLists, setReferenceLists] = useState<ReferenceList[]>([]);

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
        { type: 'linkedSelect', label: 'Linked Select' },
        { type: 'toggle', label: 'Toggle Switch' },
        { type: 'qrcode', label: 'QR Code' },
        { type: 'gps', label: 'GPS Location' },
        { type: 'repeater', label: 'Repeater Group' },
    ];

    const networkElements = [
        { type: 'submit', label: 'Submit Button' },
    ];

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

    // Load reference lists
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

    // Improved fetchForm function with better error handling
    const fetchForm = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.data) {
                const formData = response.data.data;
                const elements: FormElement[] = [];

                // Handle regular fields
                if (formData.fields && Array.isArray(formData.fields)) {
                    formData.fields.forEach((field: any) => {
                        const element: FormElement = {
                            id: field.id || `field-${Date.now()}-${Math.random()}`,
                            type: field.type,
                            label: field.label,
                            name: field.name,
                            required: field.required || false,
                            placeholder: field.placeholder || '',
                            options: field.options || [],
                            linkedListId: field.linkedListId,
                            value: field.value,
                            latitude: field.latitude,
                            longitude: field.longitude
                        };
                        elements.push(element);
                    });
                }

                // Handle repeatable groups
                if (formData.repeatable && Array.isArray(formData.repeatable)) {
                    formData.repeatable.forEach((group: any) => {
                        const repeaterElement: FormElement = {
                            id: group.id || `repeater-${Date.now()}-${Math.random()}`,
                            type: 'repeater',
                            label: group.label,
                            name: group.name,
                            required: group.required || false,
                            fields: (group.fields || group.repeatable?.fields || []).map((field: any) => ({
                                name: field.name,
                                label: field.label,
                                type: field.type,
                                placeholder: field.placeholder || '',
                                required: field.required || false,
                                options: field.options || []
                            }))
                        };
                        elements.push(repeaterElement);
                    });
                }

                setFormElements(elements);
                setFormTitle(formData.name || 'Untitled Form');
                setFormDescription(formData.description || 'This is my form. Please fill it out. Thanks!');

                // Set share settings
                if (formData.formPermission) {
                    setShareWith(formData.formPermission.access || 'none');
                    setCustomUsers(formData.formPermission.users || []);
                }

                // Set design options if available
                if (formData.design) {
                    setBgColor(formData.design.bgColor || '#ffffff');
                    setFontFamily(formData.design.fontFamily || 'sans-serif');
                    setTextColor(formData.design.textColor || '#000000');
                    setTextAlign(formData.design.textAlign || 'inherit');
                }
            }
        } catch (error) {
            console.error('Error fetching form:', error);
            toast.error('Failed to load form data');
        }
    };

    useEffect(() => {
        if (id) {
            fetchForm();
        }
    }, [id]);

    // ✅ Add new element
    const addElement = (type: string, label: string) => {
        const machineName = label.toLowerCase().replace(/\s+/g, '_');
        const newElement: FormElement = {
            id: `element-${Date.now()}-${Math.random()}`,
            type,
            label,
            name: machineName,
            required: false,
            options: ['checkbox', 'radio', 'select', 'linkedSelect'].includes(type)
                ? ['Option 1', 'Option 2']
                : undefined,
            placeholder: ['file', 'toggle', 'qrcode', 'gps'].includes(type)
                ? undefined
                : `Enter ${label.toLowerCase()}`
        };

        if (type === 'repeater') {
            newElement.name = 'item_list';
            newElement.fields = [
                {
                    name: 'item_name',
                    label: 'Item Name',
                    type: 'text',
                    placeholder: 'Enter item name',
                    required: false,
                    options: []
                },
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
                        <label className="block text-sm font-medium mb-1">
                            {element.label}
                            {element.required && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                            placeholder={element.placeholder}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            rows={3}
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
                        <label className="block text-sm font-medium mb-1">
                            {element.label}
                            {element.required && <span className="text-red-500">*</span>}
                        </label>
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
                        {selectedElement?.id === element.id && element.type === 'linkedSelect' && (
                            <div className="mt-2 border-t pt-2">
                                <label className="block text-sm mb-1">Link to Reference List</label>
                                <select
                                    className="w-full border p-2 rounded-md text-sm"
                                    value={element.linkedListId || ''}
                                    onChange={async (e) => {
                                        const listId = e.target.value;
                                        updateElement(element.id, { linkedListId: listId });
                                        if (listId) {
                                            try {
                                                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/reference-lists/${listId}/items`, {
                                                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                                                });
                                                const firstCol = Object.keys(res.data.data[0] || {})[0];
                                                updateElement(element.id, {
                                                    options: res.data.data.map((row: any) => row[firstCol]),
                                                });
                                                toast.success('Loaded from reference list');
                                            } catch (error) {
                                                toast.error('Failed to load reference list');
                                            }
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
                        <span className="text-sm font-medium">
                            {element.label}
                            {element.required && <span className="text-red-500">*</span>}
                        </span>
                        <div
                            className={`w-10 h-5 rounded-full ${element.value ? 'bg-green-500' : 'bg-gray-400'
                                }`}
                        />
                    </div>
                );

            case 'qrcode':
                return (
                    <div className="mb-4 border p-3 rounded text-center">
                        <span className="block text-sm font-medium mb-1">
                            {element.label}
                            {element.required && <span className="text-red-500">*</span>}
                        </span>
                        <div className="font-mono bg-gray-100 p-2 rounded text-xs">
                            {element.value || 'QR CODE VALUE'}
                        </div>
                    </div>
                );

            case 'gps':
                return (
                    <div className="mb-4 border p-3 rounded-md">
                        <label className="block text-sm font-medium mb-1">
                            {element.label}
                            {element.required && <span className="text-red-500">*</span>}
                        </label>
                        <p className="text-xs text-gray-500">
                            Lat: {element.latitude || '—'} | Lng: {element.longitude || '—'}
                        </p>
                    </div>
                );

            case 'file':
                return (
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                            {element.label}
                            {element.required && <span className="text-red-500">*</span>}
                        </label>
                        <input type="file" disabled className="w-full border p-2 rounded-md" />
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
                                                        <input type={field.type} className="mr-2" disabled />
                                                        <span className="text-sm">{opt}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <input
                                                type={field.type}
                                                placeholder={field.placeholder || field.label}
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                                disabled
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
                                            if (!newFieldType) return;

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
                                            e.target.value = '';
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

            case 'submit':
                return (
                    <button
                        type="button"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-full"
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
        const separatedData = formElements.reduce(
            (accumulator: AccumulatedFormData, element: FormElement): AccumulatedFormData => {
                if (element.type === 'repeater') {
                    accumulator.repeatable.push({
                        name: element.name,
                        label: element.label,
                        id: element.id,
                        type: 'repeatable',
                        required: element.required || false,
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
                    accumulator.fields.push({
                        name: element.name,
                        label: element.label,
                        id: element.id,
                        type: element.type,
                        placeholder: element.placeholder,
                        required: element.required || false,
                        options: element.options || [],
                        linkedListId: element.linkedListId,
                        value: element.value,
                        latitude: element.latitude,
                        longitude: element.longitude
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
            customUsers: customUsers.map(item => item._id),
            fields: separatedData.fields,
            repeatable: separatedData.repeatable,
            design: {
                bgColor,
                fontFamily,
                textColor,
                textAlign
            }
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
            console.error('Update error:', error);
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
                    setSearchResults(res.data.data || []);
                } catch (err) {
                    console.error("User search failed", err);
                    setSearchResults([]);
                }
            }, 300);

            return () => clearTimeout(delayDebounce);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery, shareWith]);

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Form Preview - Added right margin to account for sidebar */}
            <div
                className="flex-1 p-8 flex flex-col items-center justify-start mr-96"
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
                        suppressContentEditableWarning
                        onBlur={(e) => setFormTitle(e.currentTarget.textContent || 'Untitled Form')}
                    >
                        {formTitle}
                    </h1>
                    <p
                        className="text-lg mb-8"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setFormDescription(e.currentTarget.textContent || 'This is my form. Please fill it out. Thanks!')}
                    >
                        {formDescription}
                    </p>
                    <div className="border-t border-gray-300 my-6"></div>

                    {/* Rendered Form Elements with Drag & Drop */}
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="formElements">
                            {(provided) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-6">
                                    {formElements.map((element, index) => (
                                        <Draggable key={element.id} draggableId={element.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={`p-4 rounded-lg ${snapshot.isDragging
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

            {/* Fixed Controls Sidebar */}
            <div className="w-96 bg-white border-l border-gray-200 flex flex-col fixed right-0 top-0 bottom-0">
                {/* Tabs */}
                <div className="flex border-b border-gray-200 p-4">
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

                {/* Scrollable Tab Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'design' && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold mb-4">Global</h2>
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

                            <h2 className="text-lg font-semibold mb-4">Text</h2>
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
                                            onClick={() => addElement(el.type, el.label)}
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
                                            onClick={() => addElement(el.type, el.label)}
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
                                                                if (!newFieldType) return;

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
                                                                e.target.value = '';
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
                        <div>
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
                                                            setSearchQuery("");
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
                </div>

                {/* Fixed Update Button at Bottom */}
                <div className="p-4 border-t border-gray-200 bg-white">
                    <button
                        onClick={handleSubmit}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer font-medium"
                    >
                        Update Form
                    </button>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
}