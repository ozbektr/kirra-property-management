// Add to existing types
export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  propertyId?: string;
  status: 'pending' | 'completed';
  createdAt: string;
  updatedAt: string;
  original_currency?: 'USD' | 'TRY';
  original_amount?: number;
}

// Keep existing types...