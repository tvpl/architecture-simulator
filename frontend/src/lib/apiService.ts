import { Node, Edge } from 'reactflow';

// URL base da API - pode ser configurada via variável de ambiente
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:5001/api';

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

export interface SimulationRequest {
  nodes: Node[];
  edges: Edge[];
}

export interface ValidationResult {
  isValid: boolean;
  message: string;
}

export interface ApiInfo {
  name: string;
  version: string;
  description: string;
  supportedNodeTypes: string[];
  supportedProtocols: string[];
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Simula o fluxo de mensagens em uma arquitetura
   */
  async simulateArchitecture(nodes: Node[], edges: Edge[]): Promise<SimulationResults> {
    const request: SimulationRequest = { nodes, edges };
    
    return this.makeRequest<SimulationResults>('/simulation/simulate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Valida uma arquitetura sem executar a simulação
   */
  async validateArchitecture(nodes: Node[], edges: Edge[]): Promise<ValidationResult> {
    const request: SimulationRequest = { nodes, edges };
    
    return this.makeRequest<ValidationResult>('/simulation/validate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Obtém informações sobre a API
   */
  async getApiInfo(): Promise<ApiInfo> {
    return this.makeRequest<ApiInfo>('/simulation/info');
  }

  /**
   * Testa a conectividade com a API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getApiInfo();
      return true;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}

// Instância singleton do serviço de API
export const apiService = new ApiService();

// Função de conveniência para simular arquitetura (compatibilidade com código existente)
export async function simulateMessageFlow(
  nodes: Node[],
  edges: Edge[]
): Promise<SimulationResults> {
  return apiService.simulateArchitecture(nodes, edges);
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

// Função para formatar custos
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Função para verificar se a API está disponível
export async function checkApiHealth(): Promise<{
  isHealthy: boolean;
  apiInfo?: ApiInfo;
  error?: string;
}> {
  try {
    const apiInfo = await apiService.getApiInfo();
    return {
      isHealthy: true,
      apiInfo,
    };
  } catch (error) {
    return {
      isHealthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Função para testar conexão com a API (compatibilidade)
export async function testApiConnection(): Promise<boolean> {
  return apiService.testConnection();
}

