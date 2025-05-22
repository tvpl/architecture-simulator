import { Node, Edge } from 'reactflow';

export interface SimulationResults {
  totalLatency: number;
  totalMessages: number;
  totalProcessingTime: number;
  bottlenecks: {
    nodeId: string;
    nodeName: string;
    latency: number;
    type: string;
  }[];
  pathAnalysis: {
    path: string[];
    latency: number;
    messages: number;
  }[];
  resourceUtilization: {
    nodeId: string;
    nodeName: string;
    utilization: number;
    type: string;
  }[];
  totalCost: number;
  costBreakdown: {
    component: string;
    cost: number;
    details?: string;
  }[];
  recommendations: string[];
}

// Interface para representar um ramo de processamento na árvore de fluxo
interface ProcessingBranch {
  path: string[];            // Caminho percorrido (IDs dos nós)
  pathNames: string[];       // Nomes dos nós no caminho
  latency: number;           // Latência acumulada no caminho
  messages: number;          // Número de mensagens processadas no caminho
  nodeLatencies: {           // Latência de cada nó no caminho
    nodeId: string;
    nodeName: string;
    latency: number;
  }[];
}

export function simulateMessageFlow(
  nodes: Node[],
  edges: Edge[]
): SimulationResults {
  // Criar um mapa de nós para facilitar o acesso
  const nodeMap = new Map<string, Node>();
  nodes.forEach(node => nodeMap.set(node.id, node));

  // Inicializar resultados
  const bottlenecks: SimulationResults['bottlenecks'] = [];
  const resourceUtilization: SimulationResults['resourceUtilization'] = [];
  const pathAnalysis: SimulationResults['pathAnalysis'] = [];
  const costBreakdown: SimulationResults['costBreakdown'] = [];
  const recommendations: string[] = [];

  // Encontrar o nó de início (Start)
  const startNodes = nodes.filter(node => node.type === 'start');
  
  // Se não houver nó Start, procurar por startflow
  const entryNodes = startNodes.length > 0 ? 
    startNodes : 
    nodes.filter(node => node.type === 'startflow');
  
  // Se ainda não houver nós de entrada, usar nós sem arestas de entrada
  if (entryNodes.length === 0) {
    const incomingEdges = new Map<string, number>();
    nodes.forEach(node => incomingEdges.set(node.id, 0));
    
    edges.forEach(edge => {
      const count = incomingEdges.get(edge.target) || 0;
      incomingEdges.set(edge.target, count + 1);
    });
    
    nodes.forEach(node => {
      if ((incomingEdges.get(node.id) || 0) === 0) {
        entryNodes.push(node);
      }
    });
  }

  // Construir grafo de adjacência
  const graph = new Map<string, string[]>();
  nodes.forEach(node => graph.set(node.id, []));
  
  edges.forEach(edge => {
    const adjacentNodes = graph.get(edge.source) || [];
    adjacentNodes.push(edge.target);
    graph.set(edge.source, adjacentNodes);
  });

  // Mapa para armazenar conexões entre nós
  const edgeMap = new Map<string, Edge>();
  edges.forEach(edge => {
    edgeMap.set(`${edge.source}-${edge.target}`, edge);
  });

  // Número inicial de mensagens (assumimos 100 como padrão)
  const initialMessages = 100;
  
  // Processar o fluxo a partir do nó de início
  const processingBranches: ProcessingBranch[] = [];
  
  // Para cada nó de entrada, processar o fluxo
  entryNodes.forEach(startNode => {
    // Obter os nós conectados ao nó de início
    const connectedNodes = graph.get(startNode.id) || [];
    
    // Para cada nó conectado, iniciar um ramo de processamento
    connectedNodes.forEach(connectedNodeId => {
      const connectedNode = nodeMap.get(connectedNodeId);
      if (!connectedNode) return;
      
      // Obter a aresta entre o nó de início e o nó conectado
      const edge = edgeMap.get(`${startNode.id}-${connectedNodeId}`);
      const edgeLatency = edge ? Math.max(1, edge.data?.latency || 1) : 0;
      
      // Iniciar o processamento recursivo a partir do nó conectado
      processNodeRecursively(
        connectedNodeId,
        [startNode.id],
        [startNode.data?.label || startNode.id],
        edgeLatency,
        initialMessages,
        new Set<string>(),
        nodeMap,
        graph,
        edgeMap,
        processingBranches,
        []
      );
    });
  });

  // Se não houver ramos de processamento, criar um ramo padrão
  if (processingBranches.length === 0) {
    processingBranches.push({
      path: entryNodes.length > 0 ? [entryNodes[0].id] : [],
      pathNames: entryNodes.length > 0 ? [entryNodes[0].data?.label || entryNodes[0].id] : [],
      latency: 0,
      messages: initialMessages,
      nodeLatencies: []
    });
  }

  // Calcular a latência total (maior latência entre todos os ramos)
  const totalLatency = Math.max(...processingBranches.map(branch => branch.latency));

  // Calcular o total de mensagens (soma de todas as mensagens em todos os ramos)
  const totalMessages = processingBranches.reduce((sum, branch) => sum + branch.messages, 0);

  // Calcular tempo total de processamento
  const totalProcessingTime = totalLatency;

  // Identificar gargalos (componentes com latência acima da média)
  // Coletar todas as latências de nós em todos os ramos
  const allNodeLatencies: {
    nodeId: string;
    nodeName: string;
    latency: number;
  }[] = [];
  
  processingBranches.forEach(branch => {
    allNodeLatencies.push(...branch.nodeLatencies);
  });
  
  // Calcular a latência média
  const avgNodeLatency = allNodeLatencies.length > 0 ?
    allNodeLatencies.reduce((sum, item) => sum + item.latency, 0) / allNodeLatencies.length : 0;
  
  // Identificar gargalos (nós com latência significativamente acima da média)
  allNodeLatencies.forEach(item => {
    if (item.latency > avgNodeLatency * 1.5) {
      bottlenecks.push({
        nodeId: item.nodeId,
        nodeName: item.nodeName,
        latency: Math.round(item.latency),
        type: nodeMap.get(item.nodeId)?.type || 'unknown'
      });
    }
  });

  // Calcular utilização de recursos
  nodes.forEach(node => {
    const instances = Math.max(1, node.data?.instances || 1);
    
    // Encontrar o número de mensagens que passam por este nó em todos os ramos
    const nodeMessages = allNodeLatencies
      .filter(item => item.nodeId === node.id)
      .reduce((sum, item) => sum + (item.latency / Math.max(1, node.data?.latency || 1)), 0);
    
    // Calcular utilização de recursos
    let utilization = 0;
    
    if (node.type === 'kafka') {
      // Para Kafka, considerar brokers e partições
      const brokers = Math.max(1, node.data?.brokers || 1);
      const partitions = Math.max(1, node.data?.partitions || 1);
      // Ajustar utilização com base na capacidade total
      const capacity = brokers * partitions;
      utilization = Math.min(100, (nodeMessages / capacity) * 10);
    } else if (node.type === 'microservice' || node.type === 'function') {
      // Para microserviços e funções, considerar instâncias
      // Utilização = (mensagens / capacidade de processamento) * fator de escala
      const processingCapacity = instances;
      utilization = Math.min(100, (nodeMessages / processingCapacity) * 20);
    } else if (node.type === 'storage') {
      // Para storage, considerar throughput
      const storageThruput = Math.max(1, node.data?.throughput || 10);
      utilization = Math.min(100, (nodeMessages / storageThruput) * 15);
    } else if (node.type === 'rabbit' || node.type === 'servicebus') {
      // Para mensageria, considerar filas e throughput
      const queues = Math.max(1, node.data?.queues || 1);
      utilization = Math.min(100, (nodeMessages / queues) * 25);
    } else if (node.type === 'startflow' || node.type === 'start') {
      // Nó de início de fluxo tem utilização baseada apenas no volume de mensagens
      utilization = Math.min(100, (nodeMessages / 1000) * 10);
    } else {
      // Para outros componentes, usar cálculo genérico
      utilization = Math.min(100, (nodeMessages / 10) * 15);
    }
    
    resourceUtilization.push({
      nodeId: node.id,
      nodeName: node.data?.label || node.id,
      utilization: Math.round(utilization),
      type: node.type || 'unknown'
    });
  });

  // Calcular custo total e detalhamento
  let totalCost = 0;
  
  // Custo dos nós Kafka
  const kafkaCost = nodes
    .filter(node => node.type === 'kafka')
    .reduce((acc, node) => {
      const baseCost = Number(node.data?.cost || 0);
      const instanceCost = Number(node.data?.brokers || 0) * Number(node.data?.costPerInstance || 0);
      return acc + baseCost + instanceCost;
    }, 0);
  
  if (kafkaCost > 0) {
    costBreakdown.push({
      component: 'Kafka Clusters',
      cost: kafkaCost,
      details: `${nodes.filter(node => node.type === 'kafka').length} clusters`
    });
    totalCost += kafkaCost;
  }
  
  // Custo dos microserviços
  const microserviceCost = nodes
    .filter(node => node.type === 'microservice')
    .reduce((acc, node) => {
      const baseCost = Number(node.data?.cost || 0);
      const instanceCost = Number(node.data?.instances || 0) * Number(node.data?.costPerInstance || 0);
      return acc + baseCost + instanceCost;
    }, 0);
  
  if (microserviceCost > 0) {
    costBreakdown.push({
      component: 'Microserviços',
      cost: microserviceCost,
      details: `${nodes.filter(node => node.type === 'microservice').length} serviços, ${
        nodes
          .filter(node => node.type === 'microservice')
          .reduce((acc, node) => acc + Number(node.data?.instances || 0), 0)
      } instâncias`
    });
    totalCost += microserviceCost;
  }
  
  // Custo dos serviços de armazenamento
  const storageCost = nodes
    .filter(node => node.type === 'storage')
    .reduce((acc, node) => {
      const baseCost = Number(node.data?.cost || 0);
      const capacityCost = Number(node.data?.capacity || 0) * Number(node.data?.costPerGB || 0);
      return acc + baseCost + capacityCost;
    }, 0);
  
  if (storageCost > 0) {
    costBreakdown.push({
      component: 'Serviços de Armazenamento',
      cost: storageCost,
      details: `${nodes.filter(node => node.type === 'storage').length} serviços`
    });
    totalCost += storageCost;
  }

  // Gerar recomendações
  if (bottlenecks.length > 0) {
    recommendations.push(`Otimize os ${bottlenecks.length} gargalos identificados para melhorar a performance.`);
  }
  
  if (nodes.some(node => node.type === 'kafka' && (node.data?.brokers || 0) < 3)) {
    recommendations.push('Aumente o número de brokers Kafka para melhorar a disponibilidade e throughput.');
  }
  
  if (nodes.some(node => node.type === 'microservice' && (node.data?.instances || 0) < 2)) {
    recommendations.push('Adicione mais instâncias aos microserviços para melhorar a resiliência e throughput.');
  }
  
  if (nodes.some(node => node.type === 'storage' && !(node.data?.replication))) {
    recommendations.push('Ative a replicação nos serviços de armazenamento para melhorar a disponibilidade.');
  }
  
  // Recomendações de custo
  const highCostComponents = costBreakdown
    .filter(item => item.cost > totalCost * 0.4)
    .map(item => item.component);
  
  if (highCostComponents.length > 0) {
    recommendations.push(`Revise os custos de ${highCostComponents.join(', ')} que representam uma grande parte do orçamento.`);
  }

  return {
    totalLatency: Math.round(totalLatency),
    totalMessages: Math.round(totalMessages),
    totalProcessingTime: Math.round(totalProcessingTime),
    bottlenecks,
    pathAnalysis: processingBranches.map(branch => ({
      path: branch.pathNames,
      latency: Math.round(branch.latency),
      messages: Math.round(branch.messages)
    })),
    resourceUtilization,
    totalCost,
    costBreakdown,
    recommendations
  };
}

// Função recursiva para processar um nó e seus conectados
function processNodeRecursively(
  nodeId: string,
  currentPath: string[],
  currentPathNames: string[],
  currentLatency: number,
  currentMessages: number,
  visited: Set<string>,
  nodeMap: Map<string, Node>,
  graph: Map<string, string[]>,
  edgeMap: Map<string, Edge>,
  processingBranches: ProcessingBranch[],
  nodeLatencies: { nodeId: string; nodeName: string; latency: number; }[]
): void {
  // Verificar se o nó já foi visitado (evitar ciclos)
  if (visited.has(nodeId)) return;
  
  // Obter o nó atual
  const node = nodeMap.get(nodeId);
  if (!node) return;
  
  // Marcar como visitado
  const newVisited = new Set(visited);
  newVisited.add(nodeId);
  
  // Adicionar ao caminho
  const newPath = [...currentPath, nodeId];
  const newPathNames = [...currentPathNames, node.data?.label || nodeId];
  
  // Calcular a latência do nó atual
  const nodeLatency = Math.max(1, node.data?.latency || 1);
  
  // Calcular o número de instâncias do nó
  const instances = Math.max(1, node.data?.instances || 1);
  
  // Dividir as mensagens pelo número de instâncias
  const messagesPerInstance = currentMessages / instances;
  
  // Calcular a latência total para processar todas as mensagens neste nó
  const totalNodeLatency = nodeLatency * messagesPerInstance;
  
  // Adicionar à lista de latências de nós
  const newNodeLatencies = [
    ...nodeLatencies,
    {
      nodeId,
      nodeName: node.data?.label || nodeId,
      latency: totalNodeLatency
    }
  ];
  
  // Atualizar a latência acumulada
  const newLatency = currentLatency + totalNodeLatency;
  
  // Obter os nós conectados
  const connectedNodes = graph.get(nodeId) || [];
  
  // Se não houver nós conectados, este é um nó final
  if (connectedNodes.length === 0) {
    processingBranches.push({
      path: newPath,
      pathNames: newPathNames,
      latency: newLatency,
      messages: currentMessages,
      nodeLatencies: newNodeLatencies
    });
    return;
  }
  
  // Verificar se há nós de storage conectados
  const storageNodes = connectedNodes.filter(id => {
    const node = nodeMap.get(id);
    return node && node.type === 'storage';
  });
  
  // Processar nós de storage primeiro (eles adicionam latência mas não dividem mensagens)
  let additionalLatency = 0;
  
  storageNodes.forEach(storageId => {
    const storageNode = nodeMap.get(storageId);
    if (!storageNode) return;
    
    // Obter a latência do storage
    const storageLatency = Math.max(1, storageNode.data?.latency || 1);
    
    // Adicionar à latência adicional
    additionalLatency += storageLatency;
    
    // Marcar o storage como visitado
    newVisited.add(storageId);
    
    // Adicionar à lista de latências de nós
    newNodeLatencies.push({
      nodeId: storageId,
      nodeName: storageNode.data?.label || storageId,
      latency: storageLatency
    });
  });
  
  // Filtrar nós de storage para não processá-los novamente
  const nonStorageNodes = connectedNodes.filter(id => {
    const node = nodeMap.get(id);
    return !(node && node.type === 'storage');
  });
  
  // Se não houver nós não-storage conectados, este é um nó final
  if (nonStorageNodes.length === 0) {
    processingBranches.push({
      path: newPath,
      pathNames: newPathNames,
      latency: newLatency + additionalLatency,
      messages: currentMessages,
      nodeLatencies: newNodeLatencies
    });
    return;
  }
  
  // Dividir as mensagens entre os nós conectados não-storage
  const messagesPerNode = currentMessages / nonStorageNodes.length;
  
  // Processar cada nó conectado não-storage
  nonStorageNodes.forEach(connectedId => {
    // Obter a aresta entre o nó atual e o nó conectado
    const edge = edgeMap.get(`${nodeId}-${connectedId}`);
    const edgeLatency = edge ? Math.max(1, edge.data?.latency || 1) : 0;
    
    // Processar o nó conectado recursivamente
    processNodeRecursively(
      connectedId,
      newPath,
      newPathNames,
      newLatency + additionalLatency + edgeLatency,
      messagesPerNode,
      newVisited,
      nodeMap,
      graph,
      edgeMap,
      processingBranches,
      newNodeLatencies
    );
  });
}

// Função para formatar o tempo de processamento em formato legível
export function formatProcessingTime(timeMs: number): string {
  if (timeMs < 1000) {
    return `${timeMs} ms`;
  } else if (timeMs < 60000) {
    return `${(timeMs / 1000).toFixed(2)} segundos`;
  } else if (timeMs < 3600000) {
    return `${(timeMs / 60000).toFixed(2)} minutos`;
  } else {
    return `${(timeMs / 3600000).toFixed(2)} horas`;
  }
}
