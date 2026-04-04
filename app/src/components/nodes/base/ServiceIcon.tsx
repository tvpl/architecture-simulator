"use client";
import React, { memo } from "react";
import {
  Zap, Server, Box, Layers, Network, Globe, Globe2, ArrowLeftRight,
  MapPin, Shield, ShieldCheck, MessageSquare, Bell, Workflow, Activity,
  Waves, HardDrive, Database, FolderOpen, KeyRound, Lock, Users,
  GitBranch, BarChart3, Layers2, Container,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Zap, Server, Box, Layers, Network, Globe, Globe2, ArrowLeftRight,
  MapPin, Shield, ShieldCheck, MessageSquare, Bell, Workflow, Activity,
  Waves, HardDrive, Database, FolderOpen, KeyRound, Lock, Users,
  GitBranch, BarChart3, Layers2, Container,
};

interface ServiceIconProps {
  iconName: string;
  className?: string;
}

const ServiceIcon = memo(function ServiceIcon({ iconName, className }: ServiceIconProps) {
  const Icon = ICON_MAP[iconName] ?? Box;
  return <Icon className={className} />;
});

export { ServiceIcon };
