"use client";

import { Cpu, MemoryStick, MonitorCog, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useHardwareProfile } from "@/hooks/use-hardware-profile";
import type { SolverAlgorithm } from "@/types/chessboard";

type HardwareInfoCardProps = {
  currentAlgorithm: SolverAlgorithm;
  compactCardClass: string;
};

function getAlgorithmLabel(algorithm: SolverAlgorithm) {
  if (algorithm === "optimized") {
    return "Optimized Solver";
  }
  if (algorithm === "bitmask") {
    return "Bitmask Solver";
  }
  if (algorithm === "parallel") {
    return "Parallel Solver";
  }
  return "Classic Backtracking";
}

function prettySuitability(value: "excellent" | "good" | "limited" | "unsupported") {
  if (value === "excellent") {
    return "Excellent";
  }
  if (value === "good") {
    return "Good";
  }
  if (value === "limited") {
    return "Limited";
  }
  return "Unsupported";
}

function prettyTier(value: "entry" | "balanced" | "high" | "enthusiast") {
  if (value === "entry") {
    return "Entry";
  }
  if (value === "balanced") {
    return "Balanced";
  }
  if (value === "high") {
    return "High";
  }
  return "Enthusiast";
}

export function HardwareInfoCard({ currentAlgorithm, compactCardClass }: HardwareInfoCardProps) {
  const { profile, recommendation } = useHardwareProfile();

  return (
    <article className={compactCardClass}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">System Intelligence</p>
        <MonitorCog className="h-3.5 w-3.5 text-primary" />
      </div>

      <div className="space-y-1 text-xs">
        <p className="flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5 text-primary" />
          Detected {profile.hardwareThreads ?? "unknown"} hardware threads
        </p>
        <p className="flex items-center gap-1.5 text-muted-foreground">
          <MemoryStick className="h-3.5 w-3.5 text-primary" />
          Approx memory: {profile.deviceMemoryGb ? `${profile.deviceMemoryGb} GB` : "not reported by browser"}
        </p>
        <p className="text-muted-foreground">
          Device capability: {prettyTier(profile.capabilityTier)} | Parallel suitability:{" "}
          {prettySuitability(profile.parallelSuitability)}
        </p>
        <p className="font-semibold">
          Recommended: {recommendation.recommendedModeLabel} ({getAlgorithmLabel(recommendation.recommendedAlgorithm)})
        </p>
        <p className="text-muted-foreground">Recommended live visualization range: {recommendation.recommendedBoardRange}</p>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge variant="outline">{profile.workerSupported ? "Web Workers: supported" : "Web Workers: unavailable"}</Badge>
        <Badge variant="outline">{profile.isSecureContext ? "Secure context" : "Non-secure context"}</Badge>
        <Badge variant="outline">
          {profile.sharedArrayBufferSupported ? "SharedArrayBuffer: available" : "SharedArrayBuffer: unavailable"}
        </Badge>
      </div>

      {currentAlgorithm !== recommendation.recommendedAlgorithm && (
        <p className="mt-2 text-xs text-amber-200">
          <Sparkles className="mr-1 inline h-3.5 w-3.5" />
          Current algorithm differs from recommended profile mode.
        </p>
      )}
      {recommendation.notes.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{recommendation.notes[0]}</p>}
    </article>
  );
}
