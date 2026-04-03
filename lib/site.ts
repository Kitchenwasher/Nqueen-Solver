export const siteConfig = {
  name: "QueenMind",
  shortName: "QueenMind",
  description:
    "QueenMind is a premium N-Queen solver platform with interactive labs for classic, optimized, bitmask, and parallel strategies.",
  creatorName: "Abhinav Sharma",
  creatorRole: "Founder and Product Engineer",
  creatorEmail: "abhinasharma2005@gmail.com",
  githubUrl: "https://github.com/Kitchenwasher",
  linkedinUrl: "https://www.linkedin.com/in/abhinav-sharma-java",
  legalName: "QueenMind Labs",
  defaultOgImage: "/images/queenmind-og.svg"
} as const;

export function getSiteUrl() {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined) ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  return envUrl ? new URL(envUrl) : new URL("https://queenmind.vercel.app");
}
