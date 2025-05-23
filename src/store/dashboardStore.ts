import { create } from 'zustand';
import { 
  ComponentData, 
  WorkflowItem,
  DashboardFilters,
  SmartsheetCredentials 
} from '../types';
import { 
  parseExcelJson, 
  fetchSmartsheetData
} from '../utils/dataLoaders';
import { transformData } from '../utils/dataTransformation';

interface DashboardState {
  rawData: WorkflowItem[];
  processedData: ComponentData;
  filteredData: WorkflowItem[];
  isLoading: boolean;
  error: string | null;
  
  dataSource: 'excel' | 'smartsheet';
  smartsheetCredentials: SmartsheetCredentials | null;
  
  filters: DashboardFilters;
  selectedView: 'overview' | 'timeline' | 'allocation' | 'detailed';
  showSidebar: boolean;
  
  loadExcelData: (jsonData: any) => void;
  loadSmartsheetData: (credentials: SmartsheetCredentials) => Promise<void>;
  setDataSource: (source: 'excel' | 'smartsheet') => void;
  setSmartsheetCredentials: (credentials: SmartsheetCredentials) => void;
  updateFilters: (newFilters: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
  setSelectedView: (view: 'overview' | 'timeline' | 'allocation' | 'detailed') => void;
  toggleSidebar: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  rawData: [],
  processedData: {},
  filteredData: [],
  isLoading: false,
  error: null,
  
  dataSource: 'excel',
  smartsheetCredentials: null,
  
  filters: {},
  selectedView: 'overview',
  showSidebar: true,
  
  loadExcelData: (jsonData) => {
    set({ isLoading: true, error: null });
    
    try {
      const parsedData = parseExcelJson(jsonData);
      const hierarchicalData = transformData(parsedData);
      
      set({ 
        rawData: parsedData,
        processedData: hierarchicalData,
        filteredData: parsedData,
        isLoading: false
      });
    } catch (error) {
      console.error("Failed to load Excel data:", error);
      set({ 
        error: "Failed to load data from Excel. Please check the file format.",
        isLoading: false
      });
    }
  },
  
  loadSmartsheetData: async (credentials) => {
    set({ isLoading: true, error: null });
    
    try {
      const data = await fetchSmartsheetData(credentials);
      
      if (!data || data.length === 0) {
        throw new Error("No data returned from Smartsheet");
      }
      
      const hierarchicalData = transformData(data);
      
      set({ 
        rawData: data,
        processedData: hierarchicalData,
        filteredData: data,
        isLoading: false,
        smartsheetCredentials: credentials,
        error: null
      });
    } catch (error) {
      console.error("Failed to load Smartsheet data:", error);
      set({ 
        error: error.message || "Failed to load data from Smartsheet. Please check your credentials and try again.",
        isLoading: false
      });
    }
  },
  
  setDataSource: (source) => {
    set({ dataSource: source });
  },
  
  setSmartsheetCredentials: (credentials) => {
    set({ smartsheetCredentials: credentials });
  },
  
  updateFilters: (newFilters) => {
    const updatedFilters = { ...get().filters, ...newFilters };
    set({ filters: updatedFilters });
    
    const { rawData } = get();
    let filtered = [...rawData];
    
    // Component filter
    if (updatedFilters.component) {
      filtered = filtered.filter(item => 
        item.Component === updatedFilters.component
      );
    }
    
    // Batch filter
    if (updatedFilters.batch) {
      filtered = filtered.filter(item => 
        item.Batch === updatedFilters.batch
      );
    }
    
    // Grade filter
    if (updatedFilters.grade) {
      filtered = filtered.filter(item => {
        const itemGrade = item["Grade/Level"]?.toString().trim();
        const filterGrade = updatedFilters.grade?.toString().trim();
        return itemGrade === filterGrade;
      });
    }
    
    // Unit filter
    if (updatedFilters.unit) {
      filtered = filtered.filter(item => {
        const itemUnit = item.Unit?.toString().trim();
        const filterUnit = updatedFilters.unit?.toString().trim();
        return itemUnit === filterUnit;
      });
    }
    
    // Week filter
    if (updatedFilters.week) {
      filtered = filtered.filter(item => {
        const itemWeek = item.Week?.toString().trim();
        const filterWeek = updatedFilters.week?.toString().trim();
        return itemWeek === filterWeek;
      });
    }
    
    // Activity filter
    if (updatedFilters.activity) {
      filtered = filtered.filter(item => 
        item.Activity === updatedFilters.activity
      );
    }
    
    // Assignee filter
    if (updatedFilters.assignee) {
      filtered = filtered.filter(item => 
        item["Assigned to:"]?.includes(updatedFilters.assignee || '')
      );
    }
    
    // Reporting Status filter
    if (updatedFilters.reportingStatus) {
      filtered = filtered.filter(item => 
        item["Reporting Status"] === updatedFilters.reportingStatus
      );
    }
    
    // Date range filter
    if (updatedFilters.startDate) {
      filtered = filtered.filter(item => {
        const startDate = new Date(item["Scheduled Start Date"]);
        return startDate >= (updatedFilters.startDate as Date);
      });
    }
    
    if (updatedFilters.endDate) {
      filtered = filtered.filter(item => {
        const endDate = new Date(item["Scheduled End Date"]);
        return endDate <= (updatedFilters.endDate as Date);
      });
    }
    
    // Health status filter
    if (updatedFilters.healthStatus && updatedFilters.healthStatus.length > 0) {
      filtered = filtered.filter(item => 
        updatedFilters.healthStatus?.includes(item.Health)
      );
    }
    
    // Progress status filter
    if (updatedFilters.progressStatus && updatedFilters.progressStatus.length > 0) {
      filtered = filtered.filter(item => 
        updatedFilters.progressStatus?.includes(item.Progress)
      );
    }
    
    set({ filteredData: filtered });
  },
  
  resetFilters: () => {
    set({ 
      filters: {},
      filteredData: get().rawData
    });
  },
  
  setSelectedView: (view) => {
    set({ selectedView: view });
  },
  
  toggleSidebar: () => {
    set({ showSidebar: !get().showSidebar });
  }
}));