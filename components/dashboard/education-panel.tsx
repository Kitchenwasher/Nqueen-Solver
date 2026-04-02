"use client";

import { useMemo, useState } from "react";
import { BookOpenText, BrainCircuit, ChevronDown, GraduationCap, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { educationHighlights, educationTopics } from "@/data/dashboard-data";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type EducationTopicId = (typeof educationTopics)[number]["id"];

export function EducationPanel() {
  const [activeTopicId, setActiveTopicId] = useState<EducationTopicId>(educationTopics[0].id);
  const activeTopic = useMemo(
    () => educationTopics.find((topic) => topic.id === activeTopicId) ?? educationTopics[0],
    [activeTopicId]
  );

  return (
    <section>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <GraduationCap className="h-4 w-4" />
            <span className="mono text-xs uppercase tracking-[0.16em]">Learn</span>
          </div>
          <CardTitle>N-Queen Learning Studio</CardTitle>
          <CardDescription>
            A structured, visual guide to backtracking, recursion, optimization, and complexity behind the solver.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {educationHighlights.map((item) => (
              <article
                key={item.title}
                className="rounded-lg border border-border/60 bg-background/45 p-4 transition-colors duration-300 hover:border-primary/35"
              >
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
            <section className="rounded-xl border border-border/60 bg-background/35 p-3">
              <p className="mb-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">Topics</p>
              <div className="grid gap-2">
                {educationTopics.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setActiveTopicId(topic.id)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-sm transition-all duration-200",
                      activeTopicId === topic.id
                        ? "border-primary/40 bg-primary/15 text-foreground"
                        : "border-border/60 bg-background/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    )}
                  >
                    {topic.title}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-border/60 bg-background/35 p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTopic.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="gap-1.5">
                      <BookOpenText className="h-3.5 w-3.5" />
                      Concept
                    </Badge>
                    <Badge variant="outline" className="gap-1.5">
                      <BrainCircuit className="h-3.5 w-3.5" />
                      Deep Dive
                    </Badge>
                  </div>

                  <h3 className="text-lg font-semibold">{activeTopic.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{activeTopic.summary}</p>

                  <div className="grid gap-2">
                    {activeTopic.bullets.map((item) => (
                      <div
                        key={item}
                        className="rounded-md border border-border/60 bg-card/70 px-3 py-2 text-sm text-muted-foreground"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </section>
          </div>

          <details className="group rounded-xl border border-border/60 bg-background/35 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Constraint Satisfaction and Real-World Context</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-open:rotate-180" />
            </summary>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                In constraint satisfaction terms, each row is a variable, each column is a candidate value, and each
                safety rule is a constraint. The solver progressively assigns values while rejecting inconsistent states.
              </p>
              <p>
                This pattern appears in scheduling systems, planning engines, allocation tools, and many AI search
                pipelines where exploring possibilities efficiently is more important than brute-force generation.
              </p>
            </div>
          </details>
        </CardContent>
      </Card>
    </section>
  );
}
