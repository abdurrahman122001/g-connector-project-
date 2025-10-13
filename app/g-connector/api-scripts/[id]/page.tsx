'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiCode, FiEdit, FiTrash2, FiClock, FiFileText, FiPlus, FiX } from 'react-icons/fi'; // Import new icons
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    DndContext,
    useSensor,
    useSensors,
    PointerSensor,
    KeyboardSensor

} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    arrayMove,
    sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';
import ConfirmationToastComponent from '../../../components/ConfirmationToast';
import ApiScriptFieldMapping from '../upload/ApiScriptFieldMapping';

interface ApiScript {
    _id: string;
    name: string;
    apiType: string;
    format: string;
    endpoint: string;
    method: string;
    headers: string;
    body: string;
    formMapping: {
        formId: {
            id: string;
            name: string;
            fields: { label: string }[];
            _id?: string;

        };
    };
    createdAt: Date;
    updatedAt: Date;
}

const editSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    formMapping: z.string().min(1, 'Form mapping is required'),
    endpoint: z.string().min(1, 'Endpoint is required'),
    apiType: z.string().min(1, 'API type is required'),
    format: z.string().min(1, 'Format is required'),
    method: z.string().min(1, 'Method is required'),
    headers: z.optional(z.string()),
    body: z.optional(z.string()),
});

type EditFormData = z.infer<typeof editSchema>;

function DraggableItem(props: {
    id: string;
    apiFieldsFromData: string;
    isAPIField?: boolean;
    onRemove?: (id: string) => void;
    style?: React.CSSProperties;
}) {
    const { attributes, setNodeRef, transform, transition, listeners } = useSortable({
        id: props.id,
        data: { type: props.isAPIField ? 'api' : 'form' }
    });



    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: 'grab',
        padding: '8px',
        width: '90%',
        border: '1px solid #ccc',
        borderRadius: '4px',
        background: 'white',
        marginBottom: '4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...props.style,
    };

    return (
        <li ref={setNodeRef} style={style} {...attributes} {...listeners}> {/* Add data-type */}
            {props.apiFieldsFromData}

        </li>
    );
}

interface FormDetails {
    id: any;
    name: string;
    description: string;

}


const ApiScriptDetailsPage = () => {
    const [forms, setForms] = useState<any[]>([]);


    const { id } = useParams();
    const router = useRouter();

    const [activeId, setActiveId] = React.useState(null);

    const [fields, setFields] = useState<string[]>([]);
    const [apiData, setApiData] = useState<any[]>([]);
    const [script, setScript] = useState<ApiScript | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [needsMapping, setNeedsMapping] = useState(false);
    const [formDetails, setFormDetails] = useState<FormDetails>({
        id: '',
        name: '',
        description: '',
    });


    const [apiFieldsFromData, setApiFieldsFromData] = useState<string[]>([]);

    const [newFieldName, setNewFieldName] = useState('');

    const [addingFieldToList, setAddingFieldToList] = useState<'api' | 'form' | null>(null); // Track where to add a new field
    const [fieldMapping, setFieldMapping] = useState<any>({});
    const [draggableFormFields, setDraggableFormFields] = useState<string[]>([]);


    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<EditFormData>({
        resolver: zodResolver(editSchema),
        defaultValues: {
            name: script?.name,
            formMapping: script?.formMapping?.formId?._id,
            endpoint: script?.endpoint,
            apiType: script?.apiType,
            format: script?.format,
        }
    });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchScript = async () => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/api-scripts/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );
            if (!res.ok) throw new Error('Failed to fetch script');
            const data = await res.json();
            setScript(data.data);

            setFormDetails(data.data?.formMapping?.formId || []);

            setFieldMapping(data.data?.formMapping?.formId?.fields.map((field: any) => field.label) || []);
            reset({
                name: data.data.name,
                apiType: data.data.apiType,
                format: data.data.format,
                method: data.data.method,
                headers: data.data.headers,
                body: data.data.body,

                endpoint: data.data.endpoint,
                formMapping: data.data.formMapping?.formId?._id,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchForms = async () => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        if (response.ok) {
            setForms(data.data);
        }
    };


    useEffect(() => {

        fetchScript();

        fetchForms();

    }, [id, reset]);



    const handleEdit = async (data: EditFormData) => {
        try {

            if (data.headers == '') {
                data.headers = undefined;
            }
            if (data.body == '') {
                data.body = undefined;
            }


            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/api-scripts/${id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(data),
                }
            );

            if (!response.ok) throw new Error('Update failed');

            const updatedScript = await response.json();
            setScript(updatedScript);
            setIsEditing(false);
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Update failed');
        }
        fetchScript();
    };

    const handleDelete = async () => {
        const performDelete = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/api-scripts/${id}`,
                    {
                        method: 'DELETE',
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    }
                );

                if (!response.ok) throw new Error('Deletion failed');

                router.push('/g-connector/api-scripts');
            } catch (error) {
                alert(error instanceof Error ? error.message : 'Deletion failed');
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

    const mapToForm = async () => {
        try {

            const postData = {
                formId: script?.formMapping?.formId?.id,
                fieldMappings: apiFieldsFromData.map((apiField, index) => ({
                    apiField: apiField,
                    formField: Object.values(fieldMapping)[index] || null
                })
                ),

            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/api-scripts/${id}/map-to-form`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(postData),
                }
            );

            if (!response.ok) throw new Error('Execution failed');

            toast.success('Enpoint connected successfully!');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Execution failed');
        }
    };

    const ExecuteScript = async () => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/api-scripts/${id}/execute`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({ endpoint: script?.endpoint }),
                }
            );

            if (!response.ok) throw new Error('Execution failed');

            return response.json();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Execution failed');
        }
    };


    const fetchFormById = async () => {


        if (!script?.formMapping?.formId?.id) return false;



        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${script?.formMapping?.formId?.id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        });
        return await response.json();

    }

    function xmlToJson(xmlString: string): Record<string, any> {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "application/xml");

        function nodeToJson(node: Element | ChildNode): any {
            const obj: Record<string, any> = {};

            // Handle attributes
            if ((node as Element).attributes && (node as Element).attributes.length > 0) {
                obj["@attributes"] = {};
                Array.from((node as Element).attributes).forEach(attr => {
                    obj["@attributes"][attr.name] = attr.value;
                });
            }

            // Handle child nodes
            if (node.hasChildNodes()) {
                Array.from(node.childNodes).forEach(child => {
                    if (child.nodeType === 1) {
                        const childElement = child as Element;
                        const childName = childElement.nodeName;
                        const childJson = nodeToJson(childElement);

                        if (obj[childName]) {
                            if (!Array.isArray(obj[childName])) {
                                obj[childName] = [obj[childName]];
                            }
                            obj[childName].push(childJson);
                        } else {
                            obj[childName] = childJson;
                        }
                    } else if (child.nodeType === 3) {
                        const text = child.nodeValue?.trim();
                        if (text) {
                            obj["#text"] = text;
                        }
                    }
                });
            }

            return obj;
        }

        const rootNode = xmlDoc.documentElement;
        const rootName = rootNode.nodeName;
        const result: Record<string, any> = {
            [rootName]: nodeToJson(rootNode)
        };

        return result;
    }




    function getAllUniqueKeys(input: any): any {
        const keys = new Set();

        const items = Array.isArray(input) ? input : [input]; // Normalize to array

        items.forEach(item => {
            const flat = flattenObject(item); // assuming flattenObject is defined elsewhere
            Object.keys(flat).forEach(key => keys.add(key));
        });

        return Array.from(keys);
    }

    // Helper to flatten nested objects
    function flattenObject(obj: any, parent: string = "", res: { [key: string]: any } = {}) {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) { // Check if the property is directly on the object
                const propName = parent ? `${parent}.${key}` : key;
                if (
                    typeof obj[key] === "object" &&
                    obj[key] !== null &&
                    !Array.isArray(obj[key])
                ) {
                    flattenObject(obj[key], propName, res);
                } else {
                    res[propName] = obj[key];
                }
            }
        }
        return res;
    }

    const getHeadersAndValues = (data: any) => {
        let headers: string[] = [];
        let tableData: Record<string, any>[] = [];

        // Determine the base array to work with
        let dataArray: any[] = [];

        if (script?.apiType === 'REST') {
            dataArray = Array.isArray(data) ? data : [];

        } else if (script?.apiType === 'GraphQL') {
            // Attempt to find the first array inside GraphQL's "data" key
            const graphQLData = data?.data || {};
            const mainArrayKey = Object.keys(graphQLData).find(
                (key) => Array.isArray(graphQLData[key])
            );
            dataArray = graphQLData?.[mainArrayKey || ""] || [];
        }

        if (Array.isArray(dataArray) && dataArray.length > 0) {
            
            headers = getAllUniqueKeys(dataArray);

            tableData = dataArray.map((item: any) => {
                const flatItem = flattenObject(item);
                const rowObject: Record<string, any> = {};
                headers.forEach((header) => {
                    rowObject[header] = flatItem[header] || "";
                });
                return rowObject;
            });
        }

        return { headers, tableData };
    };




    const updateFormMappingAfterExecution = async () => {
        const executeData = await ExecuteScript();
        const getData = await fetchFormById();

        const formData = getData === false ? script?.formMapping?.formId : getData.data;
        const responseData = executeData?.data?.data || {};

        const formFields = formData?.fields.map((field: any) => field.label) || [];

        
        // Identify the main key that contains the array
        const mainArrayKey = Object.keys(responseData).find(
            (key) => Array.isArray(responseData[key])
        );
        

        let dataArray = responseData?.[mainArrayKey || ""] || responseData || [];

                
        const { headers, tableData } = getHeadersAndValues(dataArray);
 
        setApiData(tableData); // Now it's an array of objects with keys
        setApiFieldsFromData(headers);
        
        setFields(formFields);
        
        setDraggableFormFields(formFields);

        const extra = headers.filter((key: any) => !formFields.includes(key));
        const missing = formFields.filter((field: any) => !headers.includes(field));

        
        setNeedsMapping(extra.length > 0 || missing.length > 0);
    };





    const handleStartAddingNewField = (list: 'api' | 'form') => {
        setAddingFieldToList(list);
        setNewFieldName('');
    };

    const handleCreateNewField = async (list: 'api' | 'form') => {
        if (!newFieldName.trim()) {
            toast.error('Field name cannot be empty.');
            return;
        }
        if (list === 'api') {
            setApiFieldsFromData(prev => [...prev, newFieldName.trim()]);

        } else if (list === 'form') {
            setDraggableFormFields(prev => [...prev, newFieldName.trim()]);
            setFields(prev => [...prev, newFieldName.trim()]);
            setFieldMapping((prevMapping: any) => ({
                ...prevMapping,
                [newFieldName.trim()]: newFieldName.trim(), // Map the new field name to itself or adjust as needed
            }));


        }
        setAddingFieldToList(null);
        setNewFieldName('');
    };

    useEffect(() => {

        if (script?.formMapping?.formId?.id) {

            updateFormMapping();
            updateFormMappingAfterExecution();
        }


        if (!needsMapping && Object.values(fieldMapping).length > 0 && apiFieldsFromData.length > 0) {
            mapToForm();
        }
    }, [fieldMapping]);

    const handleCancelNewField = () => {
        setAddingFieldToList(null);
        setNewFieldName('');
    };

    // Update state to remove API field and its mapping
    const handleRemoveAPIField = (apiField: string) => {
        console.log("Removing API Field:", apiField);
        setApiFieldsFromData(prev => {
            const updatedFields = prev.filter(field => field !== apiField);
            console.log("Updated API Fields:", updatedFields);
            return updatedFields;
        });


        setFieldMapping((prevMapping: any) => {
            const newMapping = { ...prevMapping };
            delete newMapping[apiField];
            console.log("Updated Field Mapping:", newMapping);
            return newMapping;
        });
    };


    const updateFormMapping = async () => {


        const formData = {
            name: formDetails.name,
            description: formDetails.description,
            fields: Object.values(fieldMapping).map(key => ({
                label: key, // Assuming key is the label
                type: 'text', // Ensure fieldMapping[key] has a type property
                name: key, // Ensure fieldMapping[key] has a name property
                required: false,
                options: [],
            })),
        };


        try {
            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/api/forms/${script?.formMapping?.formId?.id}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (!response.data.success) throw new Error('Update failed');



        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Update failed');
        }
    };



    // Update state to remove form field and its mapping
    const handleRemoveFormField = (formField: string) => {


        setDraggableFormFields(prev => {
            const updatedFields = prev.filter(field => field !== formField);
            console.log("Updated Form Fields:", updatedFields);
            return updatedFields;
        });
        setFields(prev => prev.filter(field => field !== formField));

        setFieldMapping((prevMapping: any) => {

            const newMapping = { ...prevMapping };
            Object.keys(newMapping).forEach(key => {
                console.log('key deleting is ', key);
                if (newMapping[key] === formField) {
                    delete newMapping[key];
                }
            });

            return newMapping;
        });

    };

    const onDragEnd = (event: any) => {
        const { active, over } = event;

        if (!over || !active) {
            return; // Exit if not over a droppable area
        }


        setDraggableFormFields((items) => {
            const oldIndex = items.indexOf(active.id);
            const newIndex = items.indexOf(over.id);

            return arrayMove(items, oldIndex, newIndex);
        });

        setFieldMapping((items: any) => {
            const oldIndex = items.indexOf(active.id);
            const newIndex = items.indexOf(over.id);

            return arrayMove(items, oldIndex, newIndex);

        });



    }

    const saveData = async () => {
        try {
            const body = {
                data: extractTableData(),
                name: script?.name,
                field_keys: fields
            };

            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/forms/${script?.formMapping?.formId?.id}/submissions`,
                body,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (!response.data.success) throw new Error('Save failed');

            toast.success('Data saved successfully!');



        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Save failed');
        }
    }

    const handleDragStart = (event: any) => {
        setActiveId(event?.active?.id);

    };


    const extractTableData = () => {
        if (!apiData || !fields || !fieldMapping) {
            return []; // Return an empty array if any of these are missing
        }

        const extractedData = apiData.map(item => {
            return fields.map(field => {
                const mappedField = fieldMapping[field] || field; // Get the mapped field name or use the original if no mapping
                let value = item[mappedField];
                // Handle nested objects (address.street) to handle cases
                if (typeof mappedField === 'string' && mappedField.includes('.')) {

                    const keys = mappedField.split('.');

                    let nestedValue = item;

                    for (const key of keys) {
                        nestedValue = nestedValue ? nestedValue[key] : '';
                    }
                    value = nestedValue;

                }

                // Handle default cases
                return value != null ? value : ''; // Default return to avoid nulls
            });
        });

        return extractedData;
    };


    const handleDragCancel = () => {
        setActiveId(null);

    };

    const findContainer = (id: any) => {
        if (draggableFormFields.includes(id)) {
            return 'formFields';
        }
        if (apiFieldsFromData.includes(id)) {
            return 'apiFields';
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return <div className="alert alert-error">{error}</div>;
    }

    if (!script) {
        return <div className="alert alert-warning">Script not found</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">API Script Details</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded shadow flex items-center gap-2 transition duration-200"
                    >
                        <FiEdit /> {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                    <button
                        onClick={handleDelete}
                        className="cursor-pointer bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded shadow flex items-center gap-2 transition duration-200"
                    >
                        <FiTrash2 /> Delete
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                {isEditing ? (
                    <form onSubmit={handleSubmit(handleEdit)} className="space-y-6">
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Script Name</label>
                            <input
                                {...register('name')}
                                type="text"

                                className={`input ${errors.name ? 'input-error' : 'input-primary'} rounded-md border-2 border-gray-300 focus:border-blue-500 focus:outline-none`}
                                placeholder="My API Integration"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <FiX className="flex-shrink-0" /> {errors.name.message}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint</label>
                            <input
                                {...register('endpoint')}
                                type="url"

                                className={`input ${errors.endpoint ? 'input-error' : 'input-primary'} rounded-md border-2 border-gray-300 focus:border-blue-500 focus:outline-none`}
                                placeholder="https://api.example.com/v1/users"
                            />
                            {errors.endpoint && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <FiX className="flex-shrink-0" /> {errors.endpoint.message}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium text-gray-700 mb-1">API Type</label>
                                <select
                                    {...register('apiType')}

                                    className={`input ${errors.apiType ? 'input-error' : 'input-primary'} rounded-md border-2 border-gray-300 focus:border-blue-500 focus:outline-none`}
                                >
                                    <option value="">Select API Type</option>
                                    <option value="REST">REST</option>
                                    <option value="GraphQL">GraphQL</option>
                                    <option value="WebSocket">WebSocket</option>
                                </select>
                                {errors.apiType && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <FiX className="flex-shrink-0" /> {errors.apiType.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data Format</label>
                                <select
                                    {...register('format')}

                                    className={`input ${errors.format ? 'input-error' : 'input-primary'} rounded-md border-2 border-gray-300 focus:border-blue-500 focus:outline-none`}
                                >
                                    <option value="">Select Format</option>
                                    <option value="JSON">JSON</option>
                                    <option value="XML">XML</option>
                                </select>
                                {errors.format && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <FiX className="flex-shrink-0" /> {errors.format.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Form Mapping</label>
                            <select
                                {...register('formMapping')}

                                className={`input ${errors.formMapping ? 'input-error' : 'input-primary'} rounded-md border-2 border-gray-300 focus:border-blue-500 focus:outline-none`}
                            >
                                <option value="">Select Form Mapping</option>
                                {forms.map((form) => (
                                    <option key={form._id} value={form._id}>{form.name}</option>
                                ))}
                            </select>
                            {errors.formMapping && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <FiX className="flex-shrink-0" /> {errors.formMapping.message}
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-gray-700 mb-1">HTTP Method</label>
                            <select
                                {...register('method')}

                                className={`input ${errors.method ? 'input-error' : 'input-primary'} rounded-md border-2 border-gray-300 focus:border-blue-500 focus:outline-none`}
                            >
                                <option value="">Select Method</option>
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="PATCH">PATCH</option>
                                <option value="DELETE">DELETE</option>
                            </select>
                            {errors.method && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <FiX className="flex-shrink-0" /> {errors.method.message}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Headers</label>
                            <textarea
                                {...register('headers')}

                                className={`input ${errors.headers ? 'input-error' : 'input-primary'} rounded-md border-2 border-gray-300 focus:border-blue-500 focus:outline-none`}
                                placeholder="Key: Value pairs, e.g., Authorization: Bearer token"
                            />
                            {errors.headers && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <FiX className="flex-shrink-0" /> {errors.headers.message}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                            <textarea
                                {...register('body')}

                                className={`input ${errors.body ? 'input-error' : 'input-primary'} rounded-md border-2 border-gray-300 focus:border-blue-500 focus:outline-none`}
                                placeholder="Request body content"
                            />
                            {errors.body && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <FiX className="flex-shrink-0" /> {errors.body.message}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition duration-200"
                            >
                                Back
                            </button>
                            <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded-md flex items-center gap-2 hover:bg-blue-600 transition duration-200">
                                Save Changes
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                                <FiCode size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">{script.name}</h2>
                                <p className="text-gray-500">API Script</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            <div className="border rounded-lg p-4">
                                <h3 className="font-medium text-gray-700 mb-2">Details</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">API Type:</span>
                                        <span className="font-medium">{script.apiType}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Data Format:</span>
                                        <span className="font-medium">{script.format}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Form Mapping:</span>
                                        <span className="font-medium">
                                            {script.formMapping?.formId?.name}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="border rounded-lg p-4">
                                <h3 className="font-medium text-gray-700 mb-2">Timestamps</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <FiClock />
                                        <span>Created: {new Date(script.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <FiClock />
                                        <span>Updated: {new Date(script.updatedAt).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border rounded-lg p-4 mt-4">
                            <h3 className="font-medium text-gray-700 mb-2">
                                Script Endpoint
                            </h3>
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                                <FiFileText className="text-gray-500" />
                                <span>{script.endpoint}</span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => router.push('/g-connector/api-scripts')}
                                className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition duration-200"
                            >
                                Back
                            </button>
                            <button
                                type="button"

                                onClick={saveData}
                                disabled={fields.length < 0 && apiData.length < 0}
                                className="bg-green-500 text-white py-2 px-4 rounded-md flex items-center gap-2 hover:bg-green-600 transition duration-200"
                            >
                                Save Data
                            </button>
                        </div>
                    </div>
                )}

                {needsMapping && !isEditing && (
                    <ApiScriptFieldMapping scriptId={String(id)} />
                )}

                
            </div>
            <ToastContainer />
        </div>
    );
};

export default ApiScriptDetailsPage;