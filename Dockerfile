FROM node:20-alpine

WORKDIR /app

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Copiar arquivos de configuração primeiro para aproveitar o cache de camadas
COPY simulador-arquitetura/package.json simulador-arquitetura/pnpm-lock.yaml ./

# Instalar dependências
RUN pnpm install

# Copiar o restante dos arquivos do projeto
COPY simulador-arquitetura/ ./

# Expor a porta que o Vite usa por padrão
EXPOSE 5173

# Comando para iniciar o servidor de desenvolvimento
CMD ["pnpm", "run", "dev", "--host", "0.0.0.0"]
