import type { SolverAlgorithm } from "@/types/chessboard";

export type CapabilityTier = "entry" | "balanced" | "high" | "enthusiast";

export type HardwareProfile = {
  hardwareThreads: number | null;
  deviceMemoryGb: number | null;
  workerSupported: boolean;
  isSecureContext: boolean;
  sharedArrayBufferSupported: boolean;
  userAgent: string;
  parallelSuitability: "excellent" | "good" | "limited" | "unsupported";
  capabilityTier: CapabilityTier;
};

export type HardwareRecommendation = {
  recommendedAlgorithm: SolverAlgorithm;
  recommendedModeLabel: string;
  recommendedBoardRange: string;
  notes: string[];
};

function resolveCapabilityTier(hardwareThreads: number | null, deviceMemoryGb: number | null): CapabilityTier {
  const threads = hardwareThreads ?? 2;
  const memory = deviceMemoryGb ?? 4;
  const score = threads * 1.2 + memory * 0.8;

  if (score >= 24) {
    return "enthusiast";
  }
  if (score >= 15) {
    return "high";
  }
  if (score >= 8) {
    return "balanced";
  }
  return "entry";
}

function resolveParallelSuitability(
  workerSupported: boolean,
  hardwareThreads: number | null,
  isSecureContext: boolean
): HardwareProfile["parallelSuitability"] {
  if (!workerSupported) {
    return "unsupported";
  }

  if (!isSecureContext) {
    return "limited";
  }

  const threads = hardwareThreads ?? 2;
  if (threads >= 10) {
    return "excellent";
  }
  if (threads >= 6) {
    return "good";
  }
  return "limited";
}

export function detectHardwareProfile(): HardwareProfile {
  if (typeof navigator === "undefined" || typeof window === "undefined") {
    return {
      hardwareThreads: null,
      deviceMemoryGb: null,
      workerSupported: false,
      isSecureContext: false,
      sharedArrayBufferSupported: false,
      userAgent: "unknown",
      parallelSuitability: "unsupported",
      capabilityTier: "entry"
    };
  }

  const hardwareThreads = typeof navigator.hardwareConcurrency === "number" ? navigator.hardwareConcurrency : null;
  const maybeDeviceMemory = navigator as Navigator & { deviceMemory?: number };
  const deviceMemoryGb = typeof maybeDeviceMemory.deviceMemory === "number" ? maybeDeviceMemory.deviceMemory : null;
  const workerSupported = typeof Worker !== "undefined";
  const isSecureContext = window.isSecureContext;
  const sharedArrayBufferSupported = typeof SharedArrayBuffer !== "undefined";
  const capabilityTier = resolveCapabilityTier(hardwareThreads, deviceMemoryGb);
  const parallelSuitability = resolveParallelSuitability(workerSupported, hardwareThreads, isSecureContext);

  return {
    hardwareThreads,
    deviceMemoryGb,
    workerSupported,
    isSecureContext,
    sharedArrayBufferSupported,
    userAgent: navigator.userAgent,
    parallelSuitability,
    capabilityTier
  };
}

export function getHardwareRecommendation(profile: HardwareProfile): HardwareRecommendation {
  if (profile.parallelSuitability === "excellent") {
    return {
      recommendedAlgorithm: "parallel",
      recommendedModeLabel: "Parallel Turbo Mode",
      recommendedBoardRange: "10x10 to 16x16",
      notes: [
        "Web Workers are well supported on this device.",
        "Use Auto Split Depth for strongest multicore balancing."
      ]
    };
  }

  if (profile.parallelSuitability === "good") {
    return {
      recommendedAlgorithm: "parallel",
      recommendedModeLabel: "Parallel Solver",
      recommendedBoardRange: "8x8 to 14x14",
      notes: ["Parallel solving should be beneficial for medium and large boards."]
    };
  }

  if (profile.capabilityTier === "entry") {
    return {
      recommendedAlgorithm: "optimized",
      recommendedModeLabel: "Optimized Solver",
      recommendedBoardRange: "4x4 to 10x10",
      notes: ["Prefer first-solution mode for smooth live visualization on entry hardware."]
    };
  }

  return {
    recommendedAlgorithm: "bitmask",
    recommendedModeLabel: "Bitmask Solver",
    recommendedBoardRange: "6x6 to 14x14",
    notes: ["Bitmask mode gives strong speed without requiring heavy worker parallelism."]
  };
}
