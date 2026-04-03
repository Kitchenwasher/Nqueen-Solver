import type { Metadata } from "next";
import { Sora, Space_Grotesk } from "next/font/google";
import Link from "next/link";

import "@/app/globals.css";
import { PersistentLabsHost } from "@/components/app-shell/persistent-labs-host";
import { getSiteUrl, siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "500", "600", "700"]
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "700"]
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "QueenMind | N-Queen Solver Platform",
    template: "%s | QueenMind"
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.creatorName }],
  creator: siteConfig.creatorName,
  publisher: siteConfig.legalName,
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: "QueenMind | N-Queen Solver Platform",
    description: siteConfig.description,
    url: "/",
    images: [
      {
        url: siteConfig.defaultOgImage,
        width: 1200,
        height: 630,
        alt: "QueenMind N-Queen solver dashboard preview"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "QueenMind | N-Queen Solver Platform",
    description: siteConfig.description,
    images: [siteConfig.defaultOgImage]
  },
  category: "technology"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = getSiteUrl().toString().replace(/\/$/, "");
  const currentYear = new Date().getFullYear();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        name: siteConfig.creatorName,
        jobTitle: siteConfig.creatorRole,
        email: siteConfig.creatorEmail,
        url: siteUrl,
        sameAs: [siteConfig.githubUrl, siteConfig.linkedinUrl]
      },
      {
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteUrl,
        description: siteConfig.description,
        publisher: {
          "@type": "Organization",
          name: siteConfig.legalName
        }
      }
    ]
  };

  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          "min-h-screen bg-background font-sans text-foreground antialiased",
          sora.variable,
          spaceGrotesk.variable
        )}
      >
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <PersistentLabsHost />
        {children}
        <footer className="relative z-10 border-t border-border/55 bg-background/45 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-[2100px] flex-col gap-2 px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>
              © {currentYear} {siteConfig.legalName}. Built for trustworthy algorithm exploration.
            </p>
            <nav className="flex flex-wrap items-center gap-3 text-sm">
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-foreground">
                Contact
              </Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
