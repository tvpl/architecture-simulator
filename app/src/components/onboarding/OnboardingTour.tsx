"use client";
/**
 * OnboardingTour — guided first-time user tour.
 * 5 steps with animated floating cards pointing at key UI areas.
 * Shown only once (persisted via useUIStore.onboardingCompleted).
 */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sparkles, Layers, DollarSign, Play, Boxes } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

interface TourStep {
  title: string;
  description: string;
  // Where to position the tooltip card
  position: { top?: string; left?: string; right?: string; bottom?: string; transform?: string };
  // Visual accent color
  accent: string;
  icon: React.ReactNode;
  arrowDir?: "left" | "top" | "right" | "bottom";
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Bem-vindo ao AWS Architect! 🎉",
    description:
      "Crie, simule e analise arquiteturas AWS visualmente. Este tour rápido vai te mostrar os principais recursos em menos de 1 minuto.",
    position: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
    accent: "from-primary to-violet-500",
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    title: "Barra de Serviços AWS",
    description:
      "Aqui ficam todos os serviços AWS organizados por categoria. Arraste qualquer serviço para o canvas — ou clique nele para adicionar automaticamente. Use a busca para encontrar serviços rapidamente.",
    position: { top: "50%", left: "296px", transform: "translateY(-50%)" },
    accent: "from-blue-500 to-cyan-500",
    icon: <Layers className="w-5 h-5" />,
    arrowDir: "left",
  },
  {
    title: "Canvas de Arquitetura",
    description:
      "Solte serviços aqui para montar seu diagrama. Conecte-os arrastando das alças (bolinhas) nas bordas dos nós. Clique em um nó para editar suas propriedades.",
    position: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
    accent: "from-violet-500 to-pink-500",
    icon: <Boxes className="w-5 h-5" />,
  },
  {
    title: "4 Camadas de Visualização",
    description:
      "L1 → infraestrutura AWS · L2 → microsserviços e K8s · L3 → estimativas de custo · L4 → simulação de performance em tempo real.",
    position: { top: "70px", left: "50%", transform: "translateX(-50%)" },
    accent: "from-emerald-500 to-teal-500",
    icon: <DollarSign className="w-5 h-5" />,
    arrowDir: "top",
  },
  {
    title: "Simule sua Arquitetura",
    description:
      "Clique em Simular para analisar latência, throughput e identificar bottlenecks. Os resultados aparecem nos nós e no painel de simulação com recomendações automáticas.",
    position: { top: "70px", right: "16px" },
    accent: "from-orange-500 to-red-500",
    icon: <Play className="w-5 h-5" />,
    arrowDir: "top",
  },
];

export function OnboardingTour() {
  const { onboardingCompleted, completeOnboarding } = useUIStore();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  // Delay showing to let the editor render first
  useEffect(() => {
    if (!onboardingCompleted) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, [onboardingCompleted]);

  if (onboardingCompleted || !visible) return null;

  const current = TOUR_STEPS[step];
  const isFirst = step === 0;
  const isLast = step === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      completeOnboarding();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handlePrev = () => setStep((s) => Math.max(0, s - 1));
  const handleSkip = () => completeOnboarding();

  return (
    <AnimatePresence>
      {/* Backdrop for center steps */}
      {(step === 0 || step === 2) && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
          onClick={handleSkip}
        />
      )}

      {/* Tour card */}
      <motion.div
        key={`step-${step}`}
        initial={{ opacity: 0, scale: 0.92, y: step === 0 ? 16 : 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: -8 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed z-[201] w-80 pointer-events-auto"
        style={current.position as React.CSSProperties}
      >
        {/* Arrow indicator for non-center steps */}
        {current.arrowDir === "top" && (
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-popover" />
        )}
        {current.arrowDir === "left" && (
          <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-popover" />
        )}

        <div className="rounded-2xl border border-border bg-popover shadow-2xl overflow-hidden">
          {/* Gradient header */}
          <div className={cn("h-1.5 w-full bg-gradient-to-r", current.accent)} />

          <div className="p-5">
            {/* Icon + title */}
            <div className="flex items-start gap-3 mb-3">
              <div className={cn("p-2 rounded-xl bg-gradient-to-br shrink-0", current.accent, "text-white")}>
                {current.icon}
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm leading-tight">{current.title}</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {current.description}
                </p>
              </div>
            </div>

            {/* Step indicators */}
            <div className="flex items-center justify-center gap-1.5 mt-4 mb-3">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i === step
                      ? cn("w-5 h-1.5 bg-gradient-to-r", current.accent)
                      : i < step
                      ? "w-1.5 h-1.5 bg-primary/40"
                      : "w-1.5 h-1.5 bg-border"
                  )}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSkip}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex-1 text-left"
              >
                Pular tour
              </button>

              <div className="flex items-center gap-1.5">
                {!isFirst && (
                  <button
                    onClick={handlePrev}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Voltar
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition-all hover:opacity-90 bg-gradient-to-r",
                    current.accent
                  )}
                >
                  {isLast ? "Começar!" : "Próximo"}
                  {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
                  {isLast && <Sparkles className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
