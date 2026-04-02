import * as React from "react";

import { ControlGroup } from "@/components/shared/control-group";

type ParallelControlsProps = {
  children: React.ReactNode;
  className?: string;
};

export function ParallelControls({ children, className }: ParallelControlsProps) {
  return (
    <ControlGroup
      title="Parallel Controls"
      description="Split depth and worker behavior for parallel mode."
      className={className}
    >
      {children}
    </ControlGroup>
  );
}
