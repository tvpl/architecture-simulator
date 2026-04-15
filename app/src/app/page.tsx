"use client";
/**
 * Landing page — hero + feature showcase + CTA.
 * Animated with framer-motion, fully responsive.
 */
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Cpu, Play, LayoutTemplate, DollarSign, ShieldCheck,
  GitBranch, Layers, ArrowRight, Cloud, Zap, Database,
  BarChart3, Command, Box, Globe,
} from "lucide-react";

// ── Fade-in variants ──────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay },
  }),
};

// ── Feature cards data ────────────────────────────────────────────────────────

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
];

// ── Keyboard shortcuts ────────────────────────────────────────────────────────

const SHORTCUTS = [
  { keys: ["⌘", "K"], label: "Paleta de Comandos" },
  { keys: ["⌘", "Z"], label: "Desfazer" },
  { keys: ["Del"], label: "Remover nó" },
  { keys: ["⌘", "Shift", "L"], label: "Auto-layout" },
];

// ── Landing page ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 glass h-14 flex items-center px-6 gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm ring-1 ring-primary/20">
            <Cpu className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm tracking-tight">AWS Architect</span>
        </div>
        <Link
          href="/editor"
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Abrir Editor
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-24 overflow-hidden">
        {/* Background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="relative z-10 mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-medium text-primary"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          45+ serviços AWS · Simulação em tempo real
        </motion.div>

        <motion.h1
          custom={0.1}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="relative z-10 text-5xl sm:text-6xl font-black tracking-tighter text-foreground leading-none mb-6 max-w-3xl"
        >
          Arquitete soluções AWS{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-500">
            visualmente
          </span>
        </motion.h1>

        <motion.p
          custom={0.2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="relative z-10 text-lg text-muted-foreground max-w-xl mb-10"
        >
          Diagrame, simule e estime custos de arquiteturas AWS com arrastar e soltar.
          Análise de latência, CloudFormation export e muito mais.
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
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold text-sm rounded-xl shadow-md hover:opacity-90 hover:scale-[1.02] transition-all active:scale-95"
          >
            <Play className="w-4 h-4" />
            Abrir Editor
          </Link>
          <Link
            href="/editor"
            className="inline-flex items-center gap-2 px-5 py-3 border border-border text-foreground font-medium text-sm rounded-xl hover:bg-muted/50 transition-all"
          >
            <LayoutTemplate className="w-4 h-4 text-muted-foreground" />
            Ver Templates
          </Link>
        </motion.div>

        {/* Service pills */}
        <motion.div
          custom={0.4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="relative z-10 flex flex-wrap justify-center gap-2 mt-12"
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
            +37 mais →
          </span>
        </motion.div>
      </section>

      {/* Features grid */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-3">
            Tudo que você precisa
          </h2>
          <p className="text-muted-foreground">
            De diagramas simples a arquiteturas enterprise completas.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="group p-5 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
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

      {/* Keyboard shortcuts */}
      <section className="px-6 py-12 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-border bg-card p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Command className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Atalhos de Teclado</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {SHORTCUTS.map((s) => (
              <div key={s.label} className="flex items-center justify-between gap-2">
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

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
            Pronto para começar?
          </h2>
          <p className="text-muted-foreground mb-8">
            Sem cadastro. Sem instalação. Direto no browser.
          </p>
          <Link
            href="/editor"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold text-base rounded-2xl shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all active:scale-95"
          >
            <Cpu className="w-5 h-5" />
            Abrir Editor Gratuitamente
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        AWS Architect · Ferramenta de design de arquitetura cloud · Preços estimados baseados em us-east-1
      </footer>
    </div>
  );
}
