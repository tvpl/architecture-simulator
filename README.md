# Simulador de Arquiteturas baseadas em Mensageria e Microserviços

Este projeto é um simulador visual e funcional que permite modelar e simular arquiteturas baseadas em mensageria (Kafka, RabbitMQ, Service Bus), HTTP, gRPC e microserviços, com foco em visualização de fluxo de mensagens, análise de performance e cálculo de custos.

## Características Principais (Versão 5.3)

- **Interface visual interativa** inspirada no Miro, com canvas em tela cheia
- **Painéis flutuantes** para todos os controles e configurações
- **Componentes arrastáveis** para criar arquiteturas personalizadas
- **Configuração detalhada** de cada componente (latência, instâncias, partições, etc.)
- **Múltiplos protocolos de comunicação**: Kafka, HTTP, gRPC e RabbitMQ
- **Definição de latência por conexão** para simulações mais precisas (até 10000ms)
- **Simulação visual** do fluxo de mensagens entre componentes
- **Componente de início de fluxo** para definir claramente o ponto de partida
- **Direção nas setas de conexão** para visualizar o caminho do fluxo
- **Relatório detalhado** com métricas de performance, gargalos e recomendações
- **Tempo estimado de processamento total** baseado na volumetria e recursos configurados
- **Cálculo de custo** por componente e arquitetura completa (em R$)
- **Exportação e importação** de diagramas em formato JSON
- **Interface clean e responsiva** com controles contextuais

## Componentes Suportados

- **Início do Fluxo** (ponto de partida para simulação)
- **Kafka Cluster** (configurável com brokers, partições e fator de replicação)
- **RabbitMQ** (configurável com filas e exchanges)
- **Service Bus** (configurável com filas, tópicos e assinaturas)
- **Microserviços** (producer, consumer, service)
- **Function Keda** (serverless com auto-scaling)
- **Componente Genérico** (personalizável para qualquer serviço)
- **Azure Storage**:
  - Blob Storage
  - Redis Cache
  - SQL Server
  - App Configuration

## Executando com Docker (Recomendado)

A maneira mais fácil de executar o simulador é usando Docker e Docker Compose, sem necessidade de instalar nada localmente além do Docker.

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (geralmente já vem com o Docker Desktop)

### Passos para Execução

1. **Clone ou descompacte o projeto** em uma pasta local

2. **Navegue até a pasta do projeto**:
   ```bash
   cd simulador-arquitetura
   ```

3. **Inicie o container com Docker Compose**:
   ```bash
   docker-compose up
   ```
   
   Na primeira execução, o Docker irá construir a imagem, o que pode levar alguns minutos.

4. **Acesse o simulador** no navegador através do endereço:
   ```
   http://localhost:5173
   ```

5. **Para parar o container**, pressione `Ctrl+C` no terminal ou execute:
   ```bash
   docker-compose down
   ```

### Desenvolvimento com Docker

- O código-fonte na pasta `src` está montado como volume, então as alterações feitas localmente serão refletidas automaticamente no container.
- Os logs do servidor de desenvolvimento são exibidos no terminal durante a execução.

## Executando Localmente (Alternativa)

Se preferir executar o projeto diretamente na sua máquina:

1. **Instale as dependências**:
   ```bash
   pnpm install
   ```

2. **Inicie o servidor de desenvolvimento**:
   ```bash
   pnpm run dev
   ```

3. **Acesse o simulador** no navegador através do endereço indicado no terminal (geralmente http://localhost:5173)

## Publicação em VPS (Hostinger)

Para publicar o simulador em um ambiente de produção usando um VPS da Hostinger, consulte o guia detalhado em [publicacao-vps-hostinger.md](publicacao-vps-hostinger.md).

Este guia cobre:
- Contratação e configuração inicial do VPS
- Instalação de dependências (Docker, Nginx)
- Configuração de domínio e HTTPS
- Publicação e manutenção do simulador
- Backups e solução de problemas

## Como Usar o Simulador

1. **Criar uma arquitetura**:
   - Abra o painel de Componentes clicando no botão "Componentes" no canto superior esquerdo
   - Arraste componentes do painel para a área de trabalho
   - Comece adicionando um componente "Início do Fluxo" para definir o ponto de partida
   - Conecte os componentes clicando e arrastando entre os pontos de conexão
   - Configure as propriedades de cada componente no painel de Propriedades

2. **Configurar protocolos e latências**:
   - Selecione um componente para definir sua latência interna e custo
   - Selecione uma conexão para definir o protocolo (Kafka, HTTP, gRPC, RabbitMQ) e latência
   - Para conexões Kafka, defina o nome do tópico
   - Para conexões RabbitMQ, defina o nome do cluster, exchange e queue
   - As latências são exibidas visualmente nas conexões com cores indicativas
   - As setas nas conexões indicam a direção do fluxo de dados

3. **Configurar valores padrão**:
   - Abra o painel de Configurações Default clicando no botão correspondente
   - Defina valores padrão para cada tipo de componente
   - Centralize o controle de custos neste painel

4. **Simular o fluxo**:
   - Defina a quantidade de requests a serem simulados
   - Configure o nível de paralelismo desejado
   - Ajuste a velocidade de animação conforme necessário
   - Clique em "Iniciar" para executar a simulação
   - Observe a animação do fluxo de mensagens
   - Analise o relatório detalhado com métricas de performance e custo

5. **Visualizar resultados**:
   - Veja a latência total e throughput da arquitetura
   - Confira o tempo estimado de processamento total baseado na volumetria configurada
   - Identifique gargalos e pontos de melhoria
   - Analise o custo total e detalhado por componente (em R$)
   - Revise as recomendações geradas automaticamente

6. **Exportar/Importar**:
   - Use os botões no painel de controle para salvar ou carregar arquiteturas

## Novos Recursos (Versão 5.3)

- **Componente de início de fluxo**: Define claramente o ponto de partida da simulação
- **Direção nas setas de conexão**: Visualize o caminho do fluxo de dados
- **Controle de paralelismo**: Configure repetições da esteira de serviços em paralelo
- **Requests em vez de mensagens**: Controle de simulação baseado em requests
- **Tempo estimado de processamento**: Visualize o tempo total estimado para processar toda a volumetria configurada
- **Moeda local**: Todos os valores monetários são exibidos em R$ (Reais)
- **Limite de latência ampliado**: Suporte para latências de até 10000ms
- **Edição de propriedades aprimorada**: Sistema com botão "Aplicar" para confirmar alterações
- **Protocolo RabbitMQ**: Suporte completo para conexões RabbitMQ com campos para cluster, exchange e queue
- **Parametrização por conexão**: Configure a volumetria específica para cada conexão
- **Layout padronizado**: Componentes com layout visual consistente
- **Textos reduzidos**: Boxes de configuração com textos mais concisos e legíveis
- **Renomeação de tipos**: 'Processing' renomeado para 'Service' em todos os componentes

## Solução de Problemas

### Docker

- **Porta 5173 já em uso**: Altere a porta no arquivo `docker-compose.yml` (ex: `"8080:5173"`)
- **Problemas de permissão**: Execute o Docker com privilégios de administrador
- **Container não inicia**: Verifique os logs com `docker-compose logs`

### Execução Local

- **Dependências não instaladas**: Certifique-se de ter o Node.js v20+ e pnpm instalados
- **Erros de compilação**: Verifique se todas as dependências foram instaladas corretamente
- **Porta em uso**: Altere a porta no arquivo `vite.config.ts` ou aceite a porta alternativa oferecida pelo Vite

## Tecnologias Utilizadas

- React com TypeScript
- React Flow para diagramas interativos
- Tailwind CSS e shadcn/ui para interface visual
- Algoritmos de simulação para cálculo de latência, throughput e custo
- Docker e Docker Compose para containerização
