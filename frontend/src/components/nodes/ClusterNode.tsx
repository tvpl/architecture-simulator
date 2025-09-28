import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Layers } from 'lucide-react';

interface ClusterNodeData {
  label: string;
  nodes?: number;
  type?: string;
  region?: string;
  availability?: string;
  costPerNode?: number;
}

export const ClusterNode: React.FC<NodeProps<ClusterNodeData>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg bg-card border-2 border-border min-w-[150px] ${
      selected ? 'border-primary shadow-primary/20' : 'border-border'
    }`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2">
        <Layers className="w-5 h-5 text-cyan-500" />
        <div>
          <div className="font-medium text-sm text-foreground">{data.label}</div>
          <div className="text-xs text-muted-foreground">
            {data.nodes || 3} nós • {data.type || 'Kafka'}
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

export const RabbitNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg bg-card border-2 border-border min-w-[150px] ${
      selected ? 'border-primary shadow-primary/20' : 'border-border'
    }`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 text-pink-500">🐰</div>
        <div>
          <div className="font-medium text-sm text-foreground">{data.label}</div>
          <div className="text-xs text-muted-foreground">
            RabbitMQ • {data.latency || 8}ms
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

export const ServiceBusNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg bg-card border-2 border-border min-w-[150px] ${
      selected ? 'border-primary shadow-primary/20' : 'border-border'
    }`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 text-blue-600">🚌</div>
        <div>
          <div className="font-medium text-sm text-foreground">{data.label}</div>
          <div className="text-xs text-muted-foreground">
            Service Bus • {data.latency || 12}ms
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

export const FunctionNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg bg-card border-2 border-border min-w-[150px] ${
      selected ? 'border-primary shadow-primary/20' : 'border-border'
    }`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 text-yellow-500">⚡</div>
        <div>
          <div className="font-medium text-sm text-foreground">{data.label}</div>
          <div className="text-xs text-muted-foreground">
            Function • {data.latency || 5}ms
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

export const GenericNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg bg-card border-2 border-border min-w-[150px] ${
      selected ? 'border-primary shadow-primary/20' : 'border-border'
    }`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 text-gray-500">📦</div>
        <div>
          <div className="font-medium text-sm text-foreground">{data.label}</div>
          <div className="text-xs text-muted-foreground">
            Genérico • {data.latency || 10}ms
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

export const StartFlowNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg bg-card border-2 border-border min-w-[150px] ${
      selected ? 'border-primary shadow-primary/20' : 'border-border'
    }`}>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 text-green-500">🚀</div>
        <div>
          <div className="font-medium text-sm text-foreground">{data.label}</div>
          <div className="text-xs text-muted-foreground">
            Início do Fluxo
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

export const StartNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg bg-card border-2 border-border min-w-[150px] ${
      selected ? 'border-primary shadow-primary/20' : 'border-border'
    }`}>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 text-green-600">▶️</div>
        <div>
          <div className="font-medium text-sm text-foreground">{data.label}</div>
          <div className="text-xs text-muted-foreground">
            Início
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

