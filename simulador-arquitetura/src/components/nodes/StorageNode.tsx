import { Handle, Position, NodeProps } from 'reactflow';
import { Database } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function StorageNode({ data, selected }: NodeProps) {
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
                <Database className="h-6 w-6 text-blue-500" />
              </div>
              <div className="text-xs font-medium text-center max-w-[80px] truncate">{data.label || 'Storage'}</div>
              <div className="text-[10px] text-gray-500 mt-1">
                {data.type === 'blob' ? 'Blob' : 
                 data.type === 'redis' ? 'Redis' : 
                 data.type === 'sql' ? 'SQL' : 'AppConfig'}
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="space-y-1 p-1">
            <p className="font-medium text-sm">{data.label || 'Storage'}</p>
            <p className="text-xs">Tipo: {data.type === 'blob' ? 'Blob' : 
                                          data.type === 'redis' ? 'Redis' : 
                                          data.type === 'sql' ? 'SQL' : 'AppConfig'}</p>
            <p className="text-xs">Capacidade: {data.capacity || 100}GB</p>
            <p className="text-xs">Throughput: {data.throughput || 50}MB/s</p>
            <p className="text-xs">Latência: {data.latency || 10}ms</p>
            <p className="text-xs">Replicação: {data.replication ? 'Sim' : 'Não'}</p>
            <p className="text-xs">Custo: R${data.cost || 0}/mês</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
