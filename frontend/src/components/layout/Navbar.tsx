import React from 'react';
import { 
  Save, 
  FolderOpen, 
  Download, 
  Upload, 
  Settings, 
  Play, 
  Square, 
  RotateCcw,
  Wifi,
  WifiOff,
  Camera,
  FileJson,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface NavbarProps {
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
}

const NavbarButton: React.FC<{
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  disabled?: boolean;
  className?: string;
}> = ({ icon, tooltip, onClick, variant = "ghost", disabled = false, className }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className={cn("h-9 w-9", className)}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const Navbar: React.FC<NavbarProps> = ({
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
  showOverview
}) => {
  return (
    <div className="bg-background border-b border-border px-4 py-2">
      <div className="flex items-center justify-between">
        {/* Logo/Title */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-foreground">
            Simulador de Arquiteturas
          </h1>
          <div className="flex items-center space-x-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isApiConnected ? "bg-green-500" : "bg-red-500"
            )} />
            <span className="text-sm text-muted-foreground">
              {isApiConnected ? "Conectado" : "Desconectado"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* File Operations */}
          <div className="flex items-center space-x-1">
            <NavbarButton
              icon={<FolderOpen className="w-4 h-4" />}
              tooltip="Abrir projeto"
              onClick={onImportJson}
            />
            <NavbarButton
              icon={<Save className="w-4 h-4" />}
              tooltip="Salvar projeto"
              onClick={onExportJson}
            />
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Export Operations */}
          <div className="flex items-center space-x-1">
            <NavbarButton
              icon={<Camera className="w-4 h-4" />}
              tooltip="Exportar como imagem"
              onClick={onExportImage}
            />
            <NavbarButton
              icon={<FileJson className="w-4 h-4" />}
              tooltip="Exportar JSON"
              onClick={onExportJson}
            />
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Simulation Controls */}
          <div className="flex items-center space-x-1">
            {!isSimulating ? (
              <NavbarButton
                icon={<Play className="w-4 h-4" />}
                tooltip="Iniciar simulação"
                onClick={onStartSimulation}
                variant="default"
                disabled={!isApiConnected}
                className="bg-green-600 hover:bg-green-700 text-white"
              />
            ) : (
              <NavbarButton
                icon={<Square className="w-4 h-4" />}
                tooltip="Parar simulação"
                onClick={onStopSimulation}
                variant="destructive"
              />
            )}
            <NavbarButton
              icon={<RotateCcw className="w-4 h-4" />}
              tooltip="Reiniciar simulação"
              onClick={onResetSimulation}
            />
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* View Controls */}
          <div className="flex items-center space-x-1">
            <NavbarButton
              icon={showOverview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              tooltip={showOverview ? "Ocultar visão geral" : "Mostrar visão geral"}
              onClick={onToggleOverview}
            />
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* System Controls */}
          <div className="flex items-center space-x-1">
            <NavbarButton
              icon={isApiConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              tooltip="Status da API"
              onClick={onShowApiStatus}
              className={cn(
                isApiConnected ? "text-green-600" : "text-red-600"
              )}
            />
            <NavbarButton
              icon={<Settings className="w-4 h-4" />}
              tooltip="Configurações"
              onClick={onShowSettings}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

