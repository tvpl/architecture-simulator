# Plano de Redesign do Simulador de Arquiteturas

## Análise da Interface de Referência (Kafka Visualisation)

Após analisar o site de referência (https://softwaremill.com/kafka-visualisation/), identifiquei os seguintes elementos-chave:

1. **Layout dividido**:
   - Painel de configuração à esquerda
   - Área de visualização/simulação à direita

2. **Controles de configuração**:
   - Sliders para ajustar parâmetros (partições, brokers, replicação)
   - Campos numéricos para valores precisos
   - Controles de intervalo para produção e consumo

3. **Visualização de fluxo**:
   - Representação visual clara dos componentes
   - Animação de mensagens fluindo entre componentes
   - Indicadores numéricos em cada componente

4. **Controles de simulação**:
   - Botões para pausar/reiniciar
   - Controle de velocidade de animação
   - Opções para mostrar/ocultar descrições

## Nova Estrutura Visual do Simulador

### Layout Geral
- Dividir a interface em painel de configuração (esquerda) e área de visualização (direita)
- Usar design limpo e minimalista com cores distintas para diferentes tipos de componentes
- Implementar sistema de grid para posicionamento automático dos componentes

### Painel de Configuração
- Seção para configurações globais (velocidade de simulação, número de mensagens)
- Seção para adicionar componentes ao diagrama
- Seção para configurações específicas do componente selecionado
- Controles de simulação (iniciar, pausar, reiniciar)

### Área de Visualização
- Representação visual dos componentes com ícones distintos
- Linhas de conexão animadas entre componentes
- Indicadores numéricos para latência, throughput e utilização
- Painéis expansíveis para informações detalhadas

### Componentes Visuais
- **Kafka**: Representação visual semelhante à referência
- **Microserviços**: Ícones distintos para diferentes tipos (consumer, producer, processing)
- **Azure Storage**: Representação visual para diferentes tipos de armazenamento
- **Conexões**: Linhas animadas com indicadores de latência

### Configuração de Latência
- Interface para definir latência em cada conexão entre componentes
- Visualização da latência diretamente nas linhas de conexão
- Impacto visual da latência na velocidade da animação

## Próximos Passos
1. Implementar o novo layout básico
2. Adaptar os componentes existentes para o novo design
3. Adicionar configuração de latência por conexão
4. Atualizar a lógica de simulação
5. Validar e refinar a experiência visual
