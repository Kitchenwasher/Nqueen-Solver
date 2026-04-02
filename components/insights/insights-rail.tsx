import type { ComponentProps } from "react";

import { InsightsSidebar } from "@/components/dashboard/insights-sidebar";

export type InsightsRailProps = ComponentProps<typeof InsightsSidebar>;

export function InsightsRail(props: InsightsRailProps) {
  return <InsightsSidebar {...props} />;
}
