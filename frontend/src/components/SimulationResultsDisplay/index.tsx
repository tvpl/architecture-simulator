import { useState, useCallback } from 'react';
import { SimulationResults, formatProcessingTime } from '@/lib/simulation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

interface SimulationResultsDisplayProps {
  results: SimulationResults;
  onClose: () => void;
}

export function SimulationResultsDisplay({ results, onClose }: SimulationResultsDisplayProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="px-4 py-3 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Resultados da Simulação</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            ✕
          </Button>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-4">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="paths">Caminhos</TabsTrigger>
              <TabsTrigger value="resources">Recursos</TabsTrigger>
              <TabsTrigger value="cost">Custo</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <TabsContent value="overview" className="mt-0 h-full">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm text-gray-500">Latência Total</div>
                  <div className="text-2xl font-bold">{results.totalLatency} ms</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm text-gray-500">Total de Mensagens</div>
                  <div className="text-2xl font-bold">{results.totalMessages}</div>
                </div>
              </div>
              
              {/* Seção para tempo estimado de processamento */}
              <div className="mb-4">
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="text-sm text-gray-500">Tempo Estimado de Processamento Total</div>
                  <div className="text-2xl font-bold text-blue-600">{formatProcessingTime(results.totalProcessingTime)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Baseado na volumetria total de {results.totalMessages} mensagens
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Gargalos Identificados</h3>
                {results.bottlenecks.length > 0 ? (
                  <div className="space-y-2">
                    {results.bottlenecks.map((bottleneck, index) => (
                      <div key={index} className="bg-red-50 p-2 rounded-md">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">{bottleneck.nodeName}</span>
                          <span className="text-sm text-red-600">{bottleneck.latency} ms</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {bottleneck.type === 'connection' ? 'Conexão' : 
                           bottleneck.type === 'kafka' ? 'Kafka Cluster' :
                           bottleneck.type === 'microservice' ? 'Microserviço' :
                           bottleneck.type === 'storage' ? 'Storage' : 'Componente'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Nenhum gargalo significativo identificado.
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Recomendações</h3>
                {results.recommendations.length > 0 ? (
                  <ul className="space-y-1">
                    {results.recommendations.map((recommendation, index) => (
                      <li key={index} className="text-sm bg-blue-50 p-2 rounded-md">
                        {recommendation}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-gray-500">
                    Nenhuma recomendação específica para esta arquitetura.
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Resumo de Custo</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm text-gray-500">Custo Mensal Estimado</div>
                  <div className="text-2xl font-bold text-blue-600">R${results.totalCost.toFixed(2)}</div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="paths" className="mt-0 h-full">
              <h3 className="text-sm font-medium mb-2">Análise de Caminhos</h3>
              <div className="space-y-3">
                {results.pathAnalysis.map((path, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Caminho {index + 1}</span>
                      <span className="text-sm">{path.latency} ms</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      Mensagens: {path.messages}
                    </div>
                    <div className="flex flex-wrap items-center">
                      {path.path.map((node, nodeIndex) => (
                        <div key={nodeIndex} className="flex items-center mb-1">
                          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {node}
                          </div>
                          {nodeIndex < path.path.length - 1 && (
                            <div className="mx-1 text-gray-400">→</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="resources" className="mt-0 h-full">
              <h3 className="text-sm font-medium mb-2">Utilização de Recursos</h3>
              <div className="space-y-3">
                {results.resourceUtilization.map((resource, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{resource.nodeName}</span>
                      <span className="text-sm">{resource.utilization.toFixed(1)}%</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {resource.type === 'kafka' ? 'Kafka Cluster' :
                       resource.type === 'microservice' ? 'Microserviço' :
                       resource.type === 'storage' ? 'Storage' : 'Componente'}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          resource.utilization < 50 ? 'bg-green-500' :
                          resource.utilization < 80 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${resource.utilization}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="cost" className="mt-0 h-full">
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Custo Mensal Estimado</h3>
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="text-3xl font-bold text-blue-600">R${results.totalCost.toFixed(2)}</div>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Detalhamento de Custos</h3>
                <div className="space-y-2">
                  {results.costBreakdown.map((item, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{item.component}</span>
                        <span className="text-sm font-medium">R${item.cost.toFixed(2)}</span>
                      </div>
                      {item.details && (
                        <div className="text-xs text-gray-500">{item.details}</div>
                      )}
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${(item.cost / results.totalCost) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Recomendações de Custo</h3>
                {results.recommendations.filter(r => r.includes('custo') || r.includes('orçamento')).length > 0 ? (
                  <ul className="space-y-1">
                    {results.recommendations
                      .filter(r => r.includes('custo') || r.includes('orçamento'))
                      .map((recommendation, index) => (
                        <li key={index} className="text-sm bg-blue-50 p-2 rounded-md">
                          {recommendation}
                        </li>
                      ))}
                  </ul>
                ) : (
                  <div className="text-sm text-gray-500">
                    Nenhuma recomendação específica de custo para esta arquitetura.
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
