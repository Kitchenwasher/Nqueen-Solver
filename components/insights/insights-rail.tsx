import { memo, type ComponentProps } from "react";

import { InsightsSidebar } from "@/components/dashboard/insights-sidebar";

export type InsightsRailProps = ComponentProps<typeof InsightsSidebar>;

function InsightsRailComponent(props: InsightsRailProps) {
  return <InsightsSidebar {...props} />;
}

export const InsightsRail = memo(InsightsRailComponent);
