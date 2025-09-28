// Este arquivo agora redireciona para o serviço de API
// Mantido para compatibilidade com o código existente

import { Node, Edge } from 'reactflow';
import { simulateMessageFlow as apiSimulateMessageFlow, SimulationResults as ApiSimulationResults } from './apiService';

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

export async function simulateMessageFlow(
  nodes: Node[],
  edges: Edge[]
): Promise<SimulationResults> {
  try {
    // Chamar a API do backend .NET Core
    const results = await apiSimulateMessageFlow(nodes, edges);
    return results;
  } catch (error) {
    console.error('Erro ao chamar a API de simulação:', error);
    
    // Em caso de erro, retornar resultados vazios ou de fallback
    return {
      totalLatency: 0,
      totalMessages: 0,
      totalProcessingTime: 0,
      bottlenecks: [],
      pathAnalysis: [],
      resourceUtilization: [],
      totalCost: 0,
      costBreakdown: [],
      recommendations: ['Erro ao conectar com o backend. Verifique se a API está rodando.']
    };
  }
}

// Função para formatar o tempo de processamento em formato legível
export function formatProcessingTime(timeMs: number): string {
  if (timeMs < 1000) {
    return `${timeMs} ms`;
  } else if (timeMs < 60000) {
    return `${(timeMs / 1000).toFixed(1)} s`;
  } else {
    const minutes = Math.floor(timeMs / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}

