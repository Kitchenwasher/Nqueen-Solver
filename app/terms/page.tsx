import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms governing the use of QueenMind algorithm labs and educational tooling.",
  alternates: {
    canonical: "/terms"
  }
};

export default function TermsPage() {
  return (
    <main className="relative z-10 mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <Card className="glass-panel border-border/70">
        <CardHeader>
          <p className="mono text-xs uppercase tracking-[0.16em] text-primary/80">Legal</p>
          <CardTitle className="text-2xl [font-family:var(--font-space-grotesk)]">Terms of Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            QueenMind is provided as an educational and experimental platform for understanding N-Queen solving
            strategies. Use of the platform must comply with applicable laws and platform usage policies.
          </p>
          <p>
            Solver outputs and performance analytics are provided on an as-is basis for learning and product
            exploration. Users are responsible for how they interpret and apply generated insights.
          </p>
          <p>
            The QueenMind interface, branding, and content remain protected by applicable intellectual property rights.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
