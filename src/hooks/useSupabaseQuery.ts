import { useState, useEffect } from 'react';
import { PostgrestError } from '@supabase/supabase-js';
import { supabase, handleSupabaseError } from '../lib/supabase';

interface UseSupabaseQueryOptions<T> {
  query: () => Promise<{
    data: T[] | null;
    error: PostgrestError | null;
  }>;
  dependencies?: any[];
}

export function useSupabaseQuery<T>({ query, dependencies = [] }: UseSupabaseQueryOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        setLoading(true);
        
        const { data: result, error: queryError } = await query();
        
        if (queryError) {
          throw queryError;
        }
        
        setData(result || []);
      } catch (err) {
        console.error('Error executing query:', err);
        setError(handleSupabaseError(err));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, dependencies);

  return { data, loading, error };
}