import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Server } from 'lucide-react';

interface MicroserviceNodeData {
  label: string;
  instances?: number;
  latency?: number;
  type?: string;
  cpuUsage?: number;
  memoryUsage?: number;
  cost?: number;
  costPerInstance?: number;
  supportedProtocols?: string[];
}

export const MicroserviceNode: React.FC<NodeProps<MicroserviceNodeData>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg bg-card border-2 border-border min-w-[150px] ${
      selected ? 'border-primary shadow-primary/20' : 'border-border'
    }`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2">
        <Server className="w-5 h-5 text-blue-500" />
        <div>
          <div className="font-medium text-sm text-foreground">{data.label}</div>
          <div className="text-xs text-muted-foreground">
            {data.instances || 2} instâncias • {data.latency || 15}ms
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

