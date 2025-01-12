// Add Message interface
export interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read: boolean;
  mentions?: string[];
  lead_id: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed' | 'lost';
  source?: string;
  notes?: string;
  assignedTo?: string;
  propertyId?: string;
  createdAt?: string;
  updatedAt?: string;
}

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