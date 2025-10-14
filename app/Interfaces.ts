export type DataSourceType = 'manual' | 'reference';

export interface ReferenceList {
  _id: string;
  name: string;
  description?: string;
  columns: { key: string; label: string }[];
}

export interface ReferenceListItem {
  _id: string;
  listId: string;
  data: Record<string, string>;
}

export interface FormElementField {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

export interface FormElement {
  id: string;
  type: string;
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;

  // existing
  options?: string[];
  fields?: FormElementField[];

  // toggle
  value?: boolean | string;

  // gps
  latitude?: string | number;
  longitude?: string | number;

  // reference linking
  dataSource?: DataSourceType;              // 'manual' | 'reference'
  referenceListId?: string;                 // selected list id
  referenceLabelKey?: string;               // which column is label
  referenceValueKey?: string;               // which column is value
  _referencePreview?: { label: string; value: string }[]; // transient preview
}

export interface AccumulatedFormData {
  fields: Array<{
    id: string;
    name: string;
    label: string;
    type: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
    // Persist reference config so renderer can fetch options in runtime
    dataSource?: DataSourceType;
    referenceListId?: string;
    referenceLabelKey?: string;
    referenceValueKey?: string;
  }>;
  repeatable: Array<{
    id: string;
    name: string;
    label: string;
    type: 'repeatable';
    required: boolean;
    repeatable: { fields: FormElementField[] };
  }>;
}
