"use client";
/**
 * Sidebar — layer-aware component palette.
 * Shows infrastructure services (L1) or app components (L2) based on active layer.
 * Premium design: colored accent strips, category count badges, improved hover states.
 */
import React, { useState, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevronRightSmall,
  Server,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { registry } from "@/registry";
import { appComponentRegistry } from "@/registry/app-components";
import type { AWSServiceType } from "@/domain/entities/node";
import type { AppComponentType } from "@/domain/entities/app-component";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUIStore } from "@/stores/ui-store";
import { useLayerStore } from "@/stores/layer-store";
import { useFlowStore, selectInfraHostOptions } from "@/stores/flow-store";
import { ServiceIcon } from "@/components/nodes/base/ServiceIcon";

// Converts "border-orange-500" → a matching bg color for the left accent strip
function borderToStripBg(borderColor: string): string {
  return borderColor
    .split(" ")
    .filter((c) => c.startsWith("border-") && c !== "border-dashed")
    .map((c) => c.replace("border-", "bg-"))
    .join(" ");
}

// Converts "text-orange-500" → "bg-orange-500/10" for category badge
function textToCategoryBadge(textColor: string): string {
  return textColor.replace("text-", "bg-").replace(/(-\d+)$/, "$1/15");
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const activeLayer = useLayerStore((s) => s.activeLayer);
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["compute", "networking", "messaging", "application", "messaging-app"])
  );

  const isInfraLayer = activeLayer === "architecture";

  const handleDragStart = useCallback(
    (event: React.DragEvent, type: string) => {
      const mimeType = isInfraLayer
        ? "application/architecture-service"
        : "application/app-component";
      event.dataTransfer.setData(mimeType, type);
      event.dataTransfer.effectAllowed = "move";
    },
    [isInfraLayer]
  );

  if (activeLayer === "cost" || activeLayer === "simulation") {
    return null;
  }

  const palette = isInfraLayer
    ? registry.buildPalette()
    : appComponentRegistry.buildPalette();

  const filteredPalette = search.trim()
    ? palette
        .map((cat) => ({
          ...cat,
          services: cat.services.filter(
            (s) =>
              s.label.toLowerCase().includes(search.toLowerCase()) ||
              s.description.toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter((c) => c.services.length > 0)
    : palette;

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalCount = isInfraLayer
    ? registry.getAll().length
    : appComponentRegistry.getAll().length;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "relative flex flex-col bg-background border-r border-border transition-all duration-300",
          sidebarCollapsed ? "w-14" : "w-72"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center border-b border-border px-3 py-2.5",
            sidebarCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {!sidebarCollapsed && (
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {isInfraLayer ? "Infraestrutura AWS" : "Componentes de Solução"}
              </h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {totalCount} {isInfraLayer ? "serviços" : "componentes"} · arraste para o canvas
              </p>
            </div>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={toggleSidebar}>
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Search */}
        {!sidebarCollapsed && (
          <div className="px-2 py-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={isInfraLayer ? "Buscar serviço AWS..." : "Buscar componente..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>
        )}

        {/* Infrastructure context banner for L2 */}
        {!isInfraLayer && !sidebarCollapsed && <InfrastructureContext />}

        {/* Component palette */}
        <ScrollArea className="flex-1">
          <div className="py-2 px-2">
            {filteredPalette.map((category, idx) => {
              const isExpanded = sidebarCollapsed || expandedCategories.has(category.id);
              // Pick a representative color from first service for category badge
              const firstService = category.services[0];
              const categoryBadgeBg = firstService ? textToCategoryBadge(firstService.color) : "bg-muted";
              const categoryTextColor = firstService ? firstService.color : "text-muted-foreground";

              return (
                <div key={category.id} className={cn("mb-1", idx > 0 && !sidebarCollapsed && "mt-1")}>
                  {/* Category header */}
                  {!sidebarCollapsed && (
                    <button
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                      onClick={() => toggleCategory(category.id)}
                    >
                      {/* Category color chip */}
                      <span
                        className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide",
                          categoryBadgeBg,
                          categoryTextColor
                        )}
                      >
                        {category.services.length}
                      </span>
                      <span className="flex-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-left">
                        {category.label}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <ChevronRightSmall className="w-3 h-3 text-muted-foreground" />
                      )}
                    </button>
                  )}

                  {/* Services */}
                  {isExpanded && (
                    <div className={cn("space-y-0.5", !sidebarCollapsed && "mt-0.5")}>
                      {category.services.map((service) => (
                        <ServiceCard
                          key={service.type}
                          service={service}
                          collapsed={sidebarCollapsed}
                          onDragStart={handleDragStart}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredPalette.length === 0 && !sidebarCollapsed && (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <Search className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">Nenhum resultado para</p>
                <p className="text-xs font-medium text-foreground mt-0.5">"{search}"</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}

// ── InfrastructureContext ─────────────────────────────────────────────────────

function InfrastructureContext() {
  const infraHosts = useFlowStore((s) => selectInfraHostOptions(s));

  if (infraHosts.length === 0) {
    return (
      <div className="mx-2 my-2 rounded-lg border border-amber-200 bg-amber-50/60 dark:border-amber-800/50 dark:bg-amber-950/20 p-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
              Nenhuma infraestrutura
            </p>
            <p className="text-[10px] text-amber-600/80 dark:text-amber-500 mt-0.5">
              Adicione serviços na aba L1 Arquitetura primeiro
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-2 my-2 rounded-lg border border-border bg-muted/30 p-2">
      <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 px-1">
        Hosts disponíveis
      </div>
      <div className="space-y-0.5">
        {infraHosts.map((host) => (
          <div
            key={host.id}
            className="flex items-center gap-2 px-2 py-1 rounded-md bg-background/60 text-xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate text-foreground flex-1">{host.data.label}</span>
            <span className="text-[9px] font-mono text-muted-foreground shrink-0">{host.data.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ServiceCard ───────────────────────────────────────────────────────────────

interface ServiceCardProps {
  service: {
    type: AWSServiceType | AppComponentType;
    label: string;
    description: string;
    iconName: string;
    color: string;
    bgColor: string;
    borderColor?: string;
  };
  collapsed: boolean;
  onDragStart: (e: React.DragEvent, type: string) => void;
}

function ServiceCard({ service, collapsed, onDragStart }: ServiceCardProps) {
  const accentBg = service.borderColor
    ? borderToStripBg(service.borderColor)
    : service.color.replace("text-", "bg-");

  const card = (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, service.type)}
      className={cn(
        "relative flex items-center gap-2.5 rounded-lg overflow-hidden select-none",
        "border border-transparent cursor-grab active:cursor-grabbing",
        "hover:border-border hover:bg-muted/40 hover:shadow-sm transition-all",
        collapsed ? "p-2 justify-center" : "px-2 py-2"
      )}
    >
      {/* Left accent strip */}
      {!collapsed && (
        <div className={cn("absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg", accentBg)} />
      )}

      {/* Icon */}
      <div className={cn("p-1.5 rounded-lg shrink-0", service.bgColor)}>
        <ServiceIcon iconName={service.iconName} className={cn("w-3.5 h-3.5", service.color)} />
      </div>

      {/* Labels */}
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-foreground truncate leading-tight">
            {service.label}
          </div>
          <div className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
            {service.description}
          </div>
        </div>
      )}
    </div>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{card}</TooltipTrigger>
        <TooltipContent side="right" className="max-w-[200px]">
          <p className="font-medium">{service.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return card;
}
