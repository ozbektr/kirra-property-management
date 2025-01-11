import React, { useState } from 'react';
import { Building } from 'lucide-react';
import RoleSelector from '../RoleSelector';
import { useRBAC } from '../../hooks/useRBAC';

const Header = () => {
  const { isAdmin, isOwner } = useRBAC();
  const [selectedRole, setSelectedRole] = useState<'owner' | 'admin'>(
    isAdmin() ? 'admin' : 'owner'
  );

  const handleRoleChange = (role: 'owner' | 'admin') => {
    setSelectedRole(role);
    // You can add additional logic here when role changes
  };

  return (
    <nav className="bg-dark-800 shadow-lg border-b border-dark-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-primary-400" />
            <span className="ml-2 text-xl font-bold text-white">Kirra</span>
          </div>
          
          {(isAdmin() || isOwner()) && (
            <div className="flex items-center">
              <RoleSelector
                selectedRole={selectedRole}
                onRoleChange={handleRoleChange}
              />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;