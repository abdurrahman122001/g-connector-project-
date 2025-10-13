import axios from 'axios';

// API service for Data Warehouse module
// Replace BASE_URL with your actual backend server URL

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : 'http://localhost:8000/api';

// Helper function to get auth token
const getAuthHeaders = () => {
  // Get token from localStorage or wherever you store it
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export interface DashboardData {
  totalDataNodes: number;
  totalRecords: number;
  totalVariables: number;
  dataVolume: number;
  lastUpdated: string;
  transferData: Array<{ name: string; sent: number; received: number }>;
  variableDistribution: Array<{ name: string; value: number }>;
  metadataIndicator: Array<{ name: string; value: number }>;
}

export interface DataNode {
  id: string; // MongoDB ObjectId
  name: string;
  description: string;
  nodeCount: number;
  linkedForms: string[];
  created: string;
  status: 'active' | 'inactive' | 'pending';
  variables: Array<{ form: string; fields: string[]; formName?: string }>;
  forms?: Array<{ formId: string; formName: string; selectedVariables: string[] }>;
  scriptFile?: File | string; // File for upload, string for stored file path
  scriptColumn?: {
    name?: string;
    type?: 'computed' | 'aggregated' | 'transformed';
    source?: 'python_script' | 'r_script' | 'javascript';
    description?: string;
    functionName?: string;
    scriptFile?: File | string; // ✅ allow file object (upload) or stored path
  };

  createdColumns?: Array<{
    name: string;
    type: string;
    source: string;
    description?: string;
    status?: string;
  }>;
  fields?: string[];
  metadata?: any;
  user?: string; // Added user field for backend
}

export interface ApiPoint {
  id: string; // MongoDB ObjectId
  type: 'JSON' | 'XML' | 'CSV' | 'REST' | 'SOAP';
  url: string;
  user: string;
  passkey: string;
  enabled: boolean;
  variables: Array<{
    name: string;
    type: string;
    description?: string;
    required?: boolean;
  }>;
  headers?: any;
  authentication?: any;
  rateLimit?: any;
  lastSync?: string;
  syncInterval?: number;
}

export interface TransmissionLog {
  id: string; // MongoDB ObjectId
  source: string;
  destination: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  dataVolume: string;
  details?: string;
}

export interface UserManualArticle {
  id: string; // MongoDB ObjectId
  question: string;
  answer: string;
  images: string[];
  videos: string[];
  created: string;
  updated: string;
  category?: 'general' | 'setup' | 'troubleshooting' | 'advanced' | 'faq';
  tags?: string[];
  isPublished?: boolean;
  order?: number;
  viewCount?: number;
  helpfulCount?: number;
  notHelpfulCount?: number;
  metadata?: any;
}

export interface Indicator {
  id: string; // MongoDB ObjectId
  name: string;
  description: string;
  scriptFile?: File | string; // File for upload, string for stored file path
  enabled: boolean;
  dashboardId?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: any;
  nodeId?: string; // ID of the data node this indicator uses
  nodeName?: string; // Name of the data node
  selectedVariables?: Array<{
    key: string;
    label: string;
    type?: string;
    formName: string;
    _id?: string;
  }>; // Array of selected field keys with metadata
  dataCounts?: {
    totalRecords: number;
    totalForms: number;
    totalFields: number;
    lastAnalyzed: string | null;
  };
  latestResult?: any;
  lastStatus?: string;
  scriptType?: string;
  analysisResults?: {
    fieldCounts: any;
    chartData: any;
    summary: any;
  };
  lastExecuted?: string | null;
  executionCount?: number;
  outputs?: Array<{
    id: string;
    name: string;
    type: string;
    description: string;
    data: any;
    isVisibleOnDashboard: boolean;
    isVisibleOnAnalytics: boolean;
    order: number;
    lastUpdated: string;
  }>;
}

export interface IndicatorOutput {
  id: string;
  name: string;
  type: string;
  description: string;
  data: any;
  isVisibleOnDashboard: boolean;
  isVisibleOnAnalytics: boolean;
  order: number;
  lastUpdated: string;
}

export interface DashboardOutput {
  id: string;
  name: string;
  type: string;
  description: string;
  data: any;
  indicatorName: string;
  lastUpdated: string;
}

export interface AnalyticsOutput {
  indicatorId: string;
  indicatorName: string;
  outputs: IndicatorOutput[];
}

// Dashboard API
export const getDashboardData = async (): Promise<DashboardData> => {
  try {
    const response = await axios.get(`${BASE_URL}/data-warehouse/dashboard`, {
      headers: getAuthHeaders(),
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch dashboard data');
    }

    return response.data.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

// Data Nodes API
export const getDataNodes = async (): Promise<DataNode[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/data-warehouse/nodes`, {
      headers: getAuthHeaders(),
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch data nodes');
    }

    return response.data.data;
  } catch (error) {
    console.error('Error fetching data nodes:', error);
    throw error;
  }
};

export const createDataNode = async (nodeData: Partial<DataNode>): Promise<DataNode> => {
  try {
    console.log("Creating data node with:", nodeData);

    // Detect file either at top-level or in scriptColumn
    const topLevelFile = nodeData as any;
    const file: File | undefined =
      (topLevelFile.scriptFile instanceof File ? topLevelFile.scriptFile : undefined) ||
      (nodeData.scriptColumn?.scriptFile instanceof File ? (nodeData.scriptColumn.scriptFile as File) : undefined);

    const hasScriptFile = !!file;

    if (hasScriptFile) {
      const formData = new FormData();

      // basic fields
      formData.append("name", nodeData.name || "");
      formData.append("description", nodeData.description || "");
      formData.append("status", nodeData.status || "active");
      formData.append("linkedForms", JSON.stringify(nodeData.linkedForms || []));
      formData.append("variables", JSON.stringify(nodeData.variables || []));

      // script metadata (exclude the file itself)
      if (nodeData.scriptColumn) {
        const { scriptFile, ...scriptMeta } = nodeData.scriptColumn;
        formData.append("scriptColumn", JSON.stringify(scriptMeta));
      }

      // the actual file
      formData.append("scriptFile", file!, file!.name);

      const response = await axios.post(`${BASE_URL}/data-warehouse/nodes`, formData, {
        headers: {
          Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem("token") : ""}`,
          // Let axios set multipart boundary automatically
        },
      });

      if (!response.data.success) throw new Error(response.data.error);
      return response.data.data;
    }

    // Fallback to JSON request when no file
    const response = await axios.post(`${BASE_URL}/data-warehouse/nodes`, nodeData, {
      headers: getAuthHeaders(),
    });

    if (!response.data.success) throw new Error(response.data.error);
    return response.data.data;
  } catch (error) {
    console.error("Error creating data node:", error);
    throw error;
  }
};



export const updateDataNode = async (id: string, nodeData: Partial<DataNode>): Promise<DataNode> => {
  try {
    const response = await axios.put(`${BASE_URL}/data-warehouse/nodes/${id}`, nodeData, {
      headers: getAuthHeaders(),
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update data node');
    }

    return response.data.data;
  } catch (error) {
    console.error('Error updating data node:', error);
    throw error;
  }
};

export const deleteDataNode = async (id: string): Promise<void> => {
  try {
    console.log('Deleting data node with ID:', id);
    console.log('DELETE URL:', `${BASE_URL}/data-warehouse/nodes/${id}`);

    const response = await axios.delete(`${BASE_URL}/data-warehouse/nodes/${id}`, {
      headers: getAuthHeaders(),
    });

    console.log('Delete response status:', response.status);
    console.log('Delete response data:', response.data);

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete data node');
    }
  } catch (error) {
    console.error('Error deleting data node:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      id: id
    });
    throw error;
  }
};

// API Points API
export const getApiPoints = async (): Promise<ApiPoint[]> => {
  try {
    const response = await fetch(`${BASE_URL}/data-warehouse/api-points`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch API points');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching API points:', error);
    throw error;
  }
};

export const createApiPoint = async (apiData: Partial<ApiPoint>): Promise<ApiPoint> => {
  try {
    const response = await fetch(`${BASE_URL}/data-warehouse/api-points`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(apiData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to create API point');
    }

    return result.data;
  } catch (error) {
    console.error('Error creating API point:', error);
    throw error;
  }
};

export const updateApiPoint = async (id: string, apiData: Partial<ApiPoint>): Promise<ApiPoint> => {
  try {
    const response = await fetch(`${BASE_URL}/data-warehouse/api-points/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(apiData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to update API point');
    }

    return result.data;
  } catch (error) {
    console.error('Error updating API point:', error);
    throw error;
  }
};

export const deleteApiPoint = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${BASE_URL}/data-warehouse/api-points/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete API point');
    }
  } catch (error) {
    console.error('Error deleting API point:', error);
    throw error;
  }
};

// Transmission Logs API
export const getTransmissionLogs = async (filters?: {
  status?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
}): Promise<TransmissionLog[]> => {
  try {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.source) queryParams.append('source', filters.source);
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);

    const response = await fetch(`${BASE_URL}/data-warehouse/transmission-logs?${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch transmission logs');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching transmission logs:', error);
    throw error;
  }
};

export const downloadTransmissionLogs = async (filters?: {
  status?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
  format?: 'csv' | 'excel';
}): Promise<Blob> => {
  try {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.source) queryParams.append('source', filters.source);
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    if (filters?.format) queryParams.append('format', filters.format);

    const response = await fetch(`${BASE_URL}/data-warehouse/transmission-logs/download?${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('Error downloading transmission logs:', error);
    throw error;
  }
};

// User Manual API
export const getUserManualArticles = async (): Promise<UserManualArticle[]> => {
  try {
    const response = await fetch(`${BASE_URL}/data-warehouse/user-manual`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch user manual articles');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching user manual articles:', error);
    throw error;
  }
};

export const createUserManualArticle = async (articleData: Partial<UserManualArticle>): Promise<UserManualArticle> => {
  try {
    const response = await fetch(`${BASE_URL}/data-warehouse/user-manual`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(articleData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to create user manual article');
    }

    return result.data;
  } catch (error) {
    console.error('Error creating user manual article:', error);
    throw error;
  }
};

export const updateUserManualArticle = async (id: string, articleData: Partial<UserManualArticle>): Promise<UserManualArticle> => {
  try {
    const response = await fetch(`${BASE_URL}/data-warehouse/user-manual/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(articleData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: {response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to update user manual article');
    }

    return result.data;
  } catch (error) {
    console.error('Error updating user manual article:', error);
    throw error;
  }
};

export const deleteUserManualArticle = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${BASE_URL}/data-warehouse/user-manual/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete user manual article');
    }
  } catch (error) {
    console.error('Error deleting user manual article:', error);
    throw error;
  }
};

// Forms API (for node creation)
export const getForms = async (): Promise<Array<{ id: string; name: string; variables: string[] }>> => {
  try {
    const response = await fetch(`${BASE_URL}/forms/warehouse`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch forms');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching forms:', error);
    throw error;
  }
};

export const getFormStructure = async (formId: string): Promise<{ fields: { name: string; label: string; type?: string }[] }> => {
  try {
    const response = await fetch(`${BASE_URL}/forms/${formId}/structure`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch form structure');
    }
    return result.data;
  } catch (error) {
    console.error('Error fetching form structure:', error);
    throw error;
  }
};

export const getAllIndicators = async (): Promise<Indicator[]> => {
  try {
    const response = await fetch(`${BASE_URL}/data-warehouse/indicators`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch indicators');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching indicators:', error);
    throw error;
  }
};

export const getIndicatorById = async (id: string): Promise<Indicator> => {
  try {
    const response = await fetch(`${BASE_URL}/data-warehouse/indicators/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch indicator');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching indicator:', error);
    throw error;
  }
};

// Indicators API
export const getIndicators = async (): Promise<Indicator[]> => {
  try {
    const response = await fetch(`${BASE_URL}/data-warehouse/indicators`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch indicators');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching indicators:', error);
    throw error;
  }
};

export const createIndicator = async (indicatorData: Partial<Indicator>): Promise<Indicator> => {
  try {
    console.log('Creating indicator with:', indicatorData);
    console.log('BASE_URL:', BASE_URL);

    // Check if there's a script file to upload
    const hasScriptFile = indicatorData.scriptFile && indicatorData.scriptFile instanceof File;

    if (hasScriptFile) {
      // Use FormData for file upload
      const formData = new FormData();

      // Add all non-file data individually
      const { scriptFile, ...otherData } = indicatorData;
      Object.entries(otherData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      // Add the script file
      if (scriptFile && scriptFile instanceof File) {
        formData.append('scriptFile', scriptFile, scriptFile.name);
      }

      console.log('Sending FormData request to:', `${BASE_URL}/data-warehouse/indicators`);
      console.log('FormData contents:', Array.from(formData.entries()));

      const response = await axios.post(`${BASE_URL}/data-warehouse/indicators`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response data:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create indicator');
      }

      return response.data.data;
    } else {
      // Use JSON for data without files
      console.log('Sending JSON request to:', `${BASE_URL}/data-warehouse/indicators`);
      console.log('JSON payload:', JSON.stringify(indicatorData, null, 2));

      const response = await axios.post(`${BASE_URL}/data-warehouse/indicators`, indicatorData, {
        headers: getAuthHeaders(),
      });

      console.log('Response status:', response.status);
      console.log('Response data:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create indicator');
      }

      return response.data.data;
    }
  } catch (error) {
    console.error('Error creating indicator:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      indicatorData: indicatorData
    });
    throw error;
  }
};

export const updateIndicator = async (id: string, indicatorData: Partial<Indicator>): Promise<Indicator> => {
  try {
    const response = await axios.put(`${BASE_URL}/data-warehouse/indicators/${id}`, indicatorData, {
      headers: getAuthHeaders(),
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update indicator');
    }

    return response.data.data;
  } catch (error) {
    console.error('Error updating indicator:', error);
    throw error;
  }
};

export const deleteIndicator = async (id: string): Promise<void> => {
  try {
    const response = await axios.delete(`${BASE_URL}/data-warehouse/indicators/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete indicator');
    }
  } catch (error) {
    console.error('Error deleting indicator:', error);
    throw error;
  }
};

// Node Submission Data API
export interface NodeSubmissionData {
  nodeId: string;
  nodeName: string;
  requestedFields: string[];
  totalRecords: number;
  data: Array<{
    submissionId: string;
    formName: string;
    createdAt: string;
    [key: string]: any; // Dynamic fields based on what was requested
  }>;
}

export const getNodeSubmissionData = async (nodeId: string, selectedFields?: string[]): Promise<NodeSubmissionData> => {
  try {
    const queryParams = new URLSearchParams();
    if (selectedFields && selectedFields.length > 0) {
      queryParams.append('fields', selectedFields.join(','));
    }

    const url = `${BASE_URL}/data-warehouse/nodes/${nodeId}/data${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await axios.get(url, {
      headers: getAuthHeaders(),
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch node submission data');
    }

    return response.data.data;
  } catch (error) {
    console.error('Error fetching node submission data:', error);
    throw error;
  }
};

export const getNodeFieldKeys = async (nodeId: string): Promise<{
  nodeId: string;
  nodeName: string;
  fieldKeys: Array<{
    key: string;
    label: string;
    type?: string;
    formName: string;
  }>;
}> => {
  try {
    const response = await axios.get(`${BASE_URL}/data-warehouse/nodes/${nodeId}/field-keys`, {
      headers: getAuthHeaders(),
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch node field keys');
    }

    return response.data.data;
  } catch (error) {
    console.error('Error fetching node field keys:', error);
    throw error;
  }
};

// Indicator Output Management APIs
export const getIndicatorOutputs = async (indicatorId: string): Promise<{
  indicatorId: string;
  indicatorName: string;
  scriptOutputs: IndicatorOutput[];
  lastExecuted: string;
  executionStatus: string;
}> => {
  try {
    const response = await axios.get(`${BASE_URL}/data-warehouse/indicators/${indicatorId}/outputs`, {
      headers: getAuthHeaders(),
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch indicator outputs');
    }

    return response.data.data;
  } catch (error) {
    console.error('Error fetching indicator outputs:', error);
    throw error;
  }
};

export const updateIndicatorOutputVisibility = async (
  indicatorId: string,
  outputs: Array<{
    id: string;
    isVisibleOnDashboard: boolean;
    isVisibleOnAnalytics: boolean;
    order: number;
  }>
): Promise<{ message: string; updatedOutputs: number }> => {
  try {
    const response = await axios.put(`${BASE_URL}/data-warehouse/indicators/${indicatorId}/outputs/visibility`, {
      outputs
    }, {
      headers: getAuthHeaders(),
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update output visibility');
    }

    return response.data.data;
  } catch (error) {
    console.error('Error updating output visibility:', error);
    throw error;
  }
};

export interface IndicatorConfig {
  data_limits?: {
    submissions?: number;
    data_nodes?: number;
    transmission_logs?: number;
    forms?: number;
    users?: number;
  };
  processing?: {
    max_records_per_source?: number;
    include_metadata?: boolean;
    data_quality_threshold?: number;
    enable_data_validation?: boolean;
    timeout_seconds?: number;
  };
  output?: {
    max_outputs?: number;
    include_charts?: boolean;
    include_tables?: boolean;
    include_summary?: boolean;
    chart_colors?: string[];
  };
  backend_url?: string;
}

export const executeIndicatorScript = async (
  indicatorId: string,
  config?: IndicatorConfig
): Promise<{
  executionId: string;
  status: string;
  executionTime: string;
  outputs: IndicatorOutput[];
  executedAt: string;
}> => {
  try {
    // Use default configuration if none provided
    const defaultConfig: IndicatorConfig = {
      data_limits: {
        submissions: 1000,
        data_nodes: 200,
        transmission_logs: 500,
        forms: 75,
        users: 50
      },
      processing: {
        max_records_per_source: 2000,
        include_metadata: true,
        data_quality_threshold: 85,
        enable_data_validation: true,
        timeout_seconds: 45
      },
      output: {
        max_outputs: 8,
        include_charts: true,
        include_tables: true,
        include_summary: true,
        chart_colors: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"]
      }
    };

    const finalConfig = config ? { ...defaultConfig, ...config } : defaultConfig;

    const response = await axios.post(`${BASE_URL}/data-warehouse/indicators/${indicatorId}/execute`, {
      parameters: finalConfig
    }, {
      headers: getAuthHeaders(),
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to execute indicator script');
    }

    return response.data.data;
  } catch (error) {
    console.error('Error executing indicator script:', error);
    throw error;
  }
};

export const getDashboardOutputs = async (): Promise<{
  dashboardOutputs: Array<{
    indicatorId: string;
    indicatorName: string;
    outputs: IndicatorOutput[];
  }>;
  lastUpdated: string;
}> => {
  try {
    const response = await axios.get(`${BASE_URL}/data-warehouse/dashboard/outputs`, {
      headers: getAuthHeaders(),
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch dashboard outputs');
    }

    return response.data.data;
  } catch (error) {
    console.error('Error fetching dashboard outputs:', error);
    throw error;
  }
};

export const getAnalyticsOutputs = async (): Promise<{
  analyticsOutputs: AnalyticsOutput[];
}> => {
  try {
    const response = await axios.get(`${BASE_URL}/data-warehouse/analytics/outputs`, {
      headers: getAuthHeaders(),
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch analytics outputs');
    }

    return response.data.data;
  } catch (error) {
    console.error('Error fetching analytics outputs:', error);
    throw error;
  }
};

// Test function to verify the API connection
export const testApiConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.get(`${BASE_URL}/health`, {
      headers: getAuthHeaders(),
    });
    return { success: true, message: 'API connection successful' };
  } catch (error) {
    console.error('API connection test failed:', error);
    return {
      success: false,
      message: `API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Utility function to get user ID from localStorage
export const getUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userId');
  }
  return null;
};