export const LAYER_TYPES = [
  "architecture",
  "services",
  "cost",
  "simulation",
] as const;

export type LayerType = (typeof LAYER_TYPES)[number];

export interface LayerConfig {
  type: LayerType;
  displayName: string;
  description: string;
  icon: string;
  showNodeLabels: boolean;
  showEdgeLabels: boolean;
  showCostBadges: boolean;
  showAnimations: boolean;
  showContainerBoundaries: boolean;
}

export const LAYER_CONFIGS: Record<LayerType, LayerConfig> = {
  architecture: {
    type: "architecture",
    displayName: "Arquitetura",
    description: "Componentes AWS, VPC, sub-redes e grupos de segurança",
    icon: "Layers",
    showNodeLabels: true,
    showEdgeLabels: false,
    showCostBadges: false,
    showAnimations: false,
    showContainerBoundaries: true,
  },
  services: {
    type: "services",
    displayName: "Serviços",
    description: "Microsserviços, comunicação e protocolos",
    icon: "Network",
    showNodeLabels: true,
    showEdgeLabels: true,
    showCostBadges: false,
    showAnimations: false,
    showContainerBoundaries: false,
  },
  cost: {
    type: "cost",
    displayName: "Custos",
    description: "Análise de custos por componente e total",
    icon: "DollarSign",
    showNodeLabels: true,
    showEdgeLabels: false,
    showCostBadges: true,
    showAnimations: false,
    showContainerBoundaries: false,
  },
  simulation: {
    type: "simulation",
    displayName: "Simulação",
    description: "Fluxo de mensagens ao vivo, latência e gargalos",
    icon: "Play",
    showNodeLabels: true,
    showEdgeLabels: true,
    showCostBadges: false,
    showAnimations: true,
    showContainerBoundaries: false,
  },
};
