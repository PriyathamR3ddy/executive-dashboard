import React, { useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { ChevronRight, ChevronDown, Box } from 'lucide-react';
import { formatDate } from '../../utils/dataTransformation';

const HierarchicalView: React.FC = () => {
  const { processedData } = useDashboardStore();
  const [expandedComponents, setExpandedComponents] = useState<Record<string, boolean>>({});
  const [expandedGrades, setExpandedGrades] = useState<Record<string, boolean>>({});
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});
  const [expandedStatuses, setExpandedStatuses] = useState<Record<string, boolean>>({});
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});
  const [expandedActivities, setExpandedActivities] = useState<Record<string, boolean>>({});
  
  const isDelayed = (item: any) => {
    if (!item || !item["Scheduled Start Date"] || !item["Scheduled End Date"] || !item.Progress) {
      return false;
    }

    const today = new Date();
    const startDate = new Date(item["Scheduled Start Date"]);
    const endDate = new Date(item["Scheduled End Date"]);
    const progress = item.Progress.toLowerCase();

    // Don't show delay for future start dates
    if (startDate > today) {
      return false;
    }

    return (
      (progress === 'not started' && startDate < today) ||
      (progress === 'in progress' && endDate < today)
    );
  };

  const getDelayDays = (item: any) => {
    if (!item || !item["Scheduled Start Date"] || !item["Scheduled End Date"] || !item.Progress) {
      return 0;
    }

    const today = new Date();
    const startDate = new Date(item["Scheduled Start Date"]);
    const endDate = new Date(item["Scheduled End Date"]);
    const progress = item.Progress.toLowerCase();

    // Don't calculate delay for future start dates
    if (startDate > today) {
      return 0;
    }

    if (progress === 'not started') {
      return Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    } else if (progress === 'in progress') {
      return Math.floor((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    return 0;
  };

  const getDelayIndicator = (item: any) => {
    const delayDays = getDelayDays(item);
    if (delayDays > 7) {
      return '🚩';
    }
    return '⚠️';
  };

  const countDelayedItems = (items: any[]) => {
    let flags = 0;
    let alerts = 0;

    items.forEach(item => {
      if (isDelayed(item)) {
        if (getDelayDays(item) > 7) {
          flags++;
        } else {
          alerts++;
        }
      }
    });

    return { flags, alerts };
  };

  const shouldShowGroupAlert = (items: any[], level: 'unit' | 'status' | 'week' | 'activity') => {
    const { flags, alerts } = countDelayedItems(items);
    
    if (level === 'unit' || level === 'status') {
      // For unit and status levels, show alert if any weeks are delayed
      const weekGroups = items.reduce((acc: Record<string, any[]>, item) => {
        const week = item.Week;
        if (!acc[week]) acc[week] = [];
        acc[week].push(item);
        return acc;
      }, {});

      const delayedWeeks = Object.values(weekGroups).filter(weekItems => {
        const { flags, alerts } = countDelayedItems(weekItems);
        return flags > 3 || alerts > 3;
      });

      return delayedWeeks.length > 1;
    }

    return flags > 3 || alerts > 3;
  };

  const toggleComponent = (component: string) => {
    setExpandedComponents(prev => ({
      ...prev,
      [component]: !prev[component]
    }));
  };
  
  const toggleGrade = (component: string, grade: string) => {
    const key = `${component}-${grade}`;
    setExpandedGrades(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const toggleUnit = (component: string, grade: string, unit: string) => {
    const key = `${component}-${grade}-${unit}`;
    setExpandedUnits(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const toggleStatus = (component: string, grade: string, unit: string, status: string) => {
    const key = `${component}-${grade}-${unit}-${status}`;
    setExpandedStatuses(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const toggleWeek = (component: string, grade: string, unit: string, status: string, week: string) => {
    const key = `${component}-${grade}-${unit}-${status}-${week}`;
    setExpandedWeeks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const toggleActivity = (component: string, grade: string, unit: string, status: string, week: string, activity: string) => {
    const key = `${component}-${grade}-${unit}-${status}-${week}-${activity}`;
    setExpandedActivities(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const getItemMetrics = (items: any[]) => {
    if (!items || !Array.isArray(items)) return { total: 0, complete: 0, inProgress: 0, notStarted: 0 };
    
    const metrics = { total: items.length, complete: 0, inProgress: 0, notStarted: 0 };
    
    items.forEach(item => {
      const progress = item?.Progress?.toLowerCase();
      if (progress === 'complete') {
        metrics.complete++;
      } else if (progress === 'in progress') {
        metrics.inProgress++;
      } else if (progress === 'not started') {
        metrics.notStarted++;
      }
    });
    
    return metrics;
  };
  
  const renderProgressBar = (metrics: { total: number, complete: number, inProgress: number, notStarted: number }) => {
    const completePercentage = (metrics.complete / metrics.total) * 100 || 0;
    const inProgressPercentage = (metrics.inProgress / metrics.total) * 100 || 0;
    const notStartedPercentage = (metrics.notStarted / metrics.total) * 100 || 0;
    
    return (
      <div className="w-24 h-2 bg-neutral-200 rounded-full flex overflow-hidden">
        <div 
          className="h-full bg-success" 
          style={{ width: `${completePercentage}%` }}
        ></div>
        <div 
          className="h-full bg-primary-500" 
          style={{ width: `${inProgressPercentage}%` }}
        ></div>
        <div 
          className="h-full bg-neutral-400" 
          style={{ width: `${notStartedPercentage}%` }}
        ></div>
      </div>
    );
  };
  
  const groupItems = (items: any[]) => {
    const grouped: Record<string, Record<string, Record<string, any[]>>> = {};
    items.forEach(item => {
      const status = item["Reporting Status"] || 'Not Specified';
      const week = item.Week || 'Not Specified';
      const activity = item.Activity || 'Not Specified';
      
      if (!grouped[status]) {
        grouped[status] = {};
      }
      if (!grouped[status][week]) {
        grouped[status][week] = {};
      }
      if (!grouped[status][week][activity]) {
        grouped[status][week][activity] = [];
      }
      grouped[status][week][activity].push(item);
    });
    return grouped;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <h3 className="text-lg font-semibold text-neutral-800 mb-4">Project Hierarchy</h3>
      
      <div className="overflow-y-auto max-h-96">
        <ul className="space-y-1">
          {Object.entries(processedData).map(([component, gradeData]) => {
            const componentItems = Object.values(gradeData)
              .flatMap(unitData => 
                Object.values(unitData).flatMap(weekData => 
                  Object.values(weekData).flat()
                )
              );
            
            const componentMetrics = getItemMetrics(componentItems);
            const isExpanded = expandedComponents[component];
            
            return (
              <li key={component} className="border border-neutral-200 rounded-md mb-2 overflow-hidden">
                <div 
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-neutral-50"
                  onClick={() => toggleComponent(component)}
                >
                  <div className="flex items-center">
                    {isExpanded ? 
                      <ChevronDown size={16} className="text-neutral-600 mr-2" /> : 
                      <ChevronRight size={16} className="text-neutral-600 mr-2" />
                    }
                    <Box size={16} className="text-primary-600 mr-2" />
                    <span className="font-medium">{component}</span>
                  </div>
                  
                  <div className="flex items-center">
                    {renderProgressBar(componentMetrics)}
                  </div>
                </div>
                
                {isExpanded && (
                  <ul className="bg-neutral-50 border-t border-neutral-200 pl-8 py-1">
                    {Object.entries(gradeData).map(([grade, unitData]) => {
                      const gradeKey = `${component}-${grade}`;
                      const isGradeExpanded = expandedGrades[gradeKey];
                      
                      const gradeItems = Object.values(unitData)
                        .flatMap(weekData => 
                          Object.values(weekData).flat()
                        );
                      
                      const gradeMetrics = getItemMetrics(gradeItems);
                      
                      return (
                        <li key={gradeKey} className="border-b border-neutral-200 last:border-b-0">
                          <div 
                            className="flex items-center justify-between p-2 cursor-pointer hover:bg-neutral-100"
                            onClick={() => toggleGrade(component, grade)}
                          >
                            <div className="flex items-center">
                              {isGradeExpanded ? 
                                <ChevronDown size={14} className="text-neutral-600 mr-2" /> : 
                                <ChevronRight size={14} className="text-neutral-600 mr-2" />
                              }
                              <span className="text-sm">Grade {grade}</span>
                            </div>
                            
                            <div className="flex items-center">
                              {renderProgressBar(gradeMetrics)}
                            </div>
                          </div>
                          
                          {isGradeExpanded && (
                            <ul className="pl-6 py-1">
                              {Object.entries(unitData).map(([unit, items]) => {
                                const unitKey = `${component}-${grade}-${unit}`;
                                const isUnitExpanded = expandedUnits[unitKey];
                                
                                const unitItems = Object.values(items).flat();
                                const unitMetrics = getItemMetrics(unitItems);
                                const showUnitAlert = shouldShowGroupAlert(unitItems, 'unit');
                                
                                const groupedItems = groupItems(unitItems);
                                
                                return (
                                  <li key={unitKey} className="border-b border-neutral-200 last:border-b-0">
                                    <div 
                                      className="flex items-center justify-between p-2 cursor-pointer hover:bg-neutral-100"
                                      onClick={() => toggleUnit(component, grade, unit)}
                                    >
                                      <div className="flex items-center">
                                        {isUnitExpanded ? 
                                          <ChevronDown size={12} className="text-neutral-600 mr-2" /> : 
                                          <ChevronRight size={12} className="text-neutral-600 mr-2" />
                                        }
                                        <span className="text-sm">Unit {unit}</span>
                                        {showUnitAlert && (
                                          <span className="blink text-danger ml-2">⚠️</span>
                                        )}
                                      </div>
                                      
                                      <div className="flex items-center">
                                        {renderProgressBar(unitMetrics)}
                                      </div>
                                    </div>
                                    
                                    {isUnitExpanded && (
                                      <ul className="pl-6 py-1">
                                        {Object.entries(groupedItems).map(([status, weekGroups]) => {
                                          const statusKey = `${component}-${grade}-${unit}-${status}`;
                                          const isStatusExpanded = expandedStatuses[statusKey];
                                          const statusItems = Object.values(weekGroups)
                                            .flatMap(activities => Object.values(activities).flat());
                                          const statusMetrics = getItemMetrics(statusItems);
                                          const showStatusAlert = shouldShowGroupAlert(statusItems, 'status');
                                          
                                          return (
                                            <li key={statusKey} className="border-b border-neutral-200 last:border-b-0">
                                              <div 
                                                className="flex items-center justify-between p-2 cursor-pointer hover:bg-neutral-100"
                                                onClick={() => toggleStatus(component, grade, unit, status)}
                                              >
                                                <div className="flex items-center">
                                                  {isStatusExpanded ? 
                                                    <ChevronDown size={12} className="text-neutral-600 mr-2" /> : 
                                                    <ChevronRight size={12} className="text-neutral-600 mr-2" />
                                                  }
                                                  <span className="text-sm">{status}</span>
                                                  {showStatusAlert && (
                                                    <span className="blink text-danger ml-2">⚠️</span>
                                                  )}
                                                </div>
                                                
                                                <div className="flex items-center">
                                                  {renderProgressBar(statusMetrics)}
                                                </div>
                                              </div>
                                              
                                              {isStatusExpanded && (
                                                <ul className="pl-6 py-1">
                                                  {Object.entries(weekGroups).map(([week, activityGroups]) => {
                                                    const weekKey = `${component}-${grade}-${unit}-${status}-${week}`;
                                                    const isWeekExpanded = expandedWeeks[weekKey];
                                                    const weekItems = Object.values(activityGroups).flat();
                                                    const weekMetrics = getItemMetrics(weekItems);
                                                    const showWeekAlert = shouldShowGroupAlert(weekItems, 'week');
                                                    
                                                    return (
                                                      <li key={weekKey}>
                                                        <div 
                                                          className="flex items-center justify-between p-2 cursor-pointer hover:bg-neutral-100"
                                                          onClick={() => toggleWeek(component, grade, unit, status, week)}
                                                        >
                                                          <div className="flex items-center">
                                                            {isWeekExpanded ? 
                                                              <ChevronDown size={12} className="text-neutral-600 mr-2" /> : 
                                                              <ChevronRight size={12} className="text-neutral-600 mr-2" />
                                                            }
                                                            <span className="text-sm">Week {week}</span>
                                                            {showWeekAlert && (
                                                              <span className="blink text-danger ml-2">⚠️</span>
                                                            )}
                                                          </div>
                                                          
                                                          <div className="flex items-center">
                                                            {renderProgressBar(weekMetrics)}
                                                          </div>
                                                        </div>
                                                        
                                                        {isWeekExpanded && (
                                                          <ul className="pl-6 py-1">
                                                            {Object.entries(activityGroups).map(([activity, items]) => {
                                                              const activityKey = `${component}-${grade}-${unit}-${status}-${week}-${activity}`;
                                                              const isActivityExpanded = expandedActivities[activityKey];
                                                              const activityMetrics = getItemMetrics(items);
                                                              const showActivityAlert = shouldShowGroupAlert(items, 'activity');
                                                              
                                                              return (
                                                                <li key={activityKey}>
                                                                  <div 
                                                                    className="flex items-center justify-between p-2 cursor-pointer hover:bg-neutral-100"
                                                                    onClick={() => toggleActivity(component, grade, unit, status, week, activity)}
                                                                  >
                                                                    <div className="flex items-center">
                                                                      {isActivityExpanded ? 
                                                                        <ChevronDown size={12} className="text-neutral-600 mr-2" /> : 
                                                                        <ChevronRight size={12} className="text-neutral-600 mr-2" />
                                                                      }
                                                                      <span className="text-sm">{activity}</span>
                                                                      {showActivityAlert && (
                                                                        <span className="blink text-danger ml-2">⚠️</span>
                                                                      )}
                                                                    </div>
                                                                    
                                                                    <div className="flex items-center">
                                                                      {renderProgressBar(activityMetrics)}
                                                                    </div>
                                                                  </div>
                                                                  
                                                                  {isActivityExpanded && (
                                                                    <ul className="pl-6 py-1 text-xs">
                                                                      {items.map((item, itemIndex) => (
                                                                        <li key={itemIndex} className="py-2 space-y-2">
                                                                          <div className="flex items-center justify-between">
                                                                            <div className="flex items-center">
                                                                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                                                                item?.Health?.toLowerCase() === 'green' ? 'bg-success' :
                                                                                item?.Health?.toLowerCase() === 'yellow' ? 'bg-warning' :
                                                                                item?.Health?.toLowerCase() === 'red' ? 'bg-danger' : 'bg-neutral-400'
                                                                              }`}></div>
                                                                              <span className={`truncate max-w-xs ${isDelayed(item) ? 'blink text-danger font-medium' : ''}`}>
                                                                                {item.Workflow}
                                                                              </span>
                                                                            </div>
                                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                                              item?.Progress?.toLowerCase() === 'complete' ? 'bg-success text-white' :
                                                                              item?.Progress?.toLowerCase() === 'in progress' ? 'bg-primary-500 text-white' :
                                                                              'bg-neutral-300 text-neutral-800'
                                                                            }`}>
                                                                              {item?.Progress || 'Not Started'}
                                                                            </span>
                                                                          </div>
                                                                          <div className="flex justify-between text-neutral-500 pl-4">
                                                                            <div className="space-y-1">
                                                                              <div>
                                                                                <span className="font-medium">Start:</span>{' '}
                                                                                {formatDate(new Date(item["Scheduled Start Date"]))}{' '}
                                                                                {new Date(item["Scheduled Start Date"]) > new Date(item["Baseline Start"]) && (
                                                                                  <span className="text-danger">★</span>
                                                                                )}
                                                                                {item?.Progress?.toLowerCase() === 'not started' && 
                                                                                 new Date(item["Scheduled Start Date"]) < new Date() && (
                                                                                  <span className="blink text-danger ml-1">
                                                                                    {getDelayIndicator(item)}
                                                                                  </span>
                                                                                )}
                                                                              </div>
                                                                              <div>
                                                                                <span className="font-medium">End:</span>{' '}
                                                                                {formatDate(new Date(item["Scheduled End Date"]))}{' '}
                                                                                {new Date(item["Scheduled End Date"]) > new Date(item["Baseline Finish"]) && (
                                                                                  <span className="text-danger">★</span>
                                                                                )}
                                                                                {item?.Progress?.toLowerCase() === 'in progress' && 
                                                                                 new Date(item["Scheduled End Date"]) < new Date() && (
                                                                                  <span className="blink text-danger ml-1">
                                                                                    {getDelayIndicator(item)}
                                                                                  </span>
                                                                                )}
                                                                              </div>
                                                                            </div>
                                                                            <div className="space-y-1 text-right">
                                                                              <div>
                                                                                <span className="font-medium">Baseline Start:</span>{' '}
                                                                                {formatDate(new Date(item["Baseline Start"]))}
                                                                              </div>
                                                                              <div>
                                                                                <span className="font-medium">Baseline End:</span>{' '}
                                                                                {formatDate(new Date(item["Baseline Finish"]))}
                                                                              </div>
                                                                            </div>
                                                                          </div>
                                                                        </li>
                                                                      ))}
                                                                    </ul>
                                                                  )}
                                                                </li>
                                                              );
                                                            })}
                                                          </ul>
                                                        )}
                                                      </li>
                                                    );
                                                  })}
                                                </ul>
                                              )}
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default HierarchicalView;