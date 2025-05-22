import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface DefaultConfigPanelProps {
  updateNodeDefaults: (type: string, data: any) => void;
}

export function DefaultConfigPanel({ updateNodeDefaults }: DefaultConfigPanelProps) {
  const [activeTab, setActiveTab] = useState('kafka');

  // Valores padrão para Kafka
  const [kafkaDefaults, setKafkaDefaults] = useState({
    brokers: 3,
    partitions: 5,
    replicationFactor: 2,
    latency: 10,
    cost: 100,
    costPerInstance: 50
  });

  // Valores padrão para Microserviço
  const [microserviceDefaults, setMicroserviceDefaults] = useState({
    instances: 2,
    latency: 15,
    cost: 75,
    costPerInstance: 25
  });

  // Valores padrão para Storage
  const [storageDefaults, setStorageDefaults] = useState({
    latency: 20,
    throughput: 50,
    capacity: 100,
    cost: 120,
    costPerGB: 0.5
  });

  // Valores padrão para RabbitMQ
  const [rabbitDefaults, setRabbitDefaults] = useState({
    queues: 1,
    exchanges: 1,
    latency: 8,
    cost: 50,
    costPerQueue: 5
  });

  // Valores padrão para Service Bus
  const [serviceBusDefaults, setServiceBusDefaults] = useState({
    queues: 1,
    topics: 1,
    subscriptions: 1,
    latency: 12,
    cost: 80,
    costPerQueue: 10
  });

  // Valores padrão para Function
  const [functionDefaults, setFunctionDefaults] = useState({
    maxReplicas: 10,
    minReplicas: 0,
    latency: 5,
    cost: 20,
    costPerExecution: 0.0001
  });

  // Valores padrão para Componente Genérico
  const [genericDefaults, setGenericDefaults] = useState({
    instances: 1,
    latency: 10,
    cost: 30,
    costPerInstance: 15
  });

  // Função para atualizar os valores padrão do Kafka
  const updateKafkaDefaults = useCallback((data: Partial<typeof kafkaDefaults>) => {
    setKafkaDefaults(prev => {
      const updated = { ...prev, ...data };
      updateNodeDefaults('kafka', updated);
      return updated;
    });
  }, [updateNodeDefaults]);

  // Função para atualizar os valores padrão do Microserviço
  const updateMicroserviceDefaults = useCallback((data: Partial<typeof microserviceDefaults>) => {
    setMicroserviceDefaults(prev => {
      const updated = { ...prev, ...data };
      updateNodeDefaults('microservice', updated);
      return updated;
    });
  }, [updateNodeDefaults]);

  // Função para atualizar os valores padrão do Storage
  const updateStorageDefaults = useCallback((data: Partial<typeof storageDefaults>) => {
    setStorageDefaults(prev => {
      const updated = { ...prev, ...data };
      updateNodeDefaults('storage', updated);
      return updated;
    });
  }, [updateNodeDefaults]);

  // Função para atualizar os valores padrão do RabbitMQ
  const updateRabbitDefaults = useCallback((data: Partial<typeof rabbitDefaults>) => {
    setRabbitDefaults(prev => {
      const updated = { ...prev, ...data };
      updateNodeDefaults('rabbit', updated);
      return updated;
    });
  }, [updateNodeDefaults]);

  // Função para atualizar os valores padrão do Service Bus
  const updateServiceBusDefaults = useCallback((data: Partial<typeof serviceBusDefaults>) => {
    setServiceBusDefaults(prev => {
      const updated = { ...prev, ...data };
      updateNodeDefaults('servicebus', updated);
      return updated;
    });
  }, [updateNodeDefaults]);

  // Função para atualizar os valores padrão da Function
  const updateFunctionDefaults = useCallback((data: Partial<typeof functionDefaults>) => {
    setFunctionDefaults(prev => {
      const updated = { ...prev, ...data };
      updateNodeDefaults('function', updated);
      return updated;
    });
  }, [updateNodeDefaults]);

  // Função para atualizar os valores padrão do Componente Genérico
  const updateGenericDefaults = useCallback((data: Partial<typeof genericDefaults>) => {
    setGenericDefaults(prev => {
      const updated = { ...prev, ...data };
      updateNodeDefaults('generic', updated);
      return updated;
    });
  }, [updateNodeDefaults]);

  return (
    <div className="h-full overflow-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="kafka">Kafka</TabsTrigger>
          <TabsTrigger value="microservice">Microserviço</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="outros">Outros</TabsTrigger>
        </TabsList>
        
        {/* Configurações padrão do Kafka */}
        <TabsContent value="kafka" className="mt-0 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kafka-brokers" className="text-sm">Brokers Padrão</Label>
            <div className="flex items-center gap-2">
              <Slider
                id="kafka-brokers"
                value={[kafkaDefaults.brokers]}
                min={1}
                max={10}
                step={1}
                onValueChange={(value) => updateKafkaDefaults({ brokers: value[0] })}
              />
              <Input
                type="number"
                value={kafkaDefaults.brokers}
                min={1}
                max={10}
                className="w-16 h-8"
                onChange={(e) => updateKafkaDefaults({ brokers: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="kafka-partitions" className="text-sm">Partições Padrão</Label>
            <div className="flex items-center gap-2">
              <Slider
                id="kafka-partitions"
                value={[kafkaDefaults.partitions]}
                min={1}
                max={20}
                step={1}
                onValueChange={(value) => updateKafkaDefaults({ partitions: value[0] })}
              />
              <Input
                type="number"
                value={kafkaDefaults.partitions}
                min={1}
                max={20}
                className="w-16 h-8"
                onChange={(e) => updateKafkaDefaults({ partitions: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="kafka-replication" className="text-sm">Fator de Replicação Padrão</Label>
            <div className="flex items-center gap-2">
              <Slider
                id="kafka-replication"
                value={[kafkaDefaults.replicationFactor]}
                min={1}
                max={5}
                step={1}
                onValueChange={(value) => updateKafkaDefaults({ replicationFactor: value[0] })}
              />
              <Input
                type="number"
                value={kafkaDefaults.replicationFactor}
                min={1}
                max={5}
                className="w-16 h-8"
                onChange={(e) => updateKafkaDefaults({ replicationFactor: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="kafka-latency" className="text-sm">Latência Padrão (ms)</Label>
            <div className="flex items-center gap-2">
              <Slider
                id="kafka-latency"
                value={[kafkaDefaults.latency]}
                min={1}
                max={100}
                step={1}
                onValueChange={(value) => updateKafkaDefaults({ latency: value[0] })}
              />
              <Input
                type="number"
                value={kafkaDefaults.latency}
                min={1}
                max={100}
                className="w-16 h-8"
                onChange={(e) => updateKafkaDefaults({ latency: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="kafka-cost" className="text-sm">Custo Base Padrão ($)</Label>
            <Input
              id="kafka-cost"
              type="number"
              value={kafkaDefaults.cost}
              min={0}
              step={0.01}
              className="h-8"
              onChange={(e) => updateKafkaDefaults({ cost: parseFloat(e.target.value) || 0 })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="kafka-costPerInstance" className="text-sm">Custo por Broker Padrão ($)</Label>
            <Input
              id="kafka-costPerInstance"
              type="number"
              value={kafkaDefaults.costPerInstance}
              min={0}
              step={0.01}
              className="h-8"
              onChange={(e) => updateKafkaDefaults({ costPerInstance: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </TabsContent>
        
        {/* Configurações padrão do Microserviço */}
        <TabsContent value="microservice" className="mt-0 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="microservice-instances" className="text-sm">Instâncias Padrão</Label>
            <div className="flex items-center gap-2">
              <Slider
                id="microservice-instances"
                value={[microserviceDefaults.instances]}
                min={1}
                max={10}
                step={1}
                onValueChange={(value) => updateMicroserviceDefaults({ instances: value[0] })}
              />
              <Input
                type="number"
                value={microserviceDefaults.instances}
                min={1}
                max={10}
                className="w-16 h-8"
                onChange={(e) => updateMicroserviceDefaults({ instances: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="microservice-latency" className="text-sm">Latência Padrão (ms)</Label>
            <div className="flex items-center gap-2">
              <Slider
                id="microservice-latency"
                value={[microserviceDefaults.latency]}
                min={1}
                max={100}
                step={1}
                onValueChange={(value) => updateMicroserviceDefaults({ latency: value[0] })}
              />
              <Input
                type="number"
                value={microserviceDefaults.latency}
                min={1}
                max={100}
                className="w-16 h-8"
                onChange={(e) => updateMicroserviceDefaults({ latency: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="microservice-cost" className="text-sm">Custo Base Padrão ($)</Label>
            <Input
              id="microservice-cost"
              type="number"
              value={microserviceDefaults.cost}
              min={0}
              step={0.01}
              className="h-8"
              onChange={(e) => updateMicroserviceDefaults({ cost: parseFloat(e.target.value) || 0 })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="microservice-costPerInstance" className="text-sm">Custo por Instância Padrão ($)</Label>
            <Input
              id="microservice-costPerInstance"
              type="number"
              value={microserviceDefaults.costPerInstance}
              min={0}
              step={0.01}
              className="h-8"
              onChange={(e) => updateMicroserviceDefaults({ costPerInstance: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </TabsContent>
        
        {/* Configurações padrão do Storage */}
        <TabsContent value="storage" className="mt-0 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storage-latency" className="text-sm">Latência Padrão (ms)</Label>
            <div className="flex items-center gap-2">
              <Slider
                id="storage-latency"
                value={[storageDefaults.latency]}
                min={1}
                max={100}
                step={1}
                onValueChange={(value) => updateStorageDefaults({ latency: value[0] })}
              />
              <Input
                type="number"
                value={storageDefaults.latency}
                min={1}
                max={100}
                className="w-16 h-8"
                onChange={(e) => updateStorageDefaults({ latency: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="storage-throughput" className="text-sm">Throughput Padrão (MB/s)</Label>
            <div className="flex items-center gap-2">
              <Slider
                id="storage-throughput"
                value={[storageDefaults.throughput]}
                min={1}
                max={200}
                step={1}
                onValueChange={(value) => updateStorageDefaults({ throughput: value[0] })}
              />
              <Input
                type="number"
                value={storageDefaults.throughput}
                min={1}
                max={200}
                className="w-16 h-8"
                onChange={(e) => updateStorageDefaults({ throughput: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="storage-capacity" className="text-sm">Capacidade Padrão (GB)</Label>
            <div className="flex items-center gap-2">
              <Slider
                id="storage-capacity"
                value={[storageDefaults.capacity]}
                min={1}
                max={1000}
                step={10}
                onValueChange={(value) => updateStorageDefaults({ capacity: value[0] })}
              />
              <Input
                type="number"
                value={storageDefaults.capacity}
                min={1}
                max={1000}
                className="w-16 h-8"
                onChange={(e) => updateStorageDefaults({ capacity: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="storage-cost" className="text-sm">Custo Base Padrão ($)</Label>
            <Input
              id="storage-cost"
              type="number"
              value={storageDefaults.cost}
              min={0}
              step={0.01}
              className="h-8"
              onChange={(e) => updateStorageDefaults({ cost: parseFloat(e.target.value) || 0 })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="storage-costPerGB" className="text-sm">Custo por GB Padrão ($)</Label>
            <Input
              id="storage-costPerGB"
              type="number"
              value={storageDefaults.costPerGB}
              min={0}
              step={0.01}
              className="h-8"
              onChange={(e) => updateStorageDefaults({ costPerGB: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </TabsContent>
        
        {/* Configurações padrão de outros componentes */}
        <TabsContent value="outros" className="mt-0">
          <Tabs defaultValue="rabbit">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="rabbit">RabbitMQ</TabsTrigger>
              <TabsTrigger value="servicebus">Service Bus</TabsTrigger>
              <TabsTrigger value="function">Function</TabsTrigger>
              <TabsTrigger value="generic">Genérico</TabsTrigger>
            </TabsList>
            
            {/* Configurações padrão do RabbitMQ */}
            <TabsContent value="rabbit" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rabbit-queues" className="text-sm">Filas Padrão</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="rabbit-queues"
                    value={[rabbitDefaults.queues]}
                    min={1}
                    max={20}
                    step={1}
                    onValueChange={(value) => updateRabbitDefaults({ queues: value[0] })}
                  />
                  <Input
                    type="number"
                    value={rabbitDefaults.queues}
                    min={1}
                    max={20}
                    className="w-16 h-8"
                    onChange={(e) => updateRabbitDefaults({ queues: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rabbit-exchanges" className="text-sm">Exchanges Padrão</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="rabbit-exchanges"
                    value={[rabbitDefaults.exchanges]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={(value) => updateRabbitDefaults({ exchanges: value[0] })}
                  />
                  <Input
                    type="number"
                    value={rabbitDefaults.exchanges}
                    min={1}
                    max={10}
                    className="w-16 h-8"
                    onChange={(e) => updateRabbitDefaults({ exchanges: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rabbit-latency" className="text-sm">Latência Padrão (ms)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="rabbit-latency"
                    value={[rabbitDefaults.latency]}
                    min={1}
                    max={100}
                    step={1}
                    onValueChange={(value) => updateRabbitDefaults({ latency: value[0] })}
                  />
                  <Input
                    type="number"
                    value={rabbitDefaults.latency}
                    min={1}
                    max={100}
                    className="w-16 h-8"
                    onChange={(e) => updateRabbitDefaults({ latency: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rabbit-cost" className="text-sm">Custo Base Padrão ($)</Label>
                <Input
                  id="rabbit-cost"
                  type="number"
                  value={rabbitDefaults.cost}
                  min={0}
                  step={0.01}
                  className="h-8"
                  onChange={(e) => updateRabbitDefaults({ cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rabbit-costPerQueue" className="text-sm">Custo por Fila Padrão ($)</Label>
                <Input
                  id="rabbit-costPerQueue"
                  type="number"
                  value={rabbitDefaults.costPerQueue}
                  min={0}
                  step={0.01}
                  className="h-8"
                  onChange={(e) => updateRabbitDefaults({ costPerQueue: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </TabsContent>
            
            {/* Configurações padrão do Service Bus */}
            <TabsContent value="servicebus" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="servicebus-queues" className="text-sm">Filas Padrão</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="servicebus-queues"
                    value={[serviceBusDefaults.queues]}
                    min={1}
                    max={20}
                    step={1}
                    onValueChange={(value) => updateServiceBusDefaults({ queues: value[0] })}
                  />
                  <Input
                    type="number"
                    value={serviceBusDefaults.queues}
                    min={1}
                    max={20}
                    className="w-16 h-8"
                    onChange={(e) => updateServiceBusDefaults({ queues: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="servicebus-topics" className="text-sm">Tópicos Padrão</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="servicebus-topics"
                    value={[serviceBusDefaults.topics]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={(value) => updateServiceBusDefaults({ topics: value[0] })}
                  />
                  <Input
                    type="number"
                    value={serviceBusDefaults.topics}
                    min={1}
                    max={10}
                    className="w-16 h-8"
                    onChange={(e) => updateServiceBusDefaults({ topics: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="servicebus-subscriptions" className="text-sm">Assinaturas Padrão</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="servicebus-subscriptions"
                    value={[serviceBusDefaults.subscriptions]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={(value) => updateServiceBusDefaults({ subscriptions: value[0] })}
                  />
                  <Input
                    type="number"
                    value={serviceBusDefaults.subscriptions}
                    min={1}
                    max={10}
                    className="w-16 h-8"
                    onChange={(e) => updateServiceBusDefaults({ subscriptions: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="servicebus-latency" className="text-sm">Latência Padrão (ms)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="servicebus-latency"
                    value={[serviceBusDefaults.latency]}
                    min={1}
                    max={100}
                    step={1}
                    onValueChange={(value) => updateServiceBusDefaults({ latency: value[0] })}
                  />
                  <Input
                    type="number"
                    value={serviceBusDefaults.latency}
                    min={1}
                    max={100}
                    className="w-16 h-8"
                    onChange={(e) => updateServiceBusDefaults({ latency: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="servicebus-cost" className="text-sm">Custo Base Padrão ($)</Label>
                <Input
                  id="servicebus-cost"
                  type="number"
                  value={serviceBusDefaults.cost}
                  min={0}
                  step={0.01}
                  className="h-8"
                  onChange={(e) => updateServiceBusDefaults({ cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="servicebus-costPerQueue" className="text-sm">Custo por Fila/Tópico Padrão ($)</Label>
                <Input
                  id="servicebus-costPerQueue"
                  type="number"
                  value={serviceBusDefaults.costPerQueue}
                  min={0}
                  step={0.01}
                  className="h-8"
                  onChange={(e) => updateServiceBusDefaults({ costPerQueue: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </TabsContent>
            
            {/* Configurações padrão da Function */}
            <TabsContent value="function" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="function-maxReplicas" className="text-sm">Máximo de Réplicas Padrão</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="function-maxReplicas"
                    value={[functionDefaults.maxReplicas]}
                    min={1}
                    max={30}
                    step={1}
                    onValueChange={(value) => updateFunctionDefaults({ maxReplicas: value[0] })}
                  />
                  <Input
                    type="number"
                    value={functionDefaults.maxReplicas}
                    min={1}
                    max={30}
                    className="w-16 h-8"
                    onChange={(e) => updateFunctionDefaults({ maxReplicas: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="function-minReplicas" className="text-sm">Mínimo de Réplicas Padrão</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="function-minReplicas"
                    value={[functionDefaults.minReplicas]}
                    min={0}
                    max={10}
                    step={1}
                    onValueChange={(value) => updateFunctionDefaults({ minReplicas: value[0] })}
                  />
                  <Input
                    type="number"
                    value={functionDefaults.minReplicas}
                    min={0}
                    max={10}
                    className="w-16 h-8"
                    onChange={(e) => updateFunctionDefaults({ minReplicas: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="function-latency" className="text-sm">Latência Padrão (ms)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="function-latency"
                    value={[functionDefaults.latency]}
                    min={1}
                    max={100}
                    step={1}
                    onValueChange={(value) => updateFunctionDefaults({ latency: value[0] })}
                  />
                  <Input
                    type="number"
                    value={functionDefaults.latency}
                    min={1}
                    max={100}
                    className="w-16 h-8"
                    onChange={(e) => updateFunctionDefaults({ latency: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="function-cost" className="text-sm">Custo Base Padrão ($)</Label>
                <Input
                  id="function-cost"
                  type="number"
                  value={functionDefaults.cost}
                  min={0}
                  step={0.01}
                  className="h-8"
                  onChange={(e) => updateFunctionDefaults({ cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="function-costPerExecution" className="text-sm">Custo por Execução Padrão ($)</Label>
                <Input
                  id="function-costPerExecution"
                  type="number"
                  value={functionDefaults.costPerExecution}
                  min={0}
                  step={0.0001}
                  className="h-8"
                  onChange={(e) => updateFunctionDefaults({ costPerExecution: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </TabsContent>
            
            {/* Configurações padrão do Componente Genérico */}
            <TabsContent value="generic" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="generic-instances" className="text-sm">Instâncias Padrão</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="generic-instances"
                    value={[genericDefaults.instances]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={(value) => updateGenericDefaults({ instances: value[0] })}
                  />
                  <Input
                    type="number"
                    value={genericDefaults.instances}
                    min={1}
                    max={10}
                    className="w-16 h-8"
                    onChange={(e) => updateGenericDefaults({ instances: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="generic-latency" className="text-sm">Latência Padrão (ms)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="generic-latency"
                    value={[genericDefaults.latency]}
                    min={1}
                    max={100}
                    step={1}
                    onValueChange={(value) => updateGenericDefaults({ latency: value[0] })}
                  />
                  <Input
                    type="number"
                    value={genericDefaults.latency}
                    min={1}
                    max={100}
                    className="w-16 h-8"
                    onChange={(e) => updateGenericDefaults({ latency: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="generic-cost" className="text-sm">Custo Base Padrão ($)</Label>
                <Input
                  id="generic-cost"
                  type="number"
                  value={genericDefaults.cost}
                  min={0}
                  step={0.01}
                  className="h-8"
                  onChange={(e) => updateGenericDefaults({ cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="generic-costPerInstance" className="text-sm">Custo por Instância Padrão ($)</Label>
                <Input
                  id="generic-costPerInstance"
                  type="number"
                  value={genericDefaults.costPerInstance}
                  min={0}
                  step={0.01}
                  className="h-8"
                  onChange={(e) => updateGenericDefaults({ costPerInstance: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
