import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables for Supabase configuration');
}

// Create Supabase client with error handling and retry logic
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  },
  global: {
    headers: {
      'x-client-info': 'property-management-app'
    }
  },
  // Add retry configuration
  db: {
    schema: 'public'
  }
});

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  const configured = Boolean(supabaseUrl && supabaseAnonKey);
  if (!configured) {
    console.error('Supabase is not properly configured. Missing environment variables.');
  }
  return configured;
};

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: unknown): string => {
  if (!error) return 'An unknown error occurred';

  // Log the error for debugging
  console.error('Supabase error:', error);

  // Handle PostgrestError
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const pgError = error as { code: string; message: string };
    
    switch (pgError.code) {
      case '23505': // unique_violation
        return 'This record already exists.';
      case '23503': // foreign_key_violation
        return 'This operation cannot be completed due to related records.';
      case '42P01': // undefined_table
        return 'The requested resource is not available.';
      case '42501': // insufficient_privilege
        return 'You do not have permission to perform this action.';
      case 'PGRST301': // Row-level security violation
        return 'Access denied. Please check your permissions.';
      case 'PGRST116': // Single row expected
        return 'Record not found.';
      case '23502': // not_null_violation
        return 'Please fill in all required fields.';
      default:
        return pgError.message || 'An error occurred while processing your request.';
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    if (error.message.includes('Failed to fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    return error.message;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred. Please try again.';
};

// Helper function to retry failed requests
export const retryRequest = async <T>(
  request: () => Promise<T>,
  maxRetries = 3
): Promise<T> => {
  let lastError: unknown;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await request();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
  
  throw lastError;
};