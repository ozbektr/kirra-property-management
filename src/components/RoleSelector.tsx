import React from 'react';
import { useRBAC } from '../hooks/useRBAC';

interface RoleSelectorProps {
  selectedRole: 'owner' | 'admin';
  onRoleChange: (role: 'owner' | 'admin') => void;
}

const RoleSelector = ({ selectedRole, onRoleChange }: RoleSelectorProps) => {
  const { isAdmin, isOwner } = useRBAC();

  if (!isAdmin() && !isOwner()) {
    return null;
  }

  return (
    <div className="flex space-x-2 bg-dark-700 p-1 rounded-lg">
      {isOwner() && (
        <button
          onClick={() => onRoleChange('owner')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedRole === 'owner'
              ? 'bg-primary-600 text-white'
              : 'text-dark-300 hover:text-primary-400'
          }`}
        >
          Owner View
        </button>
      )}
      {isAdmin() && (
        <button
          onClick={() => onRoleChange('admin')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedRole === 'admin'
              ? 'bg-primary-600 text-white'
              : 'text-dark-300 hover:text-primary-400'
          }`}
        >
          Admin View
        </button>
      )}
    </div>
  );
};

export default RoleSelector;