export function getFieldsById(id, form) {
    return form.filter(field => field.id === id);
}

export const getRules = (rules, initialData = null) => {
    if (!rules) return null;
    
    // If we have initial data, map it to the rules structure
    if (initialData) {
        return {
            ...rules.skipLogic,
            initialData: initialData
        };
    }
    
    return rules.skipLogic;
}
