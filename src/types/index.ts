// Add to existing types
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

// Keep existing types...