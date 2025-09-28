import React from 'react';
import { Node, Edge } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { X, Settings } from 'lucide-react';
import { ConfigPanel } from '../ConfigPanel';

interface PropertiesPanelProps {
  selectedElement: Node | Edge | null;
  onClose: () => void;
  updateNodeData: (nodeId: string, data: any) => void;
  updateEdgeData: (edgeId: string, data: any) => void;
  nodes: Node[];
  edges: Edge[];
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onClose,
  updateNodeData,
  updateEdgeData,
  nodes,
  edges
}) => {
  if (!selectedElement) {
    return (
      <Card className="w-80 h-96 border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Propriedades
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Selecione um elemento para ver suas propriedades</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isNode = 'data' in selectedElement && selectedElement.data;
  const elementType = isNode ? selectedElement.type : 'edge';
  const elementName = isNode ? selectedElement.data.label : `Conexão ${selectedElement.id}`;

  return (
    <Card className="w-80 max-h-[600px] border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Propriedades
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {elementType} • {elementName}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="p-0 overflow-y-auto max-h-[500px]">
        <ConfigPanel
          selectedElement={selectedElement}
          updateNodeData={updateNodeData}
          updateEdgeData={updateEdgeData}
          nodes={nodes}
          edges={edges}
        />
      </CardContent>
    </Card>
  );
};

