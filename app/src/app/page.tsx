"use client";
/**
 * Landing page — hero + feature showcase + CTA.
 * Animated with framer-motion, fully responsive.
 */
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Cpu, Play, LayoutTemplate, DollarSign, ShieldCheck,
  GitBranch, Layers, ArrowRight, Cloud, Zap, Database,
  BarChart3, Command, Box, Globe, Globe2, Server, Activity,
  FileJson, Image, Code2, Package, Blocks, CheckCircle2,
} from "lucide-react";

// ── Animation helpers ─────────────────────────────────────────────────────────

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE, delay },
  }),
};

// ── Terminal preview ──────────────────────────────────────────────────────────

const TERMINAL_LINES = [
  { text: "12 serviços · 8 conexões", delay: 0.6 },
  { text: "Latência estimada: 245ms", delay: 1.0 },
  { text: "Custo mensal: $487/mês", delay: 1.4 },
  { text: "Disponibilidade: 99.94%", delay: 1.8 },
];

function TerminalPreview() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const timers = TERMINAL_LINES.map((line, i) =>
      setTimeout(() => setVisibleCount(i + 1), line.delay * 1000)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      custom={0.45}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="relative z-10 mt-10 mx-auto w-full max-w-sm"
    >
      <div className="rounded-xl border border-border/60 bg-zinc-950 dark:bg-zinc-900 shadow-2xl overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
          <span className="ml-2 text-[10px] text-white/30 font-mono">aws-architect — simulation</span>
        </div>
        {/* Content */}
        <div className="px-4 py-3 space-y-2 min-h-[100px]">
          {TERMINAL_LINES.slice(0, visibleCount).map((line, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[12px] font-mono text-white/80">{line.text}</span>
            </div>
          ))}
          {visibleCount < TERMINAL_LINES.length && (
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                <span className="w-1.5 h-3.5 bg-white/50 animate-pulse" />
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Layer cards ───────────────────────────────────────────────────────────────

const LAYERS = [
  {
    label: "L1",
    title: "Infraestrutura",
    desc: "Diagrame 55+ serviços AWS",
    gradient: "from-blue-600 to-cyan-500",
    icon: <Server className="w-5 h-5" />,
  },
  {
    label: "L2",
    title: "Design de Solução",
    desc: "Modele microsserviços e K8s",
    gradient: "from-violet-600 to-purple-500",
    icon: <Blocks className="w-5 h-5" />,
  },
  {
    label: "L3",
    title: "Custos",
    desc: "Estime custos reais em USD e BRL",
    gradient: "from-emerald-600 to-teal-500",
    icon: <DollarSign className="w-5 h-5" />,
  },
  {
    label: "L4",
    title: "Simulação",
    desc: "Analise latência e bottlenecks",
    gradient: "from-orange-500 to-rose-500",
    icon: <Activity className="w-5 h-5" />,
  },
];

// ── Feature cards ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <Layers className="w-5 h-5" />,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    title: "4 Camadas de Visualização",
    desc: "L1 Infraestrutura, L2 Solução, L3 Custos e L4 Simulação — tudo em um só lugar.",
  },
  {
    icon: <Play className="w-5 h-5" />,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    title: "Simulação de Performance",
    desc: "Análise de latência, throughput e pontos de bottleneck com DFS automático.",
  },
  {
    icon: <DollarSign className="w-5 h-5" />,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    title: "Dashboard de Custos",
    desc: "Estimativas mensais precisas baseadas nos preços reais da AWS (us-east-1).",
  },
  {
    icon: <LayoutTemplate className="w-5 h-5" />,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    title: "Templates Prontos",
    desc: "6 arquiteturas de referência: serverless, containers, microservices e mais.",
  },
  {
    icon: <GitBranch className="w-5 h-5" />,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    title: "CloudFormation Export",
    desc: "Gere templates CloudFormation válidos diretamente do seu diagrama.",
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    color: "text-red-500",
    bg: "bg-red-500/10",
    title: "Validação em Tempo Real",
    desc: "Detecta erros de configuração, ciclos e topologias inválidas enquanto você desenha.",
  },
];

// ── Export formats ────────────────────────────────────────────────────────────

const EXPORT_FORMATS = [
  { icon: <FileJson className="w-3.5 h-3.5" />, label: "JSON", color: "text-yellow-600 bg-yellow-500/10 border-yellow-500/20" },
  { icon: <Image className="w-3.5 h-3.5" />, label: "PNG", color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
  { icon: <Code2 className="w-3.5 h-3.5" />, label: "SVG", color: "text-indigo-600 bg-indigo-500/10 border-indigo-500/20" },
  { icon: <GitBranch className="w-3.5 h-3.5" />, label: "CloudFormation", color: "text-orange-600 bg-orange-500/10 border-orange-500/20" },
  { icon: <Package className="w-3.5 h-3.5" />, label: "Terraform", color: "text-violet-600 bg-violet-500/10 border-violet-500/20" },
  { icon: <Code2 className="w-3.5 h-3.5" />, label: "AWS CDK", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
  { icon: <Blocks className="w-3.5 h-3.5" />, label: "K8s YAML", color: "text-teal-600 bg-teal-500/10 border-teal-500/20" },
];

// ── Stats bar ─────────────────────────────────────────────────────────────────

const STATS = [
  { value: "55+", label: "Serviços AWS" },
  { value: "6", label: "Arquiteturas Prontas" },
  { value: "4", label: "Formatos de Export" },
  { value: "100%", label: "no Browser" },
];

// ── Service pills ─────────────────────────────────────────────────────────────

const SERVICES = [
  { icon: <Zap className="w-3.5 h-3.5" />, label: "Lambda", color: "text-orange-500 bg-orange-500/10" },
  { icon: <Box className="w-3.5 h-3.5" />, label: "ECS", color: "text-teal-600 bg-teal-500/10" },
  { icon: <Database className="w-3.5 h-3.5" />, label: "RDS", color: "text-blue-600 bg-blue-500/10" },
  { icon: <Globe className="w-3.5 h-3.5" />, label: "CloudFront", color: "text-indigo-500 bg-indigo-500/10" },
  { icon: <Cloud className="w-3.5 h-3.5" />, label: "S3", color: "text-green-500 bg-green-500/10" },
  { icon: <BarChart3 className="w-3.5 h-3.5" />, label: "CloudWatch", color: "text-green-600 bg-green-500/10" },
  { icon: <Cpu className="w-3.5 h-3.5" />, label: "EKS", color: "text-blue-500 bg-blue-500/10" },
  { icon: <Database className="w-3.5 h-3.5" />, label: "DynamoDB", color: "text-indigo-600 bg-indigo-500/10" },
  { icon: <Globe2 className="w-3.5 h-3.5" />, label: "Region", color: "text-indigo-500 bg-indigo-500/10" },
];

// ── Keyboard shortcuts ────────────────────────────────────────────────────────

const SHORTCUTS = [
  { keys: ["⌘", "K"], label: "Paleta de Comandos" },
  { keys: ["⌘", "Z"], label: "Desfazer" },
  { keys: ["⌘", "Y"], label: "Refazer" },
  { keys: ["Del"], label: "Remover nó" },
  { keys: ["⌘", "Shift", "L"], label: "Auto-layout" },
  { keys: ["⌘", "D"], label: "Duplicar nó" },
  { keys: ["⌘", "A"], label: "Selecionar tudo" },
  { keys: ["⌘", "\\"], label: "Painel de propriedades" },
];

// ── Landing page ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border/50 glass h-14 flex items-center px-6 gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm ring-1 ring-primary/20">
            <Cpu className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm tracking-tight">AWS Architect</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/editor"
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors"
          >
            Atalhos de teclado
          </Link>
          <Link
            href="/editor"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Abrir Editor
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-24 overflow-hidden">
        {/* Background glows */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-[700px] h-[700px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div aria-hidden className="pointer-events-none absolute top-20 left-1/4 w-[300px] h-[300px] rounded-full bg-violet-500/5 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute bottom-20 right-1/4 w-[250px] h-[250px] rounded-full bg-cyan-500/5 blur-3xl" />

        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="relative z-10 mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-medium text-primary"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          55+ serviços AWS · 4 camadas · Simulação em tempo real
        </motion.div>

        <motion.h1
          custom={0.1}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="relative z-10 text-5xl sm:text-6xl font-black tracking-tighter text-foreground leading-none mb-6 max-w-4xl"
        >
          Arquitete, Simule e{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-500 to-cyan-500 animate-gradient-x">
            Calcule custos AWS
          </span>{" "}
          — visualmente
        </motion.h1>

        <motion.p
          custom={0.2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="relative z-10 text-lg text-muted-foreground max-w-2xl mb-10"
        >
          Sistema de 4 camadas: diagrame infraestrutura, modele microsserviços, estime custos reais
          e simule latência — tudo no browser, sem instalação.
        </motion.p>

        <motion.div
          custom={0.3}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="relative z-10 flex flex-col sm:flex-row items-center gap-3"
        >
          <Link
            href="/editor"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground font-semibold text-sm rounded-xl shadow-md hover:opacity-90 hover:scale-[1.02] transition-all active:scale-95"
          >
            <Play className="w-4 h-4" />
            Abrir Editor
          </Link>
          <Link
            href="/editor"
            className="inline-flex items-center gap-2 px-5 py-3.5 border border-border text-foreground font-medium text-sm rounded-xl hover:bg-muted/50 transition-all"
          >
            <LayoutTemplate className="w-4 h-4 text-muted-foreground" />
            Ver Templates
          </Link>
          <Link
            href="/editor"
            className="inline-flex items-center gap-2 px-5 py-3.5 text-muted-foreground font-medium text-sm rounded-xl hover:text-foreground hover:bg-muted/30 transition-all"
          >
            <Command className="w-4 h-4" />
            Atalhos de teclado
          </Link>
        </motion.div>

        {/* Terminal preview */}
        <TerminalPreview />

        {/* Service pills */}
        <motion.div
          custom={0.5}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="relative z-10 flex flex-wrap justify-center gap-2 mt-10"
        >
          {SERVICES.map((s) => (
            <span
              key={s.label}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border/50 ${s.color}`}
            >
              {s.icon}
              {s.label}
            </span>
          ))}
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border border-border/50 text-muted-foreground">
            +46 mais →
          </span>
        </motion.div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/20 py-8">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE }}
            className="flex flex-wrap justify-center gap-x-12 gap-y-6"
          >
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-black text-foreground tracking-tight">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Layer showcase ────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-3">
            Sistema de 4 Camadas
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Cada camada oferece uma perspectiva diferente da sua arquitetura — do visual ao financeiro.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {LAYERS.map((layer, i) => (
            <motion.div
              key={layer.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, ease: EASE, delay: i * 0.08 }}
              className="group relative rounded-2xl overflow-hidden border border-border hover:scale-[1.02] transition-transform duration-300"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${layer.gradient} opacity-[0.08] group-hover:opacity-[0.14] transition-opacity`} />
              <div className="relative p-6">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${layer.gradient} text-white mb-4 shadow-md`}>
                  {layer.icon}
                </div>
                <div className="text-[10px] font-black text-muted-foreground tracking-widest uppercase mb-1">{layer.label}</div>
                <div className="text-sm font-bold text-foreground mb-2">{layer.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{layer.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features grid ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-3">
            Tudo que você precisa
          </h2>
          <p className="text-muted-foreground">
            De diagramas simples a arquiteturas enterprise completas.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: EASE, delay: i * 0.07 }}
              className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-md hover:scale-[1.01] transition-all duration-200"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.bg} ${f.color}`}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-2">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Export formats ────────────────────────────────────────────────────── */}
      <section className="px-6 py-14 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE }}
          className="rounded-2xl border border-border bg-card p-8 text-center"
        >
          <h2 className="font-bold text-foreground text-xl mb-2">Formatos de exportação</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Exporte sua arquitetura em múltiplos formatos para integrar ao seu workflow.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {EXPORT_FORMATS.map((fmt) => (
              <span
                key={fmt.label}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${fmt.color}`}
              >
                {fmt.icon}
                {fmt.label}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Keyboard shortcuts ───────────────────────────────────────────────── */}
      <section className="px-6 py-12 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE }}
          className="rounded-2xl border border-border bg-card p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Command className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-semibold text-foreground">Atalhos de Teclado</h2>
            </div>
            <Link
              href="/editor"
              className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              Ver todos os atalhos
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SHORTCUTS.map((s) => (
              <div key={s.label} className="flex items-center justify-between gap-2 py-1">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <div className="flex items-center gap-1">
                  {s.keys.map((k) => (
                    <kbd
                      key={k}
                      className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono text-foreground"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 ring-1 ring-primary/20 mb-6">
            <Cpu className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
            Pronto para começar?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Sem cadastro. Sem instalação. Direto no browser.
            Comece a arquitetar em segundos.
          </p>
          <Link
            href="/editor"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold text-base rounded-2xl shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all active:scale-95"
          >
            <Play className="w-5 h-5" />
            Abrir Editor Gratuitamente
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted-foreground">
        <div className="max-w-3xl mx-auto space-y-2">
          <div className="font-medium text-foreground/70">AWS Architect — Simulator</div>
          <div>Ferramenta de design de arquitetura cloud · Preços estimados baseados em us-east-1</div>
          <div className="flex items-center justify-center gap-4 mt-3 text-muted-foreground/60">
            <span>v2.0.0</span>
            <span>·</span>
            <span>MIT License</span>
            <span>·</span>
            <span>Construído com Next.js 16, React Flow, Tailwind CSS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
