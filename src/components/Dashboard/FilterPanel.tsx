import React, { useState, useEffect } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Filter, X, Check } from 'lucide-react';

const FilterPanel: React.FC = () => {
  const { 
    rawData, 
    filters, 
    updateFilters, 
    resetFilters 
  } = useDashboardStore();
  
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Extract unique values for filter dropdowns
  const [components, setComponents] = useState<string[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [grades, setGrades] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [weeks, setWeeks] = useState<string[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [reportingStatuses, setReportingStatuses] = useState<string[]>([]);
  
  // Check if Batch field exists
  const hasBatch = rawData.length > 0 && 'Batch' in rawData[0];
  
  // Populate filter options from raw data
  useEffect(() => {
    if (rawData.length > 0) {
      setComponents([...new Set(rawData.map(item => item.Component))]);
      if (hasBatch) {
        setBatches([...new Set(rawData.map(item => item.Batch || 'No Batch'))]);
      }
      setGrades([...new Set(rawData.map(item => item["Grade/Level"]))]);
      setUnits([...new Set(rawData.map(item => item.Unit))]);
      setWeeks([...new Set(rawData.map(item => item.Week))]);
      setActivities([...new Set(rawData.map(item => item.Activity))]);
      setReportingStatuses([...new Set(rawData.map(item => item["Reporting Status"]))]);
      
      const assigneeList = rawData.map(item => item["Assigned to:"])
        .filter(Boolean)
        .flatMap(assignee => assignee.split(',').map(a => a.trim()))
        .filter((value, index, self) => self.indexOf(value) === index);
        
      setAssignees(assigneeList);
    }
  }, [rawData, hasBatch]);
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-card overflow-hidden">
      <div 
        className="p-4 flex justify-between items-center cursor-pointer"
        onClick={toggleExpand}
      >
        <div className="flex items-center">
          <Filter size={18} className="text-primary-600 mr-2" />
          <h3 className="font-semibold text-neutral-800">Filters</h3>
        </div>
        <div className="flex items-center">
          {Object.keys(filters).length > 0 && (
            <span className="bg-primary-500 text-white text-xs font-medium px-2 py-0.5 rounded-full mr-2">
              {Object.keys(filters).length}
            </span>
          )}
          <button className="text-neutral-500 hover:text-neutral-700">
            {isExpanded ? <X size={18} /> : <Check size={18} />}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4 border-t border-neutral-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Component filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Component
              </label>
              <select
                value={filters.component || ''}
                onChange={(e) => updateFilters({ component: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Components</option>
                {components.map(component => (
                  <option key={component} value={component}>{component}</option>
                ))}
              </select>
            </div>
            
            {/* Batch filter - only show if Batch field exists */}
            {hasBatch && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Batch
                </label>
                <select
                  value={filters.batch || ''}
                  onChange={(e) => updateFilters({ batch: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Batches</option>
                  {batches.map(batch => (
                    <option key={batch} value={batch}>{batch}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Grade/Level filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Grade/Level
              </label>
              <select
                value={filters.grade || ''}
                onChange={(e) => updateFilters({ grade: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Grades</option>
                {grades.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
            
            {/* Unit filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Unit
              </label>
              <select
                value={filters.unit || ''}
                onChange={(e) => updateFilters({ unit: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Units</option>
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
            
            {/* Week filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Week
              </label>
              <select
                value={filters.week || ''}
                onChange={(e) => updateFilters({ week: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Weeks</option>
                {weeks.map(week => (
                  <option key={week} value={week}>{week}</option>
                ))}
              </select>
            </div>
            
            {/* Activity filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Activity
              </label>
              <select
                value={filters.activity || ''}
                onChange={(e) => updateFilters({ activity: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Activities</option>
                {activities.map(activity => (
                  <option key={activity} value={activity}>{activity}</option>
                ))}
              </select>
            </div>
            
            {/* Assignee filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Assignee
              </label>
              <select
                value={filters.assignee || ''}
                onChange={(e) => updateFilters({ assignee: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Assignees</option>
                {assignees.map(assignee => (
                  <option key={assignee} value={assignee}>{assignee}</option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Status
              </label>
              <select
                value={filters.reportingStatus || ''}
                onChange={(e) => updateFilters({ reportingStatus: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                {reportingStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={resetFilters}
              className="px-4 py-2 border border-neutral-300 rounded-md text-neutral-700 hover:bg-neutral-50"
            >
              Clear Filters
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;