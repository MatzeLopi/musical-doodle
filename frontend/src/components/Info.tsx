'use client';

import React from 'react';
import Popup from './Popup';

interface InfoProps {
  message: string;
  title?: string;
  onClose: () => void;
}

const Info: React.FC<InfoProps> = ({ message, title = 'Info', onClose }) => {
  return (
    <Popup onClose={onClose} bgColour='bg-green-100'>
      <div className="flex flex-col items-center">
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p>{message}</p>
      </div>
    </Popup>
  );
};

export default Info;
