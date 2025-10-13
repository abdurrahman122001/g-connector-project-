export const generateUniqueId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);


export const processFile = async (id: string, setTables: (tables: any[]) => void, setFormMapping: (formMapping: any[]) => void, getFormsForMapping: (formId: string, tables: any[], initialApiMappings: any[]) => Promise<any[]>) => {

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/db-connections/${id}/schema`, {

        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },

    });


    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Processing failed with status: ' + res.status }));
        throw new Error(errorData.message || 'Failed to process file');
    }

    const data = await res.json();



    if (!data.success || !data.data) {
        throw new Error(data.message || 'Processing completed but returned no data.');
    }

    // Ensure data_records is an array

    const processedTables = Array.isArray(data.data)
        ? (Array.isArray(data.data[0])
            ? data.data[0]  // It's an array of arrays (tables)
            : data.data) // It's a single array of records, so wrap it in an array to treat it as a single "table"
        : [];      // Get initial mappings from the API response

    setTables(processedTables);
    const initialApiMappings = Array.isArray(data.mapId?.formMappings) ? data.mapId.formMappings : [];
    const finalMappings = await getFormsForMapping(data.mapId, processedTables, initialApiMappings);


    if (setFormMapping) {
     
        setFormMapping(finalMappings); // Set the final, potentially updated mappings
    }
}

export const updateSubmissionId = async (id: string[], url: string) => {
    await fetch(url, {
        method: 'PUT',
        body: JSON.stringify({ submission_id: id }),
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    });

}

export const getSubmissions = async(id:string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${id}/onlysubmissions`, {
        
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    });

    return res.json();
}