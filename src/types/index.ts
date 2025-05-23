export interface DashboardFilters {
  component?: string;
  batch?: string;
  grade?: string;
  unit?: string;
  week?: string;
  activity?: string;
  assignee?: string;
  startDate?: Date;
  endDate?: Date;
  healthStatus?: string[];
  progressStatus?: string[];
  reportingStatus?: string;
}

export interface WorkflowItem {
  Health: string;
  Format: string;
  "Grade/Level": string;
  Unit: string;
  Week: string;
  Component: string;
  Batch?: string;
  Activity: string;
  Workflow: string;
  "Assigned to:": string;
  "WW Status": string;
  Progress: string;
  Predecessors: string;
  "Reporting Status": string;
  Duration: string;
  "Scheduled Start Date": string;
  "Scheduled End Date": string;
  Comments: string;
  "Completion Date": string;
  Variance: string;
  "Baseline Start": string;
  "Baseline Finish": string;
  "% Complete": string;
  "% Remaining": string;
  "% Allocation": string;
  Read: string;
}

export interface ComponentData {
  [component: string]: {
    [batchOrGrade: string]: {
      [gradeOrUnit: string]: {
        [unitOrWeek: string]: {
          [week: string]: WorkflowItem[];
        };
      };
    };
  };
}

export interface SmartsheetCredentials {
  sheetId: string;
  token: string;
}

export interface MetricSummary {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  atRisk: number;
  completion: number;
  onTrack: number;
  behindSchedule: number;
  aheadOfSchedule: number;
}

export interface WorkflowMetrics {
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  notStartedItems: number;
  healthStatus: {
    green: number;
    yellow: number;
    red: number;
    blank: number;
  };
  averageCompletion: number;
  workflowsByAssignee: Record<string, number>;
  dueDateDistribution: Record<string, number>;
  variance: {
    negative: number;
    zero: number;
    positive: number;
  };
}