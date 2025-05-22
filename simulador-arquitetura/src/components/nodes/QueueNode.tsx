import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function QueueNode({ data, selected }: NodeProps) {
  return (
    <TooltipProvider delayDuration={3000}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`relative bg-white rounded-md shadow-md ${selected ? 'ring-2 ring-pink-500' : ''}`}>
            {/* Handles para conexões */}
            <Handle
              type="target"
              position={Position.Left}
              className="w-3 h-3 bg-pink-500"
            />
            <Handle
              type="source"
              position={Position.Right}
              className="w-3 h-3 bg-pink-500"
            />
            
            {/* Conteúdo do nó */}
            <div className="flex flex-col items-center p-2 border-2 border-pink-400 rounded-md">
              <div className="text-2xl mb-1">📨</div>
              <div className="text-xs font-medium text-center max-w-[80px] truncate">{data.label || 'Fila'}</div>
              <div className="text-[10px] text-gray-500 mt-1">
                {data.cluster || 'Sem cluster'} • {data.latency || 5}ms
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="space-y-1 p-1">
            <p className="font-medium text-sm">{data.label || 'Fila'}</p>
            <p className="text-xs">Cluster: {data.cluster || 'Não definido'}</p>
            <p className="text-xs">Latência: {data.latency || 5}ms</p>
            <p className="text-xs">Custo por mensagem: ${data.costPerMessage || 0.001}</p>
            <p className="text-xs">Custo mensal: ${data.cost || 10}/mês</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
