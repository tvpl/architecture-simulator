// Função para atualizar os valores padrão dos nós e propagar para componentes existentes
const updateNodeDefaults = useCallback((type: string, data: any) => {
  // Atualizar os valores padrão no estado
  setNodeDefaults(prev => ({
    ...prev,
    [type]: {
      ...(prev[type] || {}),
      ...data
    }
  }));
  
  // Propagar as alterações para todos os nós existentes do mesmo tipo
  setNodes(nds => 
    nds.map(node => {
      if (node.type === type) {
        // Mesclar os novos valores padrão com os dados existentes do nó
        return {
          ...node,
          data: {
            ...node.data,
            ...data
          }
        };
      }
      return node;
    })
  );
}, [setNodeDefaults, setNodes]);
