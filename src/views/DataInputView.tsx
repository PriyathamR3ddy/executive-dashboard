import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStore } from '../store/dashboardStore';
import DataSourceSelector from '../components/Dashboard/DataSourceSelector';
import FileUpload from '../components/DataInput/FileUpload';
import SmartsheetInput from '../components/DataInput/SmartsheetInput';

const DataInputView: React.FC = () => {
  const { dataSource, rawData } = useDashboardStore();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    if (rawData.length > 0) {
      navigate('/dashboard');
    }
  }, [rawData, navigate]);
  
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-900">Executive Project Dashboard</h1>
          <p className="text-neutral-600 mt-2">
            Choose a data source and load your project data to get started
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DataSourceSelector />
          {dataSource === 'excel' ? <FileUpload /> : <SmartsheetInput />}
        </div>
        
        <div className="bg-white rounded-lg shadow-card p-6 mt-8">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">Data Format Instructions</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-neutral-800 mb-2">Required Data Structure</h4>
              <div className="bg-neutral-50 p-4 rounded-md">
                <pre className="text-xs text-neutral-800 overflow-x-auto">
{`Component
└── Grade
    └── Unit
        └── Week
            └── [List of workflow objects]`}
                </pre>
              </div>
              <p className="text-sm text-neutral-600 mt-2">
                Your data should follow this hierarchical structure for optimal dashboard performance.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-neutral-800 mb-3">Required Fields</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-neutral-700 mb-2">Core Fields</h5>
                  <ul className="text-sm text-neutral-600 list-disc pl-5 space-y-1">
                    <li>Component - The main project component</li>
                    <li>Grade/Level - Grade level designation</li>
                    <li>Unit - Unit identifier</li>
                    <li>Week - Corresponding week identifier</li>
                    <li>Activity - Type of activity</li>
                    <li>Workflow - Specific workflow step, WBS</li>
                    <li>Progress - Current status (Complete, In Progress, Not Started)</li>
                    <li>Health - Health indicator (Green, Yellow, Red)</li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-neutral-700 mb-2">Additional Required Fields</h5>
                  <ul className="text-sm text-neutral-600 list-disc pl-5 space-y-1">
                    <li>Scheduled Start Date - Task start date</li>
                    <li>Scheduled End Date - Task end date</li>
                    <li>Baseline Start - Original planned start date</li>
                    <li>Baseline Finish - Original planned finish date</li>
                    <li>Reporting Status - Current reporting status</li>
                    <li>WW Status - Wood Wing status</li>
                    <li>Assigned to: - Task assignee(s)</li>
                    <li>% Complete - Completion percentage</li>
                    <li>% Remaining - Remaining work percentage</li>
                    <li>% Allocation - Resource allocation percentage</li>
                    <li>Predecessors - Dependent tasks</li>
                    <li>Duration - Task duration</li>
                    <li>Comments - Task notes or comments</li>
                    <li>Completion Date - Actual completion date</li>
                    <li>Variance - Schedule variance</li>
                    <li>Format - Task format specification</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-primary-50 border border-primary-200 rounded-md p-4">
              <p className="text-sm text-primary-800">
                <strong>Important:</strong> Ensure all fields are present in your data, even if some values are empty. 
                This ensures proper functionality of filtering, sorting, and visualization features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataInputView;