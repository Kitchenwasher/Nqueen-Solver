import type { ComponentProps } from "react";

import { NavigationSidebar } from "@/components/dashboard/navigation-sidebar";

type AppSidebarProps = ComponentProps<typeof NavigationSidebar>;

export function AppSidebar(props: AppSidebarProps) {
  return <NavigationSidebar {...props} />;
}
