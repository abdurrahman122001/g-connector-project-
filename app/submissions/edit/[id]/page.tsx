'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { index } from 'd3';


type FormElement = {
    name: string;
    id: string;
    type: string;
    label: string;
    required?: boolean;
    options?: string[];
    placeholder?: string;
};


export default function SubmissionEdit() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const indexStr = searchParams.get('index');

    const indexIs: number | null = indexStr !== null ? Number(indexStr) : null;


    const [formTitle, setFormTitle] = useState('Untitled Form');
    const [dataAndFieldKeys, setDataAndFieldKeys] = useState<Array<{ [key: string]: any }>>([]); // Initialize as array
    const [formDescription, setFormDescription] = useState('Checkbox description');

    const [bgColor, setBgColor] = useState('#F3F4F6');
    const [contentBgColor, setContentBgColor] = useState('#ffffff');
    const [fontFamily, setFontFamily] = useState('sans-serif');
    const [textColor, setTextColor] = useState('#000000');
    const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'inherit'>('left');

    const [formElements, setFormElements] = useState<FormElement[]>([]);
    const [selectedElement, setSelectedElement] = useState<FormElement | null>(null); // For structural changes

    const { id } = useParams();

    const fetchForm = async (formId: string) => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${formId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.data) {
                const formData = response.data.data;
                const fetchedElements: FormElement[] = formData.fields.map((el: any) => ({
                    id: el.id, // Ensure ID is string
                    label: el.label,
                    name: el.name, // This 'name' should correspond to keys in submission data
                    options: el.options,
                    type: el.type,
                    placeholder: el.placeholder,
                    required: el.required || false,
                }));
                setFormElements(fetchedElements);
                setFormTitle(formData.name);
                setFormDescription(formData.description);
            }
        } catch (error) {
            console.error("Error fetching form details:", error);
            toast.error("Failed to load form details.");
        }
    };

    const fetchSubmissions = async () => {
        if (!id) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${id}/submissionsIndividual`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!res.ok) throw new Error('Failed to fetch submission data');
            const data = await res.json();

            if (data.data && data.data.data && data.data.field_keys) {
                // field_keys are the names of the fields, e.g., ["id", "title", "description_field"]
                // data.data.data is an array of arrays, e.g., [[1, "Mascara", "Good one"], [2, "Lipstick", "Red"]]
                const submissionsArray = data.data.data.map((row: any[]) =>
                    Object.fromEntries(data.data.field_keys.map((key: string, index: number) => [key, row[index]]))
                );
                setDataAndFieldKeys(submissionsArray); // This is now an array of submission objects
                if (data.data.form) {
                    fetchForm(data.data.form);
                }
            } else {
                throw new Error('Submission data is not in expected format');
            }
        } catch (err) {
            console.error("Error fetching submissions:", err);
            toast.error((err as Error).message || 'Failed to load submission data.');
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, [id]);

    const handleInputChange = (elementName: string, newValue: any) => {
        if (indexIs === null) return;

        setDataAndFieldKeys(prevData => {
            const newData = [...prevData]; // Create a shallow copy of the submissions array
            if (newData[indexIs]) {
                // Create a shallow copy of the specific submission object being edited
                newData[indexIs] = {
                    ...newData[indexIs],
                    [elementName]: newValue
                };
            }
            return newData;
        });
    };



    const renderElement = (element: FormElement) => {
        // Use element.name as the primary key for data mapping
        const dataKey = element.label;
        let value = '';

        if (indexIs !== null && dataAndFieldKeys[indexIs] && dataAndFieldKeys[indexIs].hasOwnProperty(dataKey)) {
            value = dataAndFieldKeys[indexIs][dataKey];
        }

        const displayValue = value === null || value === undefined ? '' : String(value);

        const inputBaseClass = "w-full p-2.5 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500";
        // Special class for the "title" field if its name is 'title' or label contains 'title' for visual consistency with image
        const titleInputClass = (element.name === 'title' || element.label.toLowerCase().includes('title')) ?
            "w-full p-2.5 border-2 border-black rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            : inputBaseClass;

        switch (element.type) {
            case 'text':
            case 'number':
            case 'email':
            case 'date':
                return (
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            {element.label}
                            {element.required && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type={element.type}
                            name={element.name}
                            placeholder={element.placeholder}
                            className={element.name === 'title' ? titleInputClass : inputBaseClass}
                            value={displayValue}
                            onChange={(e) => handleInputChange(dataKey, e.target.value)}
                        />
                    </div>
                );
            case 'textarea':
                return (
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            {element.label}
                            {element.required && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                            name={element.name}
                            placeholder={element.placeholder}
                            className={`${inputBaseClass} min-h-[60px]`}
                            rows={3}
                            value={displayValue}
                            onChange={(e) => handleInputChange(dataKey, e.target.value)}
                        ></textarea>
                    </div>
                );
            case 'checkbox':

                const currentCheckedOptions: string[] = Array.isArray(value) ? value : (typeof value === 'string' && value ? value.split(',') : []);

                return (
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                            {element.label}
                            {element.required && <span className="text-red-500">*</span>}
                        </label>
                        <div className="space-y-1.5">
                            {element.options?.map((option, i) => (
                                <div key={i} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name={`${element.name}-${option}`} // Unique name for each checkbox for form handling if needed
                                        value={option}
                                        className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded-sm focus:ring-offset-0 focus:ring-blue-500"
                                        checked={currentCheckedOptions.includes(option)}
                                        onChange={(e) => {
                                            const newCheckedOptions = [...currentCheckedOptions];
                                            if (e.target.checked) {
                                                if (!newCheckedOptions.includes(option)) {
                                                    newCheckedOptions.push(option);
                                                }
                                            } else {
                                                const index = newCheckedOptions.indexOf(option);
                                                if (index > -1) {
                                                    newCheckedOptions.splice(index, 1);
                                                }
                                            }
                                            // Store as comma-separated string or array based on your backend needs
                                            // For this example, storing as an array. Adjust if backend expects string.
                                            handleInputChange(dataKey, newCheckedOptions);
                                            // If you need a comma-separated string:
                                            // handleInputChange(dataKey, newCheckedOptions.join(','));
                                        }}
                                    />
                                    <span className="text-sm text-gray-700">{option}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'radio':
                return (
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                            {element.label}
                            {element.required && <span className="text-red-500">*</span>}
                        </label>
                        <div className="space-y-1.5">
                            {element.options?.map((option, i) => (
                                <div key={i} className="flex items-center">
                                    <input
                                        type="radio"
                                        name={element.name} // Radio group uses the same name
                                        value={option}
                                        className="mr-2 h-4 w-4 text-blue-600 border-gray-300 focus:ring-offset-0 focus:ring-blue-500"
                                        checked={displayValue === option}
                                        onChange={(e) => handleInputChange(dataKey, e.target.value)}
                                    />
                                    <span className="text-sm text-gray-700">{option}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'select':
                return (
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            {element.label}
                            {element.required && <span className="text-red-500">*</span>}
                        </label>
                        <select
                            name={element.name}
                            className={inputBaseClass}
                            value={displayValue}
                            onChange={(e) => handleInputChange(dataKey, e.target.value)}
                        >
                            {element.placeholder && <option value="">{element.placeholder}</option>}
                            {element.options?.map((option, i) => (
                                <option key={i} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                );
            case 'file':
                // dataKey is element.label
                // value is dataAndFieldKeys[indexIs]?.[dataKey]

                const currentFileValue = (indexIs !== null && dataAndFieldKeys[indexIs])
                    ? dataAndFieldKeys[indexIs][dataKey]
                    : null;

                // Helper to display current file info
                const renderCurrentFileInfo = () => {
                    if (currentFileValue instanceof File) {
                        // A new file has been selected via the input, but not yet submitted
                        return (
                            <p className="text-sm text-gray-700 mt-1">
                                Selected file: {currentFileValue.name}
                            </p>
                        );
                    } else if (typeof currentFileValue === 'string' && currentFileValue.trim() !== '') {
                        // An existing file (URL or just a filename string from the backend)
                        const isUrl = currentFileValue.startsWith('http') || currentFileValue.startsWith('/');
                        const fileName = isUrl ? currentFileValue.split('/').pop() || currentFileValue : currentFileValue;

                        if (isUrl) {
                            return (
                                <p className="text-sm text-gray-700 mt-1">
                                    Current file: {' '}
                                    <a
                                        href={currentFileValue}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                    >
                                        {fileName}
                                    </a>
                                </p>
                            );
                        }
                        return (
                            <p className="text-sm text-gray-700 mt-1">
                                Current file: {fileName}
                            </p>
                        );
                    }
                    return (
                        <p className="text-sm text-gray-500 italic mt-1">
                            No file currently associated.
                        </p>
                    );
                };

                return (
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            {element.label}
                            {element.required && <span className="text-red-500">*</span>}
                        </label>

                        {/* Display current file info or selection */}
                        {renderCurrentFileInfo()}

                        {/* File input for uploading/changing the file */}
                        <input
                            type="file"
                            name={element.name} // Corresponds to the field's machine name
                            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mt-2"
                            onChange={(e) => {
                                const file = e.target.files && e.target.files.length > 0 ? e.target.files[0] : null;
                                // Update the state with the File object or null if cleared (though clearing is browser-dependent)
                                // 'dataKey' here is 'element.label'
                                handleInputChange(dataKey, file);
                            }}
                        // To allow re-selecting the same file if the user clicks away and then back
                        // you can set value to '' but this can be tricky with controlled components.
                        // For simplicity, we'll rely on onChange.
                        />
                        {/* 
                              If you want an explicit "Remove" button for the file:
                              {currentFileValue && (
                                <button
                                    type="button"
                                    onClick={() => handleInputChange(dataKey, null)}
                                    className="mt-1 text-xs text-red-600 hover:text-red-800"
                                >
                                    Remove file
                                </button>
                              )}
                            */}
                    </div>
                );
            default:
                return null;
        }
    };

    // handleSubmit for updating form STRUCTURE
    // This function is being repurposed to submit user data values,
    // similar to the Postman example.
    // Consider renaming it to something like 'handleSubmitSubmissionData' for clarity.
    const handleSubmitFormStructure = async () => {
        if (indexIs === null || !dataAndFieldKeys[indexIs]) {
            toast.error("No submission data selected or available to submit.");
            return;
        }

        const currentSubmissionData = dataAndFieldKeys[indexIs];
        const apiPayload = new FormData();

        // // Iterate over formElements to determine how to format each piece of data
        // formElements.forEach(element => {
        //     // Assuming element.label is the key used in currentSubmissionData
        //     // and also the key expected by the API (e.g., "Username", "Vehicles", "PDF File")
        //     const dataKeyForSubmission = element.label;
        //     let value = currentSubmissionData[dataKeyForSubmission];

        //     // Skip if value is undefined. If null should be sent as empty, adjust this.
        //     if (value === undefined) {
        //         return;
        //     }
        //     if (value === null) {
        //         // Decide how nulls are sent, e.g. as empty string for non-file/non-array fields
        //         // For arrays or files, null might mean 'not present' or an empty submission.
        //         // If you want to explicitly send an empty value for nulls:
        //         // apiPayload.append(`data[${dataKeyForSubmission}]`, '');
        //         // return; // Or continue to specific handling below
        //     }


        //     if (element.type === 'file') {
        //         if (value instanceof File) {
        //             // If 'value' is a File object (from a new file selection in your UI)
        //             apiPayload.append(`data[${dataKeyForSubmission}]`, value, value.name);
        //         } else if (typeof value === 'string' && value.trim() !== '') {
        //             // If 'value' is a string (e.g., existing filename/URL).
        //             // This sends the string, NOT the file content like Postman's fs.createReadStream.
        //             // Your backend must handle this string appropriately.
        //             apiPayload.append(`data[${dataKeyForSubmission}]`, value);
        //         } else if (value === null || (typeof value === 'string' && value.trim() === '')) {
        //             // If you need to signify 'no file' or 'remove file' explicitly with form-data,
        //             // you might append an empty string or a specific marker if your backend expects it.
        //             // Example: apiPayload.append(`data[${dataKeyForSubmission}]`, '');
        //             // Often, not appending the key is sufficient for 'no file'.
        //         }
        //         // If value is null or empty string and you don't want to send anything, it's handled by not appending.
        //     } else if (Array.isArray(value)) {
        //         // For array values (e.g., from checkboxes, multi-selects)
        //         if (value.length === 0) {
        //             // How to represent empty arrays in form-data for your backend?
        //             // Option 1: Send a special marker (e.g., data[Vehicles][]=) if backend expects it for empty array.
        //             // apiPayload.append(`data[${dataKeyForSubmission}][]`, '');
        //             // Option 2: Send nothing (default if this block is empty). Backend interprets missing key as empty.
        //             // Option 3: Send data[Vehicles] = "" (less common for arrays).
        //             // apiPayload.append(`data[${dataKeyForSubmission}]`, '');
        //         } else {
        //             value.forEach((item, idx) => {
        //                 apiPayload.append(`data[${dataKeyForSubmission}][${idx}]`, String(item === null ? '' : item));
        //             });
        //         }
        //     } else {
        //         // For other types (text, number, radio, select, textarea, etc.)
        //         // Convert null to empty string, or handle as per backend requirements.
        //         apiPayload.append(`data[${dataKeyForSubmission}]`, String(value === null ? '' : value));
        //     }
        // });

        dataAndFieldKeys.forEach((row, rowIndex) => {
            Object.entries(row).forEach(([key, value]) => {
                apiPayload.append(`data[${rowIndex}][${key}]`, String(value ?? ''));
            });
        });

        // For debugging the FormData content:
        // console.log(`--- FormData Payload for Submission (Form ID: ${id}, Submission Index: ${indexIs}) ---`);
        // for (let [key, val] of apiPayload.entries()) {
        //   if (val instanceof File) {
        //     console.log(`${key}: File - ${val.name}, ${val.size} bytes, type: ${val.type}`);
        //   } else {
        //     console.log(`${key}: ${val}`);
        //   }
        // }
        // debugger;

        try {
            // Endpoint from your Postman example (assuming 'id' from useParams is the form ID)
            // Method is POST as per your example
            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/api/forms/${id}/submission_update?type=web`,
                apiPayload,
                {
                    headers: {
                        // 'Content-Type': 'multipart/form-data' is set automatically by axios for FormData
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                        // If your API uses POST for updates and needs a method override header:
                        // 'X-HTTP-Method-Override': 'PUT' // (If applicable)
                    }
                }
            );

            // Adjust success condition based on your API's response
            if (response.status === 201 || response.status === 200 || response.data.success) {
                toast.success('Submission data sent successfully!');
                // You might want to re-fetch submissions or navigate
                // router.push(`/submissions//${response.data.data.form._id}`);
            } else {
                toast.error(response.data.message || 'Submission failed. Please try again.');
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data.message || 'Submission failed due to a server error.');
                console.error("Server error during submission:", error.response.data);
            } else {
                toast.error('Submission failed due to an unexpected error.');
                console.error("Error submitting user data:", error);
            }
        }
    };


    // You would need another function and API endpoint to save the SUBMISSION DATA (dataAndFieldKeys[indexIs])
    // const handleSaveSubmissionData = async () => {
    //     if (indexIs === null || !dataAndFieldKeys[indexIs]) {
    //         toast.error("No submission data to save.");
    //         return;
    //     }
    //     const submissionToSave = dataAndFieldKeys[indexIs];
    //     // Assuming 'id' from useParams is form ID, and submissionToSave might have its own ID if it's an existing submission
    //     // const submissionId = submissionToSave.id; // Or however you identify the submission
    //     // try {
    //     //     await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${id}/submissions/${submissionId}`, submissionToSave, {...});
    //     //     toast.success("Submission data saved!");
    //     // } catch (error) { ... }
    //     toast.info("Save submission data functionality not yet implemented.");
    // };


    return (
        <div className="flex flex-col min-h-screen" style={{ backgroundColor: bgColor, fontFamily: fontFamily }}>
            <div
                className="flex-1 py-8 px-4 sm:px-6 lg:px-8"
                style={{ color: textColor, textAlign: textAlign }}
            >
                <div className="w-full max-w-2xl mx-auto p-6 sm:p-8 rounded-lg shadow-sm" style={{ backgroundColor: contentBgColor }}>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-3">
                        <h1
                            className="text-3xl font-bold text-black"
                            contentEditable
                            suppressContentEditableWarning={true}
                            onBlur={(e) => setFormTitle(e.target.textContent || 'Checkbox')}
                            style={{ lineHeight: '1.2' }}
                        >
                            {formTitle}
                        </h1>
                        <div className="flex flex-col sm:flex-row sm:items-center mt-3 sm:mt-0">
                            <button
                                onClick={handleSubmitFormStructure}
                                className="sm:ml-4 px-4 py-2 bg-gray-700 text-white text-xs font-semibold rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-150 shadow-sm self-start sm:self-auto whitespace-nowrap cursor-pointer"
                            >
                                Update Form Structure
                            </button>
                            {/* Example button to save submission data - requires backend endpoint */}
                            {/* <button
                                onClick={handleSaveSubmissionData}
                                className="mt-2 sm:mt-0 sm:ml-2 px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-150 shadow-sm self-start sm:self-auto whitespace-nowrap cursor-pointer"
                            >
                                Save Submission Data
                            </button> */}
                        </div>
                    </div>

                    <p
                        className="text-sm text-gray-600 mb-6"
                        contentEditable
                        suppressContentEditableWarning={true}
                        onBlur={(e) => setFormDescription(e.target.textContent || 'Checkbox description')}
                    >
                        {formDescription}
                    </p>

                    <div className="border-t border-gray-200 my-6"></div>

                    {formElements.length > 0 && indexIs !== null && dataAndFieldKeys[indexIs] ? (
                        <div className="space-y-5">
                            {formElements.map((element, key) => (
                                <div
                                    key={key}
                                    className={`rounded-md transition-all duration-150 p-0.5`}
                                >
                                    {renderElement(element)}
                                    {/* Removed selectedElement highlighting for simplicity, as focus is on data editing */}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">
                            {indexIs === null || !dataAndFieldKeys[indexIs] ? "No submission selected or data available." : "No form fields configured."}
                        </p>
                    )}
                </div>
            </div>

            <ToastContainer
                position="bottom-right"
                autoClose={4000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
        </div>
    );
}