export interface ConfiguredTargetField {
    id: string; // Unique ID for React list keys and stable operations
    name: string; // The user-defined name for this target field (e.g., table column header)
    mappedSourceField: string | null; // The name of the source field (from left panel) mapped to this target, or null
  }
  
  
  export interface FileUpload {
    _id: string;
    originalName: string;
    fileType: string;
    filePath: string;
    fileSize: number;
    description?: string;
    formMappings?: any;
    createdAt: Date;
    updatedAt?: Date; // Add if available
  }
  export interface FileUploadDetailsPageProps {
    fileId: any;
  }

  export interface TableInfo {
    table: string;
    data: any[];
  };
  
export interface FormMappingItem {
  _id?: string;
  name: string | undefined;
  type: string;
  formId?: {
    id: string | number;
    fields?: { label: string; [key: string]: any }[];
  };
  fields?: string[];
  options?: string[];
  fieldMappings?: {
    fields: string[];
    [key: string]: any;
  }[];
  [key: string]: any;
};
export interface TableData {
  [tableName: string]: any[];
};


export type RepeaterField = {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // Added for select, radio, checkbox
};



export type FormElement = {
  name: string;
  id: string;
  type: string;
  label: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  fields?: RepeaterField[]; // Sub-fields for repeater type
};

export type AccumulatedFormData = {
  fields: Array<{ // Type for non-repeatable fields
    name: string;
    label: string;
    id: string;
    type: string;
    placeholder?: string;
    required: boolean;
    options: string[];
  }>;
  repeatable: Array<{ // Type for repeatable fields (groups)
    name: string;
    label: string;
    id: string;
    type: string; // This will be 'repeatable' or similar
    required: boolean;
    repeatable: { // Nested repeatable structure
      fields: Array<{ // Fields within the repeatable group
        name: string;
        label: string;
        type: string;
        placeholder: string;
        required: boolean;
        options: string[];
      }>;
    };
  }>;
};