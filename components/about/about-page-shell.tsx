"use client";

import Link from "next/link";
import Image from "next/image";
import type { ComponentType, ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Binary,
  BookOpenText,
  BrainCircuit,
  Compass,
  Cpu,
  Crown,
  FlaskConical,
  Gauge,
  Github,
  Globe,
  GraduationCap,
  Layers3,
  Linkedin,
  LineChart,
  Mail,
  MonitorCog,
  Palette,
  Radar,
  Rocket,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Target,
  Waypoints,
  Workflow
} from "lucide-react";

import { DashboardAppShell } from "@/components/dashboard/dashboard-app-shell";
import { AnimatedGridBackground } from "@/components/effects/animated-grid-background";
import { GlowBorder } from "@/components/effects/glow-border";
import { GradientOverlay } from "@/components/effects/gradient-overlay";
import { SpotlightBackground } from "@/components/effects/spotlight-background";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { aboutPageContent, type AboutIconKey, type AboutLink } from "@/data/about-content";

type AboutPageShellProps = {
  isVisible?: boolean;
};

const iconMap: Record<AboutIconKey, ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  "arrow-up-right": ArrowUpRight,
  cpu: Cpu,
  crown: Crown,
  compass: Compass,
  rocket: Rocket,
  target: Target,
  "brain-circuit": BrainCircuit,
  "line-chart": LineChart,
  "shield-check": ShieldCheck,
  github: Github,
  linkedin: Linkedin,
  globe: Globe,
  mail: Mail,
  "flask-conical": FlaskConical,
  "book-open-text": BookOpenText,
  "monitor-cog": MonitorCog,
  "graduation-cap": GraduationCap,
  gauge: Gauge,
  "layers-3": Layers3,
  binary: Binary,
  "server-cog": ServerCog,
  palette: Palette,
  workflow: Workflow,
  waypoints: Waypoints,
  radar: Radar
};

function AboutLinkButton({ item, size = "default" }: { item: AboutLink; size?: "default" | "sm" }) {
  const ItemIcon = iconMap[item.icon];
  const variant = item.variant ?? "outline";

  const content: ReactNode = (
    <>
      {item.label}
      <ItemIcon className="h-4 w-4" />
    </>
  );

  if (item.external) {
    return (
      <Button asChild variant={variant} className="gap-1.5" size={size}>
        <a href={item.href} target="_blank" rel="noreferrer">
          {content}
        </a>
      </Button>
    );
  }

  return (
    <Button asChild variant={variant} className="gap-1.5" size={size}>
      <Link href={item.href}>{content}</Link>
    </Button>
  );
}

function ContactLinkCard({ item, index }: { item: AboutLink; index: number }) {
  const ItemIcon = iconMap[item.icon];
  const handlePlayAudio = () => {
    const audio = new Audio(item.href);
    void audio.play();
  };
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: "easeOut", delay: 0.34 + index * 0.03 }}
      whileHover={{ y: -2 }}
      className="h-full"
    >
      <Card className="glass-elevated hover-shine card-lift h-full border-border/65 bg-gradient-to-br from-background/75 via-background/55 to-primary/7">
        <CardContent className="flex h-full flex-col justify-between gap-3 p-4">
          <div className="space-y-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
              <ItemIcon className="h-4.5 w-4.5" />
            </span>
            <p className="text-sm font-semibold text-foreground/95">{item.label}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{item.description ?? "Open link"}</p>
          </div>
          <Badge variant="outline" className="w-fit border-primary/30 bg-primary/8 text-primary/90">
            Open
          </Badge>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (item.playAudio) {
    return (
      <button type="button" onClick={handlePlayAudio} className="block h-full text-left">
        {content}
      </button>
    );
  }

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className="block h-full">
        {content}
      </a>
    );
  }

  return (
    <Link href={item.href} className="block h-full">
      {content}
    </Link>
  );
}

function SectionIntro({
  title,
  description,
  accent
}: {
  title: string;
  description?: string;
  accent?: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="mono text-[11px] uppercase tracking-[0.18em] text-primary/80">{title}</p>
      {description ? <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
      {accent ? (
        <p className="text-xs font-medium tracking-wide text-foreground/85 [font-family:var(--font-space-grotesk)]">{accent}</p>
      ) : null}
    </div>
  );
}

export function AboutPageShell({ isVisible: _isVisible = true }: AboutPageShellProps) {
  void _isVisible;
  const HeroBadgeIcon = iconMap.sparkles;

  return (
    <DashboardAppShell
      page="about"
      title={aboutPageContent.shell.title}
      subtitle={aboutPageContent.shell.subtitle}
      quickActions={
        <div className="hidden items-center gap-1.5 md:flex">
          {aboutPageContent.quickActions.map((action) => (
            <Button key={action.label} asChild variant="outline" size="sm">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ))}
        </div>
      }
      activeSection="learn"
      onSectionNavigate={() => {
        // Dedicated route: section callbacks are intentionally inert.
      }}
      solverLiveLabel={aboutPageContent.shell.solverLiveLabel}
      multiAlgorithmEnabled={false}
    >
      <div className="relative mx-auto w-full max-w-[1320px] space-y-6 pb-2">
        <div className="pointer-events-none absolute -top-10 left-1/2 h-72 w-[82%] -translate-x-1/2 rounded-full bg-primary/6 blur-3xl" />
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative"
        >
          <GlowBorder intensity="medium" className="rounded-2xl p-[1px]">
            <Card className="glass-panel overflow-hidden border-primary/30 bg-gradient-to-br from-primary/12 via-background/90 to-background/60">
              <div className="pointer-events-none absolute inset-0">
                <SpotlightBackground className="opacity-45" />
                <AnimatedGridBackground className="opacity-14" />
                <GradientOverlay className="opacity-55" />
              </div>
              <motion.div
                className="pointer-events-none absolute -left-16 top-8 h-52 w-52 rounded-full bg-primary/20 blur-3xl"
                animate={{ x: [0, 14, 0], y: [0, -8, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="pointer-events-none absolute -right-12 bottom-6 h-44 w-44 rounded-full bg-accent/25 blur-3xl"
                animate={{ x: [0, -10, 0], y: [0, 8, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              />

              <CardContent className="relative p-5 sm:p-7 lg:p-8">
                <div className="grid items-stretch gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="space-y-4">
                    <Badge variant="outline" className="w-fit border-primary/40 bg-primary/10 text-primary">
                      <HeroBadgeIcon className="mr-1.5 h-3.5 w-3.5" />
                      {aboutPageContent.hero.pageHeading}
                    </Badge>
                    <p className="mono text-[11px] uppercase tracking-[0.19em] text-primary/75">{aboutPageContent.hero.creatorTitle}</p>
                    <h2 className="max-w-4xl text-3xl font-semibold leading-tight sm:text-4xl lg:text-[3.1rem] [font-family:var(--font-space-grotesk)]">
                      {aboutPageContent.hero.creatorName}
                    </h2>
                    <p className="max-w-4xl text-lg text-foreground/90 sm:text-xl">{aboutPageContent.hero.tagline}</p>
                    <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                      {aboutPageContent.hero.mission}
                    </p>
                    <div className="flex flex-wrap gap-2.5 pt-1">
                      {aboutPageContent.hero.ctas.map((item) => (
                        <AboutLinkButton key={item.label} item={item} />
                      ))}
                    </div>
                    <div className="space-y-2.5 pt-2">
                      <div className="h-px w-full bg-gradient-to-r from-primary/35 via-border/55 to-transparent" />
                      <div className="flex flex-wrap gap-2">
                        {aboutPageContent.hero.highlights.map((item) => (
                          <Badge
                            key={item}
                            variant="secondary"
                            className="badge-animate rounded-full border border-border/55 bg-secondary/60 px-3 py-1 text-[12px] text-secondary-foreground"
                          >
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Card className="glass-elevated relative overflow-hidden border-border/70 bg-background/35">
                    <div className="pointer-events-none absolute inset-0 bg-grid-noise opacity-25 [background-size:17px_17px]" />
                    <motion.div
                      className="pointer-events-none absolute right-3 top-3 h-16 w-16 rounded-full bg-primary/18 blur-2xl"
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <CardHeader className="relative pb-3">
                      <Badge variant="secondary" className="w-fit gap-1.5 bg-secondary/70">
                        <Crown className="h-3.5 w-3.5" />
                        {aboutPageContent.hero.identityPanel.badge}
                      </Badge>
                      <CardTitle className="text-xl [font-family:var(--font-space-grotesk)]">
                        {aboutPageContent.hero.identityPanel.title}
                      </CardTitle>
                      <CardDescription>{aboutPageContent.hero.identityPanel.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="relative space-y-4 pt-0">
                      <div className="flex flex-wrap gap-2">
                        {aboutPageContent.hero.identityPanel.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="border-primary/30 bg-primary/8 text-primary/90">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="grid gap-2">
                        {aboutPageContent.hero.identityPanel.metrics.map((metric) => (
                          <div
                            key={metric.label}
                            className="rounded-lg border border-border/60 bg-background/35 px-3 py-2.5"
                          >
                            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{metric.label}</p>
                            <p className="mt-1 text-sm font-medium text-foreground/95">{metric.value}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </GlowBorder>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.38, ease: "easeOut", delay: 0.04 }}
        >
          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: "easeOut" }}>
            <GlowBorder intensity="low" className="rounded-2xl p-[1px]">
              <Card className="glass-elevated hover-shine card-lift overflow-hidden border-border/70 bg-gradient-to-br from-background/80 via-background/55 to-accent/10">
                <motion.div
                  className="pointer-events-none absolute -left-10 top-8 h-24 w-24 rounded-full bg-primary/20 blur-2xl"
                  animate={{ opacity: [0.45, 0.65, 0.45] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <CardHeader>
                  <CardTitle className="text-lg">{aboutPageContent.creatorProfile.sectionTitle}</CardTitle>
                  <CardDescription>{aboutPageContent.creatorProfile.sectionDescription}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5 lg:grid-cols-[280px_1fr]">
                  <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/18 via-background/50 to-accent/20 p-5">
                    <div className="pointer-events-none absolute inset-0 bg-grid-noise opacity-25 [background-size:18px_18px]" />
                    <motion.div
                      className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-accent/20 blur-2xl"
                      animate={{ scale: [1, 1.07, 1] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <div className="relative flex h-full min-h-[220px] items-center justify-center">
                      <div className="relative h-28 w-28 overflow-hidden rounded-[1.3rem] border border-primary/40 bg-background/60 shadow-[0_0_0_1px_rgba(82,255,232,0.24),0_18px_34px_rgba(7,14,40,0.58)]">
                        <Image
                          src="/images/queenmind-profile.svg"
                          alt="QueenMind creator profile visual"
                          fill
                          sizes="112px"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold [font-family:var(--font-space-grotesk)]">{aboutPageContent.creatorProfile.name}</h3>
                      <p className="mt-1 text-sm text-primary/90">{aboutPageContent.creatorProfile.role}</p>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{aboutPageContent.creatorProfile.bio}</p>
                    <div className="flex flex-wrap gap-2">
                      {aboutPageContent.creatorProfile.badges.map((badge) => {
                        const BadgeIcon = iconMap[badge.icon];
                        return (
                          <Badge key={badge.label} variant="secondary" className="gap-1.5 bg-secondary/70 px-3 py-1">
                            <BadgeIcon className="h-3.5 w-3.5" />
                            {badge.label}
                          </Badge>
                        );
                      })}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {aboutPageContent.creatorProfile.quickStats.map((stat) => (
                        <div key={stat.label} className="rounded-lg border border-border/60 bg-background/35 px-3 py-2.5">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{stat.label}</p>
                          <p className="mt-1 text-sm font-medium text-foreground/95">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </GlowBorder>
          </motion.div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.08 }}
          className="grid items-start gap-4 xl:grid-cols-[0.85fr_1.15fr]"
        >
          <Card className="glass-panel self-start border-border/65 bg-gradient-to-br from-background/82 via-background/58 to-primary/8">
            <CardHeader className="space-y-3">
              <Badge variant="outline" className="w-fit border-primary/35 bg-primary/10 text-primary">
                <BookOpenText className="mr-1.5 h-3.5 w-3.5" />
                Product Story
              </Badge>
              <CardTitle className="text-xl [font-family:var(--font-space-grotesk)]">{aboutPageContent.aboutQueenmind.sectionTitle}</CardTitle>
              <CardDescription className="text-sm leading-relaxed">{aboutPageContent.aboutQueenmind.sectionDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="rounded-xl border border-border/60 bg-background/35 p-3">
                <p className="mono text-[11px] uppercase tracking-[0.16em] text-primary/80">Identity Statement</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {aboutPageContent.aboutQueenmind.identityStatement}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/30 p-3">
                <p className="mono text-[11px] uppercase tracking-[0.16em] text-primary/80">Strategic Pillars</p>
                <div className="mt-2 space-y-2">
                  {aboutPageContent.aboutQueenmind.pillars.map((pillar) => (
                    <div key={pillar} className="flex items-start gap-2">
                      <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-primary/75" />
                      <p className="text-sm text-muted-foreground">{pillar}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-primary/25 bg-gradient-to-r from-primary/8 via-background/35 to-accent/10 p-3.5">
                <p className="text-sm italic leading-relaxed text-foreground/90">
                  &ldquo;{aboutPageContent.aboutQueenmind.founderQuote}&rdquo;
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-border/55 pt-2.5">
                  <p className="text-sm font-medium [font-family:var(--font-space-grotesk)]">
                    {aboutPageContent.aboutQueenmind.signature.name}
                  </p>
                  <Badge variant="outline" className="border-primary/30 bg-primary/8 text-primary/90">
                    {aboutPageContent.aboutQueenmind.signature.role}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {aboutPageContent.aboutQueenmind.cards.map((card, index) => {
              const StoryIcon = iconMap[card.icon];
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.28, ease: "easeOut", delay: 0.1 + index * 0.04 }}
                  whileHover={{ y: -1.5 }}
                >
                  <Card className="glass-elevated card-lift border-border/65 bg-gradient-to-b from-background/72 to-background/30">
                    <CardHeader className="space-y-2 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="w-fit border-primary/35 bg-primary/10 text-primary">
                          {card.anchor}
                        </Badge>
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                          <StoryIcon className="h-3.5 w-3.5" />
                        </span>
                      </div>
                      <CardTitle className="text-base">{card.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm leading-relaxed text-muted-foreground">{card.description}</CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.44, ease: "easeOut", delay: 0.12 }}
          className="space-y-3"
        >
          <SectionIntro
            title={aboutPageContent.coreFeatures.sectionTitle}
            description={aboutPageContent.coreFeatures.sectionDescription}
            accent="Built as composable product capabilities."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {aboutPageContent.coreFeatures.items.map((item, index) => {
              const FeatureIcon = iconMap[item.icon];
              const isLastCard = index === aboutPageContent.coreFeatures.items.length - 1;
              const singleInLastMdRow = aboutPageContent.coreFeatures.items.length % 2 === 1;
              const singleInLastXlRow = aboutPageContent.coreFeatures.items.length % 3 === 1;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24, ease: "easeOut", delay: 0.14 + index * 0.03 }}
                  whileHover={{ y: -2 }}
                  className={[
                    isLastCard && singleInLastMdRow ? "md:col-span-2" : "",
                    isLastCard && singleInLastXlRow ? "xl:col-span-3" : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <Card className="glass-elevated hover-shine card-lift relative overflow-hidden border-border/65 bg-gradient-to-br from-background/75 via-background/55 to-primary/5">
                    <motion.div
                      className="pointer-events-none absolute -right-7 -top-8 h-24 w-24 rounded-full bg-primary/18 blur-2xl"
                      animate={{ scale: [1, 1.06, 1], opacity: [0.45, 0.7, 0.45] }}
                      transition={{ duration: 5 + index * 0.4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <CardHeader className="space-y-2 pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                          <FeatureIcon className="h-4.5 w-4.5" />
                        </span>
                        <Badge variant="outline" className="border-primary/30 bg-primary/8 text-primary/90">
                          Capability
                        </Badge>
                      </div>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/65">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-primary to-blue-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${56 + (index % 4) * 10}%` }}
                          transition={{ duration: 0.65, delay: 0.18 + index * 0.03, ease: "easeOut" }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.46, ease: "easeOut", delay: 0.16 }}
          className="space-y-3"
        >
          <SectionIntro
            title={aboutPageContent.techStack.sectionTitle}
            description={aboutPageContent.techStack.sectionDescription}
            accent="Balanced for interaction quality and runtime efficiency."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {aboutPageContent.techStack.groups.map((group, index) => {
              const GroupIcon = iconMap[group.icon];
              return (
                <motion.div
                  key={group.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.26, ease: "easeOut", delay: 0.18 + index * 0.03 }}
                  whileHover={{ y: -1.5 }}
                >
                  <Card className="glass-panel hover-shine card-lift overflow-hidden border-border/65 bg-background/40">
                    <CardHeader className="space-y-2 pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-primary">
                          <GroupIcon className="h-4.5 w-4.5" />
                          <CardTitle className="text-base">{group.title}</CardTitle>
                        </div>
                        <Badge variant="outline" className="border-primary/30 bg-primary/8 text-primary/90">
                          Stack
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-2">
                        {group.items.map((item) => (
                          <Badge
                            key={item}
                            variant="secondary"
                            className="badge-animate rounded-full border border-border/55 bg-secondary/60 px-3 py-1 text-[12px] text-secondary-foreground"
                          >
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.48, ease: "easeOut", delay: 0.2 }}
          className="grid gap-4 lg:grid-cols-2"
        >
          <Card className="glass-panel border-border/70 bg-gradient-to-br from-background/75 via-background/50 to-primary/6">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <Waypoints className="h-4.5 w-4.5" />
                <CardTitle className="text-lg">{aboutPageContent.philosophy.sectionTitle}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <h3 className="text-base font-semibold">{aboutPageContent.philosophy.points[0].title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{aboutPageContent.philosophy.points[0].description}</p>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/70 bg-gradient-to-br from-background/75 via-background/50 to-accent/8">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <Radar className="h-4.5 w-4.5" />
                <CardTitle className="text-lg">Engineering Intent</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <h3 className="text-base font-semibold">{aboutPageContent.philosophy.points[1].title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{aboutPageContent.philosophy.points[1].description}</p>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.24 }}
          className="space-y-3"
        >
          <SectionIntro
            title={aboutPageContent.roadmap.sectionTitle}
            description={aboutPageContent.roadmap.sectionDescription}
            accent="Forward roadmap across scale, intelligence, and collaboration."
          />
          <Card className="glass-panel border-border/65 bg-gradient-to-br from-background/78 via-background/56 to-primary/7">
            <CardContent className="p-4 sm:p-5">
              <div className="relative space-y-3">
                <div className="pointer-events-none absolute bottom-0 left-[14px] top-1 w-px bg-gradient-to-b from-primary/50 via-primary/25 to-transparent" />
                {aboutPageContent.roadmap.items.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.28, ease: "easeOut", delay: 0.12 + index * 0.03 }}
                    className="relative pl-9"
                  >
                    <span className="absolute left-[6px] top-[18px] z-10 h-4 w-4 rounded-full border border-primary/40 bg-primary/20 shadow-[0_0_0_4px_rgba(82,255,232,0.06)]" />
                    <Card className="glass-elevated border-border/60 bg-gradient-to-b from-background/74 to-background/35">
                      <CardHeader className="space-y-2 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="w-fit border-primary/35 bg-primary/10 text-primary">
                            {item.label}
                          </Badge>
                          <Badge variant="secondary" className="bg-secondary/65 text-xs">
                            Roadmap
                          </Badge>
                        </div>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 text-sm leading-relaxed text-muted-foreground">{item.description}</CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.52, ease: "easeOut", delay: 0.28 }}
        >
          <Card className="glass-panel border-border/70 bg-gradient-to-br from-background/75 via-background/55 to-primary/7">
            <CardHeader>
              <CardTitle className="text-lg">{aboutPageContent.contact.sectionTitle}</CardTitle>
              <CardDescription>{aboutPageContent.contact.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {aboutPageContent.contact.links.map((item, index) => (
                  <ContactLinkCard key={item.label} item={item} index={index} />
                ))}
              </div>
              <div className="mt-3 flex justify-end">
                <Badge variant="secondary" className="bg-secondary/65 text-xs">
                  Professional Links
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: "easeOut", delay: 0.32 }}
          className="pb-1"
        >
          <Card className="glass-elevated overflow-hidden border-primary/30 bg-gradient-to-r from-primary/8 via-background/45 to-accent/10">
            <motion.div
              className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/20 blur-3xl"
              animate={{ scale: [1, 1.08, 1], opacity: [0.45, 0.7, 0.45] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <CardContent className="space-y-3 py-6 text-center sm:py-7">
              <p className="text-base font-medium text-foreground/95 sm:text-lg [font-family:var(--font-space-grotesk)]">
                {aboutPageContent.footerCta.line}
              </p>
              <p className="text-sm text-muted-foreground">{aboutPageContent.footerCta.subline}</p>
              <Badge variant="outline" className="mx-auto w-fit border-primary/35 bg-primary/10 text-primary">
                {aboutPageContent.footerCta.memeLine}
              </Badge>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                {aboutPageContent.footerCta.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="badge-animate rounded-full border border-border/55 bg-secondary/60 px-3 py-1 text-[12px] text-secondary-foreground"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </DashboardAppShell>
  );
}
