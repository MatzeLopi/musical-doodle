'use client';

import React from 'react';

interface PopupProps {
  onClose: () => void;
  children: React.ReactNode;
  bgColour?: string;
}

const Popup: React.FC<PopupProps> = ({ onClose, children, bgColour }) => {
  // When clicking on the backdrop, the popup will close.
  const handleBackdropClick = () => {
    onClose();
  };

  // Prevent clicks inside the popup from closing it.
  const handleContentClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300"
      onClick={handleBackdropClick}
    >
      <div
        className={`w-11/12 max-w-md  p-6 rounded-lg shadow-xl transition-transform duration-300 transform scale-100 ${bgColour || 'bg-white'}`}
        onClick={handleContentClick}
      >
        {children}
      </div>
    </div>
  );
};

export default Popup;
