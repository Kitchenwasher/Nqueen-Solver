"use client";

import { useEffect, useMemo, useState } from "react";

import { detectHardwareProfile, getHardwareRecommendation, type HardwareProfile } from "@/lib/system/hardware";

const UNKNOWN_PROFILE: HardwareProfile = {
  hardwareThreads: null,
  deviceMemoryGb: null,
  workerSupported: false,
  isSecureContext: false,
  sharedArrayBufferSupported: false,
  userAgent: "unknown",
  parallelSuitability: "unsupported",
  capabilityTier: "entry"
};

export function useHardwareProfile() {
  const [profile, setProfile] = useState<HardwareProfile>(UNKNOWN_PROFILE);

  useEffect(() => {
    setProfile(detectHardwareProfile());
  }, []);

  const recommendation = useMemo(() => getHardwareRecommendation(profile), [profile]);

  return {
    profile,
    recommendation
  };
}
