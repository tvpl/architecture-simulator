import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch } from 'lucide-react';

interface TopicNodeData {
  label: string;
  partitions?: number;
  latency?: number;
  costPerPartition?: number;
  cluster?: string;
}

export const TopicNode: React.FC<NodeProps<TopicNodeData>> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg bg-card border-2 border-border min-w-[150px] ${
      selected ? 'border-primary shadow-primary/20' : 'border-border'
    }`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2">
        <GitBranch className="w-5 h-5 text-indigo-500" />
        <div>
          <div className="font-medium text-sm text-foreground">{data.label}</div>
          <div className="text-xs text-muted-foreground">
            {data.partitions || 3} partições • {data.latency || 8}ms
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

