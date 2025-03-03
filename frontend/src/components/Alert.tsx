'use client';

import React from 'react';
import Popup from './Popup';

interface AlertProps {
  message: string;
  title?: string;
  onClose: () => void;
}

const Alert: React.FC<AlertProps> = ({ message, title = 'Alert', onClose }) => {
  return (
    <Popup onClose={onClose} bgColour='bg-red-100'>
      <div className="flex flex-col items-center">
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p>{message}</p>
      </div>
    </Popup>
  );
};

export default Alert;
