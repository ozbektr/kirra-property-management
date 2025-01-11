import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
}

const MenuItem = ({ icon: Icon, label, to }: MenuItemProps) => {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <li>
      <Link
        to={to}
        className={`flex items-center px-4 py-2 space-x-3 rounded-lg cursor-pointer ${
          active
            ? 'bg-primary-900/50 text-primary-400'
            : 'text-dark-300 hover:bg-dark-700 hover:text-primary-300'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span>{label}</span>
      </Link>
    </li>
  );
};

export default MenuItem;