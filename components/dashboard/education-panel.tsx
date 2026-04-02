"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpenText,
  BrainCircuit,
  GitBranch,
  Layers3,
  Network,
  Sigma,
  Sparkles,
  Zap
} from "lucide-react";

import { educationHighlights, educationTopics } from "@/data/dashboard-data";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlowBorder } from "@/components/effects/glow-border";
import { GradientOverlay } from "@/components/effects/gradient-overlay";

type EducationTopicId = (typeof educationTopics)[number]["id"];

type LearnSection = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  toneClass: string;
  topicIds: EducationTopicId[];
  keywords: string[];
  calloutTitle: string;
  calloutText: string;
  labHint: string;
};

const learnSections: LearnSection[] = [
  {
    id: "nqueen",
    title: "What Is N-Queen?",
    subtitle: "Core puzzle framing and goal state",
    icon: BookOpenText,
    toneClass: "from-cyan-500/15 to-sky-500/10 border-cyan-300/25",
    topicIds: ["nqueen-problem"],
    keywords: ["Board Constraints", "Non-Attacking Queens", "One-Per-Row"],
    calloutTitle: "Puzzle Goal",
    calloutText: "Place N queens on an N x N board with zero row, column, or diagonal conflicts.",
    labHint: "Use manual board editing in Solver mode to test valid vs invalid states quickly."
  },
  {
    id: "backtracking",
    title: "Backtracking",
    subtitle: "Explore, test, revert, continue",
    icon: GitBranch,
    toneClass: "from-emerald-500/15 to-cyan-500/10 border-emerald-300/25",
    topicIds: ["backtracking"],
    keywords: ["State Space Search", "Dead-End Recovery", "Branch Pruning"],
    calloutTitle: "Search Behavior",
    calloutText: "A move is accepted only if safe; failures rewind to the last decision point.",
    labHint: "Watch the Live Solver Log to see move attempts and rollbacks in sequence."
  },
  {
    id: "recursion",
    title: "Recursion",
    subtitle: "Subproblem decomposition by row",
    icon: BrainCircuit,
    toneClass: "from-violet-500/15 to-indigo-500/10 border-violet-300/25",
    topicIds: ["recursion"],
    keywords: ["Call Stack", "Base Case", "Stack Unwind"],
    calloutTitle: "Recursive Pattern",
    calloutText: "Each row placement creates the next row subproblem until all rows are solved.",
    labHint: "Enable Search Tree Visualizer to see recursive depth and branching flow."
  },
  {
    id: "optimization",
    title: "Optimization",
    subtitle: "Reduce checks and reject earlier",
    icon: Zap,
    toneClass: "from-amber-500/15 to-orange-500/10 border-amber-300/25",
    topicIds: ["optimization"],
    keywords: ["Bitmasking", "Constant-Time Checks", "Symmetry Reduction"],
    calloutTitle: "Performance Strategy",
    calloutText: "Fast solvers avoid repeated scans by tracking columns and diagonals incrementally.",
    labHint: "Compare Classic vs Bitmask in Benchmark Lab to observe practical speedup."
  },
  {
    id: "complexity",
    title: "Complexity",
    subtitle: "Scaling costs and trade-offs",
    icon: Sigma,
    toneClass: "from-fuchsia-500/15 to-purple-500/10 border-fuchsia-300/25",
    topicIds: ["time-complexity", "space-complexity"],
    keywords: ["Exponential Growth", "O(N!) Trend", "Memory Pressure"],
    calloutTitle: "Scaling Reality",
    calloutText: "Pruning helps, but search still scales sharply as board size grows.",
    labHint: "Stress Test mode is ideal for finding maximum solvable N under time limits."
  },
  {
    id: "csp",
    title: "Constraint Satisfaction Framing",
    subtitle: "Formal CSP interpretation",
    icon: Network,
    toneClass: "from-sky-500/15 to-blue-500/10 border-sky-300/25",
    topicIds: ["csp", "real-world"],
    keywords: ["Variables & Domains", "Constraint Propagation", "Decision Systems"],
    calloutTitle: "CSP Lens",
    calloutText: "Rows become variables, columns are domains, and conflict rules are constraints.",
    labHint: "Constraint Editor + Challenge Mode demonstrates CSP-style solving on custom boards."
  }
];

export function EducationPanel() {
  const [activeSectionId, setActiveSectionId] = useState<string>(learnSections[0].id);
  const topicLookup = useMemo(() => new Map(educationTopics.map((topic) => [topic.id, topic])), []);
  const activeSection = useMemo(
    () => learnSections.find((section) => section.id === activeSectionId) ?? learnSections[0],
    [activeSectionId]
  );
  const activeTopics = useMemo(
    () =>
      activeSection.topicIds
        .map((topicId) => topicLookup.get(topicId))
        .filter((topic): topic is (typeof educationTopics)[number] => Boolean(topic)),
    [activeSection.topicIds, topicLookup]
  );

  return (
    <section>
      <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-background/90 via-background to-background/70 shadow-[0_26px_62px_rgba(4,10,34,0.48)]">
        <GradientOverlay className="opacity-80" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(96,255,235,0.13),transparent_34%),radial-gradient(circle_at_88%_10%,rgba(86,160,255,0.12),transparent_44%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

        <CardHeader className="relative">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <span className="mono text-xs uppercase tracking-[0.16em]">Learn</span>
          </div>
          <CardTitle>N-Queen Learning Platform</CardTitle>
          <CardDescription>
            A premium concept studio for understanding search, recursion, optimization, and constraint reasoning.
          </CardDescription>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Badge variant="secondary" className="bg-cyan-500/15 text-cyan-100">
              Educational Mode
            </Badge>
            <Badge variant="outline" className="border-primary/30 bg-background/60 shadow-[0_0_0_1px_rgba(96,255,235,0.12)]">
              Tool + Learning Platform
            </Badge>
            <Badge variant="outline" className="border-primary/25 bg-background/60">
              Premium Learning UI
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {educationHighlights.map((item, index) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.22, delay: index * 0.04 }}
                className="rounded-xl border border-border/60 bg-background/45 p-4 shadow-[inset_0_0_0_1px_rgba(96,255,235,0.06)] transition-all duration-300 hover:border-primary/35 hover:shadow-[0_0_0_1px_rgba(96,255,235,0.16),0_12px_30px_rgba(4,10,34,0.38)]"
              >
                <div className="mb-2 h-1.5 w-10 rounded-full bg-gradient-to-r from-primary/80 to-cyan-400/70" />
                <h3 className="text-sm font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
              </motion.article>
            ))}
          </div>

          <Tabs value={activeSectionId} onValueChange={setActiveSectionId} className="w-full">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1.5 border-primary/20 bg-background/60 p-1 backdrop-blur-sm md:grid-cols-3">
              {learnSections.map((section) => (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  className="justify-start gap-1.5 px-2.5 py-2 text-xs font-medium"
                >
                  <section.icon className="h-3.5 w-3.5" />
                  {section.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {learnSections.map((section) => {
              const sectionTopics = section.topicIds
                .map((topicId) => topicLookup.get(topicId))
                .filter((topic): topic is (typeof educationTopics)[number] => Boolean(topic));
              const SectionIcon = section.icon;

              return (
                <TabsContent key={section.id} value={section.id} className="mt-3 space-y-3">
                  <div className="grid gap-3 xl:grid-cols-[1.1fr_1.2fr]">
                    <GlowBorder intensity="low" className="h-full rounded-xl border-primary/25">
                      <Card className={cn("h-full border bg-gradient-to-b from-background/50 to-background/25", section.toneClass)}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <SectionIcon className="h-4 w-4 text-primary" />
                            <CardTitle className="text-base tracking-tight">{section.title}</CardTitle>
                          </div>
                          <Badge variant="outline" className="border-primary/30 bg-background/55">
                            Concept
                          </Badge>
                        </div>
                        <CardDescription>{section.subtitle}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="rounded-lg border border-primary/25 bg-background/45 p-3 shadow-[inset_0_0_0_1px_rgba(96,255,235,0.08)]">
                          <p className="text-xs font-semibold text-primary">{section.calloutTitle}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{section.calloutText}</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {section.keywords.map((keyword) => (
                            <Badge key={keyword} variant="secondary" className="bg-secondary/65">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                        <Separator />
                        <div className="rounded-lg border border-border/60 bg-background/35 p-3">
                          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">In QueenMind Lab</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{section.labHint}</p>
                        </div>
                      </CardContent>
                      </Card>
                    </GlowBorder>

                    <Card className="border-border/60 bg-background/40 shadow-[0_10px_26px_rgba(4,10,34,0.26)]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Deep Dive Notes</CardTitle>
                        <CardDescription>Collapsible explanation blocks for fast or detailed learning.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Accordion type="multiple" defaultValue={sectionTopics.map((topic) => topic.id)} className="w-full">
                          {sectionTopics.map((topic) => (
                            <AccordionItem key={topic.id} value={topic.id}>
                              <AccordionTrigger className="text-left text-sm font-medium">{topic.title}</AccordionTrigger>
                              <AccordionContent className="space-y-2">
                                <p className="text-xs leading-relaxed text-muted-foreground">{topic.summary}</p>
                                <div className="grid gap-1.5">
                                  {topic.bullets.map((bullet) => (
                                    <div
                                      key={bullet}
                                      className="rounded-md border border-border/55 bg-card/70 px-2.5 py-2 text-xs text-muted-foreground shadow-[inset_0_0_0_1px_rgba(96,255,235,0.05)]"
                                    >
                                      {bullet}
                                    </div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>

          <Separator />

          <div className="rounded-xl border border-border/60 bg-background/40 p-3 shadow-[0_10px_24px_rgba(4,10,34,0.24)]">
            <div className="flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Quick Concept Snapshot</p>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Active focus: <span className="font-medium text-foreground">{activeSection.title}</span>.{" "}
              {activeTopics[0]?.summary ?? "Select a concept tab to begin exploring the learning notes."}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="outline" className="border-primary/30 bg-background/55">
                Topic Count: {activeTopics.length}
              </Badge>
              <Badge variant="outline" className="border-primary/30 bg-background/55">
                Section: {activeSection.subtitle}
              </Badge>
              <Badge variant="outline" className="border-primary/30 bg-background/55">
                Learning Track Ready
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
