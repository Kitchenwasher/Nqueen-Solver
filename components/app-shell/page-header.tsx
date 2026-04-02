import * as React from "react";

import { SectionHeader } from "@/components/shared/section-header";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
};

export function PageHeader({ title, subtitle, rightSlot }: PageHeaderProps) {
  return <SectionHeader title={title} description={subtitle} rightSlot={rightSlot} className="px-1" />;
}
