"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpenText, Crown, FlaskConical, Lightbulb, Settings2, Sparkles, UserCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type NavigationSidebarProps = {
  className?: string;
  activeSection?: "solver" | "challenges" | "learn" | "insights" | "settings";
  onSectionNavigate?: (sectionId: string) => void;
};

type NavSectionItem = {
  id: NavigationSidebarProps["activeSection"];
  label: string;
  icon: ComponentType<{ className?: string }>;
  sectionId: string;
};

const sectionItems: NavSectionItem[] = [
  { id: "solver", label: "Solver", icon: Crown, sectionId: "solver-section" },
  { id: "challenges", label: "Challenges", icon: Sparkles, sectionId: "challenges-section" },
  { id: "learn", label: "Learn", icon: BookOpenText, sectionId: "learn-section" },
  { id: "settings", label: "Control Guide", icon: Settings2, sectionId: "settings-section" }
];

export function NavigationSidebar({ className, activeSection = "solver", onSectionNavigate }: NavigationSidebarProps) {
  const pathname = usePathname();
  const currentPage = pathname?.startsWith("/benchmark")
    ? "benchmark"
    : pathname?.startsWith("/challenges")
      ? "challenges"
      : pathname?.startsWith("/insights")
        ? "insights"
        : pathname?.startsWith("/about")
          ? "about"
          : "solver";
  const isSolverPage = currentPage === "solver";

  return (
    <aside className={className}>
      <Card className="glass-panel sticky top-[88px] overflow-hidden border-border/70">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-primary">
            <Crown className="h-4 w-4" />
            <span className="mono text-xs uppercase tracking-[0.16em]">Navigation</span>
          </div>
          <CardTitle className="text-lg">Dashboard Shell</CardTitle>
          <CardDescription>Move across labs and sections with smooth transitions.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <p className="px-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Pages</p>

            <Link href="/" className="block">
              <div className="relative">
                {currentPage === "solver" && (
                  <motion.span
                    layoutId="active-page-indicator"
                    className="absolute inset-0 rounded-xl bg-primary/16 ring-1 ring-primary/35"
                    transition={{ type: "spring", stiffness: 360, damping: 32 }}
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "relative z-10 w-full justify-start gap-2 rounded-xl",
                    currentPage === "solver" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Crown className="h-4 w-4" />
                  Solver
                </Button>
              </div>
            </Link>

            <Link href="/benchmark" className="block">
              <div className="relative">
                {currentPage === "benchmark" && (
                  <motion.span
                    layoutId="active-page-indicator"
                    className="absolute inset-0 rounded-xl bg-primary/16 ring-1 ring-primary/35"
                    transition={{ type: "spring", stiffness: 360, damping: 32 }}
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "relative z-10 w-full justify-start gap-2 rounded-xl",
                    currentPage === "benchmark" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FlaskConical className="h-4 w-4" />
                  Benchmark Lab
                </Button>
              </div>
            </Link>

            <Link href="/challenges" className="block">
              <div className="relative">
                {currentPage === "challenges" && (
                  <motion.span
                    layoutId="active-page-indicator"
                    className="absolute inset-0 rounded-xl bg-primary/16 ring-1 ring-primary/35"
                    transition={{ type: "spring", stiffness: 360, damping: 32 }}
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "relative z-10 w-full justify-start gap-2 rounded-xl",
                    currentPage === "challenges" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                  Challenge Lab
                </Button>
              </div>
            </Link>

            <Link href="/insights" className="block">
              <div className="relative">
                {currentPage === "insights" && (
                  <motion.span
                    layoutId="active-page-indicator"
                    className="absolute inset-0 rounded-xl bg-primary/16 ring-1 ring-primary/35"
                    transition={{ type: "spring", stiffness: 360, damping: 32 }}
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "relative z-10 w-full justify-start gap-2 rounded-xl",
                    currentPage === "insights" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Lightbulb className="h-4 w-4" />
                  Insights Lab
                </Button>
              </div>
            </Link>

            <Link href="/about" className="block">
              <div className="relative">
                {currentPage === "about" && (
                  <motion.span
                    layoutId="active-page-indicator"
                    className="absolute inset-0 rounded-xl bg-primary/16 ring-1 ring-primary/35"
                    transition={{ type: "spring", stiffness: 360, damping: 32 }}
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "relative z-10 w-full justify-start gap-2 rounded-xl",
                    currentPage === "about" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <UserCircle2 className="h-4 w-4" />
                  About
                </Button>
              </div>
            </Link>
          </div>

          <div className="space-y-1.5">
            <p className="px-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Workspace</p>
            {sectionItems.map((item) => {
              const Icon = item.icon;
              const isActive = isSolverPage && activeSection === item.id;
              const content = (
                <>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </>
              );

              if (!isSolverPage) {
                return (
                  <Link key={item.id} href={`/#${item.sectionId}`} className="block">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="relative z-10 w-full justify-start gap-2 rounded-xl text-muted-foreground hover:text-foreground"
                    >
                      {content}
                    </Button>
                  </Link>
                );
              }

              if (item.id === "challenges") {
                return (
                  <Link key={item.id} href="/challenges" className="block">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="relative z-10 w-full justify-start gap-2 rounded-xl text-muted-foreground hover:text-foreground"
                    >
                      {content}
                    </Button>
                  </Link>
                );
              }

              return (
                <div key={item.id} className="relative">
                  {isActive && (
                    <motion.span
                      layoutId="active-section-indicator"
                      className="absolute inset-0 rounded-xl bg-accent/18 ring-1 ring-accent/45"
                      transition={{ type: "spring", stiffness: 360, damping: 32 }}
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "relative z-10 w-full justify-start gap-2 rounded-xl",
                      isActive ? "text-primary hover:text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => onSectionNavigate?.(item.sectionId)}
                  >
                    {content}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
