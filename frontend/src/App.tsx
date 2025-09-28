import React, { useState, useCallback, useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { MainLayout } from './components/layout/MainLayout';
import { FlowCanvas } from './components/flow/FlowCanvas';
import { PropertiesPanel } from './components/panels/PropertiesPanel';
import { SimulationPanel } from './components/panels/SimulationPanel';
import { ApiStatus } from './components/ApiStatus';
import { FloatingPanelManager } from './components/ui/FloatingPanelManager';
import { testApiConnection } from './lib/apiService';
import html2canvas from 'html2canvas';
import 'reactflow/dist/style.css';
import './App.css';

interface ComponentItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  category: string;
  type: string;
  storageType?: string;
}

function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isApiConnected, setIsApiConnected] = useState(false);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [showOverview, setShowOverview] = useState(false);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  const [showSimulationPanel, setShowSimulationPanel] = useState(false);
  const [showApiStatus, setShowApiStatus] = useState(false);

  // Verificar conexão com a API
  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        const connected = await testApiConnection();
        setIsApiConnected(connected);
      } catch (error) {
        setIsApiConnected(false);
      }
    };

    checkApiConnection();
    const interval = setInterval(checkApiConnection, 30000); // Verificar a cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  // Carregamento inicial
  useEffect(() => {
    setTimeout(() => {
      setIsLoaded(true);
    }, 100);
  }, []);

  // Handlers para drag and drop
  const handleDragStart = useCallback((event: React.DragEvent, component: ComponentItem) => {
    event.dataTransfer.setData('application/reactflow', component.type);
    event.dataTransfer.setData('application/nodeName', component.name);
    if (component.storageType) {
      event.dataTransfer.setData('application/storageType', component.storageType);
    }
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  // Handler para seleção de elementos
  const handleElementSelect = useCallback((element: any) => {
    setSelectedElement(element);
    if (element) {
      setShowPropertiesPanel(true);
    }
  }, []);

  // Handlers para simulação
  const handleStartSimulation = useCallback(() => {
    setIsSimulating(true);
    setShowSimulationPanel(true);
  }, []);

  const handleStopSimulation = useCallback(() => {
    setIsSimulating(false);
  }, []);

  const handleResetSimulation = useCallback(() => {
    setIsSimulating(false);
    setSimulationResults(null);
    setShowSimulationPanel(false);
  }, []);

  const handleSimulationComplete = useCallback((results: any) => {
    setIsSimulating(false);
    setSimulationResults(results);
    setShowSimulationPanel(true);
  }, []);

  // Handler para exportar imagem
  const handleExportImage = useCallback(async () => {
    const element = document.querySelector('.react-flow__viewport');
    if (element) {
      try {
        const canvas = await html2canvas(element as HTMLElement);
        const link = document.createElement('a');
        link.download = `arquitetura-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } catch (error) {
        console.error('Erro ao exportar imagem:', error);
        alert('Erro ao exportar imagem');
      }
    }
  }, []);

  // Handler para exportar JSON
  const handleExportJson = useCallback(() => {
    // Esta função será implementada no FlowCanvas
    const event = new CustomEvent('exportJson');
    document.dispatchEvent(event);
  }, []);

  // Handler para importar JSON
  const handleImportJson = useCallback(() => {
    const input = document.getElementById('import-json-input') as HTMLInputElement;
    if (input) {
      input.click();
    }
  }, []);

  // Handler para mostrar status da API
  const handleShowApiStatus = useCallback(() => {
    setShowApiStatus(true);
  }, []);

  // Handler para configurações
  const handleShowSettings = useCallback(() => {
    // Implementar painel de configurações
    console.log('Mostrar configurações');
  }, []);

  // Handler para toggle da visão geral
  const handleToggleOverview = useCallback(() => {
    setShowOverview(!showOverview);
  }, [showOverview]);

  // Placeholder para updateNodeData e updateEdgeData
  const updateNodeData = useCallback((nodeId: string, data: any) => {
    // Esta função será passada do FlowCanvas
    console.log('Update node data:', nodeId, data);
  }, []);

  const updateEdgeData = useCallback((edgeId: string, data: any) => {
    // Esta função será passada do FlowCanvas
    console.log('Update edge data:', edgeId, data);
  }, []);

  if (!isLoaded) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando simulador...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background">
      <FloatingPanelManager>
        <ReactFlowProvider>
          <MainLayout
            isSimulating={isSimulating}
            isApiConnected={isApiConnected}
            onStartSimulation={handleStartSimulation}
            onStopSimulation={handleStopSimulation}
            onResetSimulation={handleResetSimulation}
            onExportImage={handleExportImage}
            onExportJson={handleExportJson}
            onImportJson={handleImportJson}
            onShowApiStatus={handleShowApiStatus}
            onShowSettings={handleShowSettings}
            onToggleOverview={handleToggleOverview}
            showOverview={showOverview}
            onDragStart={handleDragStart}
          >
            {/* Canvas Principal */}
            <div className="relative w-full h-full">
              <FlowCanvas
                onDragStart={handleDragStart}
                onElementSelect={handleElementSelect}
                onSimulationStart={handleStartSimulation}
                onSimulationComplete={handleSimulationComplete}
                isSimulating={isSimulating}
              />

              {/* Painel de Propriedades - Flutuante à direita */}
              {showPropertiesPanel && (
                <div className="absolute top-4 right-4 z-10">
                  <PropertiesPanel
                    selectedElement={selectedElement}
                    onClose={() => setShowPropertiesPanel(false)}
                    updateNodeData={updateNodeData}
                    updateEdgeData={updateEdgeData}
                    nodes={[]}
                    edges={[]}
                  />
                </div>
              )}

              {/* Painel de Simulação - Flutuante na parte inferior */}
              {showSimulationPanel && (
                <div className="absolute bottom-4 left-4 right-4 z-10">
                  <SimulationPanel
                    isVisible={showSimulationPanel}
                    onClose={() => setShowSimulationPanel(false)}
                    simulationResults={simulationResults}
                    isSimulating={isSimulating}
                  />
                </div>
              )}

              {/* Modal de Status da API */}
              {showApiStatus && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                  <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
                    <ApiStatus onClose={() => setShowApiStatus(false)} />
                  </div>
                </div>
              )}
            </div>
          </MainLayout>
        </ReactFlowProvider>
      </FloatingPanelManager>
    </div>
  );
}

export default App;

