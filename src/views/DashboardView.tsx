import React from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import StatusOverview from '../components/Dashboard/StatusOverview';
import FilterPanel from '../components/Dashboard/FilterPanel';
import MetricsCharts from '../components/Dashboard/MetricsCharts';
import HierarchicalView from '../components/Dashboard/HierarchicalView';
import { useDashboardStore } from '../store/dashboardStore';
import { parseDate, formatDate } from '../utils/dataTransformation';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

const DashboardView: React.FC = () => {
  const { rawData, filteredData, filters } = useDashboardStore();
  
  // Check if data is loaded
  const hasData = rawData.length > 0;

  // Get unique components and their date ranges
  const componentData = React.useMemo(() => {
    const data: Record<string, {
      startDate: Date | null;
      endDate: Date | null;
      baselineStart: Date | null;
      baselineFinish: Date | null;
      variance: number;
    }> = {};

    rawData.forEach(item => {
      const component = item.Component;
      if (!data[component]) {
        data[component] = {
          startDate: null,
          endDate: null,
          baselineStart: null,
          baselineFinish: null,
          variance: 0
        };
      }

      const currentStart = parseDate(item["Scheduled Start Date"]);
      const currentEnd = parseDate(item["Scheduled End Date"]);
      const baselineStart = parseDate(item["Baseline Start"]);
      const baselineFinish = parseDate(item["Baseline Finish"]);
      const variance = parseInt(item.Variance) || 0;

      // Update start date if earlier
      if (currentStart && (!data[component].startDate || currentStart < data[component].startDate)) {
        data[component].startDate = currentStart;
      }

      // Update end date if later
      if (currentEnd && (!data[component].endDate || currentEnd > data[component].endDate)) {
        data[component].endDate = currentEnd;
      }

      // Update baseline start if earlier
      if (baselineStart && (!data[component].baselineStart || baselineStart < data[component].baselineStart)) {
        data[component].baselineStart = baselineStart;
      }

      // Update baseline finish if later
      if (baselineFinish && (!data[component].baselineFinish || baselineFinish > data[component].baselineFinish)) {
        data[component].baselineFinish = baselineFinish;
      }

      // Accumulate variance
      data[component].variance += variance;
    });

    return data;
  }, [rawData]);
  
  return (
    <DashboardLayout>
      {hasData ? (
        <div className="space-y-6">
          {/* Title with counter */}
          <div className="flex flex-wrap items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Executive Dashboard</h1>
              <p className="text-sm text-neutral-600 mt-1">
                Viewing {filteredData.length} of {rawData.length} workflow items
                {Object.keys(filters).length > 0 && ' (filtered)'}
              </p>
            </div>
          </div>

          {/* Project Summary Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-neutral-800">Project Summary</h2>
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(componentData).map(([component, data]) => (
                <div key={component} className="bg-white rounded-lg shadow-card p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-shrink-0">
                      <h3 className="text-xl font-semibold text-neutral-800">{component}</h3>
                      <p className="text-sm text-neutral-600 mt-1">Project Component</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-grow">
                      {/* Actual Dates */}
                      <div className="bg-neutral-50 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <Calendar size={16} className="text-primary-600 mr-2" />
                          <h4 className="text-sm font-medium text-neutral-700">Actual Timeline</h4>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="text-neutral-600">{formatDate(data.startDate)}</span>
                          <ArrowRight size={14} className="mx-2 text-neutral-400" />
                          <span className="text-neutral-600">{formatDate(data.endDate)}</span>
                        </div>
                      </div>

                      {/* Baseline Dates */}
                      <div className="bg-neutral-50 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <Clock size={16} className="text-secondary-600 mr-2" />
                          <h4 className="text-sm font-medium text-neutral-700">Baseline Timeline</h4>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="text-neutral-600">{formatDate(data.baselineStart)}</span>
                          <ArrowRight size={14} className="mx-2 text-neutral-400" />
                          <span className="text-neutral-600">{formatDate(data.baselineFinish)}</span>
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="bg-neutral-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-neutral-700 mb-2">Project Duration</h4>
                        <p className="text-lg font-semibold text-neutral-800">
                          {data.startDate && data.endDate ? 
                            `${Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24))} days` :
                            'N/A'
                          }
                        </p>
                      </div>

                      {/* Variance */}
                      <div className="bg-neutral-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-neutral-700 mb-2">Schedule Variance</h4>
                        <p className={`text-lg font-semibold ${
                          data.variance > 0 ? 'text-danger' :
                          data.variance < 0 ? 'text-success' :
                          'text-neutral-800'
                        }`}>
                          {data.variance > 0 ? '+' : ''}{data.variance} days
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Filter panel */}
          <FilterPanel />
          
          {/* Status overview section */}
          <StatusOverview />
          
          {/* Metrics charts section */}
          <MetricsCharts />
          
          {/* Hierarchical view */}
          <div className="grid grid-cols-1 gap-6">
            <HierarchicalView />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)]">
          <img 
            src="https://images.pexels.com/photos/7147450/pexels-photo-7147450.jpeg?auto=compress&cs=tinysrgb&w=600" 
            alt="Dashboard" 
            className="w-96 h-auto rounded-lg mb-6 opacity-70"
          />
          <h2 className="text-xl font-bold text-neutral-700 mb-2">Welcome to the Executive Dashboard</h2>
          <p className="text-neutral-600 text-center max-w-md mb-8">
            Get started by selecting a data source and loading your project data to view comprehensive metrics and insights.
          </p>
          <Link to="/" className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Load Project Data
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
};

import { Link } from 'react-router-dom';

export default DashboardView;