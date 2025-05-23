import React, { useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { MetricSummary } from '../../types';
import { getSummaryMetrics } from '../../utils/metrics';
import { Check, Clock, AlertTriangle, AlertCircle, Percent, Hash, HelpCircle, PieChart, LayoutGrid } from 'lucide-react';
import { PieChart as RechartsChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';

const StatusCard: React.FC<{
  title: string;
  value: number;
  total: number;
  percentage: number;
  icon: React.ReactNode;
  color: string;
  showPercentage: boolean;
  tooltip?: string;
}> = ({ title, value, total, percentage, icon, color, showPercentage, tooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div className="bg-white rounded-lg shadow-card p-5 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center">
            <h3 className="text-sm font-medium text-neutral-600">{title}</h3>
            {tooltip && (
              <div className="relative ml-1">
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <HelpCircle size={14} />
                </button>
                {showTooltip && (
                  <div className="absolute z-10 w-64 px-4 py-3 text-sm bg-neutral-800 text-white rounded-lg shadow-lg -right-2 top-6">
                    <div className="absolute -top-1 right-3 w-2 h-2 bg-neutral-800 transform rotate-45"></div>
                    {tooltip}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-baseline mt-1">
            <p className="text-2xl font-bold" style={{ color }}>
              {showPercentage ? `${Math.round(percentage)}%` : value}
            </p>
            {!showPercentage && (
              <p className="ml-2 text-sm text-neutral-500">of {total}</p>
            )}
          </div>
          <div className="mt-3 w-full bg-neutral-200 rounded-full h-2.5">
            <div 
              className="h-2.5 rounded-full" 
              style={{ width: `${Math.round(percentage)}%`, backgroundColor: color }}
            ></div>
          </div>
        </div>
        <div className="p-2 rounded-full" style={{ backgroundColor: `${color}20` }}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const COLORS = {
  completed: '#00C48C',  // Green
  inProgress: '#0077ff', // Blue
  notStarted: '#FFCA41', // Amber
  atRisk: '#FF4858'      // Red
};

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value } = props;
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
      <text x={cx} y={cy} dy={-20} textAnchor="middle" fill={fill} className="text-lg font-semibold">
        {payload.name}
      </text>
      <text x={cx} y={cy} dy={20} textAnchor="middle" fill={fill} className="text-3xl font-bold">
        {`${(percent * 100).toFixed(0)}%`}
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
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="text-sm">
        {`${value} tasks`}
      </text>
    </g>
  );
};

const StatusOverview: React.FC = () => {
  const { filteredData } = useDashboardStore();
  const metrics: MetricSummary = getSummaryMetrics(filteredData);
  const [showPercentage, setShowPercentage] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'chart'>('cards');
  const [activeIndex, setActiveIndex] = useState(0);
  
  const atRiskTooltip = "A task is counted in the 'at risk' metric if either:\n• It has a red health status\n• It hasn't started but should have\n• It's in progress but past its due date";

  const pieChartData = [
    { 
      name: 'Completed', 
      value: metrics.completed,
      percentage: Math.round((metrics.completed / metrics.total) * 100),
      color: COLORS.completed
    },
    { 
      name: 'In Progress', 
      value: metrics.inProgress,
      percentage: Math.round((metrics.inProgress / metrics.total) * 100),
      color: COLORS.inProgress
    },
    { 
      name: 'Not Started', 
      value: metrics.notStarted,
      percentage: Math.round((metrics.notStarted / metrics.total) * 100),
      color: COLORS.notStarted
    },
    { 
      name: 'At Risk', 
      value: metrics.atRisk,
      percentage: Math.round((metrics.atRisk / metrics.total) * 100),
      color: COLORS.atRisk
    }
  ];

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-neutral-800">Project Status Overview</h2>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 bg-neutral-100 p-1 rounded-lg mr-4">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center px-3 py-1.5 rounded ${
                viewMode === 'cards'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              <LayoutGrid size={16} className="mr-1" />
              Cards
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`flex items-center px-3 py-1.5 rounded ${
                viewMode === 'chart'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              <PieChart size={16} className="mr-1" />
              Chart
            </button>
          </div>

          <div className="flex items-center space-x-2 bg-neutral-100 p-1 rounded-lg">
            <button
              onClick={() => setShowPercentage(true)}
              className={`flex items-center px-3 py-1.5 rounded ${
                showPercentage 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              <Percent size={16} className="mr-1" />
              Percentage
            </button>
            <button
              onClick={() => setShowPercentage(false)}
              className={`flex items-center px-3 py-1.5 rounded ${
                !showPercentage 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              <Hash size={16} className="mr-1" />
              Count
            </button>
          </div>
        </div>
      </div>
      
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatusCard 
            title="Completed Tasks"
            value={metrics.completed}
            total={metrics.total}
            percentage={metrics.completion}
            icon={<Check size={20} style={{ color: COLORS.completed }} />}
            color={COLORS.completed}
            showPercentage={showPercentage}
          />
          
          <StatusCard 
            title="In Progress"
            value={metrics.inProgress}
            total={metrics.total}
            percentage={Math.round((metrics.inProgress / metrics.total) * 100)}
            icon={<Clock size={20} style={{ color: COLORS.inProgress }} />}
            color={COLORS.inProgress}
            showPercentage={showPercentage}
          />
          
          <StatusCard 
            title="Not Started"
            value={metrics.notStarted}
            total={metrics.total}
            percentage={Math.round((metrics.notStarted / metrics.total) * 100)}
            icon={<AlertCircle size={20} style={{ color: COLORS.notStarted }} />}
            color={COLORS.notStarted}
            showPercentage={showPercentage}
          />
          
          <StatusCard 
            title="At Risk"
            value={metrics.atRisk}
            total={metrics.total}
            percentage={Math.round((metrics.atRisk / metrics.total) * 100)}
            icon={<AlertTriangle size={20} style={{ color: COLORS.atRisk }} />}
            color={COLORS.atRisk}
            showPercentage={showPercentage}
            tooltip={atRiskTooltip}
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col space-y-4">
              {pieChartData.map((entry, index) => (
                <div 
                  key={entry.name}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    activeIndex === index ? 'bg-neutral-50' : 'hover:bg-neutral-50'
                  }`}
                  onClick={() => setActiveIndex(index)}
                >
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <div>
                    <p className="font-medium text-neutral-700">{entry.name}</p>
                    <p className="text-sm text-neutral-500">
                      {showPercentage 
                        ? `${entry.percentage}% (${entry.value} tasks)`
                        : `${entry.value} tasks (${entry.percentage}%)`
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex-1 h-96">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={100}
                    outerRadius={140}
                    fill="#8884d8"
                    paddingAngle={4}
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-4 shadow-lg rounded-lg border border-neutral-200">
                            <p className="font-semibold text-neutral-800" style={{ color: data.color }}>
                              {data.name}
                            </p>
                            <p className="text-neutral-600">
                              {showPercentage 
                                ? `${data.percentage}% (${data.value} tasks)`
                                : `${data.value} tasks (${data.percentage}%)`
                              }
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RechartsChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8 bg-white rounded-lg shadow-card p-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Project Schedule Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.completed }}></div>
              <h4 className="text-sm font-medium text-neutral-700 ml-2">On Track</h4>
            </div>
            <p className="mt-1 text-2xl font-bold" style={{ color: COLORS.completed }}>
              {showPercentage 
                ? `${metrics.onTrack}%`
                : Math.round((metrics.onTrack / 100) * metrics.total)
              }
            </p>
            <p className="text-sm text-neutral-500">
              {showPercentage
                ? `${Math.round((metrics.onTrack / 100) * metrics.total)} tasks on schedule`
                : 'tasks on schedule'
              }
            </p>
          </div>
          
          <div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.atRisk }}></div>
              <h4 className="text-sm font-medium text-neutral-700 ml-2">Behind Schedule</h4>
            </div>
            <p className="mt-1 text-2xl font-bold" style={{ color: COLORS.atRisk }}>
              {showPercentage
                ? `${metrics.behindSchedule}%`
                : Math.round((metrics.behindSchedule / 100) * metrics.total)
              }
            </p>
            <p className="text-sm text-neutral-500">
              {showPercentage
                ? `${Math.round((metrics.behindSchedule / 100) * metrics.total)} tasks delayed`
                : 'tasks delayed'
              }
            </p>
          </div>
          
          <div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.inProgress }}></div>
              <h4 className="text-sm font-medium text-neutral-700 ml-2">Ahead of Schedule</h4>
            </div>
            <p className="mt-1 text-2xl font-bold" style={{ color: COLORS.inProgress }}>
              {showPercentage
                ? `${metrics.aheadOfSchedule}%`
                : Math.round((metrics.aheadOfSchedule / 100) * metrics.total)
              }
            </p>
            <p className="text-sm text-neutral-500">
              {showPercentage
                ? `${Math.round((metrics.aheadOfSchedule / 100) * metrics.total)} tasks ahead`
                : 'tasks ahead'
              }
            </p>
          </div>
        </div>
        
        <div className="mt-8">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-neutral-700">Overall Completion</h4>
            <span className="text-sm font-semibold text-neutral-800">
              {showPercentage
                ? `${metrics.completion}%`
                : `${metrics.completed} of ${metrics.total}`
              }
            </span>
          </div>
          <div className="w-full h-3 bg-neutral-200 rounded-full">
            <div 
              className="h-3 rounded-full"
              style={{ 
                width: `${Math.round(metrics.completion)}%`,
                backgroundColor: COLORS.completed
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusOverview;