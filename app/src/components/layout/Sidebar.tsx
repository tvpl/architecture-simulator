"use client";
/**
 * Sidebar — layer-aware component palette.
 * Shows infrastructure services (L1) or app components (L2) based on active layer.
 * Premium design: colored accent strips, category count badges, improved hover states.
 *
 * Features:
 * - Click-to-add services (L1 and L2) with "+" button on hover
 * - Category expansion persisted in useUIStore
 * - Resizable sidebar via drag handle on right edge
 * - "Adicionar via Command Palette" button when search has no results
 */
import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevronRightSmall,
  AlertTriangle,
  Plus,
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
import { useCommandPaletteStore } from "@/stores/command-palette-store";
import { ServiceIcon } from "@/components/nodes/base/ServiceIcon";
import { toast } from "sonner";
import type { ServicePaletteEntry } from "@/registry/types";
import type { AppPaletteEntry } from "@/registry/app-components/types";

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
  const {
    sidebarCollapsed,
    toggleSidebar,
    sidebarWidth,
    setSidebarWidth,
    expandedCategories,
    toggleExpandedCategory,
  } = useUIStore();
  const activeLayer = useLayerStore((s) => s.activeLayer);
  const [search, setSearch] = useState("");

  // ── Resizable sidebar ────────────────────────────────────────────────────────
  const isResizing = useRef(false);

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;

      const handleMouseMove = (ev: MouseEvent) => {
        if (!isResizing.current) return;
        setSidebarWidth(ev.clientX);
      };

      const handleMouseUp = () => {
        isResizing.current = false;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [setSidebarWidth]
  );

  // Clean up listeners on unmount (safety net)
  useEffect(() => {
    return () => {
      isResizing.current = false;
    };
  }, []);

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

  // ── Click-to-add handler for L1 ─────────────────────────────────────────────
  const handleAddInfraService = useCallback((type: AWSServiceType) => {
    useFlowStore.getState().addNode(type, {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
    });
  }, []);

  // ── Click-to-add handler for L2 ─────────────────────────────────────────────
  const handleAddAppComponent = useCallback((type: AppComponentType) => {
    const infraHosts = selectInfraHostOptions(useFlowStore.getState());
    if (infraHosts.length === 0) {
      toast.warning("Nenhuma infraestrutura disponível. Adicione serviços na aba L1 Arquitetura primeiro.");
      return;
    }
    const defaultHost = infraHosts[0];
    useFlowStore.getState().addAppComponent(type, {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
    }, defaultHost.id);
  }, []);

  const handleAdd = useCallback(
    (type: AWSServiceType | AppComponentType) => {
      if (isInfraLayer) {
        handleAddInfraService(type as AWSServiceType);
      } else {
        handleAddAppComponent(type as AppComponentType);
      }
    },
    [isInfraLayer, handleAddInfraService, handleAddAppComponent]
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
    toggleExpandedCategory(id);
  };

  const totalCount = isInfraLayer
    ? registry.getAll().length
    : appComponentRegistry.getAll().length;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "relative flex flex-col bg-background border-r border-border transition-all duration-300",
          sidebarCollapsed ? "w-14" : ""
        )}
        style={sidebarCollapsed ? undefined : { width: sidebarWidth }}
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
              const isExpanded = sidebarCollapsed || expandedCategories.includes(category.id);
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

                  {/* Services — animated expand/collapse */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key="services"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
                        className="overflow-hidden"
                      >
                        <div className={cn("space-y-0.5", !sidebarCollapsed && "mt-0.5 pb-0.5")}>
                          {category.services.map((service) => (
                            <ServiceCard
                              key={service.type}
                              service={service}
                              collapsed={sidebarCollapsed}
                              onDragStart={handleDragStart}
                              onAdd={handleAdd}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {filteredPalette.length === 0 && !sidebarCollapsed && (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <Search className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">Nenhum resultado para</p>
                <p className="text-xs font-medium text-foreground mt-0.5">{'"'}{search}{'"'}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 h-7 text-xs gap-1.5"
                  onClick={() => useCommandPaletteStore.getState().open()}
                >
                  <Plus className="w-3 h-3" />
                  Adicionar via Command Palette
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Drag handle — right edge resize (only when not collapsed) */}
        {!sidebarCollapsed && (
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/60 transition-colors z-10"
            onMouseDown={handleResizeMouseDown}
          />
        )}
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

type ServiceOrAppEntry = (ServicePaletteEntry & { borderColor?: string }) | (AppPaletteEntry & { borderColor?: string });

interface ServiceCardProps {
  service: ServiceOrAppEntry;
  collapsed: boolean;
  onDragStart: (e: React.DragEvent, type: string) => void;
  onAdd: (type: AWSServiceType | AppComponentType) => void;
}

function ServiceCard({ service, collapsed, onDragStart, onAdd }: ServiceCardProps) {
  const accentBg = service.borderColor
    ? borderToStripBg(service.borderColor)
    : service.color.replace("text-", "bg-");

  const card = (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, service.type)}
      onClick={() => onAdd(service.type)}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg overflow-hidden select-none",
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

      {/* "+" button — appears on hover, only when expanded */}
      {!collapsed && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAdd(service.type);
          }}
          className={cn(
            "shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
            "w-5 h-5 flex items-center justify-center rounded",
            "bg-primary/10 hover:bg-primary/20 text-primary"
          )}
          aria-label={`Adicionar ${service.label}`}
        >
          <Plus className="w-3 h-3" />
        </button>
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
