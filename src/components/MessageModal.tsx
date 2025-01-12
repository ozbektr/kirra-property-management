import React, { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import type { Lead } from '../types';
import { supabase } from '../lib/supabase';
import MentionList from './MentionList';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read: boolean;
  mentions?: string[];
  lead_id: string;
}

interface Profile {
  id: string;
  email: string;
}

interface MessageModalProps {
  lead: Lead;
  onClose: () => void;
}

const MessageModal = ({ lead, onClose }: MessageModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    loadProfiles();
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${lead.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages',
        filter: `lead_id=eq.${lead.id}`
      }, handleNewMessage)
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [lead.id]);

  const handleNewMessage = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      const newMessage = payload.new as Message;
      setMessages(current => [...current, newMessage]);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) {
        setMessages(data);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email');

      if (error) throw error;
      if (data) setProfiles(data);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    const curPos = e.target.selectionStart || 0;
    setCursorPosition(curPos);
    
    const lastAtSymbol = value.lastIndexOf('@', curPos);
    if (lastAtSymbol !== -1 && lastAtSymbol < curPos) {
      const searchText = value.slice(lastAtSymbol + 1, curPos);
      setMentionSearch(searchText);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (profile: Profile) => {
    const beforeMention = newMessage.slice(0, newMessage.lastIndexOf('@'));
    const afterMention = newMessage.slice(cursorPosition);
    const newValue = `${beforeMention}@${profile.email} ${afterMention}`;
    setNewMessage(newValue);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const extractMentions = (content: string): string[] => {
    const mentions = content.match(/@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g) || [];
    return mentions.map(mention => mention.slice(1));
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageContent = newMessage.trim();
    if (!messageContent) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const mentions = extractMentions(messageContent);
      
      // Optimistically add message to UI
      const optimisticMessage: Message = {
        id: crypto.randomUUID(),
        content: messageContent,
        sender_id: user.id,
        created_at: new Date().toISOString(),
        read: false,
        mentions,
        lead_id: lead.id
      };
      
      setMessages(current => [...current, optimisticMessage]);
      setNewMessage(''); // Clear input immediately
      scrollToBottom();

      // Send message to server
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          content: messageContent,
          lead_id: lead.id,
          sender_id: user.id,
          mentions,
          read: false
        });

      if (messageError) throw messageError;

      // Handle mentions notifications
      if (mentions.length > 0) {
        const notificationPromises = mentions.map(email => {
          const mentionedUser = profiles.find(p => p.email === email);
          if (mentionedUser) {
            return supabase
              .from('notifications')
              .insert({
                user_id: mentionedUser.id,
                title: 'New Mention',
                content: `You were mentioned in a message by ${user.email}`,
                type: 'mention',
                lead_id: lead.id
              });
          }
          return Promise.resolve();
        });

        await Promise.all(notificationPromises);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(current => current.filter(msg => msg.id !== crypto.randomUUID()));
      setNewMessage(messageContent); // Restore message content
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg shadow-xl border border-dark-700 w-full max-w-2xl h-[600px] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <div>
            <h2 className="text-lg font-semibold text-white">Messages</h2>
            <p className="text-sm text-dark-400">Lead: {lead.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === lead.assignedTo ? 'justify-end' : ''}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.sender_id === lead.assignedTo
                    ? 'bg-primary-600/20 text-primary-300'
                    : 'bg-dark-700 text-white'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">
                  {message.content.split(' ').map((word, i) => (
                    word.startsWith('@') ? (
                      <span key={i} className="text-primary-400">{word} </span>
                    ) : (
                      word + ' '
                    )
                  ))}
                </p>
                <span className="text-xs text-dark-400 mt-1 block">
                  {formatTime(message.created_at)}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t border-dark-700">
          <div className="flex space-x-2 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Type your message... Use @ to mention someone"
              className="flex-1 px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
            />
            {showMentions && (
              <MentionList
                profiles={profiles}
                onSelect={handleMentionSelect}
                searchTerm={mentionSearch}
              />
            )}
            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MessageModal;