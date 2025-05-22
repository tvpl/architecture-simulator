import { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  EdgeTypes,
  Panel,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { ConfigPanel } from '../ConfigPanel';
import { DefaultConfigPanel } from '../DefaultConfigPanel';
import { KafkaNode } from '../nodes/KafkaNode';
import { MicroserviceNode } from '../nodes/MicroserviceNode';
import { StorageNode } from '../nodes/StorageNode';
import { QueueNode } from '../nodes/QueueNode';
import { TopicNode } from '../nodes/TopicNode';
import { ClusterNode } from '../nodes/ClusterNode';
import { RabbitNode } from '../nodes/RabbitNode';
import { ServiceBusNode } from '../nodes/ServiceBusNode';
import { FunctionNode } from '../nodes/FunctionNode';
import { GenericNode } from '../nodes/GenericNode';
import { StartFlowNode } from '../nodes/StartFlowNode';
import { StartNode } from '../nodes/StartNode';
import { SimulationControls } from '../SimulationControls';
import { CustomEdge } from '../edges/CustomEdge';
import { SimulationResults, simulateMessageFlow } from '@/lib/simulation';
import { SimulationResultsDisplay } from '../SimulationResultsDisplay';
import { Button } from '@/components/ui/button';
import { DetailedReport } from '../DetailedReport';
import { usePanelManager } from '@/components/ui/FloatingPanelManager';
import { ComponentsPanel } from '../ComponentsPanel';
import html2canvas from 'html2canvas';

// Definição dos tipos de nós personalizados
const nodeTypes: NodeTypes = {
  kafka: KafkaNode,
  microservice: MicroserviceNode,
  storage: StorageNode,
  queue: QueueNode,
  topic: TopicNode,
  cluster: ClusterNode,
  rabbit: RabbitNode,
  start: StartNode,
  servicebus: ServiceBusNode,
  function: FunctionNode,
  generic: GenericNode,
  startflow: StartFlowNode,
};

// Definição dos tipos de arestas personalizadas
const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

// Nós iniciais para demonstração
const initialNodes: Node[] = [];

// Arestas iniciais para demonstração
const initialEdges: Edge[] = [];

// Valores padrão para os nós
const defaultNodeValues = {
  kafka: {
    brokers: 3,
    partitions: 5,
    replicationFactor: 2,
    latency: 10,
    cost: 100,
    costPerInstance: 50
  },
  microservice: {
    instances: 2,
    latency: 15,
    cost: 75,
    costPerInstance: 25
  },
  storage: {
    latency: 20,
    throughput: 50,
    capacity: 100,
    cost: 120,
    costPerGB: 0.5
  },
  rabbit: {
    queues: 1,
    exchanges: 1,
    latency: 8,
    cost: 50,
    costPerQueue: 5
  },
  servicebus: {
    queues: 1,
    topics: 1,
    subscriptions: 1,
    latency: 12,
    cost: 80,
    costPerQueue: 10
  },
  function: {
    maxReplicas: 10,
    minReplicas: 0,
    latency: 5,
    cost: 20,
    costPerExecution: 0.0001
  },
  generic: {
    instances: 1,
    latency: 10,
    cost: 30,
    costPerInstance: 15
  }
};

export function FlowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(3); // 1-5, onde 5 é o mais lento
  const [selectedElement, setSelectedElement] = useState<Node | Edge | null>(null);
  const [simulationResults, setSimulationResults] = useState<SimulationResults | null>(null);
  const [showDescriptions, setShowDescriptions] = useState(true);
  const [requestCount, setRequestCount] = useState(1000);
  const [parallelism, setParallelism] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [panelsVisible, setPanelsVisible] = useState({
    components: false,
    properties: false,
    defaultConfig: false,
    overview: false
  });
  
  // Estado para armazenar os valores padrão dos nós
  const [nodeDefaults, setNodeDefaults] = useState(defaultNodeValues);
  
  const { fitView } = useReactFlow();
  const panelManager = usePanelManager();

  // Efeito para ajustar a visualização quando o tamanho do canvas muda
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.2 });
    }, 200);
    return () => clearTimeout(timer);
  }, [fitView]);

  // Efeito para manter o selectedElement sincronizado com os nodes atualizados
  useEffect(() => {
    if (selectedElement && 'id' in selectedElement) {
      const nodeId = selectedElement.id;
      const updatedNode = nodes.find(node => node.id === nodeId);
      
      if (updatedNode) {
        setSelectedElement(updatedNode);
      }
    }
  }, [nodes, selectedElement]);

  // Fun  // Função para atualizar os valores padrão dos nós e propagar para componentes existentes
  const updateNodeDefaults = useCallback((type: string, data: any) => {
    // Atualizar os valores padrão no estado
    setNodeDefaults(prev => ({
      ...prev,
      [type]: {
        ...(prev[type] || {}),
        ...data
      }
    }));
    
    // Propagar as alterações para todos os nós existentes do mesmo tipo
    setNodes(nds => 
      nds.map(node => {
        if (node.type === type) {
          // Mesclar os novos valores padrão com os dados existentes do nó
          return {
            ...node,
            data: {
              ...node.data,
              ...data
            }
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  // Função para atualizar a latência de uma aresta
  const updateEdgeData = useCallback((edgeId: string, data: any) => {
    setEdges((eds) => 
      eds.map((edge) => {
        if (edge.id === edgeId) {
          const updatedEdge = {
            ...edge,
            data: {
              ...edge.data,
              ...data,
            },
          };
          
          // Se este é o elemento selecionado, atualize-o também
          if (selectedElement && 'id' in selectedElement && selectedElement.id === edgeId) {
            setSelectedElement(updatedEdge);
          }
          
          return updatedEdge;
        }
        return edge;
      })
    );
  }, [setEdges, selectedElement]);

  // Função para atualizar os dados de um nó
  const updateNodeData = useCallback((nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const updatedNode = {
            ...node,
            data: {
              ...node.data,
              ...data,
            },
          };
          
          // Se este é o elemento selecionado, atualize-o também
          if (selectedElement && 'id' in selectedElement && selectedElement.id === nodeId) {
            setSelectedElement(updatedNode);
          }
          
          return updatedNode;
        }
        return node;
      })
    );
  }, [setNodes, selectedElement]);

  // Função para mostrar o painel de propriedades
  const showPropertiesPanel = useCallback((element: Node | Edge) => {
    panelManager.showPanel('properties', {
      title: 'Propriedades',
      content: (
        <ConfigPanel 
          selectedElement={element}
          updateNodeData={updateNodeData}
          updateEdgeData={updateEdgeData}
          nodes={nodes}
          edges={edges}
        />
      ),
      position: { x: 20, y: 20 },
      width: 350,
      height: 600
    });
    setPanelsVisible(prev => ({ ...prev, properties: true }));
  }, [panelManager, nodes, edges, updateNodeData, updateEdgeData]);

  // Função para lidar com conexões entre nós
  const onConnect = useCallback(
    (params: Connection) => {
      // Verificar se a conexão já existe
      const connectionExists = edges.some(
        edge => edge.source === params.source && edge.target === params.target
      );
      
      if (connectionExists) {
        console.log('Conexão já existe');
        return;
      }
      
      // Criar uma aresta personalizada com latência padrão e protocolo padrão
      const edge: Edge = {
        ...params,
        id: `e${params.source}-${params.target}`,
        type: 'custom',
        data: { 
          latency: 10,
          protocol: 'kafka', // Protocolo padrão
          cost: 0, // Custo padrão (removido conforme solicitado)
          messageCount: 100 // Quantidade de mensagens por conexão
        },
        animated: true,
        style: { strokeWidth: 2 }
      };
      
      setEdges((eds) => addEdge(edge, eds));
      
      // Selecionar a nova conexão automaticamente
      setTimeout(() => {
        setSelectedElement(edge);
        showPropertiesPanel(edge);
      }, 100);
    },
    [edges, setEdges, showPropertiesPanel]
  );

  // Função para lidar com o arrastar e soltar de novos nós
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Função para lidar com o soltar de novos nós
  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      const name = event.dataTransfer.getData('application/nodeName');
      const storageType = event.dataTransfer.getData('application/storageType');

      // Verificar se o tipo é válido e se temos as coordenadas do wrapper
      if (typeof type === 'undefined' || !type || !reactFlowBounds || !reactFlowInstance) {
        return;
      }

      // Calcular a posição do novo nó
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Usar os valores padrão do tipo de nó, se disponíveis
      const defaultValues = nodeDefaults[type as keyof typeof nodeDefaults] || {};

      // Criar um novo nó com base no tipo
      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { 
          label: name || `${type} ${nodes.length + 1}`,
          // Dados específicos para cada tipo de nó
          ...(type === 'kafka' && { 
            brokers: defaultValues.brokers || 3, 
            partitions: defaultValues.partitions || 5, 
            replicationFactor: defaultValues.replicationFactor || 2,
            latency: defaultValues.latency || 10,
            cost: defaultValues.cost || 100,
            costPerInstance: defaultValues.costPerInstance || 50
          }),
          ...(type === 'microservice' && { 
            instances: defaultValues.instances || 2, 
            latency: defaultValues.latency || 15, 
            type: 'service', // Alterado de 'processing' para 'service'
            cpuUsage: 30,
            memoryUsage: 40,
            cost: defaultValues.cost || 75,
            costPerInstance: defaultValues.costPerInstance || 25,
            supportedProtocols: ['kafka', 'http', 'grpc']
          }),
          ...(type === 'storage' && { 
            type: storageType || 'blob', // Usar o tipo específico de storage
            latency: defaultValues.latency || 20, 
            throughput: defaultValues.throughput || 50,
            capacity: defaultValues.capacity || 100,
            replication: true,
            cost: defaultValues.cost || 120,
            costPerGB: defaultValues.costPerGB || 0.5,
            ...(storageType === 'sql' && {
              dbType: 'relacional',
              dbName: 'Database',
              tableName: 'Table'
            }),
            ...(storageType === 'appconfig' && {
              isFeatureFlag: false,
              configKey: 'config-key'
            })
          }),
          ...(type === 'function' && {
            triggerType: 'http',
            maxReplicas: defaultValues.maxReplicas || 10,
            minReplicas: defaultValues.minReplicas || 0,
            latency: defaultValues.latency || 5,
            serviceName: 'Function Keda',
            type: 'service', // Alterado de 'processing' para 'service'
            cost: defaultValues.cost || 20,
            costPerExecution: defaultValues.costPerExecution || 0.0001
          }),
          ...(type === 'rabbit' && {
            queues: defaultValues.queues || 1,
            exchanges: defaultValues.exchanges || 1,
            latency: defaultValues.latency || 8,
            serviceName: 'RabbitMQ',
            type: 'service', // Alterado de 'processing' para 'service'
            cost: defaultValues.cost || 50,
            costPerQueue: defaultValues.costPerQueue || 5
          }),
          ...(type === 'servicebus' && {
            queues: defaultValues.queues || 1,
            topics: defaultValues.topics || 1,
            subscriptions: defaultValues.subscriptions || 1,
            latency: defaultValues.latency || 12,
            serviceName: 'Service Bus',
            type: 'service', // Alterado de 'processing' para 'service'
            cost: defaultValues.cost || 80,
            costPerQueue: defaultValues.costPerQueue || 10
          }),
          ...(type === 'generic' && {
            serviceType: 'Personalizado',
            latency: defaultValues.latency || 10,
            instances: defaultValues.instances || 1,
            serviceName: 'Serviço Genérico',
            type: 'service', // Alterado de 'processing' para 'service'
            cost: defaultValues.cost || 30,
            costPerInstance: defaultValues.costPerInstance || 15
          }),
          ...(type === 'queue' && {
            latency: 5,
            cost: 10,
            costPerMessage: 0.001,
            cluster: 'Não definido'
          }),
          ...(type === 'topic' && {
            partitions: 3,
            latency: 8,
            costPerPartition: 5,
            cluster: 'Não definido'
          }),
          ...(type === 'cluster' && {
            nodes: 3,
            type: 'Kafka',
            region: 'East US',
            availability: '99.9%',
            costPerNode: 50
          }),
          ...(type === 'startflow' && {
            description: 'Ponto de início do fluxo',
            latency: 1
          })
        },
        selected: true,
      };

      // Adicionar o novo nó ao estado e selecioná-lo
      setNodes((nds) => {
        // Desselecionar todos os nós existentes
        const updatedNodes = nds.map(node => ({
          ...node,
          selected: false
        }));
        
        // Adicionar o novo nó (já selecionado)
        return [...updatedNodes, newNode];
      });
      
      // Atualizar o elemento selecionado
      setTimeout(() => {
        setSelectedElement(newNode);
        showPropertiesPanel(newNode);
      }, 100);
    },
    [reactFlowInstance, nodes, setNodes, showPropertiesPanel, nodeDefaults]
  );

  // Função para selecionar um elemento (nó ou aresta)
  const onElementClick = useCallback((event: React.MouseEvent, element: Node | Edge) => {
    // Desselecionar todos os nós
    setNodes((nds) => 
      nds.map(node => ({
        ...node,
        selected: node.id === element.id
      }))
    );
    
    // Atualizar o elemento selecionado
    setSelectedElement(element);
    
    // Mostrar painel de propriedades
    showPropertiesPanel(element);
  }, [setNodes, showPropertiesPanel]);

  // Função para lidar com duplo clique em um nó
  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Mostrar relatório detalhado
    panelManager.showPanel(`report-${node.id}`, {
      title: `Relatório: ${node.data.label}`,
      content: (
        <DetailedReport 
          node={node} 
          edges={edges} 
          nodes={nodes} 
          onClose={() => panelManager.hidePanel(`report-${node.id}`)}
        />
      ),
      position: { x: window.innerWidth / 2 - 250, y: window.innerHeight / 2 - 250 },
      width: 500,
      height: 600
    });
  }, [panelManager, edges, nodes]);

  // Função para iniciar a simulação
  const startSimulation = useCallback(() => {
    if (nodes.length < 2 || edges.length === 0) {
      alert('Adicione pelo menos 2 componentes e conecte-os para iniciar a simulação.');
      return;
    }
    
    setIsSimulating(true);
    
    // Simular um pequeno atraso para dar feedback visual
    setTimeout(() => {
      try {
        const results = simulateMessageFlow(nodes, edges);
        setSimulationResults(results);
      } catch (error) {
        console.error('Erro na simulação:', error);
        alert('Ocorreu um erro durante a simulação. Verifique o console para mais detalhes.');
      } finally {
        setIsSimulating(false);
      }
    }, 1500);
  }, [nodes, edges, requestCount, parallelism]);

  // Função para pausar a simulação
  const pauseSimulation = useCallback(() => {
    setIsSimulating(false);
  }, []);

  // Função para reiniciar a simulação
  const restartSimulation = useCallback(() => {
    setIsSimulating(false);
    setSimulationResults(null);
    
    // Pequeno atraso antes de reiniciar
    setTimeout(() => {
      startSimulation();
    }, 500);
  }, [startSimulation]);

  // Função para fechar os resultados da simulação
  const closeResults = useCallback(() => {
    setSimulationResults(null);
  }, []);

  // Função para importar diagrama
  const importDiagram = useCallback((jsonData: { nodes: Node[], edges: Edge[] }) => {
    if (jsonData.nodes && jsonData.edges) {
      setNodes(jsonData.nodes);
      setEdges(jsonData.edges);
      setSelectedElement(null);
      
      // Ajustar a visualização após importar
      setTimeout(() => {
        fitView({ padding: 0.2 });
      }, 100);
    }
  }, [setNodes, setEdges, fitView]);

  // Função para alternar a visibilidade dos controles
  const toggleControls = useCallback(() => {
    setShowControls(!showControls);
  }, [showControls]);

  // Função para mostrar o painel de componentes
  const showComponentsPanel = useCallback(() => {
    if (panelsVisible.components) {
      panelManager.hidePanel('components');
      setPanelsVisible(prev => ({ ...prev, components: false }));
    } else {
      panelManager.showPanel('components', {
        title: 'Componentes',
        content: (
          <ComponentsPanel />
        ),
        position: { x: 20, y: 80 },
        width: 320,
        height: 500
      });
      setPanelsVisible(prev => ({ ...prev, components: true }));
    }
  }, [panelManager, panelsVisible.components]);

  // Função para mostrar o painel de visão geral
  const showOverviewPanel = useCallback(() => {
    if (panelsVisible.overview) {
      panelManager.hidePanel('overview');
      setPanelsVisible(prev => ({ ...prev, overview: false }));
    } else {
      panelManager.showPanel('overview', {
        title: 'Visão Geral',
        content: (
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-lg font-medium">Estatísticas</h3>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-gray-100 p-2 rounded">
                  <span className="text-sm font-medium">Componentes:</span>
                  <span className="text-sm ml-2">{nodes.length}</span>
                </div>
                <div className="bg-gray-100 p-2 rounded">
                  <span className="text-sm font-medium">Conexões:</span>
                  <span className="text-sm ml-2">{edges.length}</span>
                </div>
                <div className="bg-gray-100 p-2 rounded">
                  <span className="text-sm font-medium">Microserviços:</span>
                  <span className="text-sm ml-2">{nodes.filter(n => n.type === 'microservice').length}</span>
                </div>
                <div className="bg-gray-100 p-2 rounded">
                  <span className="text-sm font-medium">Kafka:</span>
                  <span className="text-sm ml-2">{nodes.filter(n => n.type === 'kafka').length}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Componentes</h3>
              <div className="mt-2 max-h-60 overflow-y-auto">
                {nodes.map(node => (
                  <div 
                    key={node.id} 
                    className="flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => {
                      setSelectedElement(node);
                      showPropertiesPanel(node);
                      panelManager.hidePanel('overview');
                      setPanelsVisible(prev => ({ ...prev, overview: false }));
                    }}
                  >
                    <span className="text-sm">{node.data.label}</span>
                    <span className="text-xs text-gray-500">{node.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ),
        position: { x: window.innerWidth - 320 - 20, y: 80 },
        width: 320,
        height: 400
      });
      setPanelsVisible(prev => ({ ...prev, overview: true }));
    }
  }, [panelManager, panelsVisible.overview, nodes, edges, setSelectedElement, showPropertiesPanel]);

  // Função para mostrar o painel de configurações padrão
  const showDefaultConfigPanel = useCallback(() => {
    if (panelsVisible.defaultConfig) {
      panelManager.hidePanel('defaultConfig');
      setPanelsVisible(prev => ({ ...prev, defaultConfig: false }));
    } else {
      panelManager.showPanel('defaultConfig', {
        title: 'Configurações Default',
        content: (
          <DefaultConfigPanel 
            updateNodeDefaults={updateNodeDefaults}
          />
        ),
        position: { x: window.innerWidth - 320 - 20, y: 80 },
        width: 320,
        height: 600
      });
      setPanelsVisible(prev => ({ ...prev, defaultConfig: true }));
    }
  }, [panelManager, panelsVisible.defaultConfig, updateNodeDefaults]);

  // Função para exportar o diagrama como imagem
  const exportAsImage = useCallback(async () => {
    if (!reactFlowWrapper.current) return;
    
    try {
      const canvas = await html2canvas(reactFlowWrapper.current);
      const dataUrl = canvas.toDataURL('image/png');
      
      // Criar um link temporário para download
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'arquitetura.png';
      link.click();
    } catch (error) {
      console.error('Erro ao exportar imagem:', error);
      alert('Ocorreu um erro ao exportar a imagem. Verifique o console para mais detalhes.');
    }
  }, []);

  // Função para exportar o diagrama como JSON
  const exportAsJson = useCallback(() => {
    try {
      const jsonData = JSON.stringify({ nodes, edges }, null, 2);
      
      // Criar um blob e um link temporário para download
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'arquitetura.json';
      link.click();
      
      // Limpar o URL criado
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar JSON:', error);
      alert('Ocorreu um erro ao exportar o JSON. Verifique o console para mais detalhes.');
    }
  }, [nodes, edges]);

  return (
    <div className="w-full h-full" ref={reactFlowWrapper}>
      <div className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={onElementClick}
          onEdgeClick={onElementClick}
          onNodeDoubleClick={onNodeDoubleClick}
          fitView
          attributionPosition="bottom-right"
        >
          <Background />
          <Controls />
          <MiniMap 
            nodeStrokeWidth={3}
            zoomable 
            pannable
          />
          
          {/* Painel de controle flutuante */}
          <Panel position="top-left" className="flex gap-2">
            <Button
              onClick={showComponentsPanel}
              className="h-8 text-xs bg-gray-200 text-gray-800"
              variant="outline"
            >
              {panelsVisible.components ? 'Ocultar Componentes' : 'Componentes'}
            </Button>
            
            <Button
              onClick={showDefaultConfigPanel}
              className="h-8 text-xs bg-gray-200 text-gray-800"
              variant="outline"
            >
              {panelsVisible.defaultConfig ? 'Ocultar Config Default' : 'Config Default'}
            </Button>
            
            <Button
              onClick={showOverviewPanel}
              className="h-8 text-xs bg-gray-200 text-gray-800"
              variant="outline"
            >
              {panelsVisible.overview ? 'Ocultar Visão Geral' : 'Visão Geral'}
            </Button>
            
            <Button
              onClick={exportAsImage}
              className="h-8 text-xs bg-gray-200 text-gray-800"
              variant="outline"
            >
              Exportar Imagem
            </Button>
            
            <Button
              onClick={exportAsJson}
              className="h-8 text-xs bg-gray-200 text-gray-800"
              variant="outline"
            >
              Exportar JSON
            </Button>
          </Panel>
          
          {/* Painel de controle de simulação */}
          <Panel position="bottom-center" className="bg-white p-2 rounded-t shadow-md">
            <Button
              onClick={toggleControls}
              className="h-8 text-xs bg-gray-200 text-gray-800"
              variant="outline"
            >
              {showControls ? 'Ocultar Controles' : 'Mostrar Controles'}
            </Button>
            
            {showControls && (
              <SimulationControls
                isSimulating={isSimulating}
                simulationSpeed={simulationSpeed}
                onSpeedChange={setSimulationSpeed}
                onStart={startSimulation}
                onPause={pauseSimulation}
                onRestart={restartSimulation}
                nodes={nodes}
                edges={edges}
              />
            )}
          </Panel>
        </ReactFlow>
      </div>
      
      {simulationResults && (
        <SimulationResultsDisplay 
          results={simulationResults} 
          onClose={closeResults} 
        />
      )}
    </div>
  );
}
