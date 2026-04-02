"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { AnimatedGridBackground } from "@/components/effects/animated-grid-background";
import { GradientOverlay } from "@/components/effects/gradient-overlay";
import { SpotlightBackground } from "@/components/effects/spotlight-background";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { AppTopbar } from "@/components/app-shell/app-topbar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useHardwareProfile } from "@/hooks/use-hardware-profile";
import { cn } from "@/lib/utils";

type DashboardPage = "solver" | "benchmark" | "challenges" | "insights";
type DashboardSection = "solver" | "challenges" | "learn" | "insights" | "settings";

type DashboardAppShellProps = {
  page: DashboardPage;
  title: string;
  subtitle: string;
  children: ReactNode;
  rightPanel?: ReactNode;
  focusMode?: boolean;
  showFocusToggle?: boolean;
  onToggleFocusMode?: () => void;
  quickActions?: ReactNode;
  activeSection?: DashboardSection;
  onSectionNavigate?: (sectionId: string) => void;
  className?: string;
  solverLiveLabel?: string;
  multiAlgorithmEnabled?: boolean;
};

export function DashboardAppShell({
  page,
  title,
  subtitle,
  children,
  rightPanel,
  focusMode = false,
  showFocusToggle = false,
  onToggleFocusMode,
  quickActions,
  activeSection = "solver",
  onSectionNavigate,
  className,
  solverLiveLabel,
  multiAlgorithmEnabled = true
}: DashboardAppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { profile } = useHardwareProfile();

  const hardwareLabel = useMemo(() => {
    const threadsLabel = profile.hardwareThreads ? `${profile.hardwareThreads} threads` : "Unknown threads";
    return `${threadsLabel} | ${profile.capabilityTier}`;
  }, [profile.capabilityTier, profile.hardwareThreads]);

  const handleSectionNavigate = (sectionId: string) => {
    onSectionNavigate?.(sectionId);
    setMobileNavOpen(false);
  };

  return (
    <div className={cn("relative min-h-screen", className)}>
      <div className="pointer-events-none absolute inset-0">
        <SpotlightBackground className="opacity-75" />
        <AnimatedGridBackground className="opacity-15" />
        <GradientOverlay className="opacity-80" />
      </div>

      <AppTopbar
        title={title}
        subtitle={subtitle}
        onOpenNavigation={() => setMobileNavOpen(true)}
        showFocusToggle={showFocusToggle}
        focusMode={focusMode}
        onToggleFocusMode={onToggleFocusMode}
        quickActions={quickActions}
        solverLiveLabel={solverLiveLabel}
        multiAlgorithmEnabled={multiAlgorithmEnabled}
        hardwareLabel={hardwareLabel}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[2100px] gap-3 px-3 py-3 sm:gap-4 sm:px-4 lg:gap-5 lg:px-6 lg:py-4">
        {!focusMode && (
          <div className="hidden w-[248px] shrink-0 lg:block xl:w-[264px]">
            <AppSidebar activeSection={activeSection} onSectionNavigate={onSectionNavigate} />
          </div>
        )}

        <main className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.section
              key={`${page}-${focusMode ? "focus" : "default"}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="min-h-[calc(100vh-116px)]"
            >
              {children}
            </motion.section>
          </AnimatePresence>
        </main>

        {!focusMode && rightPanel && (
          <motion.aside
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="hidden w-[340px] shrink-0 2xl:block"
          >
            {rightPanel}
          </motion.aside>
        )}
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[86vw] max-w-[340px] border-border/70 bg-slate-950/90 p-3">
          <SheetHeader>
            <SheetTitle className="text-sm tracking-wide">Navigation</SheetTitle>
          </SheetHeader>
          <AppSidebar className="mt-3" activeSection={activeSection} onSectionNavigate={handleSectionNavigate} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
