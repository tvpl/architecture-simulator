"use client";
import React, { useState, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronRightSmall } from "lucide-react";
import { cn } from "@/lib/utils";
import { registry } from "@/registry";
import type { AWSServiceType } from "@/domain/entities/node";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUIStore } from "@/stores/ui-store";
import { ServiceIcon } from "@/components/nodes/base/ServiceIcon";

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["compute", "networking", "messaging"])
  );

  const palette = registry.buildPalette();

  const filteredPalette = search.trim()
    ? palette.map((cat) => ({
        ...cat,
        services: cat.services.filter(
          (s) =>
            s.label.toLowerCase().includes(search.toLowerCase()) ||
            s.description.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter((c) => c.services.length > 0)
    : palette;

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDragStart = useCallback(
    (event: React.DragEvent, type: AWSServiceType) => {
      event.dataTransfer.setData("application/architecture-service", type);
      event.dataTransfer.effectAllowed = "move";
    },
    []
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "relative flex flex-col bg-background border-r border-border transition-all duration-300",
          sidebarCollapsed ? "w-14" : "w-72"
        )}
      >
        {/* Header */}
        <div className={cn("flex items-center border-b border-border p-3", sidebarCollapsed ? "justify-center" : "justify-between")}>
          {!sidebarCollapsed && (
            <div>
              <h2 className="text-sm font-semibold text-foreground">Componentes AWS</h2>
              <p className="text-xs text-muted-foreground">Arraste para o canvas</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={toggleSidebar}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Search */}
        {!sidebarCollapsed && (
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar serviço..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>
        )}

        {/* Service palette */}
        <ScrollArea className="flex-1">
          <div className={cn("py-2", sidebarCollapsed ? "px-2" : "px-2")}>
            {filteredPalette.map((category, idx) => (
              <div key={category.id}>
                {idx > 0 && !sidebarCollapsed && <Separator className="my-2" />}

                {/* Category header */}
                {!sidebarCollapsed && (
                  <button
                    className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <span className="uppercase tracking-wider">{category.label}</span>
                    {expandedCategories.has(category.id) ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRightSmall className="w-3 h-3" />
                    )}
                  </button>
                )}

                {/* Services */}
                {(sidebarCollapsed || expandedCategories.has(category.id)) && (
                  <div className={cn("space-y-0.5 mt-1", sidebarCollapsed && "space-y-1")}>
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
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        {!sidebarCollapsed && (
          <div className="p-3 border-t border-border text-[10px] text-muted-foreground text-center">
            {registry.getAll().length} serviços AWS disponíveis
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// ── ServiceCard ───────────────────────────────────────────────────────────────

interface ServiceCardProps {
  service: {
    type: AWSServiceType;
    label: string;
    description: string;
    iconName: string;
    color: string;
    bgColor: string;
  };
  collapsed: boolean;
  onDragStart: (e: React.DragEvent, type: AWSServiceType) => void;
}

function ServiceCard({ service, collapsed, onDragStart }: ServiceCardProps) {
  const card = (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, service.type)}
      className={cn(
        "flex items-center gap-2.5 rounded-lg border border-transparent cursor-grab active:cursor-grabbing",
        "hover:border-border hover:bg-muted/50 transition-all select-none",
        collapsed ? "p-2 justify-center" : "px-2 py-2"
      )}
    >
      <div className={cn("p-1.5 rounded-lg shrink-0", service.bgColor)}>
        <ServiceIcon iconName={service.iconName} className={cn("w-3.5 h-3.5", service.color)} />
      </div>
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-foreground truncate">{service.label}</div>
          <div className="text-[10px] text-muted-foreground truncate">{service.description}</div>
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
          <p className="text-xs opacity-80">{service.description}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return card;
}
