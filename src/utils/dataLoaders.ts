import { SmartsheetCredentials, WorkflowItem } from '../types';
import axios from 'axios';

// Function to parse the JSON data from an Excel file
export const parseExcelJson = (jsonData: any): WorkflowItem[] => {
  try {
    // Handle different possible structures of JSON data
    let data = jsonData;

    // If the data is nested within components, flatten it
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const flattened: WorkflowItem[] = [];
      
      // Extract nested structure based on the format
      Object.entries(data).forEach(([component, gradeData]: [string, any]) => {
        Object.entries(gradeData).forEach(([grade, unitData]: [string, any]) => {
          Object.entries(unitData).forEach(([unit, weekData]: [string, any]) => {
            Object.entries(weekData).forEach(([week, items]: [string, any]) => {
              if (Array.isArray(items)) {
                items.forEach((item: any) => {
                  flattened.push({
                    ...item,
                    Component: component,
                    "Grade/Level": grade,
                    Unit: unit,
                    Week: week
                  });
                });
              }
            });
          });
        });
      });
      
      return flattened;
    } 
    
    // If data is already an array, ensure it has the required properties
    if (Array.isArray(data)) {
      return data.map(item => {
        // Ensure all properties exist with defaults
        return {
          Health: item.Health || '',
          Format: item.Format || '',
          "Grade/Level": item["Grade/Level"] || '',
          Unit: item.Unit || '',
          Week: item.Week || '',
          Component: item.Component || '',
          Activity: item.Activity || '',
          Workflow: item.Workflow || '',
          "Assigned to:": item["Assigned to:"] || '',
          "WW Status": item["WW Status"] || '',
          Progress: item.Progress || '',
          Predecessors: item.Predecessors || '',
          "Reporting Status": item["Reporting Status"] || '',
          Duration: item.Duration || '',
          "Scheduled Start Date": item["Scheduled Start Date"] || '',
          "Scheduled End Date": item["Scheduled End Date"] || '',
          Comments: item.Comments || '',
          "Completion Date": item["Completion Date"] || '',
          Variance: item.Variance || '',
          "Baseline Start": item["Baseline Start"] || '',
          "Baseline Finish": item["Baseline Finish"] || '',
          "% Complete": item["% Complete"] || '',
          "% Remaining": item["% Remaining"] || '',
          "% Allocation": item["% Allocation"] || '',
          Read: item.Read || ''
        };
      });
    }

    console.error("Could not parse data: Invalid format");
    return [];
  } catch (error) {
    console.error("Error parsing Excel data:", error);
    return [];
  }
};

// Function to fetch data from Smartsheet API using Supabase Edge Function
export const fetchSmartsheetData = async (credentials: SmartsheetCredentials): Promise<WorkflowItem[]> => {
  try {
    // Get the Supabase URL from environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase configuration is missing. Please check your environment variables.");
    }
    
    // Call the project-specific Supabase Edge Function
    const functionUrl = `${supabaseUrl}/functions/v1/executive-dashboard-smartsheet`;
    
    const response = await axios.post(functionUrl, {
      sheetId: credentials.sheetId,
      token: credentials.token
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const data = response.data;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error("No data returned from Smartsheet");
    }
    
    return data as WorkflowItem[];
  } catch (error) {
    console.error("Error fetching Smartsheet data:", error);
    throw error;
  }
};