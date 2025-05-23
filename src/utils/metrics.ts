import { WorkflowItem, WorkflowMetrics, MetricSummary } from '../types';
import { getProgressPercentage, parseDate, isDelayed } from './dataTransformation';
import { format, addMonths, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';

// Calculate metrics for the current view based on filtered workflow items
export function calculateMetrics(items: WorkflowItem[]): WorkflowMetrics {
  const metrics: WorkflowMetrics = {
    totalItems: items.length,
    completedItems: 0,
    inProgressItems: 0,
    notStartedItems: 0,
    healthStatus: {
      green: 0,
      yellow: 0,
      red: 0,
      blank: 0
    },
    averageCompletion: 0,
    workflowsByAssignee: {},
    dueDateDistribution: {},
    variance: {
      negative: 0,
      zero: 0,
      positive: 0
    }
  };

  // Total completion percentage for calculating average
  let totalCompletionPercentage = 0;

  items.forEach(item => {
    // Count by progress status
    const progress = item.Progress.toLowerCase();
    if (progress === 'complete') {
      metrics.completedItems++;
    } else if (progress === 'in progress') {
      metrics.inProgressItems++;
    } else if (progress === 'not started') {
      metrics.notStartedItems++;
    }

    // Count by health status
    const health = item.Health.toLowerCase();
    if (health === 'green') {
      metrics.healthStatus.green++;
    } else if (health === 'yellow') {
      metrics.healthStatus.yellow++;
    } else if (health === 'red') {
      metrics.healthStatus.red++;
    } else {
      metrics.healthStatus.blank++;
    }

    // Calculate completion percentage
    const completionPercentage = getProgressPercentage(item['% Complete']);
    totalCompletionPercentage += completionPercentage;

    // Count workflows by assignee
    const assignee = item['Assigned to:'] || 'Unassigned';
    if (!metrics.workflowsByAssignee[assignee]) {
      metrics.workflowsByAssignee[assignee] = 0;
    }
    metrics.workflowsByAssignee[assignee]++;

    // Track due dates
    const dueDate = parseDate(item['Scheduled End Date']);
    if (dueDate) {
      const dueDateKey = format(dueDate, 'yyyy-MM-dd');
      if (!metrics.dueDateDistribution[dueDateKey]) {
        metrics.dueDateDistribution[dueDateKey] = 0;
      }
      metrics.dueDateDistribution[dueDateKey]++;
    }

    // Calculate variance 
    const varianceValue = parseInt(item.Variance, 10) || 0;
    if (varianceValue < 0) {
      metrics.variance.negative++;
    } else if (varianceValue === 0) {
      metrics.variance.zero++;
    } else {
      metrics.variance.positive++;
    }
  });

  // Calculate average completion percentage
  metrics.averageCompletion = items.length > 0 
    ? Math.round(totalCompletionPercentage / items.length) 
    : 0;

  return metrics;
}

// Get high-level summary for dashboard overview
export function getSummaryMetrics(items: WorkflowItem[]): MetricSummary {
  const total = items.length;
  
  // Count items by status
  const completed = items.filter(item => 
    item.Progress.toLowerCase() === 'complete'
  ).length;
  
  const inProgress = items.filter(item => 
    item.Progress.toLowerCase() === 'in progress'
  ).length;
  
  const notStarted = items.filter(item => 
    item.Progress.toLowerCase() === 'not started'
  ).length;
  
  const atRisk = items.filter(item => 
    item.Health.toLowerCase() === 'red' || isDelayed(item)
  ).length;

  // Calculate percentages
  const completion = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // Calculate schedule status
  let onTrack = 0;
  let behindSchedule = 0;
  let aheadOfSchedule = 0;
  
  items.forEach(item => {
    const varianceValue = parseInt(item.Variance, 10) || 0;
    
    if (varianceValue < 0) {
      aheadOfSchedule++;
    } else if (varianceValue === 0) {
      onTrack++;
    } else {
      behindSchedule++;
    }
  });
  
  // Convert to percentages
  onTrack = total > 0 ? Math.round((onTrack / total) * 100) : 0;
  behindSchedule = total > 0 ? Math.round((behindSchedule / total) * 100) : 0;
  aheadOfSchedule = total > 0 ? Math.round((aheadOfSchedule / total) * 100) : 0;

  return {
    total,
    completed,
    inProgress,
    notStarted,
    atRisk,
    completion,
    onTrack,
    behindSchedule,
    aheadOfSchedule
  };
}

// Generate monthly timeline metrics by unit
export function generateTimelineMetrics(items: WorkflowItem[], unit?: string) {
  // Filter by unit if specified
  const filteredItems = unit ? items.filter(item => item.Unit === unit) : items;
  
  // Find earliest and latest dates
  const dates = filteredItems
    .flatMap(item => [
      parseDate(item["Scheduled Start Date"]),
      parseDate(item["Scheduled End Date"]),
      parseDate(item["Completion Date"])
    ])
    .filter(Boolean) as Date[];

  if (dates.length === 0) return [];

  const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const latestDate = new Date(Math.max(...dates.map(d => d.getTime())));

  const timelineData = [];
  let currentDate = startOfMonth(earliestDate);
  const endMonth = endOfMonth(latestDate);

  while (currentDate <= endMonth) {
    const monthEnd = endOfMonth(currentDate);
    
    // Count planned completions for this month
    const plannedCompleted = filteredItems.filter(item => {
      const scheduledEnd = parseDate(item["Scheduled End Date"]);
      return scheduledEnd && scheduledEnd <= monthEnd;
    }).length;
    
    // Count actual completions for this month
    const actualCompleted = filteredItems.filter(item => {
      const completionDate = parseDate(item["Completion Date"]);
      return completionDate && 
             isSameMonth(completionDate, currentDate) && 
             item.Progress.toLowerCase() === 'complete';
    }).length;
    
    // Calculate remaining tasks
    const remaining = filteredItems.length - actualCompleted;
    
    timelineData.push({
      month: format(currentDate, 'MMM yyyy'),
      planned: plannedCompleted,
      actual: actualCompleted,
      remaining
    });
    
    currentDate = addMonths(currentDate, 1);
  }
  
  return timelineData;
}

// Get allocation metrics by assignee
export function getAllocationByAssignee(items: WorkflowItem[]) {
  const assigneeMap: Record<string, number> = {};
  
  items.forEach(item => {
    const assignee = item['Assigned to:'] || 'Unassigned';
    const allocation = parseFloat(item['% Allocation']) || 0;
    
    if (!assigneeMap[assignee]) {
      assigneeMap[assignee] = 0;
    }
    
    assigneeMap[assignee] += allocation;
  });
  
  return Object.entries(assigneeMap)
    .map(([assignee, allocation]) => ({ assignee, allocation }))
    .sort((a, b) => b.allocation - a.allocation);
}