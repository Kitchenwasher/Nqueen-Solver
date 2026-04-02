import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SectionCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerSlot?: React.ReactNode;
};

export function SectionCard({ title, description, children, className, headerSlot }: SectionCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription className="mt-1">{description}</CardDescription>}
          </div>
          {headerSlot}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
