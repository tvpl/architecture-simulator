## Regras de Negócio e Cálculos Identificados no Frontend (React)

As principais regras de negócio e cálculos que precisam ser movidos para o backend .NET Core estão concentradas no arquivo `src/lib/simulation.ts`.

### Funções e Lógicas a Serem Migradas:

1.  **`simulateMessageFlow(nodes: Node[], edges: Edge[]): SimulationResults`**:
    *   Esta é a função central que orquestra toda a simulação do fluxo de mensagens.
    *   **Lógica de Grafo**: Construção do grafo de adjacência a partir dos nós e arestas.
    *   **Identificação de Nós de Entrada**: Lógica para encontrar os nós de início (`start`, `startflow`) ou nós sem arestas de entrada.
    *   **Processamento Recursivo do Fluxo (`processNodeRecursively`)**: A função recursiva que percorre o grafo, calcula latências acumuladas, mensagens por ramo, e identifica latências por nó.
    *   **Cálculo de Latência Total**: Determinação da maior latência entre todos os ramos de processamento.
    *   **Cálculo de Mensagens Totais**: Soma das mensagens em todos os ramos.
    *   **Identificação de Gargalos (`bottlenecks`)**: Lógica para identificar nós com latência significativamente acima da média.
    *   **Cálculo de Utilização de Recursos (`resourceUtilization`)**: Lógica para calcular a utilização de recursos para diferentes tipos de nós (Kafka, Microservice, Storage, RabbitMQ, Service Bus, Function, Generic, Start/StartFlow) com base em instâncias, brokers, partições, throughput, etc.
    *   **Cálculo de Custo Total e Detalhamento (`totalCost`, `costBreakdown`)**: Lógica para calcular o custo total da arquitetura e o detalhamento por componente (Kafka, Microserviços, Armazenamento), considerando custos base, por instância, por GB, por broker, etc.
    *   **Geração de Recomendações (`recommendations`)**: Lógica para gerar recomendações com base nos gargalos, configurações de componentes (e.g., número de brokers Kafka, instâncias de microserviços, replicação de storage) e componentes de alto custo.

### Dados de Entrada Necessários para o Backend:

O backend precisará receber a estrutura completa dos nós (`Node[]`) e arestas (`Edge[]`) do diagrama, que contêm todas as propriedades configuradas pelo usuário (latência, instâncias, custos, etc.).

### Saída Esperada do Backend:

O backend deve retornar um objeto `SimulationResults` contendo:
*   `totalLatency`
*   `totalMessages`
*   `totalProcessingTime`
*   `bottlenecks`
*   `pathAnalysis`
*   `resourceUtilization`
*   `totalCost`
*   `costBreakdown`
*   `recommendations`

### Outras Considerações:

*   **`FlowCanvas/index.tsx`**: Este arquivo contém a lógica de UI para adicionar/remover nós e arestas, manipular o canvas, e chamar a função `simulateMessageFlow`. A maior parte de sua lógica permanecerá no frontend, mas a chamada para `simulateMessageFlow` será substituída por uma chamada à API do novo backend.
*   **`App.tsx`**: Este arquivo é o ponto de entrada da aplicação React e não contém regras de negócio significativas.
*   **`lib/utils.ts`**: Contém funções utilitárias genéricas (e.g., `cn` para classes CSS) que não são regras de negócio e devem permanecer no frontend.

