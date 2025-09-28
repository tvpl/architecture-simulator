import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Activity } from 'lucide-react';

interface KafkaNodeData {
  label: string;
  brokers?: number;
  partitions?: number;
  replicationFactor?: number;
  latency?: number;
  cost?: number;
  costPerInstance?: number;
}

export const KafkaNode: React.FC<NodeProps<KafkaNodeData>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg bg-card border-2 border-border min-w-[150px] ${
      selected ? 'border-primary shadow-primary/20' : 'border-border'
    }`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-orange-500" />
        <div>
          <div className="font-medium text-sm text-foreground">{data.label}</div>
          <div className="text-xs text-muted-foreground">
            {data.brokers || 3} brokers • {data.partitions || 5} partições
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

