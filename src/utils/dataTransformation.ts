import { ComponentData, WorkflowItem } from '../types';
import { parseISO, format, isValid } from 'date-fns';

// Transform flat data array into hierarchical structure
export function transformData(data: WorkflowItem[]): ComponentData {
  const transformedData: ComponentData = {};
  
  // Check if Batch field exists in the data
  const hasBatch = data.length > 0 && 'Batch' in data[0];

  data.forEach(item => {
    const component = item.Component;
    const batch = hasBatch ? (item.Batch || 'No Batch') : undefined;
    const grade = item["Grade/Level"];
    const unit = item.Unit;
    const week = item.Week;

    // Create structure if it doesn't exist
    if (!transformedData[component]) {
      transformedData[component] = {};
    }
    
    if (hasBatch) {
      if (!transformedData[component][batch!]) {
        transformedData[component][batch!] = {};
      }
      
      if (!transformedData[component][batch!][grade]) {
        transformedData[component][batch!][grade] = {};
      }
      
      if (!transformedData[component][batch!][grade][unit]) {
        transformedData[component][batch!][grade][unit] = {};
      }
      
      if (!transformedData[component][batch!][grade][unit][week]) {
        transformedData[component][batch!][grade][unit][week] = [];
      }
      
      transformedData[component][batch!][grade][unit][week].push(item);
    } else {
      if (!transformedData[component][grade]) {
        transformedData[component][grade] = {};
      }
      
      if (!transformedData[component][grade][unit]) {
        transformedData[component][grade][unit] = {};
      }
      
      if (!transformedData[component][grade][unit][week]) {
        transformedData[component][grade][unit][week] = [];
      }
      
      transformedData[component][grade][unit][week].push(item);
    }
  });

  return transformedData;
}

// Parse Excel date strings into Date objects
export function parseDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  // Try to parse with various formats
  const parsedDate = parseISO(dateString);
  
  if (isValid(parsedDate)) {
    return parsedDate;
  }
  
  // Try MM/DD/YY format
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const month = parseInt(parts[0], 10) - 1;
    const day = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);
    
    // Adjust 2-digit year
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }
    
    const date = new Date(year, month, day);
    if (isValid(date)) {
      return date;
    }
  }
  
  return null;
}

// Format dates consistently
export function formatDate(date: Date | null): string {
  if (!date || !isValid(date)) return '';
  return format(date, 'MM/dd/yyyy');
}

// Calculate variance in days between scheduled and actual dates
export function calculateVariance(scheduledDate: string, actualDate: string): number {
  const scheduled = parseDate(scheduledDate);
  const actual = parseDate(actualDate);
  
  if (!scheduled || !actual) return 0;
  
  // Return difference in days
  return Math.round((actual.getTime() - scheduled.getTime()) / (1000 * 60 * 60 * 24));
}

// Get health status color
export function getHealthColor(health: string): string {
  switch (health.toLowerCase()) {
    case 'green':
      return '#00C48C';
    case 'yellow':
      return '#FFCA41';
    case 'red':
      return '#FF4858';
    default:
      return '#aabbd2'; // neutral for empty/unknown
  }
}

// Get progress status percentage
export function getProgressPercentage(progressString: string | number | null | undefined): number {
  // If no progress value provided, return 0
  if (!progressString) return 0;
  
  // If the item is marked as "complete", always return 100%
  if (typeof progressString === 'string' && progressString.toLowerCase() === 'complete') {
    return 100;
  }
  
  // Handle number input
  if (typeof progressString === 'number') {
    return Math.min(Math.max(progressString * 100, 0), 100);
  }
  
  // Convert string to lowercase for comparison
  const progress = typeof progressString === 'string' ? progressString.toLowerCase() : '';
  
  // Handle text-based status
  switch (progress) {
    case 'complete':
      return 100;
    case 'in progress':
      return 50;
    case 'not started':
      return 0;
  }
  
  // Extract number from string like "50%" or "50"
  const match = progress.match(/(\d+)/);
  if (match && match[1]) {
    const value = parseInt(match[1], 10);
    return Math.min(Math.max(value, 0), 100);
  }
  
  return 0;
}

// Determine if a task is delayed
export function isDelayed(item: WorkflowItem): boolean {
  const endDate = parseDate(item["Scheduled End Date"]);
  const today = new Date();
  
  return !!endDate && 
         endDate < today && 
         item.Progress.toLowerCase() !== 'complete';
}

// Get the count of workflows in different statuses
export function countWorkflowsByStatus(items: WorkflowItem[]): { 
  complete: number; 
  inProgress: number; 
  notStarted: number; 
  atRisk: number;
} {
  return items.reduce((acc, item) => {
    const progress = item.Progress.toLowerCase();
    const health = item.Health.toLowerCase();
    
    if (progress === 'complete') {
      acc.complete += 1;
    } else if (progress === 'in progress') {
      acc.inProgress += 1;
    } else if (progress === 'not started') {
      acc.notStarted += 1;
    }
    
    if (health === 'red' || isDelayed(item)) {
      acc.atRisk += 1;
    }
    
    return acc;
  }, { complete: 0, inProgress: 0, notStarted: 0, atRisk: 0 });
}