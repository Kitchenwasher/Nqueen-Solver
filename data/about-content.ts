export type AboutIconKey =
  | "sparkles"
  | "arrow-up-right"
  | "cpu"
  | "crown"
  | "compass"
  | "rocket"
  | "target"
  | "brain-circuit"
  | "line-chart"
  | "shield-check"
  | "github"
  | "linkedin"
  | "globe"
  | "mail"
  | "flask-conical"
  | "book-open-text"
  | "monitor-cog"
  | "graduation-cap"
  | "gauge"
  | "layers-3"
  | "binary"
  | "server-cog"
  | "palette"
  | "workflow"
  | "waypoints"
  | "radar";

export type AboutLink = {
  label: string;
  href: string;
  icon: AboutIconKey;
  description?: string;
  external?: boolean;
  variant?: "default" | "outline" | "secondary";
};

export type AboutBadgeItem = {
  label: string;
  icon: AboutIconKey;
};

export type AboutStatItem = {
  label: string;
  value: string;
};

export type AboutFeatureItem = {
  title: string;
  description: string;
  icon: AboutIconKey;
};

export type AboutStoryBlock = {
  title: string;
  description: string;
  icon: AboutIconKey;
  anchor: string;
};

export type AboutTechStackGroup = {
  title: string;
  icon: AboutIconKey;
  items: readonly string[];
};

export const aboutPageContent = {
  shell: {
    title: "About QueenMind",
    subtitle: "Creator profile, platform vision, and build philosophy behind the N-Queen ecosystem.",
    solverLiveLabel: "About Live"
  },
  quickActions: [
    { label: "Open Solver", href: "/" },
    { label: "Open Benchmark", href: "/benchmark" },
    { label: "Open Insights", href: "/insights" }
  ] as const,
  hero: {
    pageHeading: "Behind QueenMind",
    creatorName: "QueenMind Creator",
    creatorTitle: "Algorithm Product Engineer",
    tagline: "Designing interfaces where search, speed, and strategy feel alive.",
    mission:
      "QueenMind is a premium product-lab for exploring the N-Queen problem through interaction, telemetry, and cinematic feedback loops. It is built to make complex algorithm behavior feel intuitive and compelling.",
    highlights: [
      "Real-Time Solver Telemetry",
      "Immersive Visual Debugging",
      "Performance-First Experimentation"
    ] as const,
    ctas: [
      { label: "View Project", href: "https://github.com/Kitchenwasher", icon: "arrow-up-right", external: true, variant: "default" },
      { label: "Contact", href: "mailto:abhinasharma2005@gmail.com", icon: "mail", external: true, variant: "outline" }
    ] as AboutLink[],
    identityPanel: {
      badge: "Product Identity",
      title: "Cinematic Solver Lab",
      description:
        "A premium interface language where algorithm state, performance telemetry, and learning context blend into one immersive system.",
      tags: ["Dark Futuristic UI", "Glassmorphism", "Telemetry-First UX"] as const,
      metrics: [
        { label: "Core Labs", value: "4+" },
        { label: "Solver Modes", value: "Classic to Parallel" },
        { label: "Interaction Style", value: "Cinematic + Precise" }
      ] as const
    }
  },
  creatorProfile: {
    sectionTitle: "Creator Profile",
    sectionDescription: "Personal product-lab identity focused on craft, clarity, and algorithm storytelling.",
    avatarPlaceholderLabel: "QM",
    name: "QueenMind Creator",
    role: "Full-Stack Developer, UI Designer, and Solver Architect",
    bio:
      "I build experimental systems where deep computer science concepts are translated into polished, high-trust product experiences with premium interaction quality.",
    badges: [
      { label: "Full Stack Developer", icon: "cpu" },
      { label: "Problem Solver", icon: "brain-circuit" },
      { label: "UI/UX Builder", icon: "palette" },
      { label: "Algorithm Enthusiast", icon: "workflow" },
      { label: "Computer Science Student", icon: "graduation-cap" }
    ] as AboutBadgeItem[],
    quickStats: [
      { label: "Projects Built", value: "20+" },
      { label: "Focus Areas", value: "Algorithm UX, Performance, Product Systems" },
      { label: "Favorite Stack", value: "Next.js + TypeScript + Framer Motion" },
      { label: "Current Mission", value: "Making complex algorithms intuitive and cinematic" }
    ] as AboutStatItem[]
  },
  aboutQueenmind: {
    sectionTitle: "About QueenMind",
    sectionDescription:
      "QueenMind is built as a modern algorithm product, not a one-screen demo. It combines engineering depth, visual clarity, and a premium interaction model to make computational thinking practical and memorable.",
    identityStatement: "Intelligent algorithm exploration, engineered as a premium product experience.",
    founderQuote: "I want algorithms to feel understandable, observable, and inspiring, not abstract and distant.",
    signature: {
      name: "QueenMind Creator",
      role: "Founder / Product Engineer"
    },
    pillars: [
      "Product-grade algorithm tooling",
      "Telemetry-first learning experience",
      "Scalable from beginner to advanced experimentation"
    ] as const,
    cards: [
      {
        title: "What It Is",
        anchor: "Identity",
        icon: "crown",
        description:
          "A complete N-Queen platform with solver workspace, benchmark/stress labs, insight surfaces, and educational context unified in one interface."
      },
      {
        title: "Why It Was Built",
        anchor: "Intention",
        icon: "rocket",
        description:
          "To bridge the gap between algorithm correctness and human understanding by making internal solver behavior observable, explainable, and measurable."
      },
      {
        title: "What Problem It Solves",
        anchor: "Gap",
        icon: "target",
        description:
          "Traditional algorithm demos show output, but hide reasoning. QueenMind surfaces search paths, tradeoffs, and performance signals so learners and builders can reason about process, not just final answers."
      },
      {
        title: "More Than an N-Queen Solver",
        anchor: "Platform",
        icon: "waypoints",
        description:
          "It is a product-lab for experimentation and insight: benchmark intelligence, challenge systems, educational scaffolding, and hardware-aware strategy guidance in one cohesive environment."
      }
    ] as AboutStoryBlock[]
  },
  coreFeatures: {
    sectionTitle: "Feature Showcase",
    sectionDescription: "A polished capability stack built for interactive learning, deep analysis, and performance experimentation.",
    items: [
      {
        title: "Interactive Solver Dashboard",
        description: "Control board size, strategy, constraints, and playback in a responsive solver workspace.",
        icon: "crown"
      },
      {
        title: "Benchmark Lab",
        description: "Run comparative performance experiments across algorithms, objectives, and board scales.",
        icon: "flask-conical"
      },
      {
        title: "Challenge / Puzzle Generator",
        description: "Generate constraint-driven puzzle scenarios with progression-friendly challenge configurations.",
        icon: "sparkles"
      },
      {
        title: "Search Tree Visualization",
        description: "Inspect branch expansion, pruning behavior, and recursion dynamics with clear visual structure.",
        icon: "waypoints"
      },
      {
        title: "Heatmaps / Educational Insights",
        description: "Understand solver behavior through board heatmaps, telemetry views, and guided explanations.",
        icon: "book-open-text"
      },
      {
        title: "Hardware-Aware Solver Recommendations",
        description: "Receive intelligent strategy guidance based on detected hardware capability and workload profile.",
        icon: "gauge"
      },
      {
        title: "Bitmask / Parallel Solver Support",
        description: "Scale from compact bitmask optimizations to multicore worker execution for demanding workloads.",
        icon: "binary"
      }
    ] as AboutFeatureItem[]
  },
  techStack: {
    sectionTitle: "Tech Stack",
    sectionDescription: "A modern engineering stack shaped for premium interaction quality and computational performance.",
    groups: [
      {
        title: "Frontend",
        icon: "layers-3",
        items: ["Next.js 14 (App Router)", "TypeScript", "React 18", "Tailwind CSS"]
      },
      {
        title: "UI / Design System",
        icon: "palette",
        items: ["shadcn/ui (Radix)", "Framer Motion", "lucide-react", "Glassmorphism Tokens"]
      },
      {
        title: "Solver / Algorithms",
        icon: "binary",
        items: ["Classic Backtracking", "Optimized Solver", "Bitmask Solver", "Search Strategy Controls"]
      },
      {
        title: "Performance / Parallelism",
        icon: "cpu",
        items: ["Web Workers", "Adaptive Split Depth", "Benchmark + Stress Diagnostics", "Hardware-Aware Recommendations"]
      },
      {
        title: "Visualization",
        icon: "monitor-cog",
        items: ["Search Tree Rendering", "Board Heatmaps", "Insights Dashboard", "Telemetry Signals"]
      },
      {
        title: "Deployment / Tooling",
        icon: "server-cog",
        items: ["Next.js Build Pipeline", "ESLint + TypeScript", "Vercel-Ready Architecture", "Modular App Shell"]
      }
    ] as AboutTechStackGroup[]
  },
  philosophy: {
    sectionTitle: "Design and Build Philosophy",
    points: [
      {
        title: "Interface Philosophy",
        description:
          "Every panel is built to reduce cognitive friction: information hierarchy first, motion as explanation, and glassmorphism as contextual layering."
      },
      {
        title: "Architecture Philosophy",
        description:
          "The codebase emphasizes modularity, persistent workspace state, and clean separations between presentation, solver behavior, and telemetry."
      }
    ] as const
  },
  roadmap: {
    sectionTitle: "Roadmap and Future Vision",
    sectionDescription:
      "A forward roadmap focused on scale, intelligence, collaboration, and accessibility across the QueenMind experience.",
    items: [
      {
        label: "Phase 01",
        title: "Larger Board Support",
        description: "Extend practical solving and visualization support for higher-N workloads with controlled resource strategies."
      },
      {
        label: "Phase 02",
        title: "Better Solver Analytics",
        description: "Introduce richer comparative analytics, run-history insights, and deeper branch-level performance diagnostics."
      },
      {
        label: "Phase 03",
        title: "AI-Assisted Strategy Recommendations",
        description: "Deliver contextual recommendations that suggest solver modes, heuristics, and execution plans per scenario."
      },
      {
        label: "Phase 04",
        title: "Collaborative Challenge Sharing",
        description: "Enable publishing, remixing, and sharing custom challenges with community-oriented progression paths."
      },
      {
        label: "Phase 05",
        title: "Multiplayer / Competitive Puzzle Mode",
        description: "Add competitive challenge races, timed rounds, and leaderboard mechanics for social problem-solving."
      },
      {
        label: "Phase 06",
        title: "Deeper Educational Simulations",
        description: "Expand interactive teaching modes with guided simulations for recursion, pruning, and strategy decisions."
      },
      {
        label: "Phase 07",
        title: "Mobile Optimization",
        description: "Refine layouts, controls, and interaction density for premium touch-first experiences on phones and tablets."
      }
    ] as const
  },
  contact: {
    sectionTitle: "Connect",
    description: "Professional channels for collaboration, project opportunities, and product conversations.",
    links: [
      {
        label: "GitHub",
        href: "https://github.com/Kitchenwasher",
        icon: "github",
        description: "Code, repositories, and technical experiments.",
        external: true,
        variant: "outline"
      },
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/abhinav-sharma-java",
        icon: "linkedin",
        description: "Professional updates and collaboration network.",
        external: true,
        variant: "outline"
      },
      {
        label: "Portfolio",
        href: "https://example.com/",
        icon: "globe",
        description: "Selected product work and case-study highlights.",
        external: true,
        variant: "outline"
      },
      {
        label: "Email",
        href: "mailto:abhinasharma2005@gmail.com",
        icon: "mail",
        description: "Direct contact for opportunities and discussions.",
        external: true,
        variant: "secondary"
      },
      {
        label: "Resume",
        href: "https://example.com/resume",
        icon: "book-open-text",
        description: "Experience snapshot and technical background.",
        external: true,
        variant: "outline"
      }
    ] as AboutLink[]
  },
  footerCta: {
    line: "Built to make algorithms feel alive.",
    subline: "From brute force panic to elegant pruning confidence.",
    memeLine: "Keep calm and prune the branch.",
    tags: ["No queen conflicts detected", "Recursion > confusion", "Backtracking, but make it premium"] as const
  }
} as const;
