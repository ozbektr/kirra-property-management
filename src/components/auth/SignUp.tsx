import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AuthLayout from './AuthLayout';

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'owner' as 'owner' | 'admin',
    companyName: '',
    phone: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validatePassword = (password: string): { isValid: boolean; message: string } => {
    if (password.length < 6) {
      return { isValid: false, message: 'Password must be at least 6 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }
    return { isValid: true, message: '' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Password validation
    const { isValid, message } = validatePassword(formData.password);
    if (!isValid) {
      setError(message);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    try {
      setLoading(true);

      // First, ensure no existing session
      await supabase.auth.signOut();

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.email)
        .maybeSingle();

      if (existingProfile) {
        setError('An account with this email already exists. Please sign in instead.');
        return;
      }

      // Attempt signup
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: formData.role,
            company_name: formData.companyName,
            phone: formData.phone
          }
        }
      });

      if (signUpError) {
        if (signUpError.message?.includes('already registered')) {
          setError('An account with this email already exists. Please sign in instead.');
          return;
        }
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error('Failed to create account');
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: signUpData.user.id,
          email: formData.email,
          company_name: formData.companyName,
          phone: formData.phone,
          role: formData.role,
          is_admin: false
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Clean up on profile creation failure
        await supabase.auth.signOut();
        throw new Error('Failed to create user profile. Please try again.');
      }

      // Handle admin request if needed
      if (formData.role === 'admin') {
        const { error: requestError } = await supabase
          .from('admin_requests')
          .insert({
            user_id: signUpData.user.id,
            email: formData.email,
            company_name: formData.companyName,
            phone: formData.phone,
            status: 'pending'
          });

        if (requestError) {
          console.error('Admin request creation error:', requestError);
        }

        // Notify admin
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: signUpData.user.id,
            title: 'New Admin Request',
            content: `New admin request from ${formData.email} (${formData.companyName})`,
            type: 'admin_request'
          });

        if (notifError) {
          console.error('Notification creation error:', notifError);
        }
      }

      // Ensure clean state
      await supabase.auth.signOut();

      // Redirect with appropriate message
      navigate('/login', { 
        state: { 
          message: formData.role === 'admin'
            ? 'Your admin request has been submitted and is pending approval. You will receive an email notification once approved.'
            : 'Account created successfully! Please sign in.'
        }
      });
    } catch (err) {
      console.error('Error during sign up:', err);
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }

      // Clean up on error
      try {
        await supabase.auth.signOut();
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="bg-dark-800 rounded-lg px-8 py-10 shadow-xl border border-dark-700">
        <h2 className="text-center text-2xl font-bold text-white mb-8">
          Create your account
        </h2>
        {error && (
          <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/50 text-red-500">
            {error}
          </div>
        )}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">
              Account Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="owner"
                  checked={formData.role === 'owner'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'owner' | 'admin' })}
                  className="mr-2 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-white">Property Owner</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="admin"
                  checked={formData.role === 'admin'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'owner' | 'admin' })}
                  className="mr-2 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-white">Administrator</span>
              </label>
            </div>
            {formData.role === 'admin' && (
              <p className="mt-2 text-sm text-yellow-400">
                Note: Admin registration requires approval. You will receive an email notification once approved.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-dark-300">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full rounded-md bg-dark-700 border-dark-600 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-dark-300">
              Company Name
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="mt-1 block w-full rounded-md bg-dark-700 border-dark-600 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-dark-300">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 block w-full rounded-md bg-dark-700 border-dark-600 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>


          <div>
            <label htmlFor="password" className="block text-sm font-medium text-dark-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 block w-full rounded-md bg-dark-700 border-dark-600 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <p className="mt-1 text-sm text-dark-400">
              Password must be at least 6 characters long and contain uppercase, lowercase, and numbers
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-300">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="mt-1 block w-full rounded-md bg-dark-700 border-dark-600 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-dark-300">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-400 hover:text-primary-300">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default SignUp;