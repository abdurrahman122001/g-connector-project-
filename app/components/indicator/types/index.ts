// types/index.ts (or src/types/index.ts)
export interface Indicator {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    nodeId?: string;
    nodeName?: string;
    selectedVariables?: Array<{
      key: string;
      label: string;
      type?: string;
      formName: string;
    }>;
    dataCounts?: {
      totalRecords: number;
      totalForms: number;
      totalFields: number;
      lastAnalyzed: string | null;
    };
    latestResult?: any;
    lastStatus?: string;
    scriptType?: string;
    scriptFile?: string;
    createdAt: string;
    updatedAt: string;
  }