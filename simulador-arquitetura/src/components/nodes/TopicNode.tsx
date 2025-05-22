import { Handle, Position, NodeProps } from 'reactflow';
import { MessageSquare } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function TopicNode({ data, selected }: NodeProps) {
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
            <div className={`flex flex-col items-center p-2 border-2 border-green-400 rounded-md`}>
              <div className="text-2xl mb-1">
                <MessageSquare className="h-6 w-6 text-green-500" />
              </div>
              <div className="text-xs font-medium text-center max-w-[80px] truncate">{data.label || 'Topic'}</div>
              <div className="text-[10px] text-gray-500 mt-1">
                {data.partitions || 3} part • {data.latency || 8}ms
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="space-y-1 p-1">
            <p className="font-medium text-sm">{data.label || 'Topic'}</p>
            <p className="text-xs">Partições: {data.partitions || 3}</p>
            <p className="text-xs">Latência: {data.latency || 8}ms</p>
            <p className="text-xs">Cluster: {data.cluster || 'Não definido'}</p>
            <p className="text-xs">Custo: R${data.cost || 0}/mês</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
