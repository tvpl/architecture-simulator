import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function MicroserviceNode({ data, selected }: NodeProps) {
  // Determinar a cor da borda com base no tipo
  const getBorderColor = () => {
    switch (data.type) {
      case 'api': return 'border-green-400';
      case 'worker': return 'border-blue-400';
      case 'web': return 'border-purple-400';
      case 'backend': return 'border-orange-400';
      case 'bff': return 'border-pink-400';
      default: return 'border-blue-400';
    }
  };

  // Determinar o ícone com base no tipo
  const getIcon = () => {
    switch (data.type) {
      case 'api': return '🔌';
      case 'worker': return '⚙️';
      case 'web': return '🌐';
      case 'backend': return '🖥️';
      case 'bff': return '🔄';
      default: return '🔧';
    }
  };

  return (
    <TooltipProvider delayDuration={3000}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`relative bg-white rounded-md shadow-md ${selected ? 'ring-2 ring-blue-500' : ''}`}>
            {/* Handles para conexões - aumentados para melhor interação */}
            <Handle
              type="target"
              position={Position.Left}
              className="w-5 h-5 bg-blue-500"
              style={{ left: -10 }}
            />
            <Handle
              type="source"
              position={Position.Right}
              className="w-5 h-5 bg-blue-500"
              style={{ right: -10 }}
            />
            
            {/* Conteúdo do nó */}
            <div className={`flex flex-col items-center p-2 border-2 ${getBorderColor()} rounded-md`}>
              <div className="text-2xl mb-1">{getIcon()}</div>
              <div className="text-xs font-medium text-center max-w-[80px] truncate">{data.label}</div>
              <div className="text-[10px] text-gray-500 mt-1">
                {data.instances} inst • {data.latency}ms
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="space-y-1 p-1">
            <p className="font-medium text-sm">{data.label}</p>
            <p className="text-xs">Tipo: {data.type}</p>
            <p className="text-xs">Instâncias: {data.instances}</p>
            <p className="text-xs">Latência: {data.latency}ms</p>
            <p className="text-xs">Protocolos: {(data.supportedProtocols || []).join(', ')}</p>
            <p className="text-xs">Custo: ${data.cost}/mês</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
