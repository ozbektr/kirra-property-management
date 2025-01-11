import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Mail, 
  Phone, 
  Calendar, 
  MessageSquare,
  User,
  Building2
} from 'lucide-react';
import type { Lead } from '../types';
import { supabase } from '../lib/supabase';
import LeadEditModal from './LeadEditModal';
import MessageModal from './MessageModal';
import AddLeadModal from './AddLeadModal';

const Leads = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [messagingLead, setMessagingLead] = useState<Lead | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeads();
    
    const subscription = supabase
      .channel('leads')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'leads' 
      }, payload => {
        if (payload.eventType === 'INSERT') {
          const newLead = transformLeadData(payload.new);
          setLeads(current => [newLead, ...current]);
        } else if (payload.eventType === 'UPDATE') {
          const updatedLead = transformLeadData(payload.new);
          setLeads(current => 
            current.map(lead => 
              lead.id === updatedLead.id ? updatedLead : lead
            )
          );
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const transformLeadData = (data: any): Lead => ({
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone || '',
    status: data.status,
    source: data.source,
    notes: data.notes,
    assignedTo: data.assigned_to,
    propertyId: data.property_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  });

  const loadLeads = async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('No authenticated user found');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      if (data) {
        const transformedLeads = data.map(transformLeadData);
        setLeads(transformedLeads);
      }
    } catch (error) {
      console.error('Error loading leads:', error);
      setError('Failed to load leads. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLead = (newLead: Lead) => {
    setLeads(current => [newLead, ...current]);
  };

  const handleUpdateLead = (updatedLead: Lead) => {
    setLeads(current =>
      current.map(lead =>
        lead.id === updatedLead.id ? updatedLead : lead
      )
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.phone || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center text-dark-300">Loading leads...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">Lead Management</h1>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </button>
      </div>

      <div className="bg-dark-800 rounded-lg shadow-lg border border-dark-700">
        <div className="p-6 border-b border-dark-700">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white appearance-none focus:outline-none focus:border-primary-500"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="closed">Closed</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-dark-700">
                <th className="px-6 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Lead</th>
                <th className="px-6 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-dark-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-primary-400 mr-3" />
                      <div>
                        <div className="font-medium text-white">{lead.name}</div>
                        {lead.propertyId && (
                          <div className="flex items-center text-dark-400 text-sm mt-1">
                            <Building2 className="w-4 h-4 mr-1" />
                            <span>Property Interest</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-dark-300">
                        <Mail className="w-4 h-4 mr-2" />
                        <span>{lead.email}</span>
                      </div>
                      {lead.phone && (
                        <div className="flex items-center text-dark-300">
                          <Phone className="w-4 h-4 mr-2" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      lead.status === 'new' ? 'bg-blue-500/20 text-blue-400' :
                      lead.status === 'contacted' ? 'bg-yellow-500/20 text-yellow-400' :
                      lead.status === 'qualified' ? 'bg-green-500/20 text-green-400' :
                      lead.status === 'proposal' ? 'bg-purple-500/20 text-purple-400' :
                      lead.status === 'negotiation' ? 'bg-orange-500/20 text-orange-400' :
                      lead.status === 'closed' ? 'bg-primary-500/20 text-primary-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-dark-300">{lead.source}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-dark-300">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{formatDate(lead.createdAt)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setEditingLead(lead)}
                        className="text-primary-400 hover:text-primary-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setMessagingLead(lead)}
                        className="text-primary-400 hover:text-primary-300"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <AddLeadModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddLead}
        />
      )}

      {editingLead && (
        <LeadEditModal
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onUpdate={handleUpdateLead}
        />
      )}

      {messagingLead && (
        <MessageModal
          lead={messagingLead}
          onClose={() => setMessagingLead(null)}
        />
      )}
    </div>
  );
};

export default Leads;