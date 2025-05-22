import React, { useState, useRef, useEffect } from 'react';
import { X, Minimize, Maximize, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface FloatingPanelProps {
  title: string;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
  onClose?: () => void;
  className?: string;
  zIndex?: number;
  id: string;
}

export function FloatingPanel({
  title,
  children,
  defaultPosition = { x: 20, y: 20 },
  defaultWidth = 320,
  defaultHeight = 400,
  minWidth = 200,
  minHeight = 150,
  onClose,
  className = '',
  zIndex = 10,
  id
}: FloatingPanelProps) {
  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [width, setWidth] = useState(defaultWidth);
  const [height, setHeight] = useState(defaultHeight);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartDim, setResizeStartDim] = useState({ width: 0, height: 0 });
  
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Efeito para lidar com eventos de mouse durante o arrasto
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // Limitar a posição para não sair da tela
        const newX = Math.max(0, Math.min(window.innerWidth - width, e.clientX - dragOffset.x));
        const newY = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - dragOffset.y));
        
        setPosition({
          x: newX,
          y: newY
        });
      } else if (isResizing) {
        // Limitar o tamanho para não ficar muito pequeno ou muito grande
        const newWidth = Math.max(minWidth, Math.min(window.innerWidth - position.x, resizeStartDim.width + (e.clientX - resizeStartPos.x)));
        const newHeight = Math.max(minHeight, Math.min(window.innerHeight - position.y, resizeStartDim.height + (e.clientY - resizeStartPos.y)));
        
        setWidth(newWidth);
        setHeight(newHeight);
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };
    
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, resizeStartPos, resizeStartDim, minWidth, minHeight, width, height, position.x, position.y]);
  
  // Iniciar o arrasto do painel
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };
  
  // Iniciar o redimensionamento do painel
  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (panelRef.current) {
      setResizeStartPos({
        x: e.clientX,
        y: e.clientY
      });
      setResizeStartDim({
        width,
        height
      });
      setIsResizing(true);
    }
  };
  
  // Alternar entre minimizado e normal
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };
  
  return (
    <Card
      ref={panelRef}
      className={`absolute shadow-lg rounded-md ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${width}px`,
        height: isMinimized ? 'auto' : `${height}px`,
        zIndex,
        transition: 'height 0.2s ease-in-out',
      }}
      id={id}
    >
      <CardHeader 
        className="p-2 cursor-move bg-gray-100 flex flex-row items-center"
        onMouseDown={handleDragStart}
      >
        <Move className="h-4 w-4 mr-2 text-gray-500" />
        <CardTitle className="text-sm flex-1 truncate">{title}</CardTitle>
        <div className="flex space-x-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={toggleMinimize}
          >
            {isMinimized ? <Maximize className="h-3 w-3" /> : <Minimize className="h-3 w-3" />}
          </Button>
          {onClose && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={onClose}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      {!isMinimized && (
        <CardContent className="p-3 overflow-auto" style={{ height: 'calc(100% - 40px)' }}>
          {children}
        </CardContent>
      )}
      
      {!isMinimized && (
        <div 
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize"
          onMouseDown={handleResizeStart}
          style={{ 
            background: 'transparent',
            zIndex: 1
          }}
        >
          <div className="w-0 h-0 border-t-8 border-r-8 border-gray-300 absolute bottom-0 right-0" />
        </div>
      )}
    </Card>
  );
}
