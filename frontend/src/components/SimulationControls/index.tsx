import { useState, useCallback } from 'react';
import { SimulationResults } from '@/lib/simulation';
import { Node, Edge } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SimulationControlsProps {
  isSimulating: boolean;
  onStart: () => void;
  onPause: () => void;
  onRestart: () => void;
  simulationSpeed: number;
  onSpeedChange: (speed: number) => void;
  showDescriptions?: boolean;
  onToggleDescriptions?: () => void;
  onImportDiagram?: (jsonData: { nodes: Node[], edges: Edge[] }) => void;
  nodes?: Node[];
  edges?: Edge[];
}

export function SimulationControls({ 
  isSimulating,
  onStart,
  onPause,
  onRestart,
  simulationSpeed,
  onSpeedChange,
  showDescriptions,
  onToggleDescriptions,
  onImportDiagram,
  nodes = [],
  edges = []
}: SimulationControlsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('simulation');

  // Função para iniciar a simulação com feedback visual
  const handleStartSimulation = useCallback(() => {
    if (nodes.length < 2 || edges.length === 0) {
      alert('Adicione pelo menos 2 componentes e conecte-os para iniciar a simulação.');
      return;
    }
    
    setIsLoading(true);
    
    // Iniciar a simulação
    onStart();
    
    // Limitar o tempo de loading para evitar travamentos na UI
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, [nodes, edges, onStart]);

  // Função para reiniciar a simulação com feedback visual
  const handleRestartSimulation = useCallback(() => {
    setIsLoading(true);
    
    // Reiniciar a simulação
    onRestart();
    
    // Limitar o tempo de loading para evitar travamentos na UI
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, [onRestart]);

  // Calcular o custo total da arquitetura
  const calculateTotalCost = useCallback(() => {
    let totalCost = 0;
    
    // Somar o custo de todos os nós
    nodes.forEach(node => {
      if (node.data) {
        // Custo base do componente
        if (node.data.cost) {
          totalCost += Number(node.data.cost);
        }
        
        // Custo adicional baseado em instâncias (para microserviços)
        if (node.data.instances && node.data.costPerInstance) {
          totalCost += Number(node.data.instances) * Number(node.data.costPerInstance);
        }
        
        // Custo adicional baseado em capacidade (para storage)
        if (node.data.capacity && node.data.costPerGB) {
          totalCost += Number(node.data.capacity) * Number(node.data.costPerGB);
        }
      }
    });
    
    return totalCost.toFixed(2);
  }, [nodes]);

  return (
    <Card className="w-60 shadow-sm border-gray-200">
      <CardHeader className="px-3 py-2">
        <CardTitle className="text-sm">Controles de Simulação</CardTitle>
      </CardHeader>
      
      <CardContent className="px-3 py-2 space-y-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-7">
            <TabsTrigger value="simulation" className="text-xs">Simulação</TabsTrigger>
            <TabsTrigger value="cost" className="text-xs">Custo</TabsTrigger>
          </TabsList>
          
          <TabsContent value="simulation" className="mt-3 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs font-medium">
              Velocidade
            </Label>
            <div className="flex space-x-1">
              {[5, 4, 3, 2, 1].map((speed) => (
                <button
                  key={speed}
                  onClick={() => onSpeedChange(speed)}
                  className={`w-7 h-7 rounded text-xs ${
                    simulationSpeed === speed ? 'bg-blue-500 text-white' : 'bg-gray-100'
                  }`}
                >
                  {speed}s
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex space-x-1 pt-1">
            {isSimulating ? (
              <Button
                onClick={onPause}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-xs h-7"
                disabled={isLoading}
              >
                {isLoading ? '...' : 'Pausar'}
              </Button>
            ) : (
              <Button
                onClick={handleStartSimulation}
                className="w-full bg-green-500 hover:bg-green-600 text-white text-xs h-7"
                disabled={nodes.length < 2 || edges.length === 0 || isLoading}
              >
                {isLoading ? '...' : 'Iniciar'}
              </Button>
            )}
            <Button
              onClick={handleRestartSimulation}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs h-7"
              disabled={nodes.length < 2 || edges.length === 0 || isLoading}
            >
              {isLoading ? '...' : 'Reiniciar'}
            </Button>
          </div>
          
          <div className="flex space-x-1 pt-1">
            <Button 
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs h-7"
              onClick={() => {
                const jsonData = JSON.stringify({ nodes, edges }, null, 2);
                const blob = new Blob([jsonData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'arquitetura-simulacao.json';
                a.click();
                URL.revokeObjectURL(url);
              }}
              disabled={nodes.length === 0}
              variant="outline"
            >
              Exportar
            </Button>
            
            <label 
              htmlFor="import-json" 
              className="w-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs h-7 rounded-md cursor-pointer"
            >
              Importar
            </label>
            <input
              id="import-json"
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const jsonData = JSON.parse(event.target?.result as string);
                      if (onImportDiagram && jsonData.nodes && jsonData.edges) {
                        onImportDiagram(jsonData);
                      }
                    } catch (error) {
                      console.error('Erro ao importar arquivo JSON:', error);
                      alert('Erro ao importar o arquivo. Verifique se o formato é válido.');
                    }
                  };
                  reader.readAsText(file);
                }
              }}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="cost" className="mt-3">
          {nodes.length > 0 ? (
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-xs font-medium text-gray-500">Custo Estimado Mensal</div>
                <div className="text-2xl font-bold text-blue-600">R${calculateTotalCost()}</div>
              </div>
              
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="text-xs font-medium">Detalhamento por Tipo</div>
                <div className="space-y-1">
                  {/* Kafka */}
                  {nodes.some(node => node.type === 'kafka') && (
                    <div className="flex justify-between text-xs">
                      <span>Kafka:</span>
                      <span className="font-medium">
                        R${nodes
                          .filter(node => node.type === 'kafka')
                          .reduce((acc, node) => {
                            const baseCost = Number(node.data.cost || 0);
                            const instanceCost = Number(node.data.brokers || 0) * Number(node.data.costPerInstance || 0);
                            return acc + baseCost + instanceCost;
                          }, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {/* Microserviços */}
                  {nodes.some(node => node.type === 'microservice') && (
                    <div className="flex justify-between text-xs">
                      <span>Microserviços:</span>
                      <span className="font-medium">
                        R${nodes
                          .filter(node => node.type === 'microservice')
                          .reduce((acc, node) => {
                            const baseCost = Number(node.data.cost || 0);
                            const instanceCost = Number(node.data.instances || 0) * Number(node.data.costPerInstance || 0);
                            return acc + baseCost + instanceCost;
                          }, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {/* Storage */}
                  {nodes.some(node => node.type === 'storage') && (
                    <div className="flex justify-between text-xs">
                      <span>Storage:</span>
                      <span className="font-medium">
                        R${nodes
                          .filter(node => node.type === 'storage')
                          .reduce((acc, node) => {
                            const baseCost = Number(node.data.cost || 0);
                            const capacityCost = Number(node.data.capacity || 0) * Number(node.data.costPerGB || 0);
                            return acc + baseCost + capacityCost;
                          }, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                Defina o custo de cada componente nas suas propriedades para um cálculo mais preciso.
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-gray-500">
              Adicione componentes para visualizar o custo estimado da arquitetura.
            </div>
          )}
        </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
