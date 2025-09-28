export interface ExportImageOptions {
  backgroundColor?: string;
  padding?: number;
  scale?: number;
}

/**
 * Exporta um elemento HTML como uma imagem
 * @param element Elemento HTML a ser exportado
 * @param filename Nome do arquivo (sem extensão)
 * @param options Opções de exportação
 * @returns Promise com o URL da imagem
 */
export async function exportElementAsImage(
  element: HTMLElement, 
  filename = 'arquitetura', 
  options: ExportImageOptions = {}
) {
  // Importar html2canvas dinamicamente
  const html2canvas = (await import('html2canvas')).default;
  
  // Opções padrão
  const defaultOptions = {
    backgroundColor: '#ffffff',
    padding: 20,
    scale: window.devicePixelRatio
  };
  
  // Mesclar opções
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Criar canvas
  const canvas = await html2canvas(element, {
    backgroundColor: mergedOptions.backgroundColor,
    scale: mergedOptions.scale
  });
  
  // Criar canvas com padding
  const paddedCanvas = document.createElement('canvas');
  const paddedContext = paddedCanvas.getContext('2d');
  
  if (!paddedContext) {
    throw new Error('Não foi possível criar o contexto do canvas');
  }
  
  paddedCanvas.width = canvas.width + mergedOptions.padding * 2;
  paddedCanvas.height = canvas.height + mergedOptions.padding * 2;
  
  // Preencher com cor de fundo
  paddedContext.fillStyle = mergedOptions.backgroundColor;
  paddedContext.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);
  
  // Desenhar o canvas original com padding
  paddedContext.drawImage(canvas, mergedOptions.padding, mergedOptions.padding);
  
  // Converter para URL de dados
  const dataUrl = paddedCanvas.toDataURL('image/png');
  
  // Criar link para download
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = dataUrl;
  link.click();
  
  return dataUrl;
}

/**
 * Exporta um diagrama ReactFlow como uma imagem
 * @param reactFlowWrapper Referência ao wrapper do ReactFlow
 * @param reactFlowInstance Instância do ReactFlow
 * @param filename Nome do arquivo (sem extensão)
 * @returns Promise com o URL da imagem
 */
export async function exportReactFlowAsImage(
  reactFlowWrapper: HTMLElement, 
  reactFlowInstance: any, 
  filename = 'arquitetura'
) {
  if (!reactFlowWrapper || !reactFlowInstance) {
    throw new Error('ReactFlow wrapper ou instância não definidos');
  }
  
  // Ajustar a visualização para mostrar todo o diagrama
  reactFlowInstance.fitView({ padding: 0.2 });
  
  // Pequeno atraso para garantir que a visualização foi ajustada
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Exportar o elemento
  return exportElementAsImage(reactFlowWrapper, filename);
}
