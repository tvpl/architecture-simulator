export const LAYER_TYPES = [
  "architecture",
  "solution-design",
  "cost",
  "simulation",
] as const;

export type LayerType = (typeof LAYER_TYPES)[number];

/** Determines which view component renders for a given layer */
export type LayerViewType = "canvas" | "dashboard" | "simulation-view";

export interface LayerConfig {
  type: LayerType;
  displayName: string;
  description: string;
  icon: string;
  viewType: LayerViewType;
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
    description: "Infraestrutura cloud — componentes AWS, VPC, sub-redes e segurança",
    icon: "Layers",
    viewType: "canvas",
    showNodeLabels: true,
    showEdgeLabels: false,
    showCostBadges: false,
    showAnimations: false,
    showContainerBoundaries: true,
  },
  "solution-design": {
    type: "solution-design",
    displayName: "Design de Solução",
    description: "Microsserviços, workers, APIs, pods e comunicação entre serviços",
    icon: "Boxes",
    viewType: "canvas",
    showNodeLabels: true,
    showEdgeLabels: true,
    showCostBadges: false,
    showAnimations: false,
    showContainerBoundaries: false,
  },
  cost: {
    type: "cost",
    displayName: "Custos",
    description: "Dashboard de custos, breakdown por componente e projeções",
    icon: "DollarSign",
    viewType: "dashboard",
    showNodeLabels: true,
    showEdgeLabels: false,
    showCostBadges: true,
    showAnimations: false,
    showContainerBoundaries: false,
  },
  simulation: {
    type: "simulation",
    displayName: "Simulação",
    description: "Simulação de carga, latência, throughput e gargalos",
    icon: "Play",
    viewType: "simulation-view",
    showNodeLabels: true,
    showEdgeLabels: true,
    showCostBadges: false,
    showAnimations: true,
    showContainerBoundaries: false,
  },
};
