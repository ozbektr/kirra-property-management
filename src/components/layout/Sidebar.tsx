import React from 'react';
import { useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calculator, 
  BarChart3, 
  Building2, 
  HelpCircle,
  Settings,
  Users,
  DollarSign,
  MessageSquare
} from 'lucide-react';
import MenuItem from './MenuItem';
import UserMenu from './UserMenu';
import { useRBAC } from '../../hooks/useRBAC';

const Sidebar = () => {
  const location = useLocation();
  const { isAdmin, isOwner, loading, userRole, isAdminApproved } = useRBAC();

  if (loading) {
    return (
      <aside className="w-64 bg-dark-800 h-screen border-r border-dark-700">
        <div className="p-4">
          <div className="h-8 bg-dark-700 animate-pulse rounded"></div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-dark-800 h-screen border-r border-dark-700">
      <div className="p-4">
        <div className="flex items-center">
          <Building2 className="h-8 w-8 text-primary-400" />
          <span className="ml-2 text-xl font-bold text-white">Turk Citizen</span>
        </div>
      </div>
      
      <nav className="mt-4">
        <ul className="space-y-1">
          <MenuItem icon={LayoutDashboard} label="Overview" to="/" />
          <MenuItem icon={Calculator} label="Accounting" to="/accounting" />
          <MenuItem icon={BarChart3} label="Analytics" to="/analytics" />
          
          {/* Show properties only for property owners */}
          {isOwner() && (
            <MenuItem icon={Building2} label="Properties" to="/properties" />
          )}
          
          <MenuItem icon={HelpCircle} label="Help" to="/help" />

          {/* Show admin section only if user is an approved admin */}
          {isAdmin() && isAdminApproved && (
            <>
              <div className="py-2 px-4">
                <div className="h-px bg-dark-700"></div>
                <div className="py-2 text-xs font-medium text-dark-400 uppercase">Admin</div>
              </div>
              <MenuItem icon={Settings} label="Property Management" to="/admin" />
              <MenuItem icon={Users} label="Lead Management" to="/leads" />
              <MenuItem 
                icon={DollarSign} 
                label="Transactions" 
                to="/transactions"
              />
              <MenuItem 
                icon={MessageSquare} 
                label="WhatsApp" 
                to="/whatsapp"
              />
            </>
          )}
        </ul>
      </nav>

      <UserMenu />
    </aside>
  );
};

export default Sidebar;