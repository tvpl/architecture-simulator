import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Database } from 'lucide-react';

interface StorageNodeData {
  label: string;
  type?: string;
  latency?: number;
  throughput?: number;
  capacity?: number;
  replication?: boolean;
  cost?: number;
  costPerGB?: number;
  dbType?: string;
  dbName?: string;
  tableName?: string;
  isFeatureFlag?: boolean;
  configKey?: string;
}

export const StorageNode: React.FC<NodeProps<StorageNodeData>> = ({ data, selected }) => {
  const getStorageIcon = () => {
    switch (data.type) {
      case 'sql': return '🗄️';
      case 'nosql': return '📊';
      case 'cache': return '⚡';
      case 'blob': return '📦';
      default: return '💾';
    }
  };

  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg bg-card border-2 border-border min-w-[150px] ${
      selected ? 'border-primary shadow-primary/20' : 'border-border'
    }`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2">
        <Database className="w-5 h-5 text-green-500" />
        <div>
          <div className="font-medium text-sm text-foreground">{data.label}</div>
          <div className="text-xs text-muted-foreground">
            {getStorageIcon()} {data.type || 'storage'} • {data.latency || 20}ms
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

