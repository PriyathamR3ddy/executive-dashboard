import React, { useState, useMemo } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { useDashboardStore } from '../store/dashboardStore';
import { parseDate, formatDate } from '../utils/dataTransformation';
import { generateTimelineMetrics } from '../utils/metrics';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { Calendar, Flag, CheckCircle, AlertTriangle, Filter, LayoutGrid, List } from 'lucide-react';

const TimelineView: React.FC = () => {
  const { filteredData } = useDashboardStore();
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'milestones' | 'timeline'>('milestones');
  
  // Get unique units for filtering
  const units = useMemo(() => {
    const uniqueUnits = new Set(filteredData.map(item => item.Unit));
    return Array.from(uniqueUnits).sort();
  }, [filteredData]);
  
  // Generate monthly burndown data with unit filtering
  const timelineData = useMemo(() => {
    if (selectedUnit === 'all') {
      return generateTimelineMetrics(filteredData);
    }
    return generateTimelineMetrics(filteredData, selectedUnit);
  }, [filteredData, selectedUnit]);
  
  // Filter data based on selected unit
  const filteredByUnit = useMemo(() => {
    if (selectedUnit === 'all') return filteredData;
    return filteredData.filter(item => item.Unit === selectedUnit);
  }, [filteredData, selectedUnit]);
  
  // Extract milestones from reporting statuses
  const milestones = useMemo(() => {
    const milestoneMap = new Map();
    
    filteredByUnit.forEach(item => {
      const unit = item.Unit;
      const status = item["Reporting Status"];
      const key = `${unit}-${status}`;
      
      if (!milestoneMap.has(key)) {
        milestoneMap.set(key, {
          unit,
          status,
          date: parseDate(item["Scheduled End Date"]),
          completed: item.Progress.toLowerCase() === 'complete',
          total: 1,
          completedCount: item.Progress.toLowerCase() === 'complete' ? 1 : 0
        });
      } else {
        const milestone = milestoneMap.get(key);
        milestone.total += 1;
        if (item.Progress.toLowerCase() === 'complete') {
          milestone.completedCount += 1;
        }
        // Update date only if this task ends later
        const itemDate = parseDate(item["Scheduled End Date"]);
        if (itemDate && (!milestone.date || itemDate > milestone.date)) {
          milestone.date = itemDate;
        }
      }
    });
    
    return Array.from(milestoneMap.values())
      .sort((a, b) => a.date && b.date ? a.date.getTime() - b.date.getTime() : 0);
  }, [filteredByUnit]);

  // Generate timeline data
  const timelineItems = useMemo(() => {
    const items = filteredByUnit.map(item => ({
      unit: item.Unit,
      status: item["Reporting Status"],
      startDate: parseDate(item["Scheduled Start Date"]),
      endDate: parseDate(item["Scheduled End Date"]),
      completed: item.Progress.toLowerCase() === 'complete',
      title: `${item.Unit} - ${item["Reporting Status"]}`,
      description: item.Activity
    })).filter(item => item.startDate && item.endDate);

    return items.sort((a, b) => 
      a.startDate && b.startDate ? a.startDate.getTime() - b.startDate.getTime() : 0
    );
  }, [filteredByUnit]);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Project Timeline</h1>
              <p className="text-neutral-600">Track project progress and milestones</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2 bg-neutral-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('milestones')}
                className={`flex items-center px-3 py-1.5 rounded transition-colors ${
                  viewMode === 'milestones'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-800'
                }`}
              >
                <Flag size={16} className="mr-1" />
                Milestones
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex items-center px-3 py-1.5 rounded transition-colors ${
                  viewMode === 'timeline'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-800'
                }`}
              >
                <List size={16} className="mr-1" />
                Timeline
              </button>
            </div>

            {/* Unit Filter */}
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-neutral-500" />
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="form-select rounded-md border-neutral-300 text-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Units</option>
                {units.map(unit => (
                  <option key={unit} value={unit}>Unit {unit}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Burndown Chart */}
        <div className="bg-white rounded-lg shadow-card p-6 chart-container">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">
            Monthly Burndown {selectedUnit !== 'all' && `- Unit ${selectedUnit}`}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timelineData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#666', fontSize: 12 }}
                  tickLine={{ stroke: '#ccc' }}
                />
                <YAxis 
                  tick={{ fill: '#666', fontSize: 12 }}
                  tickLine={{ stroke: '#ccc' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="planned" 
                  name="Planned Tasks"
                  stroke="#0077ff" 
                  strokeWidth={2}
                  dot={{ fill: '#0077ff', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  name="Completed Tasks"
                  stroke="#00C48C" 
                  strokeWidth={2}
                  dot={{ fill: '#00C48C', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="remaining" 
                  name="Remaining Tasks"
                  stroke="#FF4858" 
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ fill: '#FF4858', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {viewMode === 'milestones' ? (
          /* Milestones Timeline */
          <div className="bg-white rounded-lg shadow-card p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Flag className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-neutral-800">Project Milestones</h3>
            </div>
            
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-neutral-200 milestone-line"></div>
              
              {/* Milestones */}
              <div className="space-y-8">
                {milestones.map((milestone, index) => {
                  const isComplete = milestone.completedCount === milestone.total;
                  const isPartial = milestone.completedCount > 0 && !isComplete;
                  const isOverdue = milestone.date && milestone.date < new Date() && !isComplete;
                  
                  return (
                    <div 
                      key={`${milestone.unit}-${milestone.status}-${index}`}
                      className="relative pl-16 animate-slide-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {/* Milestone marker */}
                      <div 
                        className={`absolute left-4 w-5 h-5 rounded-full milestone-marker
                          ${isComplete ? 'bg-success' : isOverdue ? 'bg-danger' : 'bg-primary-500'}
                          transform -translate-x-1/2 flex items-center justify-center`}
                      >
                        {isComplete ? (
                          <CheckCircle size={14} className="text-white" />
                        ) : isOverdue ? (
                          <AlertTriangle size={14} className="text-white" />
                        ) : (
                          <Flag size={14} className="text-white" />
                        )}
                      </div>
                      
                      {/* Milestone content */}
                      <div className={`bg-white rounded-lg border p-4
                        ${isComplete ? 'border-success' : 
                          isOverdue ? 'border-danger' : 
                          'border-primary-200'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-medium text-neutral-800">
                              Unit {milestone.unit} - {milestone.status}
                            </h4>
                            <p className="text-sm text-neutral-600 mt-1">
                              Target Date: {formatDate(milestone.date)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className={`text-sm font-medium px-3 py-1 rounded-full
                              ${isComplete ? 'bg-success text-white' :
                                isOverdue ? 'bg-danger text-white' :
                                'bg-primary-100 text-primary-700'}`}
                            >
                              {isComplete ? 'Completed' :
                               isOverdue ? 'Overdue' :
                               'In Progress'}
                            </div>
                            <p className="text-sm text-neutral-600 mt-2">
                              {milestone.completedCount} of {milestone.total} tasks complete
                            </p>
                          </div>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="mt-4">
                          <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full animate-progress"
                              style={{
                                '--progress-width': `${(milestone.completedCount / milestone.total) * 100}%`,
                                backgroundColor: isComplete ? '#00C48C' : 
                                              isOverdue ? '#FF4858' : 
                                              '#0077ff'
                              } as React.CSSProperties}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Timeline View */
          <div className="bg-white rounded-lg shadow-card p-6">
            <div className="flex items-center space-x-2 mb-6">
              <List className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-neutral-800">Timeline View</h3>
            </div>
            
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-neutral-200"></div>
              
              {/* Timeline items */}
              <div className="space-y-6">
                {timelineItems.map((item, index) => (
                  <div 
                    key={index}
                    className="relative pl-16 animate-slide-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Timeline marker */}
                    <div 
                      className={`absolute left-4 w-3 h-3 rounded-full transform -translate-x-1/2
                        ${item.completed ? 'bg-success' : 'bg-primary-500'}`}
                    ></div>
                    
                    {/* Timeline content */}
                    <div className={`bg-white rounded-lg border p-4
                      ${item.completed ? 'border-success' : 'border-primary-200'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-base font-medium text-neutral-800">
                            {item.title}
                          </h4>
                          <p className="text-sm text-neutral-600 mt-1">
                            {item.description}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-sm text-neutral-600">
                            <div>Start: {formatDate(item.startDate)}</div>
                            <div>End: {formatDate(item.endDate)}</div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium
                            ${item.completed ? 'bg-success text-white' : 'bg-primary-100 text-primary-700'}`}
                          >
                            {item.completed ? 'Complete' : 'In Progress'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TimelineView;