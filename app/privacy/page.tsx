import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for QueenMind platform usage, telemetry, and local persistence behavior.",
  alternates: {
    canonical: "/privacy"
  }
};

export default function PrivacyPage() {
  return (
    <main className="relative z-10 mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <Card className="glass-panel border-border/70">
        <CardHeader>
          <p className="mono text-xs uppercase tracking-[0.16em] text-primary/80">Legal</p>
          <CardTitle className="text-2xl [font-family:var(--font-space-grotesk)]">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            QueenMind prioritizes transparent product behavior. Solver experiments run client-side, and lab state may be
            persisted locally in your browser to keep your workspace consistent across navigation.
          </p>
          <p>
            Diagnostic metrics shown in the product are intended for algorithm education and performance insights.
            Sensitive personal data is not intentionally requested in solver workflows.
          </p>
          <p>
            If you contact us directly, your message data is used only for communication and support related to
            QueenMind.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
