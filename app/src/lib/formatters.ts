const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatUSD(value: number): string {
  return usdFormatter.format(value);
}

export function formatBRL(value: number, exchangeRate = 5.0): string {
  return brlFormatter.format(value * exchangeRate);
}

export function formatCurrency(
  value: number,
  currency: "USD" | "BRL" = "USD",
  exchangeRate = 5.0
): string {
  if (currency === "BRL") return formatBRL(value, exchangeRate);
  return formatUSD(value);
}

export function formatLatency(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)} µs`;
  if (ms < 1000) return `${ms.toFixed(1)} ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)} s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export function formatThroughput(rps: number): string {
  if (rps < 1000) return `${rps.toFixed(0)} req/s`;
  if (rps < 1_000_000) return `${(rps / 1000).toFixed(1)}K req/s`;
  return `${(rps / 1_000_000).toFixed(1)}M req/s`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}
