'use client';

import React, { useEffect } from 'react';

interface InfoProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number; // Auto-dismiss time (default 3s)
  onClose: () => void;
}

const Info: React.FC<InfoProps> = ({ message, type = 'info', duration = 3000, onClose }) => {
  // Auto-dismiss the alert after the specified duration
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  // Alert styles based on type
  const typeStyles = {
    success: 'bg-emerald-600 text-white bg-opacity-80',
    error: 'bg-sky-600 text-white bg-opacity-80',
    warning: 'bg-yellow-600 text-white bg-opacity-80',
    info: 'bg-blue-600 text-white bg-opacity-80',
  };

  const iconPaths = {
    success: 'M5 13l4 4L19 7', // Checkmark
    error: 'M6 18L18 6M6 6l12 12', // X mark
    warning: 'M12 2L2 22h20L12 2z', // Triangle exclamation
    info: 'M13 16h-1v-4h-1m1-4h.01', // Info circle
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50">
      <div className={`p-6 rounded-lg shadow-lg flex items-center space-x-3 animate-fade-in ${typeStyles[type]}`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPaths[type]} />
        </svg>
        <span>{message}</span>
      </div>
    </div>
  );
};

export default Info;
