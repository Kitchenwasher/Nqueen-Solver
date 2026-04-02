import type { ComponentProps } from "react";

import { TopNavbar } from "@/components/dashboard/top-navbar";

type AppTopbarProps = ComponentProps<typeof TopNavbar>;

export function AppTopbar(props: AppTopbarProps) {
  return <TopNavbar {...props} />;
}
