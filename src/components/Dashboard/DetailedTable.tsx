import React, { useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { formatDate } from '../../utils/dataTransformation';
import { Download, ChevronDown, ChevronUp, ChevronRight, Filter, X } from 'lucide-react';

const DetailedTable: React.FC = () => {
  const { filteredData } = useDashboardStore();
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  
  // Sorting logic
  const sortedData = React.useMemo(() => {
    if (!sortField) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      let aValue = a[sortField as keyof typeof a] || '';
      let bValue = b[sortField as keyof typeof b] || '';
      
      // Convert to same type for comparison
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = String(bValue).toLowerCase();
      }
      
      // Check if the values are dates
      if (aValue && (sortField.includes('Date') || sortField === 'Baseline Start' || sortField === 'Baseline Finish')) {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        
        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
          return sortDirection === 'asc' 
            ? aDate.getTime() - bDate.getTime()
            : bDate.getTime() - aDate.getTime();
        }
      }
      
      // Regular string comparison
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortDirection]);
  
  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const currentItems = sortedData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Helper for sort indicator
  const getSortIndicator = (field: string) => {
    if (sortField !== field) return <ChevronRight size={14} className="opacity-50" />;
    return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };
  
  // Health status color
  const getHealthColor = (health: string) => {
    switch (health.toLowerCase()) {
      case 'green': return 'bg-success';
      case 'yellow': return 'bg-warning';
      case 'red': return 'bg-danger';
      default: return 'bg-neutral-300';
    }
  };
  
  // Progress status style
  const getProgressStyle = (progress: string) => {
    switch (progress.toLowerCase()) {
      case 'complete': return 'bg-success text-white';
      case 'in progress': return 'bg-primary-500 text-white';
      case 'not started': return 'bg-neutral-300 text-neutral-800';
      default: return 'bg-neutral-200 text-neutral-800';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-card overflow-hidden">
      <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-neutral-800">Detailed Workflow Items</h3>
        <div className="flex space-x-2">
          <button className="flex items-center px-3 py-1.5 text-sm border border-neutral-300 rounded hover:bg-neutral-50">
            <Filter size={14} className="mr-1" /> Filter
          </button>
          <button className="flex items-center px-3 py-1.5 text-sm text-primary-700 border border-primary-200 bg-primary-50 rounded hover:bg-primary-100">
            <Download size={14} className="mr-1" /> Export
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('Health')}
                >
                  Health {getSortIndicator('Health')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('Component')}
                >
                  Component {getSortIndicator('Component')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('Grade/Level')}
                >
                  Grade {getSortIndicator('Grade/Level')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('Unit')}
                >
                  Unit {getSortIndicator('Unit')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('Week')}
                >
                  Week {getSortIndicator('Week')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('Activity')}
                >
                  Activity {getSortIndicator('Activity')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('Workflow')}
                >
                  Workflow {getSortIndicator('Workflow')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('Assigned to:')}
                >
                  Assigned To {getSortIndicator('Assigned to:')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('Progress')}
                >
                  Progress {getSortIndicator('Progress')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('Scheduled End Date')}
                >
                  Due Date {getSortIndicator('Scheduled End Date')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {currentItems.map((item, index) => (
              <tr key={index} className="hover:bg-neutral-50">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className={`h-4 w-4 rounded-full ${getHealthColor(item.Health)}`}></div>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-900">{item.Component}</td>
                <td className="px-4 py-3 text-sm text-neutral-900">{item["Grade/Level"]}</td>
                <td className="px-4 py-3 text-sm text-neutral-900">{item.Unit}</td>
                <td className="px-4 py-3 text-sm text-neutral-900">{item.Week}</td>
                <td className="px-4 py-3 text-sm text-neutral-900">{item.Activity}</td>
                <td className="px-4 py-3 text-sm text-neutral-900">{item.Workflow}</td>
                <td className="px-4 py-3 text-sm text-neutral-900">{item["Assigned to:"]}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getProgressStyle(item.Progress)}`}>
                    {item.Progress}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-900">{item["Scheduled End Date"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-neutral-200">
          <div className="flex-1 flex justify-between items-center">
            <p className="text-sm text-neutral-700">
              Showing <span className="font-medium">{(page - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-medium">{Math.min(page * itemsPerPage, sortedData.length)}</span> of{' '}
              <span className="font-medium">{sortedData.length}</span> results
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-neutral-300 rounded-md text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-neutral-300 rounded-md text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailedTable;