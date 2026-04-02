import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ChallengePanelProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function ChallengePanel({
  title = "Challenge Generator",
  description = "Generate and solve guided puzzle setups.",
  children,
  className
}: ChallengePanelProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
