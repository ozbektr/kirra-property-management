import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Calculator, 
  BarChart3, 
  Building2, 
  ClipboardList, 
  HelpCircle, 
  ChevronDown,
  UserCircle
} from 'lucide-react';

const MenuItem = ({ icon: Icon, label, active = false }: { icon: React.ElementType, label: string, active?: boolean }) => (
  <li className={`flex items-center px-4 py-2 space-x-3 rounded-lg cursor-pointer ${active ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}>
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </li>
);

const Sidebar = () => {
  return (
    <aside className="w-64 bg-white h-screen border-r border-gray-200">
      <div className="p-4">
        <img src="/logo.svg" alt="Logo" className="h-8" />
      </div>
      
      <nav className="mt-4">
        <ul className="space-y-1">
          <MenuItem icon={LayoutDashboard} label="Overview" active />
          <MenuItem icon={Calendar} label="Calendar" />
          <MenuItem icon={Calendar} label="Inline calendar" />
          <MenuItem icon={Calculator} label="Accounting" />
          <MenuItem icon={BarChart3} label="Analytics" />
          <MenuItem icon={Building2} label="My properties" />
          <MenuItem icon={ClipboardList} label="My listings" />
          <MenuItem icon={HelpCircle} label="Help" />
        </ul>
      </nav>

      <div className="absolute bottom-0 w-64 border-t border-gray-200">
        <div className="p-4">
          <button className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
            <div className="flex items-center space-x-3">
              <UserCircle className="w-5 h-5" />
              <span>My account</span>
            </div>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;