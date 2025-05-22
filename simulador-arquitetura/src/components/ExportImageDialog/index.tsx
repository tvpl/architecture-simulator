import React, { useCallback, useEffect, useState } from 'react';
import { exportReactFlowAsImage } from '@/lib/exportImage';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface ExportImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reactFlowWrapper: React.RefObject<HTMLDivElement>;
  reactFlowInstance: any;
}

export function ExportImageDialog({ 
  isOpen, 
  onClose, 
  reactFlowWrapper, 
  reactFlowInstance 
}: ExportImageDialogProps) {
  const [filename, setFilename] = useState('arquitetura');
  const [includeControls, setIncludeControls] = useState(false);
  const [includeBackground, setIncludeBackground] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resetar estado quando o diálogo é aberto
  useEffect(() => {
    if (isOpen) {
      setFilename('arquitetura');
      setIncludeControls(false);
      setIncludeBackground(true);
      setError(null);
    }
  }, [isOpen]);

  // Função para exportar a imagem
  const handleExport = useCallback(async () => {
    if (!reactFlowWrapper.current || !reactFlowInstance) {
      setError('Não foi possível acessar o canvas de desenho');
      return;
    }

    try {
      setIsExporting(true);
      setError(null);

      // Ocultar temporariamente os controles se necessário
      const controlsElement = reactFlowWrapper.current.querySelector('.react-flow__controls');
      const backgroundElement = reactFlowWrapper.current.querySelector('.react-flow__background');
      
      if (controlsElement && !includeControls) {
        controlsElement.classList.add('hidden');
      }
      
      if (backgroundElement && !includeBackground) {
        backgroundElement.classList.add('hidden');
      }

      // Exportar a imagem
      await exportReactFlowAsImage(
        reactFlowWrapper.current,
        reactFlowInstance,
        filename
      );

      // Restaurar os elementos ocultos
      if (controlsElement && !includeControls) {
        controlsElement.classList.remove('hidden');
      }
      
      if (backgroundElement && !includeBackground) {
        backgroundElement.classList.remove('hidden');
      }

      // Fechar o diálogo após exportação bem-sucedida
      onClose();
    } catch (err) {
      console.error('Erro ao exportar imagem:', err);
      setError('Ocorreu um erro ao exportar a imagem. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  }, [
    reactFlowWrapper,
    reactFlowInstance,
    filename,
    includeControls,
    includeBackground,
    onClose
  ]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Arquitetura como Imagem</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="filename">Nome do arquivo</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Nome do arquivo (sem extensão)"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeControls"
              checked={includeControls}
              onCheckedChange={(checked) => setIncludeControls(checked as boolean)}
            />
            <Label htmlFor="includeControls" className="text-sm">Incluir controles de zoom</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeBackground"
              checked={includeBackground}
              onCheckedChange={(checked) => setIncludeBackground(checked as boolean)}
            />
            <Label htmlFor="includeBackground" className="text-sm">Incluir grade de fundo</Label>
          </div>
          
          {error && (
            <div className="text-sm text-red-500 mt-2">
              {error}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exportando...' : 'Exportar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
