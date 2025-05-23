import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Clock, 
  Users, 
  List,
  FileText,
  Settings,
  HelpCircle,
  Upload
} from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { selectedView, setSelectedView } = useDashboardStore();
  
  const navigationItems = [
    {
      name: 'Data Input',
      icon: <Upload size={20} />,
      view: 'overview' as const,
      path: '/'
    },
    {
      name: 'Overview',
      icon: <LayoutDashboard size={20} />,
      view: 'overview' as const,
      path: '/dashboard'
    },
    {
      name: 'Timeline',
      icon: <Clock size={20} />,
      view: 'timeline' as const,
      path: '/timeline'
    },
    {
      name: 'Resource Allocation',
      icon: <Users size={20} />,
      view: 'allocation' as const,
      path: '/allocation'
    },
    {
      name: 'Detailed Report',
      icon: <List size={20} />,
      view: 'detailed' as const, 
      path: '/detailed'
    }
  ];

  // Utility Items
  const utilityItems = [
    {
      name: 'Documentation',
      icon: <FileText size={20} />,
      path: '/docs'
    },
    {
      name: 'Settings',
      icon: <Settings size={20} />,
      path: '/settings'
    },
    {
      name: 'Help',
      icon: <HelpCircle size={20} />,
      path: '/help'
    }
  ];

  const handleNavClick = (view: 'overview' | 'timeline' | 'allocation' | 'detailed') => {
    setSelectedView(view);
  };
  
  return (
    <div className="flex flex-col h-full bg-white border-r border-neutral-200">
      {/* Logo and Brand */}
      <div className="py-6 px-4 border-b border-neutral-200">
        <h1 className="text-xl font-display font-bold text-primary-600">
          Executive Dashboard
        </h1>
        <p className="text-sm text-neutral-500 mt-1">Project Insights</p>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-2 space-y-1">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => handleNavClick(item.view)}
              className={`group flex items-center px-4 py-3 text-sm font-medium rounded-md transition-all
                ${location.pathname === item.path 
                  ? 'bg-primary-50 text-primary-600' 
                  : 'text-neutral-700 hover:bg-neutral-100'}`}
            >
              <span className={`mr-3 ${location.pathname === item.path ? 'text-primary-600' : 'text-neutral-500 group-hover:text-neutral-700'}`}>
                {item.icon}
              </span>
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      
      {/* Utility Navigation */}
      <div className="py-4 border-t border-neutral-200">
        <nav className="px-2 space-y-1">
          {utilityItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="group flex items-center px-4 py-2 text-sm font-medium text-neutral-700 rounded-md hover:bg-neutral-100 hover:text-neutral-900"
            >
              <span className="mr-3 text-neutral-500 group-hover:text-neutral-700">
                {item.icon}
              </span>
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;