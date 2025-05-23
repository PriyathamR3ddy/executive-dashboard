import React from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useDashboardStore } from '../../store/dashboardStore';
import { calculateMetrics } from '../../utils/metrics';
import { parseDate } from '../../utils/dataTransformation';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const MetricsCharts: React.FC = () => {
  const { filteredData } = useDashboardStore();
  const metrics = calculateMetrics(filteredData);
  
  // Prepare variance data
  const varianceData = [
    { name: 'Ahead of Schedule', value: metrics.variance.negative },
    { name: 'On Schedule', value: metrics.variance.zero },
    { name: 'Behind Schedule', value: metrics.variance.positive }
  ];
  
  // Calculate timeline data by month
  const timelineData = React.useMemo(() => {
    // Get all dates
    const dates = filteredData
      .flatMap(item => [
        parseDate(item["Scheduled Start Date"]),
        parseDate(item["Scheduled End Date"]),
        parseDate(item["Completion Date"])
      ])
      .filter(Boolean) as Date[];

    if (dates.length === 0) return [];

    // Find min and max dates
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    // Create a map to store monthly data
    const monthlyData = new Map();

    // Initialize all months between min and max date
    let currentDate = startOfMonth(minDate);
    while (currentDate <= maxDate) {
      const monthKey = format(currentDate, 'yyyy-MM');
      monthlyData.set(monthKey, {
        name: format(currentDate, 'MMM yyyy'),
        planned: 0,
        actual: 0
      });
      currentDate = startOfMonth(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
    }

    // Count planned and actual completions by month
    filteredData.forEach(item => {
      const scheduledEnd = parseDate(item["Scheduled End Date"]);
      const completionDate = parseDate(item["Completion Date"]);

      if (scheduledEnd) {
        const monthKey = format(scheduledEnd, 'yyyy-MM');
        if (monthlyData.has(monthKey)) {
          monthlyData.get(monthKey).planned++;
        }
      }

      if (completionDate) {
        const monthKey = format(completionDate, 'yyyy-MM');
        if (monthlyData.has(monthKey)) {
          monthlyData.get(monthKey).actual++;
        }
      }
    });

    // Convert map to array and sort by date
    return Array.from(monthlyData.values());
  }, [filteredData]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Timeline Comparison */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Monthly Timeline Comparison</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timelineData}
              margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="planned" 
                stroke="#0077ff" 
                name="Planned Completions"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#00C48C" 
                name="Actual Completions"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Schedule Variance */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Schedule Variance</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={varianceData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#0077ff" name="Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default MetricsCharts;