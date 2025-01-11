import React, { useState } from 'react';
import { Mail, Phone, MessageSquare, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Help = () => {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'normal',
    category: 'general'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');

      const { error: submitError } = await supabase
        .from('support_requests')
        .insert({
          subject: formData.subject,
          message: formData.message,
          priority: formData.priority,
          category: formData.category,
          user_id: user.id,
          status: 'new'
        });

      if (submitError) throw submitError;
      
      setSuccess(true);
      setFormData({
        subject: '',
        message: '',
        priority: 'normal',
        category: 'general'
      });
    } catch (err) {
      console.error('Error submitting support request:', err);
      setError('Failed to submit support request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">Help & Support</h1>
      
      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-dark-800 p-6 rounded-lg shadow-lg border border-dark-700">
          <div className="flex items-center mb-4">
            <Mail className="w-8 h-8 text-primary-400" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-white">Email Support</h3>
              <p className="text-dark-300">info@turkcitizen.com</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-800 p-6 rounded-lg shadow-lg border border-dark-700">
          <div className="flex items-center mb-4">
            <Phone className="w-8 h-8 text-primary-400" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-white">Phone Support</h3>
              <p className="text-dark-300">+90 (850) 302-83-28</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-800 p-6 rounded-lg shadow-lg border border-dark-700">
          <div className="flex items-center mb-4">
            <MessageSquare className="w-8 h-8 text-primary-400" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-white">Live Chat</h3>
              <p className="text-dark-300">Available 24/7</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="bg-dark-800 p-6 rounded-lg shadow-lg border border-dark-700">
        <h2 className="text-lg font-semibold mb-6 text-white">Contact Form</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 text-green-400 rounded-lg">
            Your support request has been submitted successfully. We'll get back to you soon.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-dark-300 mb-1">
              Subject
            </label>
            <input
              id="subject"
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
              placeholder="Brief description of your inquiry"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-dark-300 mb-1">
              Category
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
            >
              <option value="general">General Inquiry</option>
              <option value="technical">Technical Support</option>
              <option value="billing">Billing</option>
              <option value="feature">Feature Request</option>
              <option value="bug">Bug Report</option>
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-dark-300 mb-1">
              Priority
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-dark-300 mb-1">
              Message
            </label>
            <textarea
              id="message"
              required
              rows={5}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
              placeholder="Please describe your issue or question in detail"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Help;