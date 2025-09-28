import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Play } from 'lucide-react';

export const StartNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg bg-card border-2 border-border min-w-[150px] ${
      selected ? 'border-primary shadow-primary/20' : 'border-border'
    }`}>
      <div className="flex items-center gap-2">
        <Play className="w-5 h-5 text-green-600" />
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

