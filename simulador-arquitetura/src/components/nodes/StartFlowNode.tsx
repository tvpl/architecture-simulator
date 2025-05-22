import { Handle, Position, NodeProps } from 'reactflow';
import { Play } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function StartFlowNode({ data, selected }: NodeProps) {
  return (
    <TooltipProvider delayDuration={3000}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`relative bg-green-50 rounded-md shadow-md ${selected ? 'ring-2 ring-blue-500' : ''}`}>
            {/* Apenas handle de saída, já que é o início do fluxo */}
            <Handle
              type="source"
              position={Position.Right}
              className="w-5 h-5 bg-green-500"
              style={{ right: -10 }}
            />
            
            {/* Conteúdo do nó */}
            <div className={`flex flex-col items-center p-2 border-2 border-green-500 rounded-md`}>
              <div className="text-2xl mb-1">
                <Play className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-xs font-medium text-center max-w-[80px] truncate text-green-700">Início do Fluxo</div>
              <div className="text-[10px] text-green-600 mt-1">
                {data.label || 'Ponto de Partida'}
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="space-y-1 p-1">
            <p className="font-medium text-sm">Início do Fluxo</p>
            <p className="text-xs">Descrição: {data.description || 'Ponto inicial da simulação'}</p>
            <p className="text-xs">Requests: {data.requests || 100} por simulação</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
