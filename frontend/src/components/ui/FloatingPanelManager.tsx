import React from 'react';

interface FloatingPanelManagerProps {
  children: React.ReactNode;
}

export const FloatingPanelManager: React.FC<FloatingPanelManagerProps> = ({ children }) => {
  return (
    <div className="relative w-full h-full">
      {children}
    </div>
  );
};

