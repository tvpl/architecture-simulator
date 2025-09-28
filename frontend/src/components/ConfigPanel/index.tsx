import { useState, useCallback, useEffect } from 'react';
import { Node, Edge } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ConfigPanelProps {
  selectedElement: Node | Edge | null;
  updateNodeData: (nodeId: string, data: any) => void;
  updateEdgeData: (edgeId: string, data: any) => void;
  nodes: Node[];
  edges: Edge[];
}

export function ConfigPanel({
  selectedElement,
  updateNodeData,
  updateEdgeData,
  nodes,
  edges,
}: ConfigPanelProps) {
  const [activeTab, setActiveTab] = useState('properties');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [localData, setLocalData] = useState<any>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Efeito para limpar a mensagem de sucesso após alguns segundos
  useEffect(() => {
    if (updateSuccess) {
      const timer = setTimeout(() => {
        setUpdateSuccess(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [updateSuccess]);

  // Efeito para inicializar os dados locais quando o elemento selecionado muda
  useEffect(() => {
    if (selectedElement) {
      setLocalData(selectedElement.data || {});
      setHasChanges(false);
    } else {
      setLocalData({});
      setHasChanges(false);
    }
  }, [selectedElement]);

  // Função para atualizar os dados locais
  const updateLocalData = (data: any) => {
    setLocalData(prev => {
      const newData = { ...prev, ...data };
      setHasChanges(true);
      return newData;
    });
  };

  // Função para aplicar as mudanças
  const applyChanges = () => {
    if (!selectedElement || !hasChanges) return;

    if ('source' in selectedElement) {
      // É uma aresta
      updateEdgeData(selectedElement.id, localData);
    } else {
      // É um nó
      updateNodeData(selectedElement.id, localData);
    }

    setUpdateSuccess(true);
    setHasChanges(false);
  };

  // Função para renderizar o painel de configuração de aresta
  const renderEdgeConfig = useCallback(() => {
    if (!selectedElement || !('source' in selectedElement)) return null;
    
    const edge = selectedElement as Edge;
    const latency = localData.latency || edge.data?.latency || 10;
    const protocol = localData.protocol || edge.data?.protocol || 'kafka';
    const topicName = localData.topicName || edge.data?.topicName || '';
    const clusterName = localData.clusterName || edge.data?.clusterName || '';
    const exchangeName = localData.exchangeName || edge.data?.exchangeName || '';
    const queueName = localData.queueName || edge.data?.queueName || '';
    const messageCount = localData.messageCount || edge.data?.messageCount || 1000;
    
    const sourceNode = nodes.find(node => node.id === edge.source);
    const targetNode = nodes.find(node => node.id === edge.target);
    
    const sourceName = sourceNode?.data?.label || edge.source;
    const targetName = targetNode?.data?.label || edge.target;

    // Verificar quais protocolos são suportados pelos nós conectados
    const sourceProtocols = sourceNode?.data?.supportedProtocols || ['kafka'];
    const targetProtocols = targetNode?.data?.supportedProtocols || ['kafka'];
    
    // Encontrar a interseção dos protocolos suportados
    // Garantir que todos os protocolos estejam disponíveis por padrão
    const supportedProtocols = ['kafka', 'http', 'grpc', 'rabbitmq'];

    return (
      <div className="space-y-4">
        <div className="text-sm font-medium flex items-center">
          <Badge variant="outline" className="mr-2">Conexão</Badge>
          {sourceName} → {targetName}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="edge-protocol" className="text-sm">Protocolo</Label>
          <Select
            value={protocol}
            onValueChange={(value) => updateLocalData({ protocol: value })}
          >
            <SelectTrigger id="edge-protocol" className="h-8">
              <SelectValue placeholder="Selecione o protocolo" />
            </SelectTrigger>
            <SelectContent>
              {supportedProtocols.map(p => (
                <SelectItem key={p} value={p}>
                  {p === 'kafka' ? 'Kafka (Mensageria)' : 
                   p === 'http' ? 'HTTP (REST)' : 
                   p === 'grpc' ? 'gRPC' : 
                   'RabbitMQ (Mensageria)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            Define o protocolo de comunicação entre os componentes.
          </p>
        </div>
        
        {protocol === 'kafka' && (
          <div className="space-y-2">
            <Label htmlFor="edge-topic-name" className="text-sm">Nome do Tópico</Label>
            <Input
              id="edge-topic-name"
              value={topicName}
              className="h-8"
              onChange={(e) => updateLocalData({ topicName: e.target.value })}
              placeholder="Ex: orders-topic"
            />
            <p className="text-xs text-gray-500 mt-1">
              Nome do tópico Kafka utilizado nesta conexão.
            </p>
          </div>
        )}

        {protocol === 'rabbitmq' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="edge-cluster-name" className="text-sm">Nome do Cluster</Label>
              <Input
                id="edge-cluster-name"
                value={clusterName}
                className="h-8"
                onChange={(e) => updateLocalData({ clusterName: e.target.value })}
                placeholder="Ex: prod-cluster"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nome do cluster RabbitMQ.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edge-exchange-name" className="text-sm">Nome do Exchange</Label>
              <Input
                id="edge-exchange-name"
                value={exchangeName}
                className="h-8"
                onChange={(e) => updateLocalData({ exchangeName: e.target.value })}
                placeholder="Ex: orders-exchange"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nome do exchange RabbitMQ.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edge-queue-name" className="text-sm">Nome da Fila</Label>
              <Input
                id="edge-queue-name"
                value={queueName}
                className="h-8"
                onChange={(e) => updateLocalData({ queueName: e.target.value })}
                placeholder="Ex: orders-queue"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nome da fila RabbitMQ.
              </p>
            </div>
          </>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="edge-latency" className="text-sm">Latência de Resposta (ms)</Label>
          <div className="flex items-center gap-2">
            <Slider
              id="edge-latency"
              value={[latency]}
              min={1}
              max={10000}
              step={1}
              onValueChange={(value) => updateLocalData({ latency: value[0] })}
            />
            <Input
              type="number"
              value={latency}
              min={1}
              max={10000}
              className="w-20 h-8"
              onChange={(e) => updateLocalData({ latency: parseInt(e.target.value) || 1 })}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Define o tempo de resposta entre os componentes conectados.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="edge-message-count" className="text-sm">Mensagens/Chamadas por Simulação</Label>
          <Input
            id="edge-message-count"
            type="number"
            value={messageCount}
            min={1}
            max={100000}
            className="h-8"
            onChange={(e) => updateLocalData({ messageCount: parseInt(e.target.value) || 1000 })}
          />
          <p className="text-xs text-gray-500 mt-1">
            Número de mensagens ou chamadas esperadas nesta conexão durante a simulação.
          </p>
        </div>
        
        <div className="mt-4 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Impacto na simulação:
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="text-xs">
              <span className="text-gray-500">Throughput máximo:</span>
              <span className="ml-1 font-medium">{Math.floor(1000 / latency)} msg/s</span>
            </div>
            <div className="text-xs">
              <span className="text-gray-500">Classificação:</span>
              <span className={`ml-1 font-medium ${
                latency < 20 ? 'text-green-600' : latency < 50 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {latency < 20 ? 'Baixa' : latency < 50 ? 'Média' : 'Alta'}
              </span>
            </div>
          </div>
        </div>

        <Button 
          className="w-full mt-4" 
          onClick={applyChanges}
          disabled={!hasChanges}
        >
          Aplicar Alterações
        </Button>
      </div>
    );
  }, [selectedElement, nodes, edges, localData, hasChanges, updateEdgeData]);

  // Função para renderizar o painel de configuração de nó Kafka
  const renderKafkaConfig = useCallback((node: Node) => {
    const brokers = localData.brokers !== undefined ? localData.brokers : node.data.brokers;
    const partitions = localData.partitions !== undefined ? localData.partitions : node.data.partitions;
    const replicationFactor = localData.replicationFactor !== undefined ? localData.replicationFactor : node.data.replicationFactor;
    const latency = localData.latency !== undefined ? localData.latency : node.data.latency;
    const cost = localData.cost !== undefined ? localData.cost : node.data.cost || 0;
    const costPerInstance = localData.costPerInstance !== undefined ? localData.costPerInstance : node.data.costPerInstance || 0;
    const label = localData.label !== undefined ? localData.label : node.data.label;
    
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="node-label" className="text-sm">Nome do Serviço</Label>
          <Input
            id="node-label"
            value={label}
            className="h-8"
            onChange={(e) => updateLocalData({ label: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="node-brokers" className="text-sm">Brokers</Label>
          <div className="flex items-center gap-2">
            <Slider
              id="node-brokers"
              value={[brokers]}
              min={1}
              max={10}
              step={1}
              onValueChange={(value) => updateLocalData({ brokers: value[0] })}
            />
            <Input
              type="number"
              value={brokers}
              min={1}
              max={10}
              className="w-16 h-8"
              onChange={(e) => updateLocalData({ brokers: parseInt(e.target.value) || 1 })}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Número de brokers no cluster Kafka.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="node-partitions" className="text-sm">Partições</Label>
          <div className="flex items-center gap-2">
            <Slider
              id="node-partitions"
              value={[partitions]}
              min={1}
              max={20}
              step={1}
              onValueChange={(value) => updateLocalData({ partitions: value[0] })}
            />
            <Input
              type="number"
              value={partitions}
              min={1}
              max={20}
              className="w-16 h-8"
              onChange={(e) => updateLocalData({ partitions: parseInt(e.target.value) || 1 })}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Número de partições por tópico.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="node-replication" className="text-sm">Fator de Replicação</Label>
          <div className="flex items-center gap-2">
            <Slider
              id="node-replication"
              value={[replicationFactor]}
              min={1}
              max={5}
              step={1}
              onValueChange={(value) => updateLocalData({ replicationFactor: value[0] })}
            />
            <Input
              type="number"
              value={replicationFactor}
              min={1}
              max={5}
              className="w-16 h-8"
              onChange={(e) => updateLocalData({ replicationFactor: parseInt(e.target.value) || 1 })}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Número de réplicas para cada partição.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="node-latency" className="text-sm">Latência Interna (ms)</Label>
          <div className="flex items-center gap-2">
            <Slider
              id="node-latency"
              value={[latency]}
              min={1}
              max={10000}
              step={1}
              onValueChange={(value) => updateLocalData({ latency: value[0] })}
            />
            <Input
              type="number"
              value={latency}
              min={1}
              max={10000}
              className="w-20 h-8"
              onChange={(e) => updateLocalData({ latency: parseInt(e.target.value) || 1 })}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Tempo de processamento interno do Kafka.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="node-cost" className="text-sm">Custo Base Mensal ($)</Label>
          <Input
            id="node-cost"
            type="number"
            value={cost}
            min={0}
            step={0.01}
            className="h-8"
            onChange={(e) => updateLocalData({ cost: parseFloat(e.target.value) || 0 })}
          />
          <p className="text-xs text-gray-500 mt-1">
            Custo fixo mensal do cluster Kafka.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="node-costPerInstance" className="text-sm">Custo por Broker ($)</Label>
          <Input
            id="node-costPerInstance"
            type="number"
            value={costPerInstance}
            min={0}
            step={0.01}
            className="h-8"
            onChange={(e) => updateLocalData({ costPerInstance: parseFloat(e.target.value) || 0 })}
          />
          <p className="text-xs text-gray-500 mt-1">
            Custo adicional por broker no cluster.
          </p>
        </div>

        <Button 
          className="w-full mt-4" 
          onClick={applyChanges}
          disabled={!hasChanges}
        >
          Aplicar Alterações
        </Button>
      </div>
    );
  }, [localData, hasChanges, updateNodeData]);

  // Função para renderizar o painel de configuração de nó Microservice
  const renderMicroserviceConfig = useCallback((node: Node) => {
    const label = localData.label !== undefined ? localData.label : node.data.label;
    const type = localData.type !== undefined ? localData.type : node.data.type;
    const instances = localData.instances !== undefined ? localData.instances : node.data.instances;
    const latency = localData.latency !== undefined ? localData.latency : node.data.latency;
    const cost = localData.cost !== undefined ? localData.cost : node.data.cost || 0;
    const costPerInstance = localData.costPerInstance !== undefined ? localData.costPerInstance : node.data.costPerInstance || 0;
    const supportedProtocols = localData.supportedProtocols !== undefined ? localData.supportedProtocols : node.data.supportedProtocols || ['kafka'];
    
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="node-label" className="text-sm">Nome do Serviço</Label>
          <Input
            id="node-label"
            value={label}
            className="h-8"
            onChange={(e) => updateLocalData({ label: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="node-type" className="text-sm">Tipo</Label>
          <Select
            value={type}
            onValueChange={(value) => updateLocalData({ type: value })}
          >
            <SelectTrigger id="node-type" className="h-8">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consumer">Consumer</SelectItem>
              <SelectItem value="producer">Producer</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            Função principal do microserviço.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="node-instances" className="text-sm">Instâncias</Label>
          <div className="flex items-center gap-2">
            <Slider
              id="node-instances"
              value={[instances]}
              min={1}
              max={10}
              step={1}
              onValueChange={(value) => updateLocalData({ instances: value[0] })}
            />
            <Input
              type="number"
              value={instances}
              min={1}
              max={10}
              className="w-16 h-8"
              onChange={(e) => updateLocalData({ instances: parseInt(e.target.value) || 1 })}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Número de réplicas do microserviço.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="node-latency" className="text-sm">Latência Interna (ms)</Label>
          <div className="flex items-center gap-2">
            <Slider
              id="node-latency"
              value={[latency]}
              min={1}
              max={10000}
              step={1}
              onValueChange={(value) => updateLocalData({ latency: value[0] })}
            />
            <Input
              type="number"
              value={latency}
              min={1}
              max={10000}
              className="w-20 h-8"
              onChange={(e) => updateLocalData({ latency: parseInt(e.target.value) || 1 })}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Tempo de processamento interno do microserviço.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm">Protocolos Suportados</Label>
          <div className="space-y-2">
            {['kafka', 'http', 'grpc', 'rabbitmq'].map(protocol => {
              const isChecked = supportedProtocols.includes(protocol);
              return (
                <div key={protocol} className="flex items-center justify-between">
                  <Label htmlFor={`protocol-${protocol}`} className="text-xs cursor-pointer">
                    {protocol === 'kafka' ? 'Kafka (Mensageria)' : 
                     protocol === 'http' ? 'HTTP (REST)' : 
                     protocol === 'grpc' ? 'gRPC' : 
                     'RabbitMQ (Mensageria)'}
                  </Label>
                  <Switch
                    id={`protocol-${protocol}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const newProtocols = checked 
                        ? [...supportedProtocols, protocol]
                        : supportedProtocols.filter(p => p !== protocol);
                      updateLocalData({ supportedProtocols: newProtocols });
                    }}
                  />
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Protocolos de comunicação suportados pelo microserviço.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="node-cost" className="text-sm">Custo Base Mensal ($)</Label>
          <Input
            id="node-cost"
            type="number"
            value={cost}
            min={0}
            step={0.01}
            className="h-8"
            onChange={(e) => updateLocalData({ cost: parseFloat(e.target.value) || 0 })}
          />
          <p className="text-xs text-gray-500 mt-1">
            Custo fixo mensal do microserviço.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="node-costPerInstance" className="text-sm">Custo por Instância ($)</Label>
          <Input
            id="node-costPerInstance"
            type="number"
            value={costPerInstance}
            min={0}
            step={0.01}
            className="h-8"
            onChange={(e) => updateLocalData({ costPerInstance: parseFloat(e.target.value) || 0 })}
          />
          <p className="text-xs text-gray-500 mt-1">
            Custo adicional por instância do microserviço.
          </p>
        </div>

        <Button 
          className="w-full mt-4" 
          onClick={applyChanges}
          disabled={!hasChanges}
        >
          Aplicar Alterações
        </Button>
      </div>
    );
  }, [localData, hasChanges, updateNodeData]);

  // Função para renderizar o painel de configuração de nó Storage
  const renderStorageConfig = useCallback((node: Node) => {
    const label = localData.label !== undefined ? localData.label : node.data.label;
    const type = localData.type !== undefined ? localData.type : node.data.type;
    const latency = localData.latency !== undefined ? localData.latency : node.data.latency;
    const throughput = localData.throughput !== undefined ? localData.throughput : node.data.throughput;
    const capacity = localData.capacity !== undefined ? localData.capacity : node.data.capacity;
    const replication = localData.replication !== undefined ? localData.replication : node.data.replication;
    const cost = localData.cost !== undefined ? localData.cost : node.data.cost || 0;
    const costPerGB = localData.costPerGB !== undefined ? localData.costPerGB : node.data.costPerGB || 0;
    
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="node-label" className="text-sm">Nome do Serviço</Label>
          <Input
            id="node-label"
            value={label}
            className="h-8"
            onChange={(e) => updateLocalData({ label: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="node-type" className="text-sm">Tipo</Label>
          <Select
            value={type}
            onValueChange={(value) => updateLocalData({ type: value })}
          >
            <SelectTrigger id="node-type" className="h-8">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blob">Blob Storage</SelectItem>
              <SelectItem value="sql">SQL Database</SelectItem>
              <SelectItem value="redis">Redis Cache</SelectItem>
              <SelectItem value="appconfig">App Config</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            Tipo de armazenamento.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="node-latency" className="text-sm">Latência (ms)</Label>
          <div className="flex items-center gap-2">
            <Slider
              id="node-latency"
              value={[latency]}
              min={1}
              max={10000}
              step={1}
              onValueChange={(value) => updateLocalData({ latency: value[0] })}
            />
            <Input
              type="number"
              value={latency}
              min={1}
              max={10000}
              className="w-20 h-8"
              onChange={(e) => updateLocalData({ latency: parseInt(e.target.value) || 1 })}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Tempo de acesso ao armazenamento.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="node-throughput" className="text-sm">Throughput (MB/s)</Label>
          <div className="flex items-center gap-2">
            <Slider
              id="node-throughput"
              value={[throughput]}
              min={1}
              max={1000}
              step={1}
              onValueChange={(value) => updateLocalData({ throughput: value[0] })}
            />
            <Input
              type="number"
              value={throughput}
              min={1}
              max={1000}
              className="w-20 h-8"
              onChange={(e) => updateLocalData({ throughput: parseInt(e.target.value) || 1 })}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Taxa de transferência de dados.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="node-capacity" className="text-sm">Capacidade (GB)</Label>
          <div className="flex items-center gap-2">
            <Slider
              id="node-capacity"
              value={[capacity]}
              min={1}
              max={10000}
              step={1}
              onValueChange={(value) => updateLocalData({ capacity: value[0] })}
            />
            <Input
              type="number"
              value={capacity}
              min={1}
              max={10000}
              className="w-20 h-8"
              onChange={(e) => updateLocalData({ capacity: parseInt(e.target.value) || 1 })}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Capacidade total de armazenamento.
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="node-replication" className="text-sm cursor-pointer">
            Replicação
          </Label>
          <Switch
            id="node-replication"
            checked={replication}
            onCheckedChange={(checked) => updateLocalData({ replication: checked })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="node-cost" className="text-sm">Custo Base Mensal ($)</Label>
          <Input
            id="node-cost"
            type="number"
            value={cost}
            min={0}
            step={0.01}
            className="h-8"
            onChange={(e) => updateLocalData({ cost: parseFloat(e.target.value) || 0 })}
          />
          <p className="text-xs text-gray-500 mt-1">
            Custo fixo mensal do armazenamento.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="node-costPerGB" className="text-sm">Custo por GB ($)</Label>
          <Input
            id="node-costPerGB"
            type="number"
            value={costPerGB}
            min={0}
            step={0.01}
            className="h-8"
            onChange={(e) => updateLocalData({ costPerGB: parseFloat(e.target.value) || 0 })}
          />
          <p className="text-xs text-gray-500 mt-1">
            Custo adicional por GB de armazenamento.
          </p>
        </div>

        <Button 
          className="w-full mt-4" 
          onClick={applyChanges}
          disabled={!hasChanges}
        >
          Aplicar Alterações
        </Button>
      </div>
    );
  }, [localData, hasChanges, updateNodeData]);

  // Função para renderizar o painel de configuração com base no tipo de elemento selecionado
  const renderConfigPanel = useCallback(() => {
    if (!selectedElement) {
      return (
        <div className="p-4 text-center text-gray-500">
          <p>Selecione um componente ou conexão para configurar suas propriedades.</p>
        </div>
      );
    }

    // Se for uma aresta (conexão)
    if ('source' in selectedElement) {
      return renderEdgeConfig();
    }

    // Se for um nó (componente)
    const node = selectedElement as Node;
    
    switch (node.type) {
      case 'kafka':
        return renderKafkaConfig(node);
      case 'microservice':
      case 'function':
      case 'generic':
        return renderMicroserviceConfig(node);
      case 'storage':
        return renderStorageConfig(node);
      case 'rabbit':
      case 'servicebus':
      case 'queue':
      case 'topic':
      case 'cluster':
      default:
        // Para outros tipos de nós, renderizar um painel genérico
        return (
          <div className="p-4">
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Configuração Genérica</AlertTitle>
              <AlertDescription>
                Este tipo de componente tem configuração simplificada.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="node-label" className="text-sm">Nome</Label>
                <Input
                  id="node-label"
                  value={localData.label !== undefined ? localData.label : node.data.label}
                  className="h-8"
                  onChange={(e) => updateLocalData({ label: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="node-latency" className="text-sm">Latência (ms)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="node-latency"
                    value={[localData.latency !== undefined ? localData.latency : node.data.latency]}
                    min={1}
                    max={10000}
                    step={1}
                    onValueChange={(value) => updateLocalData({ latency: value[0] })}
                  />
                  <Input
                    type="number"
                    value={localData.latency !== undefined ? localData.latency : node.data.latency}
                    min={1}
                    max={10000}
                    className="w-20 h-8"
                    onChange={(e) => updateLocalData({ latency: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="node-cost" className="text-sm">Custo Mensal ($)</Label>
                <Input
                  id="node-cost"
                  type="number"
                  value={localData.cost !== undefined ? localData.cost : node.data.cost || 0}
                  min={0}
                  step={0.01}
                  className="h-8"
                  onChange={(e) => updateLocalData({ cost: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <Button 
                className="w-full mt-4" 
                onClick={applyChanges}
                disabled={!hasChanges}
              >
                Aplicar Alterações
              </Button>
            </div>
          </div>
        );
    }
  }, [
    selectedElement, 
    renderEdgeConfig, 
    renderKafkaConfig, 
    renderMicroserviceConfig, 
    renderStorageConfig,
    localData,
    hasChanges
  ]);

  return (
    <Card className="w-full h-full shadow-sm border-gray-200 overflow-hidden">
      <CardHeader className="px-4 py-2 border-b border-gray-100">
        <CardTitle className="text-sm font-medium">
          {selectedElement 
            ? 'source' in selectedElement 
              ? 'Propriedades da Conexão' 
              : `Propriedades: ${selectedElement.data?.label || selectedElement.type}`
            : 'Propriedades'
          }
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 overflow-auto" style={{ height: 'calc(100% - 41px)' }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b border-gray-100 px-4">
            <TabsTrigger value="properties" className="text-xs">
              Propriedades
            </TabsTrigger>
            <TabsTrigger value="overview" className="text-xs">
              Visão Geral
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="properties" className="p-4 mt-0">
            {renderConfigPanel()}
            
            {updateSuccess && (
              <Alert className="mt-4 bg-green-50 border-green-200">
                <AlertTitle className="text-green-600">Atualizado com sucesso</AlertTitle>
                <AlertDescription className="text-green-600">
                  As propriedades foram atualizadas.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="overview" className="p-4 mt-0">
            {selectedElement ? (
              <div className="space-y-4">
                <div className="text-sm font-medium">
                  {selectedElement.data?.label || ('source' in selectedElement ? 'Conexão' : selectedElement.type)}
                </div>
                
                {'source' in selectedElement ? (
                  // Visão geral para conexões
                  <div className="space-y-2">
                    <div className="text-xs">
                      <span className="text-gray-500">Origem:</span>
                      <span className="ml-1 font-medium">
                        {nodes.find(n => n.id === selectedElement.source)?.data?.label || selectedElement.source}
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-500">Destino:</span>
                      <span className="ml-1 font-medium">
                        {nodes.find(n => n.id === selectedElement.target)?.data?.label || selectedElement.target}
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-500">Protocolo:</span>
                      <span className="ml-1 font-medium">
                        {selectedElement.data?.protocol || 'kafka'}
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-500">Latência:</span>
                      <span className="ml-1 font-medium">
                        {selectedElement.data?.latency || 10} ms
                      </span>
                    </div>
                  </div>
                ) : (
                  // Visão geral para componentes
                  <div className="space-y-2">
                    <div className="text-xs">
                      <span className="text-gray-500">Tipo:</span>
                      <span className="ml-1 font-medium">
                        {selectedElement.type}
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-500">ID:</span>
                      <span className="ml-1 font-medium">
                        {selectedElement.id}
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-500">Latência:</span>
                      <span className="ml-1 font-medium">
                        {selectedElement.data?.latency || 10} ms
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-500">Custo:</span>
                      <span className="ml-1 font-medium">
                        ${selectedElement.data?.cost || 0}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                  Clique na aba Propriedades para editar os detalhes deste componente.
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <p>Selecione um componente ou conexão para ver sua visão geral.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
