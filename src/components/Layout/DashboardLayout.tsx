import React, { ReactNode } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Menu, X } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { showSidebar, toggleSidebar } = useDashboardStore();
  
  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg transition-all duration-300 transform lg:relative lg:translate-x-0 w-64
                   ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar />
      </aside>
      
      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        
        {/* Mobile sidebar toggle */}
        <button
          className="lg:hidden absolute top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md"
          onClick={toggleSidebar}
        >
          {showSidebar ? <X size={20} /> : <Menu size={20} />}
        </button>
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;