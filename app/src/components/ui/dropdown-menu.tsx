"use client";
/**
 * DropdownMenu — Radix UI wrapper with smooth Framer Motion animations.
 * Fully accessible: keyboard nav, ARIA roles, focus management.
 */
import * as React from "react";
import * as RadixDropdown from "@radix-ui/react-dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const DropdownMenu = RadixDropdown.Root;
const DropdownMenuTrigger = RadixDropdown.Trigger;
const DropdownMenuGroup = RadixDropdown.Group;
const DropdownMenuPortal = RadixDropdown.Portal;
const DropdownMenuSub = RadixDropdown.Sub;
const DropdownMenuRadioGroup = RadixDropdown.RadioGroup;

// ── Content ───────────────────────────────────────────────────────────────────

const DropdownMenuContent = React.forwardRef<
  React.ComponentRef<typeof RadixDropdown.Content>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.Content> & { animate?: boolean }
>(({ className, sideOffset = 6, animate = true, children, ...props }, ref) => (
  <RadixDropdown.Portal>
    <RadixDropdown.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[180px] overflow-hidden rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    >
      {children}
    </RadixDropdown.Content>
  </RadixDropdown.Portal>
));
DropdownMenuContent.displayName = RadixDropdown.Content.displayName;

// ── Sub Content ───────────────────────────────────────────────────────────────

const DropdownMenuSubContent = React.forwardRef<
  React.ComponentRef<typeof RadixDropdown.SubContent>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.SubContent>
>(({ className, ...props }, ref) => (
  <RadixDropdown.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[150px] overflow-hidden rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl",
      "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
      className
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName = RadixDropdown.SubContent.displayName;

// ── Sub Trigger ───────────────────────────────────────────────────────────────

const DropdownMenuSubTrigger = React.forwardRef<
  React.ComponentRef<typeof RadixDropdown.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.SubTrigger> & { inset?: boolean }
>(({ className, inset, children, ...props }, ref) => (
  <RadixDropdown.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none",
      "transition-colors focus:bg-accent data-[state=open]:bg-accent",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
  </RadixDropdown.SubTrigger>
));
DropdownMenuSubTrigger.displayName = RadixDropdown.SubTrigger.displayName;

// ── Item ──────────────────────────────────────────────────────────────────────

const DropdownMenuItem = React.forwardRef<
  React.ComponentRef<typeof RadixDropdown.Item>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.Item> & {
    inset?: boolean;
    variant?: "default" | "destructive";
  }
>(({ className, inset, variant = "default", ...props }, ref) => (
  <RadixDropdown.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm outline-none transition-colors",
      "focus:bg-accent focus:text-accent-foreground",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
      variant === "destructive" && "text-destructive focus:bg-destructive/10 focus:text-destructive",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = RadixDropdown.Item.displayName;

// ── Checkbox Item ─────────────────────────────────────────────────────────────

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ComponentRef<typeof RadixDropdown.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <RadixDropdown.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm outline-none transition-colors",
      "focus:bg-accent focus:text-accent-foreground",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
      <RadixDropdown.ItemIndicator>
        <Check className="h-3.5 w-3.5" />
      </RadixDropdown.ItemIndicator>
    </span>
    {children}
  </RadixDropdown.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = RadixDropdown.CheckboxItem.displayName;

// ── Radio Item ────────────────────────────────────────────────────────────────

const DropdownMenuRadioItem = React.forwardRef<
  React.ComponentRef<typeof RadixDropdown.RadioItem>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.RadioItem>
>(({ className, children, ...props }, ref) => (
  <RadixDropdown.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm outline-none transition-colors",
      "focus:bg-accent focus:text-accent-foreground",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
      <RadixDropdown.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </RadixDropdown.ItemIndicator>
    </span>
    {children}
  </RadixDropdown.RadioItem>
));
DropdownMenuRadioItem.displayName = RadixDropdown.RadioItem.displayName;

// ── Label ─────────────────────────────────────────────────────────────────────

const DropdownMenuLabel = React.forwardRef<
  React.ComponentRef<typeof RadixDropdown.Label>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.Label> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <RadixDropdown.Label
    ref={ref}
    className={cn(
      "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = RadixDropdown.Label.displayName;

// ── Separator ─────────────────────────────────────────────────────────────────

const DropdownMenuSeparator = React.forwardRef<
  React.ComponentRef<typeof RadixDropdown.Separator>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.Separator>
>(({ className, ...props }, ref) => (
  <RadixDropdown.Separator
    ref={ref}
    className={cn("-mx-1 my-1.5 h-px bg-border/60", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = RadixDropdown.Separator.displayName;

// ── Shortcut ──────────────────────────────────────────────────────────────────

function DropdownMenuShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "ml-auto text-[10px] font-mono tracking-widest text-muted-foreground",
        "bg-muted px-1.5 py-0.5 rounded border border-border",
        className
      )}
      {...props}
    />
  );
}

// ── AnimatedDropdownContent ───────────────────────────────────────────────────
// For cases where you want framer-motion instead of CSS animations

interface AnimatedDropdownContentProps {
  open: boolean;
  children: React.ReactNode;
  className?: string;
  align?: "start" | "end" | "center";
}

function AnimatedDropdownContent({ open, children, className, align = "end" }: AnimatedDropdownContentProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "absolute top-full mt-1.5 z-50 min-w-[200px] overflow-hidden rounded-xl",
            "border border-border bg-popover shadow-xl",
            "p-1.5 text-popover-foreground",
            align === "end" ? "right-0" : align === "start" ? "left-0" : "left-1/2 -translate-x-1/2",
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  AnimatedDropdownContent,
};
