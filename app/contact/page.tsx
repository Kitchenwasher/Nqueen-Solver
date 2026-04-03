import type { Metadata } from "next";
import Link from "next/link";
import { Github, Linkedin, Mail } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact QueenMind for collaboration, product feedback, and project opportunities.",
  alternates: {
    canonical: "/contact"
  }
};

const contactLinks = [
  {
    label: "Email",
    href: `mailto:${siteConfig.creatorEmail}`,
    icon: Mail,
    external: true
  },
  {
    label: "GitHub",
    href: siteConfig.githubUrl,
    icon: Github,
    external: true
  },
  {
    label: "LinkedIn",
    href: siteConfig.linkedinUrl,
    icon: Linkedin,
    external: true
  }
] as const;

export default function ContactPage() {
  return (
    <main className="relative z-10 mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <Card className="glass-panel border-border/70">
        <CardHeader>
          <p className="mono text-xs uppercase tracking-[0.16em] text-primary/80">Contact</p>
          <CardTitle className="text-2xl [font-family:var(--font-space-grotesk)]">Let&apos;s Collaborate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Reach out for product collaboration, algorithm education tooling, or performance-lab discussions around
            QueenMind.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {contactLinks.map((item) => {
              const Icon = item.icon;

              if (item.external) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="glass-elevated inline-flex items-center gap-2 rounded-lg px-3 py-2 text-foreground transition-colors hover:text-primary"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </a>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="glass-elevated inline-flex items-center gap-2 rounded-lg px-3 py-2 text-foreground transition-colors hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
