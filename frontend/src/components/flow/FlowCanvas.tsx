import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

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
import { CustomEdge } from '../edges/CustomEdge';
import { simulateMessageFlow } from '@/lib/apiService';

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

interface ComponentItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  category: string;
  type: string;
  storageType?: string;
}

interface FlowCanvasProps {
  onDragStart: (event: React.DragEvent, component: ComponentItem) => void;
  onElementSelect: (element: Node | Edge | null) => void;
  onSimulationStart: () => void;
  onSimulationComplete: (results: any) => void;
  isSimulating: boolean;
}

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

export const FlowCanvas: React.FC<FlowCanvasProps> = ({
  onDragStart,
  onElementSelect,
  onSimulationStart,
  onSimulationComplete,
  isSimulating
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedElement, setSelectedElement] = useState<Node | Edge | null>(null);
  const [nodeDefaults, setNodeDefaults] = useState(defaultNodeValues);
  
  const { fitView } = useReactFlow();

  // Efeito para ajustar a visualização quando o tamanho do canvas muda
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.2 });
    }, 200);
    return () => clearTimeout(timer);
  }, [fitView]);

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
          
          if (selectedElement && 'id' in selectedElement && selectedElement.id === nodeId) {
            setSelectedElement(updatedNode);
            onElementSelect(updatedNode);
          }
          
          return updatedNode;
        }
        return node;
      })
    );
  }, [setNodes, selectedElement, onElementSelect]);

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
          
          if (selectedElement && 'id' in selectedElement && selectedElement.id === edgeId) {
            setSelectedElement(updatedEdge);
            onElementSelect(updatedEdge);
          }
          
          return updatedEdge;
        }
        return edge;
      })
    );
  }, [setEdges, selectedElement, onElementSelect]);

  // Função para lidar com conexões entre nós
  const onConnect = useCallback(
    (params: Connection) => {
      const connectionExists = edges.some(
        edge => edge.source === params.source && edge.target === params.target
      );
      
      if (connectionExists) {
        console.log('Conexão já existe');
        return;
      }
      
      const edge: Edge = {
        ...params,
        id: `e${params.source}-${params.target}`,
        type: 'custom',
        data: { 
          latency: 10,
          protocol: 'kafka',
          cost: 0,
          messageCount: 100
        },
        animated: true,
        style: { strokeWidth: 2 }
      };
      
      setEdges((eds) => addEdge(edge, eds));
      
      setTimeout(() => {
        setSelectedElement(edge);
        onElementSelect(edge);
      }, 100);
    },
    [edges, setEdges, onElementSelect]
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

      if (typeof type === 'undefined' || !type || !reactFlowBounds || !reactFlowInstance) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const defaultValues = nodeDefaults[type as keyof typeof nodeDefaults] || {};

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { 
          label: name || `${type} ${nodes.length + 1}`,
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
            type: 'service',
            cpuUsage: 30,
            memoryUsage: 40,
            cost: defaultValues.cost || 75,
            costPerInstance: defaultValues.costPerInstance || 25,
            supportedProtocols: ['kafka', 'http', 'grpc']
          }),
          ...(type === 'storage' && { 
            type: storageType || 'blob',
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
            type: 'service',
            cost: defaultValues.cost || 20,
            costPerExecution: defaultValues.costPerExecution || 0.0001
          }),
          ...(type === 'rabbit' && {
            queues: defaultValues.queues || 1,
            exchanges: defaultValues.exchanges || 1,
            latency: defaultValues.latency || 8,
            serviceName: 'RabbitMQ',
            type: 'service',
            cost: defaultValues.cost || 50,
            costPerQueue: defaultValues.costPerQueue || 5
          }),
          ...(type === 'servicebus' && {
            queues: defaultValues.queues || 1,
            topics: defaultValues.topics || 1,
            subscriptions: defaultValues.subscriptions || 1,
            latency: defaultValues.latency || 12,
            serviceName: 'Service Bus',
            type: 'service',
            cost: defaultValues.cost || 80,
            costPerQueue: defaultValues.costPerQueue || 10
          }),
          ...(type === 'generic' && {
            serviceType: 'Personalizado',
            latency: defaultValues.latency || 10,
            instances: defaultValues.instances || 1,
            serviceName: 'Serviço Genérico',
            type: 'service',
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

      setNodes((nds) => {
        const updatedNodes = nds.map(node => ({
          ...node,
          selected: false
        }));
        
        return [...updatedNodes, newNode];
      });
      
      setTimeout(() => {
        setSelectedElement(newNode);
        onElementSelect(newNode);
      }, 100);
    },
    [reactFlowInstance, nodes, setNodes, onElementSelect, nodeDefaults]
  );

  // Função para selecionar um elemento (nó ou aresta)
  const onElementClick = useCallback((event: React.MouseEvent, element: Node | Edge) => {
    setNodes((nds) => 
      nds.map(node => ({
        ...node,
        selected: node.id === element.id
      }))
    );
    
    setSelectedElement(element);
    onElementSelect(element);
  }, [setNodes, onElementSelect]);

  // Função para iniciar simulação
  const startSimulation = useCallback(async () => {
    if (nodes.length === 0) {
      alert('Adicione pelo menos um componente ao diagrama antes de simular.');
      return;
    }

    try {
      onSimulationStart();
      const results = await simulateMessageFlow(nodes, edges);
      onSimulationComplete(results);
    } catch (error) {
      console.error('Erro na simulação:', error);
      alert('Erro ao executar simulação. Verifique a conexão com a API.');
    }
  }, [nodes, edges, onSimulationStart, onSimulationComplete]);

  // Função para exportar como JSON
  const exportAsJson = useCallback(() => {
    const data = {
      nodes,
      edges,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `arquitetura-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  // Função para importar JSON
  const importFromJson = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.nodes && data.edges) {
          setNodes(data.nodes);
          setEdges(data.edges);
        }
      } catch (error) {
        alert('Erro ao importar arquivo. Verifique se é um JSON válido.');
      }
    };
    reader.readAsText(file);
  }, [setNodes, setEdges]);

  return (
    <div className="w-full h-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onElementClick}
        onEdgeClick={onElementClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-background"
      >
        <Controls className="bg-background border border-border" />
        <MiniMap 
          className="bg-background border border-border"
          nodeColor={(node) => {
            switch (node.type) {
              case 'kafka': return '#ff6b6b';
              case 'microservice': return '#4ecdc4';
              case 'storage': return '#45b7d1';
              case 'function': return '#f9ca24';
              default: return '#95a5a6';
            }
          }}
        />
        <Background variant="dots" gap={12} size={1} className="bg-muted/20" />
      </ReactFlow>

      {/* Hidden file input for import */}
      <input
        type="file"
        accept=".json"
        onChange={importFromJson}
        style={{ display: 'none' }}
        id="import-json-input"
      />
    </div>
  );
};

