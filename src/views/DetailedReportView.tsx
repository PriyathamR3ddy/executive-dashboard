import React from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import DetailedTable from '../components/Dashboard/DetailedTable';
import FilterPanel from '../components/Dashboard/FilterPanel';

const DetailedReportView: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Detailed Report</h1>
          <p className="text-neutral-600 mt-1">
            Comprehensive view of all workflow items and their status
          </p>
        </div>
        
        <FilterPanel />
        
        <DetailedTable />
      </div>
    </DashboardLayout>
  );
};

export default DetailedReportView;