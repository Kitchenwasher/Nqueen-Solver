import type { ComponentProps } from "react";

import { SearchTreeVisualizer } from "@/components/dashboard/search-tree-visualizer";
import { EmptyState } from "@/components/shared/empty-state";

type SearchTreePanelProps = {
  visible: boolean;
  logs: ComponentProps<typeof SearchTreeVisualizer>["logs"];
  phase: ComponentProps<typeof SearchTreeVisualizer>["phase"];
  boardSize: number;
};

export function SearchTreePanel({ visible, logs, phase, boardSize }: SearchTreePanelProps) {
  if (!visible) {
    return <EmptyState title="Search Tree Hidden" description="Enable Search Tree from controls to visualize recursion branches." />;
  }

  return <SearchTreeVisualizer logs={logs} phase={phase} boardSize={boardSize} />;
}
