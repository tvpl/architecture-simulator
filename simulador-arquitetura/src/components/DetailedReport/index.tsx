import React, { useCallback } from 'react';
import { Node, Edge } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface DetailedReportProps {
  node: Node;
  edges: Edge[];
  nodes: Node[];
  onClose: () => void;
}

export function DetailedReport({ node, edges, nodes, onClose }: DetailedReportProps) {
  // Encontrar conexões de entrada e saída
  const incomingEdges = edges.filter(edge => edge.target === node.id);
  const outgoingEdges = edges.filter(edge => edge.source === node.id);
  
  // Calcular métricas
  const calculateThroughput = () => {
    if (node.type === 'kafka') {
      return `${node.data.partitions * 10} MB/s`;
    } else if (node.type === 'microservice') {
      return `${node.data.instances * 5} req/s`;
    } else if (node.type === 'storage') {
      return `${node.data.throughput} MB/s`;
    } else if (node.type === 'queue' || node.type === 'topic') {
      return `${(node.data.partitions || 1) * 8} msg/s`;
    } else if (node.type === 'cluster') {
      return `${node.data.nodes * 20} MB/s`;
    }
    return 'N/A';
  };
  
  const calculateAvailability = () => {
    if (node.type === 'kafka' || node.type === 'cluster') {
      return node.data.replicationFactor > 1 ? '99.99%' : '99.9%';
    } else if (node.type === 'microservice') {
      return node.data.instances > 1 ? '99.95%' : '99.5%';
    } else if (node.type === 'storage') {
      return node.data.replication ? '99.999%' : '99.9%';
    }
    return '99.9%';
  };
  
  const calculateTotalCost = () => {
    let baseCost = node.data.cost || 0;
    
    if (node.type === 'kafka') {
      baseCost += (node.data.brokers * (node.data.costPerInstance || 0));
    } else if (node.type === 'microservice') {
      baseCost += (node.data.instances * (node.data.costPerInstance || 0));
    } else if (node.type === 'storage' && node.data.type === 'blob') {
      baseCost += (node.data.capacity * (node.data.costPerGB || 0));
    } else if (node.type === 'topic') {
      baseCost = (node.data.partitions || 3) * (node.data.costPerPartition || 5);
    } else if (node.type === 'cluster') {
      baseCost = (node.data.nodes || 3) * (node.data.costPerNode || 50);
    }
    
    return `$${baseCost.toFixed(2)}/mês`;
  };
  
  // Renderizar detalhes específicos do tipo de nó
  const renderSpecificDetails = () => {
    switch (node.type) {
      case 'kafka':
        return (
          <>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <p className="text-xs text-gray-500">Brokers</p>
                <p className="text-sm font-medium">{node.data.brokers}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Partições</p>
                <p className="text-sm font-medium">{node.data.partitions}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Replicação</p>
                <p className="text-sm font-medium">{node.data.replicationFactor}x</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Latência</p>
                <p className="text-sm font-medium">{node.data.latency}ms</p>
              </div>
            </div>
          </>
        );
      
      case 'microservice':
        return (
          <>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <p className="text-xs text-gray-500">Tipo</p>
                <p className="text-sm font-medium">{node.data.type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Instâncias</p>
                <p className="text-sm font-medium">{node.data.instances}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Latência</p>
                <p className="text-sm font-medium">{node.data.latency}ms</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Protocolos</p>
                <p className="text-sm font-medium">{(node.data.supportedProtocols || []).join(', ')}</p>
              </div>
            </div>
          </>
        );
      
      case 'storage':
        return (
          <>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <p className="text-xs text-gray-500">Tipo</p>
                <p className="text-sm font-medium">{node.data.type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Throughput</p>
                <p className="text-sm font-medium">{node.data.throughput} MB/s</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Capacidade</p>
                <p className="text-sm font-medium">{node.data.capacity} GB</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Replicação</p>
                <p className="text-sm font-medium">{node.data.replication ? 'Sim' : 'Não'}</p>
              </div>
              {node.data.type === 'sql' && (
                <>
                  <div>
                    <p className="text-xs text-gray-500">Banco</p>
                    <p className="text-sm font-medium">{node.data.dbName || 'Database'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tabela</p>
                    <p className="text-sm font-medium">{node.data.tableName || 'Table'}</p>
                  </div>
                </>
              )}
            </div>
          </>
        );
        
      case 'queue':
        return (
          <>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <p className="text-xs text-gray-500">Cluster</p>
                <p className="text-sm font-medium">{node.data.cluster || 'Não definido'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Latência</p>
                <p className="text-sm font-medium">{node.data.latency || 5}ms</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Custo por mensagem</p>
                <p className="text-sm font-medium">${node.data.costPerMessage || 0.001}</p>
              </div>
            </div>
          </>
        );
        
      case 'topic':
        return (
          <>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <p className="text-xs text-gray-500">Cluster</p>
                <p className="text-sm font-medium">{node.data.cluster || 'Não definido'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Partições</p>
                <p className="text-sm font-medium">{node.data.partitions || 3}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Latência</p>
                <p className="text-sm font-medium">{node.data.latency || 8}ms</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Custo por partição</p>
                <p className="text-sm font-medium">${node.data.costPerPartition || 5}/mês</p>
              </div>
            </div>
          </>
        );
        
      case 'cluster':
        return (
          <>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <p className="text-xs text-gray-500">Tipo</p>
                <p className="text-sm font-medium">{node.data.type || 'Kafka'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Nós</p>
                <p className="text-sm font-medium">{node.data.nodes || 3}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Região</p>
                <p className="text-sm font-medium">{node.data.region || 'East US'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Disponibilidade</p>
                <p className="text-sm font-medium">{node.data.availability || '99.9%'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Custo por nó</p>
                <p className="text-sm font-medium">${node.data.costPerNode || 50}/mês</p>
              </div>
            </div>
          </>
        );
        
      default:
        return null;
    }
  };
  
  // Renderizar conexões
  const renderConnections = () => {
    if (incomingEdges.length === 0 && outgoingEdges.length === 0) {
      return (
        <p className="text-sm text-gray-500 italic">Nenhuma conexão estabelecida</p>
      );
    }
    
    return (
      <div className="space-y-3">
        {incomingEdges.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Conexões de Entrada:</p>
            <div className="space-y-1">
              {incomingEdges.map(edge => {
                const sourceNode = nodes.find(n => n.id === edge.source);
                return (
                  <div key={edge.id} className="flex items-center justify-between text-xs">
                    <span>{sourceNode?.data.label || 'Desconhecido'}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {edge.data?.protocol || 'kafka'} • {edge.data?.latency || 10}ms
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {outgoingEdges.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Conexões de Saída:</p>
            <div className="space-y-1">
              {outgoingEdges.map(edge => {
                const targetNode = nodes.find(n => n.id === edge.target);
                return (
                  <div key={edge.id} className="flex items-center justify-between text-xs">
                    <span>{targetNode?.data.label || 'Desconhecido'}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {edge.data?.protocol || 'kafka'} • {edge.data?.latency || 10}ms
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{node.data.label}</CardTitle>
          <Badge variant="outline">{node.type}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Métricas Principais</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-xs text-gray-500">Throughput</p>
              <p className="text-sm font-medium">{calculateThroughput()}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-xs text-gray-500">Disponibilidade</p>
              <p className="text-sm font-medium">{calculateAvailability()}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-xs text-gray-500">Custo Total</p>
              <p className="text-sm font-medium">{calculateTotalCost()}</p>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">Detalhes do Componente</h3>
          {renderSpecificDetails()}
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-sm font-medium mb-2">Conexões</h3>
          {renderConnections()}
        </div>
        
        <div className="pt-2">
          <button 
            onClick={onClose}
            className="w-full py-1 px-3 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
          >
            Fechar
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
