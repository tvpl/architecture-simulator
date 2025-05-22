import { Handle, Position, NodeProps } from 'reactflow';
import { Server } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ClusterNode({ data, selected }: NodeProps) {
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
            <div className={`flex flex-col items-center p-2 border-2 border-blue-400 rounded-md`}>
              <div className="text-2xl mb-1">
                <Server className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-xs font-medium text-center max-w-[80px] truncate">{data.label || 'Cluster'}</div>
              <div className="text-[10px] text-gray-500 mt-1">
                {data.nodes || 3} nós • {data.type || 'Kafka'}
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="space-y-1 p-1">
            <p className="font-medium text-sm">{data.label || 'Cluster'}</p>
            <p className="text-xs">Nós: {data.nodes || 3}</p>
            <p className="text-xs">Tipo: {data.type || 'Kafka'}</p>
            <p className="text-xs">Região: {data.region || 'East US'}</p>
            <p className="text-xs">Latência: {data.latency || 10}ms</p>
            <p className="text-xs">Custo: R${data.cost || 0}/mês</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
