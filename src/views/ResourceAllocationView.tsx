import React, { useState } from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import { getAllocationByAssignee } from '../utils/metrics';
import { motion, AnimatePresence } from 'framer-motion';
import { parseISO, differenceInDays, isValid } from 'date-fns';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  Sector 
} from 'recharts';
import { Users, Calendar, Clock, AlertTriangle, Share2 } from 'lucide-react';
import DashboardLayout from '../components/Layout/DashboardLayout';

const ResourceAllocationView: React.FC = () => {
  const { filteredData } = useDashboardStore();
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Process data to split comma-separated assignees and calculate duration-based allocation
  const processedData = React.useMemo(() => {
    const tasksByAssignee = new Map<string, Set<string>>();
    const sharedTasks = new Set<string>();
    const assigneeAllocations = new Map<string, number>();
    
    filteredData.forEach(item => {
      const startDate = parseISO(item["Scheduled Start Date"]);
      const endDate = parseISO(item["Scheduled End Date"]);
      
      // Skip if dates are invalid
      if (!isValid(startDate) || !isValid(endDate)) return;
      
      // Calculate task duration in days
      const duration = differenceInDays(endDate, startDate);
      
      const assignees = item['Assigned to:']
        .split(',')
        .map(a => a.trim())
        .filter(Boolean);
      
      // If multiple assignees, mark as shared task
      if (assignees.length > 1) {
        const taskId = `${item.Component}-${item.Activity}-${item.Week}`;
        sharedTasks.add(taskId);
      }
      
      // Calculate allocation per assignee for this task
      const allocationPerAssignee = duration / assignees.length;
      
      assignees.forEach(assignee => {
        if (!tasksByAssignee.has(assignee)) {
          tasksByAssignee.set(assignee, new Set());
          assigneeAllocations.set(assignee, 0);
        }
        tasksByAssignee.get(assignee)!.add(item.Activity);
        
        // Add duration-based allocation
        assigneeAllocations.set(
          assignee,
          (assigneeAllocations.get(assignee) || 0) + allocationPerAssignee
        );
      });
    });
    
    return {
      tasksByAssignee,
      sharedTasks,
      assigneeAllocations,
      totalAssignees: tasksByAssignee.size
    };
  }, [filteredData]);
  
  // Get allocation data by individual assignee
  const assigneeAllocation = React.useMemo(() => {
    const allocations: { 
      assignee: string; 
      allocation: number; 
      sharedTasks: number;
      daysAllocated: number;
    }[] = [];
    
    processedData.tasksByAssignee.forEach((tasks, assignee) => {
      const assigneeTasks = filteredData.filter(item => 
        item['Assigned to:'].split(',').map(a => a.trim()).includes(assignee)
      );
      
      const sharedTaskCount = assigneeTasks.filter(item => 
        item['Assigned to:'].split(',').length > 1
      ).length;
      
      // Get the duration-based allocation
      const daysAllocated = processedData.assigneeAllocations.get(assignee) || 0;
      
      allocations.push({
        assignee,
        allocation: daysAllocated,
        sharedTasks: sharedTaskCount,
        daysAllocated
      });
    });
    
    return allocations.sort((a, b) => b.daysAllocated - a.daysAllocated);
  }, [filteredData, processedData]);
  
  // Calculate activity type distribution
  const activityTypes = React.useMemo(() => {
    const types = new Map<string, number>();
    
    filteredData.forEach(item => {
      const activity = item.Activity || 'Unknown';
      types.set(activity, (types.get(activity) || 0) + 1);
    });
    
    return Array.from(types.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#4CAF50', '#F44336'];
  
  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { 
      cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value
    } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';
  
    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${value} tasks`}</text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
          {`(${(percent * 100).toFixed(2)}%)`}
        </text>
      </g>
    );
  };
  
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  // Shared task indicator animation
  const SharedTaskIndicator = () => (
    <motion.div
      className="inline-flex items-center justify-center"
      initial={{ rotate: 0 }}
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    >
      <Share2 size={16} className="text-primary-500" />
    </motion.div>
  );
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Resource Allocation</h1>
          <p className="text-neutral-600 mt-1">
            Analysis of team workload and resource distribution
          </p>
        </div>
        
        {/* Resource metrics cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-card p-5">
            <div className="flex justify-between">
              <div>
                <h3 className="text-sm font-medium text-neutral-600">Individual Resources</h3>
                <p className="text-2xl font-bold text-neutral-800 mt-1">
                  {processedData.totalAssignees}
                </p>
              </div>
              <div className="p-3 rounded-full bg-primary-100">
                <Users size={24} className="text-primary-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-card p-5">
            <div className="flex justify-between">
              <div>
                <h3 className="text-sm font-medium text-neutral-600">Shared Tasks</h3>
                <p className="text-2xl font-bold text-neutral-800 mt-1">
                  {processedData.sharedTasks.size}
                </p>
              </div>
              <div className="p-3 rounded-full bg-secondary-100">
                <Share2 size={24} className="text-secondary-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-card p-5">
            <div className="flex justify-between">
              <div>
                <h3 className="text-sm font-medium text-neutral-600">Avg Tasks per Resource</h3>
                <p className="text-2xl font-bold text-neutral-800 mt-1">
                  {processedData.totalAssignees > 0
                    ? Math.round(filteredData.length / processedData.totalAssignees)
                    : 0
                  }
                </p>
              </div>
              <div className="p-3 rounded-full bg-success bg-opacity-10">
                <Clock size={24} className="text-success" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-card p-5">
            <div className="flex justify-between">
              <div>
                <h3 className="text-sm font-medium text-neutral-600">Overallocated Resources</h3>
                <p className="text-2xl font-bold text-neutral-800 mt-1">
                  {assigneeAllocation.filter(item => item.daysAllocated > 30).length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-danger bg-opacity-10">
                <AlertTriangle size={24} className="text-danger" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Resource allocation charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity type distribution */}
          <div className="bg-white rounded-lg shadow-card p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Activity Type Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={activityTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                  >
                    {activityTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Assignee allocation */}
          <div className="bg-white rounded-lg shadow-card p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Top Resource Allocation (Days)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={assigneeAllocation.slice(0, 10)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="assignee" 
                    type="category" 
                    tick={{ fontSize: 12 }}
                    width={150}
                  />
                  <Tooltip />
                  <Bar dataKey="daysAllocated" fill="#0077ff" name="Days Allocated">
                    {assigneeAllocation.slice(0, 10).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={entry.daysAllocated > 30 ? '#FF4858' : '#0077ff'}
                      />
                    ))}
                  </Bar>
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Resource details table */}
        <div className="bg-white rounded-lg shadow-card overflow-hidden">
          <div className="p-4 border-b border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-800">Resource Utilization Details</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Resource</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Total Tasks</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Shared Tasks</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Completed</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">In Progress</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Not Started</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Days Allocated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {assigneeAllocation.map((assigneeData, index) => {
                  const assigneeTasks = filteredData.filter(item => 
                    item["Assigned to:"].split(',').map(a => a.trim()).includes(assigneeData.assignee)
                  );
                  
                  const completed = assigneeTasks.filter(item => 
                    item.Progress.toLowerCase() === 'complete'
                  ).length;
                  
                  const inProgress = assigneeTasks.filter(item => 
                    item.Progress.toLowerCase() === 'in progress'
                  ).length;
                  
                  const notStarted = assigneeTasks.filter(item => 
                    item.Progress.toLowerCase() === 'not started'
                  ).length;
                  
                  return (
                    <tr key={index} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="font-medium text-neutral-800">{assigneeData.assignee}</span>
                          {assigneeData.sharedTasks > 0 && (
                            <div className="ml-2" title={`${assigneeData.sharedTasks} shared tasks`}>
                              <SharedTaskIndicator />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">{assigneeTasks.length}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">{assigneeData.sharedTasks}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">{completed}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">{inProgress}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">{notStarted}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          assigneeData.daysAllocated > 30 ? 'bg-danger text-white' :
                          assigneeData.daysAllocated === 30 ? 'bg-success text-white' :
                          'bg-warning text-neutral-800'
                        }`}>
                          {Math.round(assigneeData.daysAllocated)} days
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ResourceAllocationView;