import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Calendar,
  Filter,
  Clock
} from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { formatDate } from '../../utils/dataTransformation';

const Navbar: React.FC = () => {
  const { filters, updateFilters, resetFilters, dataSource, processedData } = useDashboardStore();
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Get current date for display
  const today = new Date();
  const formattedDate = formatDate(today);

  // Get delayed items for notifications
  const delayedItems = React.useMemo(() => {
    const items: { component: string; grade: string; unit: string; week: string; activity: string }[] = [];
    
    Object.entries(processedData).forEach(([component, gradeData]) => {
      Object.entries(gradeData).forEach(([grade, unitData]) => {
        Object.entries(unitData).forEach(([unit, weekData]) => {
          Object.entries(weekData).forEach(([week, activities]) => {
            // Add type check for activities array
            if (Array.isArray(activities)) {
              activities.forEach(activity => {
                const startDate = new Date(activity["Scheduled Start Date"]);
                const endDate = new Date(activity["Scheduled End Date"]);
                const progress = activity.Progress.toLowerCase();
                
                // Check for delays
                if (
                  (progress === 'not started' && startDate < today) ||
                  (progress === 'in progress' && endDate < today)
                ) {
                  items.push({
                    component,
                    grade,
                    unit,
                    week,
                    activity: activity.Activity
                  });
                }
              });
            }
          });
        });
      });
    });
    
    return items;
  }, [processedData]);
  
  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left section with search */}
        <div className="flex items-center">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-neutral-400" />
            </div>
            <input
              type="text"
              placeholder="Search projects..."
              className="block w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          {/* Filters button */}
          <button 
            className="ml-4 px-3 py-2 border border-neutral-300 rounded-md flex items-center text-sm text-neutral-700 hover:bg-neutral-50"
            onClick={() => {/* Open filters panel */}}
          >
            <Filter size={16} className="mr-2" />
            Filters
          </button>
        </div>
        
        {/* Right section with date and notifications */}
        <div className="flex items-center space-x-4">
          {/* Data source indicator */}
          <div className="flex items-center text-sm text-neutral-600">
            <span className="mr-2">Source:</span>
            <span className="font-medium text-primary-600 capitalize">{dataSource}</span>
          </div>
          
          {/* Date */}
          <div className="flex items-center text-sm text-neutral-600">
            <Calendar size={16} className="mr-2" />
            {formattedDate}
          </div>
          
          {/* Notifications */}
          <div className="relative">
            <button 
              className="relative p-2 text-neutral-600 hover:text-primary-600 focus:outline-none"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={20} />
              {delayedItems.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-neutral-200 z-50">
                <div className="p-4 border-b border-neutral-200">
                  <h3 className="text-lg font-semibold text-neutral-800">Delayed Items</h3>
                  <p className="text-sm text-neutral-600 mt-1">
                    {delayedItems.length} items require attention
                  </p>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {delayedItems.length > 0 ? (
                    <div className="divide-y divide-neutral-200">
                      {delayedItems.map((item, index) => (
                        <div 
                          key={index} 
                          className="p-4 hover:bg-neutral-50 transition-colors"
                        >
                          <div className="flex items-start">
                            <Clock size={16} className="text-red-500 mt-1 flex-shrink-0" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-neutral-800">
                                {item.component} - Grade {item.grade}
                              </p>
                              <p className="text-sm text-neutral-600 mt-1">
                                Unit {item.unit} - Week {item.week}
                              </p>
                              <p className="text-sm text-neutral-500 mt-1">
                                {item.activity}
                              </p>
                            </div>
                            <Bell size={14} className="text-red-500 ml-auto animate-bounce" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-neutral-600">No delayed items to show</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;