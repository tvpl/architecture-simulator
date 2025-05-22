import React, { useState, useContext, createContext, ReactNode } from 'react';
import { FloatingPanel } from './FloatingPanel';

// Definição do tipo para o conteúdo do painel
interface PanelContent {
  title: string;
  content: ReactNode;
  position: { x: number; y: number };
  width?: number;
  height?: number;
}

// Definição do tipo para o contexto do gerenciador de painéis
interface PanelManagerContextType {
  showPanel: (id: string, content: PanelContent) => void;
  hidePanel: (id: string) => void;
  isVisible: (id: string) => boolean;
}

// Criação do contexto
const PanelManagerContext = createContext<PanelManagerContextType | undefined>(undefined);

// Hook personalizado para usar o contexto
export function usePanelManager() {
  const context = useContext(PanelManagerContext);
  if (!context) {
    throw new Error('usePanelManager deve ser usado dentro de um FloatingPanelManager');
  }
  return context;
}

// Props para o componente FloatingPanelManager
interface FloatingPanelManagerProps {
  children: ReactNode;
}

// Componente principal do gerenciador de painéis
export function FloatingPanelManager({ children }: FloatingPanelManagerProps) {
  // Estado para armazenar os painéis visíveis
  const [panels, setPanels] = useState<Record<string, PanelContent>>({});

  // Função para mostrar um painel
  const showPanel = (id: string, content: PanelContent) => {
    setPanels(prev => ({
      ...prev,
      [id]: content
    }));
  };

  // Função para ocultar um painel
  const hidePanel = (id: string) => {
    setPanels(prev => {
      const newPanels = { ...prev };
      delete newPanels[id];
      return newPanels;
    });
  };

  // Função para verificar se um painel está visível
  const isVisible = (id: string) => {
    return !!panels[id];
  };

  return (
    <PanelManagerContext.Provider value={{ showPanel, hidePanel, isVisible }}>
      {children}
      
      {/* Renderizar todos os painéis visíveis */}
      {Object.entries(panels).map(([id, panel]) => (
        <FloatingPanel
          key={id}
          id={id}
          title={panel.title}
          defaultPosition={panel.position}
          defaultWidth={panel.width}
          defaultHeight={panel.height}
          onClose={() => hidePanel(id)}
        >
          {panel.content}
        </FloatingPanel>
      ))}
    </PanelManagerContext.Provider>
  );
}
