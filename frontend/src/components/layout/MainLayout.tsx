import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { TooltipProvider } from '@/components/ui/tooltip';

interface ComponentItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  category: string;
  type: string;
  storageType?: string;
}

interface MainLayoutProps {
  children: React.ReactNode;
  isSimulating: boolean;
  isApiConnected: boolean;
  onStartSimulation: () => void;
  onStopSimulation: () => void;
  onResetSimulation: () => void;
  onExportImage: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
  onShowApiStatus: () => void;
  onShowSettings: () => void;
  onToggleOverview: () => void;
  showOverview: boolean;
  onDragStart: (event: React.DragEvent, component: ComponentItem) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  isSimulating,
  isApiConnected,
  onStartSimulation,
  onStopSimulation,
  onResetSimulation,
  onExportImage,
  onExportJson,
  onImportJson,
  onShowApiStatus,
  onShowSettings,
  onToggleOverview,
  showOverview,
  onDragStart
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background">
        {/* Navbar */}
        <Navbar
          isSimulating={isSimulating}
          isApiConnected={isApiConnected}
          onStartSimulation={onStartSimulation}
          onStopSimulation={onStopSimulation}
          onResetSimulation={onResetSimulation}
          onExportImage={onExportImage}
          onExportJson={onExportJson}
          onImportJson={onImportJson}
          onShowApiStatus={onShowApiStatus}
          onShowSettings={onShowSettings}
          onToggleOverview={onToggleOverview}
          showOverview={showOverview}
        />

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggle={handleToggleSidebar}
            onDragStart={onDragStart}
          />

          {/* Canvas Area */}
          <div className="flex-1 relative">
            {children}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

