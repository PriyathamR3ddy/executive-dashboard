import React from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { FileText, ExternalLink } from 'lucide-react';

const DataSourceSelector: React.FC = () => {
  const { dataSource, setDataSource } = useDashboardStore();
  
  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <h3 className="text-lg font-semibold text-neutral-800 mb-4">Choose Data Source</h3>
      
      <div className="flex flex-col space-y-4">
        <button
          onClick={() => setDataSource('excel')}
          className={`flex items-center p-4 border-2 rounded-lg transition-colors
                     ${dataSource === 'excel' 
                       ? 'border-primary-500 bg-primary-50' 
                       : 'border-neutral-300 hover:border-primary-400'}`}
        >
          <div className={`p-2 rounded-full ${dataSource === 'excel' ? 'bg-primary-100' : 'bg-neutral-100'}`}>
            <FileText 
              size={24} 
              className={dataSource === 'excel' ? 'text-primary-500' : 'text-neutral-500'}
            />
          </div>
          <div className="ml-4">
            <h4 className={`font-medium ${dataSource === 'excel' ? 'text-primary-700' : 'text-neutral-800'}`}>
              Excel/JSON File
            </h4>
            <p className="text-sm text-neutral-600">
              Upload project data from an Excel file exported as JSON
            </p>
          </div>
        </button>
        
        <button
          onClick={() => setDataSource('smartsheet')}
          className={`flex items-center p-4 border-2 rounded-lg transition-colors
                     ${dataSource === 'smartsheet' 
                       ? 'border-primary-500 bg-primary-50' 
                       : 'border-neutral-300 hover:border-primary-400'}`}
        >
          <div className={`p-2 rounded-full ${dataSource === 'smartsheet' ? 'bg-primary-100' : 'bg-neutral-100'}`}>
            <ExternalLink 
              size={24} 
              className={dataSource === 'smartsheet' ? 'text-primary-500' : 'text-neutral-500'}
            />
          </div>
          <div className="ml-4">
            <h4 className={`font-medium ${dataSource === 'smartsheet' ? 'text-primary-700' : 'text-neutral-800'}`}>
              Smartsheet Connection
            </h4>
            <p className="text-sm text-neutral-600">
              Connect directly to Smartsheet for real-time data
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default DataSourceSelector;