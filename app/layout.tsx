import type { Metadata } from "next";
import { Sora, Space_Grotesk } from "next/font/google";

import "@/app/globals.css";
import { PersistentLabsHost } from "@/components/app-shell/persistent-labs-host";
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
  title: "QueenMind | N-Queen Visual Solver",
  description:
    "QueenMind is a premium visual dashboard shell for exploring and understanding N-Queen solving patterns."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          "min-h-screen bg-background font-sans text-foreground antialiased",
          sora.variable,
          spaceGrotesk.variable
        )}
      >
        <PersistentLabsHost />
        {children}
      </body>
    </html>
  );
}
