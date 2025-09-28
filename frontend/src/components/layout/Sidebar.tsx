import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Database, 
  MessageSquare, 
  Server, 
  Play,
  Zap,
  Box,
  GitBranch,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface ComponentItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  category: string;
  type: string;
  storageType?: string;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onDragStart: (event: React.DragEvent, component: ComponentItem) => void;
}

const componentCategories = {
  start: {
    name: 'Início',
    icon: <Play className="w-4 h-4" />,
    components: [
      {
        id: 'start',
        name: 'Início',
        icon: <Play className="w-4 h-4" />,
        description: 'Ponto de início do fluxo',
        category: 'start',
        type: 'start'
      },
      {
        id: 'startflow',
        name: 'Início do Fluxo',
        icon: <GitBranch className="w-4 h-4" />,
        description: 'Ponto de início específico do fluxo',
        category: 'start',
        type: 'startflow'
      }
    ]
  },
  messaging: {
    name: 'Mensageria',
    icon: <MessageSquare className="w-4 h-4" />,
    components: [
      {
        id: 'kafka',
        name: 'Kafka Cluster',
        icon: <Activity className="w-4 h-4" />,
        description: 'Apache Kafka para streaming de dados',
        category: 'messaging',
        type: 'kafka'
      },
      {
        id: 'rabbit',
        name: 'RabbitMQ',
        icon: <Box className="w-4 h-4" />,
        description: 'Message broker RabbitMQ',
        category: 'messaging',
        type: 'rabbit'
      },
      {
        id: 'servicebus',
        name: 'Service Bus',
        icon: <MessageSquare className="w-4 h-4" />,
        description: 'Azure Service Bus',
        category: 'messaging',
        type: 'servicebus'
      },
      {
        id: 'queue',
        name: 'Fila',
        icon: <Layers className="w-4 h-4" />,
        description: 'Fila de mensagens genérica',
        category: 'messaging',
        type: 'queue'
      },
      {
        id: 'topic',
        name: 'Tópico',
        icon: <GitBranch className="w-4 h-4" />,
        description: 'Tópico de mensagens',
        category: 'messaging',
        type: 'topic'
      }
    ]
  },
  services: {
    name: 'Serviços',
    icon: <Server className="w-4 h-4" />,
    components: [
      {
        id: 'microservice',
        name: 'Microserviço',
        icon: <Server className="w-4 h-4" />,
        description: 'Serviço de aplicação',
        category: 'services',
        type: 'microservice'
      },
      {
        id: 'function',
        name: 'Function',
        icon: <Zap className="w-4 h-4" />,
        description: 'Função serverless',
        category: 'services',
        type: 'function'
      },
      {
        id: 'generic',
        name: 'Serviço Genérico',
        icon: <Box className="w-4 h-4" />,
        description: 'Componente genérico',
        category: 'services',
        type: 'generic'
      },
      {
        id: 'cluster',
        name: 'Cluster',
        icon: <Layers className="w-4 h-4" />,
        description: 'Cluster de serviços',
        category: 'services',
        type: 'cluster'
      }
    ]
  },
  storage: {
    name: 'Armazenamento',
    icon: <Database className="w-4 h-4" />,
    components: [
      {
        id: 'storage-blob',
        name: 'Blob Storage',
        icon: <Database className="w-4 h-4" />,
        description: 'Armazenamento de objetos',
        category: 'storage',
        type: 'storage',
        storageType: 'blob'
      },
      {
        id: 'storage-sql',
        name: 'SQL Database',
        icon: <Database className="w-4 h-4" />,
        description: 'Banco de dados SQL',
        category: 'storage',
        type: 'storage',
        storageType: 'sql'
      },
      {
        id: 'storage-nosql',
        name: 'NoSQL Database',
        icon: <Database className="w-4 h-4" />,
        description: 'Banco de dados NoSQL',
        category: 'storage',
        type: 'storage',
        storageType: 'nosql'
      },
      {
        id: 'storage-cache',
        name: 'Cache',
        icon: <Database className="w-4 h-4" />,
        description: 'Sistema de cache',
        category: 'storage',
        type: 'storage',
        storageType: 'cache'
      }
    ]
  }
};

const ComponentCard: React.FC<{
  component: ComponentItem;
  isCollapsed: boolean;
  onDragStart: (event: React.DragEvent, component: ComponentItem) => void;
}> = ({ component, isCollapsed, onDragStart }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className={cn(
              "cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md border-2 border-dashed border-transparent hover:border-primary/50",
              isCollapsed ? "p-2" : "p-3"
            )}
            draggable
            onDragStart={(e) => onDragStart(e, component)}
          >
            <CardContent className={cn("p-0", isCollapsed ? "flex justify-center" : "")}>
              <div className={cn("flex items-center", isCollapsed ? "" : "space-x-3")}>
                <div className="text-primary">
                  {component.icon}
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {component.name}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {component.description}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right">
            <div>
              <p className="font-medium">{component.name}</p>
              <p className="text-xs text-muted-foreground">{component.description}</p>
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

const CategorySection: React.FC<{
  category: any;
  isCollapsed: boolean;
  onDragStart: (event: React.DragEvent, component: ComponentItem) => void;
}> = ({ category, isCollapsed, onDragStart }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (isCollapsed) {
    return (
      <div className="space-y-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex justify-center p-2 text-primary">
                {category.icon}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{category.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {category.components.map((component: ComponentItem) => (
          <ComponentCard
            key={component.id}
            component={component}
            isCollapsed={isCollapsed}
            onDragStart={onDragStart}
          />
        ))}
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-2 h-auto font-medium"
        >
          <div className="flex items-center space-x-2">
            {category.icon}
            <span>{category.name}</span>
          </div>
          <ChevronRight className={cn("w-4 h-4 transition-transform", isOpen && "rotate-90")} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 mt-2">
        {category.components.map((component: ComponentItem) => (
          <ComponentCard
            key={component.id}
            component={component}
            isCollapsed={isCollapsed}
            onDragStart={onDragStart}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, onDragStart }) => {
  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 80 : 320 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-background border-r border-border flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-foreground">Componentes</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
        {!isCollapsed && (
          <p className="text-sm text-muted-foreground mt-1">
            Arraste para adicionar ao diagrama
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {Object.values(componentCategories).map((category, index) => (
            <div key={category.name}>
              <CategorySection
                category={category}
                isCollapsed={isCollapsed}
                onDragStart={onDragStart}
              />
              {index < Object.values(componentCategories).length - 1 && !isCollapsed && (
                <Separator className="my-4" />
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

