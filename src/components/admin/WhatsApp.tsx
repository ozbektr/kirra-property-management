import React from 'react';

const WhatsApp = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-8rem)]">
      <div className="bg-dark-800 rounded-lg shadow-lg border border-dark-700 h-full">
        <iframe
          src="https://web.whatsapp.com"
          className="w-full h-full rounded-lg"
          title="WhatsApp Web"
        />
      </div>
    </div>
  );
};

export default WhatsApp;