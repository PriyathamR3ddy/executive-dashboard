import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardView from './views/DashboardView';
import DataInputView from './views/DataInputView';
import TimelineView from './views/TimelineView';
import ResourceAllocationView from './views/ResourceAllocationView';
import DetailedReportView from './views/DetailedReportView';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DataInputView />} />
        <Route path="/dashboard" element={<DashboardView />} />
        <Route path="/timeline" element={<TimelineView />} />
        <Route path="/allocation" element={<ResourceAllocationView />} />
        <Route path="/detailed" element={<DetailedReportView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;