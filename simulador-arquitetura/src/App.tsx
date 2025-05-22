import { useState, useCallback, useEffect } from 'react';
import { FlowCanvas } from './components/FlowCanvas';
import { ComponentsPanel } from './components/ComponentsPanel';
import { ReactFlowProvider } from 'reactflow';
import { FloatingPanelManager } from './components/ui/FloatingPanelManager';
import 'reactflow/dist/style.css';
import './App.css';

function App() {
  // Adicionando um estado para controlar se os componentes devem ser renderizados
  const [isLoaded, setIsLoaded] = useState(false);

  // Usando useEffect para garantir que o código só execute no cliente
  useEffect(() => {
    // Pequeno atraso para garantir que o DOM esteja pronto
    setTimeout(() => {
      setIsLoaded(true);
    }, 100);
  }, []);

  // Renderização condicional para evitar problemas de hidratação
  return (
    <div className="flex h-screen bg-gray-100">
      {isLoaded ? (
        <div className="w-full h-full">
          {/* Envolvendo o ReactFlowProvider com FloatingPanelManager para corrigir o erro de contexto */}
          <FloatingPanelManager>
            <ReactFlowProvider>
              <FlowCanvas />
            </ReactFlowProvider>
          </FloatingPanelManager>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-gray-500">Carregando simulador...</p>
        </div>
      )}
    </div>
  );
}

export default App;
