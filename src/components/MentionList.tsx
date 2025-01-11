import React from 'react';
import { User } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
}

interface MentionListProps {
  profiles: Profile[];
  onSelect: (profile: Profile) => void;
  searchTerm: string;
}

const MentionList = ({ profiles, onSelect, searchTerm }: MentionListProps) => {
  const filteredProfiles = profiles.filter(profile =>
    profile.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredProfiles.length === 0) return null;

  return (
    <div className="absolute bottom-full mb-2 w-full bg-dark-800 rounded-lg shadow-lg border border-dark-700 max-h-48 overflow-y-auto">
      {filteredProfiles.map(profile => (
        <button
          key={profile.id}
          onClick={() => onSelect(profile)}
          className="w-full px-4 py-2 flex items-center space-x-2 hover:bg-dark-700 text-left"
        >
          <User className="w-4 h-4 text-primary-400" />
          <span className="text-white">{profile.email}</span>
        </button>
      ))}
    </div>
  );
};

export default MentionList;