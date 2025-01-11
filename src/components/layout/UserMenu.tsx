import React, { useState } from 'react';
import { UserCircle, ChevronDown, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import UserProfile from '../auth/UserProfile';

const UserMenu = () => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <>
      <div className="absolute bottom-0 w-64 border-t border-dark-700">
        <div className="p-4">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center justify-between w-full px-4 py-2 text-sm text-dark-300 hover:bg-dark-700 hover:text-primary-300 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <UserCircle className="w-5 h-5" />
              <span>My account</span>
            </div>
            <ChevronDown className={`w-4 h-4 transform transition-transform ${showMenu ? 'rotate-180' : ''}`} />
          </button>

          {showMenu && (
            <div className="mt-2 py-1 bg-dark-700 rounded-lg shadow-lg">
              <button
                onClick={() => {
                  setShowProfile(true);
                  setShowMenu(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-dark-300 hover:bg-dark-600 hover:text-primary-300"
              >
                <Settings className="w-4 h-4 mr-2" />
                Profile Settings
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-dark-300 hover:bg-dark-600 hover:text-red-400"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {showProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <h2 className="text-lg font-semibold text-white">Account Settings</h2>
              <button
                onClick={() => setShowProfile(false)}
                className="text-dark-400 hover:text-white transition-colors"
              >
                <ChevronDown className="w-5 h-5 transform rotate-180" />
              </button>
            </div>
            <UserProfile />
          </div>
        </div>
      )}
    </>
  );
};

export default UserMenu;