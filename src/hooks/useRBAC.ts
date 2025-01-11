import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface Permission {
  resource: string;
  action: string;
}

export const useRBAC = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'owner' | 'admin' | null>(null);
  const [isAdminApproved, setIsAdminApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPermissions = async () => {
      if (!user) {
        setPermissions([]);
        setUserRole(null);
        setIsAdminApproved(false);
        setLoading(false);
        return;
      }

      let retries = 3;
      while (retries > 0) {
        try {
          setError(null);
          
          // Get user profile with role and admin status
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, is_admin, company_name')
            .eq('id', user.id)
            .single();

          if (profileError) {
            throw profileError;
          }

          if (profile) {
            setUserRole(profile.is_admin ? 'admin' : profile.role);
            setIsAdminApproved(profile.is_admin);

            // Get role permissions
            const { data: rolePermissions, error: permissionsError } = await supabase
              .from('role_permissions')
              .select('resource, action')
              .eq('role', profile.role);

            if (permissionsError) {
              throw permissionsError;
            }

            setPermissions(rolePermissions || []);
            break; // Success - exit retry loop
          }
        } catch (err) {
          console.error('Error loading permissions (attempt ' + (4 - retries) + '):', err);
          retries--;
          
          if (retries === 0) {
            setError('Failed to load permissions. Please refresh the page.');
            setPermissions([]);
            setUserRole(null);
            setIsAdminApproved(false);
          } else {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, 3 - retries) * 1000));
          }
        }
      }
      
      setLoading(false);
    };

    loadPermissions();
  }, [user]);

  const can = (action: string, resource: string): boolean => {
    if (!user || loading || error) return false;
    return permissions.some(
      p => p.action === action && p.resource === resource
    );
  };

  const isAdmin = (): boolean => {
    if (!user || loading || error) return false;
    return userRole === 'admin' && isAdminApproved;
  };

  const isOwner = (): boolean => {
    if (!user || loading || error) return false;
    return userRole === 'owner';
  };

  return {
    can,
    isAdmin,
    isOwner,
    loading,
    error,
    userRole,
    isAdminApproved
  };
};