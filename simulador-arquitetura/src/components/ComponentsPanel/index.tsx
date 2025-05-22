import { DragEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Play } from 'lucide-react';

export function ComponentsPanel() {
  const [activeTab, setActiveTab] = useState('mensageria');
  
  const onDragStart = (event: DragEvent<HTMLDivElement>, nodeType: string, nodeName: string, storageType?: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/nodeName', nodeName);
    
    // Adicionar o tipo específico de storage quando aplicável
    if (storageType) {
      event.dataTransfer.setData('application/storageType', storageType);
    }
    
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Card className="w-64 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Componentes</CardTitle>
        <CardDescription className="text-xs">Arraste para adicionar ao diagrama</CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="mensageria" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mx-2 mb-2">
          <TabsTrigger value="inicio" className="text-xs py-1">Início</TabsTrigger>
          <TabsTrigger value="mensageria" className="text-xs py-1">Mensageria</TabsTrigger>
          <TabsTrigger value="servicos" className="text-xs py-1">Serviços</TabsTrigger>
          <TabsTrigger value="storage" className="text-xs py-1">Storage</TabsTrigger>
        </TabsList>
        
        <CardContent className="pt-0 px-2">
          <TabsContent value="inicio" className="space-y-2 mt-0">
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <div
                    className="bg-white border border-green-500 rounded-md p-2 cursor-grab flex flex-col items-center justify-center h-16"
                    draggable
                    onDragStart={(event) => onDragStart(event, 'start', 'Start')}
                  >
                    <Play className="h-6 w-6 text-green-600 mb-1" />
                    <span className="text-xs font-medium text-green-700">Start</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Ponto inicial para cálculo do relatório final</p>
                  <p className="text-xs text-gray-500">Sem propriedades configuráveis</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TabsContent>
          
          <TabsContent value="mensageria" className="space-y-2 mt-0">
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <div
                    className="bg-white border border-orange-500 rounded-md p-2 cursor-grab flex flex-col items-center justify-center h-16"
                    draggable
                    onDragStart={(event) => onDragStart(event, 'kafka', 'Kafka Cluster')}
                  >
                    <span className="text-xl mb-1">🔄</span>
                    <span className="text-xs font-medium text-orange-700">Kafka Cluster</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Sistema de mensageria distribuído</p>
                  <p className="text-xs text-gray-500">Brokers: 3, Partições: 5</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <div
                    className="bg-white border border-pink-500 rounded-md p-2 cursor-grab flex flex-col items-center justify-center h-16"
                    draggable
                    onDragStart={(event) => onDragStart(event, 'rabbit', 'RabbitMQ')}
                  >
                    <span className="text-xl mb-1">🐰</span>
                    <span className="text-xs font-medium text-pink-700">RabbitMQ</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Message broker para comunicação assíncrona</p>
                  <p className="text-xs text-gray-500">Filas, Exchanges, Routing</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <div
                    className="bg-white border border-purple-500 rounded-md p-2 cursor-grab flex flex-col items-center justify-center h-16"
                    draggable
                    onDragStart={(event) => onDragStart(event, 'servicebus', 'Service Bus')}
                  >
                    <span className="text-xl mb-1">🚌</span>
                    <span className="text-xs font-medium text-purple-700">Service Bus</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Serviço de mensageria gerenciado da Azure</p>
                  <p className="text-xs text-gray-500">Filas, Tópicos, Assinaturas</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TabsContent>
          
          <TabsContent value="servicos" className="space-y-2 mt-0">
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <div
                    className="bg-white border border-blue-500 rounded-md p-2 cursor-grab flex flex-col items-center justify-center h-16"
                    draggable
                    onDragStart={(event) => onDragStart(event, 'microservice', 'Microserviço')}
                  >
                    <span className="text-xl mb-1">🔧</span>
                    <span className="text-xs font-medium text-blue-700">Microserviço</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Serviço independente e especializado</p>
                  <p className="text-xs text-gray-500">Instâncias: 2, Latência: 15ms</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <div
                    className="bg-white border border-yellow-500 rounded-md p-2 cursor-grab flex flex-col items-center justify-center h-16"
                    draggable
                    onDragStart={(event) => onDragStart(event, 'function', 'Function Keda')}
                  >
                    <span className="text-xl mb-1">⚡</span>
                    <span className="text-xs font-medium text-yellow-700">Function Keda</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Função serverless com auto-scaling</p>
                  <p className="text-xs text-gray-500">Suporta triggers: HTTP, Blob, Timer</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <div
                    className="bg-white border border-gray-500 rounded-md p-2 cursor-grab flex flex-col items-center justify-center h-16"
                    draggable
                    onDragStart={(event) => onDragStart(event, 'generic', 'Componente Genérico')}
                  >
                    <span className="text-xl mb-1">📦</span>
                    <span className="text-xs font-medium text-gray-700">Componente Genérico</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Componente customizável para qualquer serviço</p>
                  <p className="text-xs text-gray-500">Configurações personalizáveis</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TabsContent>
          
          <TabsContent value="storage" className="space-y-2 mt-0">
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <div
                    className="bg-white border border-purple-500 rounded-md p-2 cursor-grab flex flex-col items-center justify-center h-16"
                    draggable
                    onDragStart={(event) => onDragStart(event, 'storage', 'Azure Blob Storage', 'blob')}
                  >
                    <span className="text-xl mb-1">📁</span>
                    <span className="text-xs font-medium text-purple-700">Blob Storage</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Armazenamento de objetos não estruturados</p>
                  <p className="text-xs text-gray-500">Capacidade: 100GB, Throughput: 50MB/s</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <div
                    className="bg-white border border-red-500 rounded-md p-2 cursor-grab flex flex-col items-center justify-center h-16"
                    draggable
                    onDragStart={(event) => onDragStart(event, 'storage', 'Azure Redis Cache', 'redis')}
                  >
                    <span className="text-xl mb-1">⚡</span>
                    <span className="text-xs font-medium text-red-700">Redis Cache</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Cache em memória de alta performance</p>
                  <p className="text-xs text-gray-500">Latência: 5ms, Throughput: 100MB/s</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <div
                    className="bg-white border border-green-500 rounded-md p-2 cursor-grab flex flex-col items-center justify-center h-16"
                    draggable
                    onDragStart={(event) => onDragStart(event, 'storage', 'Banco de Dados', 'sql')}
                  >
                    <span className="text-xl mb-1">🗄️</span>
                    <span className="text-xs font-medium text-green-700">Banco de Dados</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Armazenamento estruturado de dados</p>
                  <p className="text-xs text-gray-500">Suporta SQL e NoSQL</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <div
                    className="bg-white border border-teal-500 rounded-md p-2 cursor-grab flex flex-col items-center justify-center h-16"
                    draggable
                    onDragStart={(event) => onDragStart(event, 'storage', 'Azure App Configuration', 'appconfig')}
                  >
                    <span className="text-xl mb-1">⚙️</span>
                    <span className="text-xs font-medium text-teal-700">App Configuration</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Gerenciamento de configurações e feature flags</p>
                  <p className="text-xs text-gray-500">Configurável para AppConfig ou FeatureFlag</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
