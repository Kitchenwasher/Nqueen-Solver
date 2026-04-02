import type { ComponentProps } from "react";

import { Chessboard } from "@/components/chessboard/chessboard";

type SolverBoardProps = ComponentProps<typeof Chessboard>;

export function SolverBoard(props: SolverBoardProps) {
  return <Chessboard {...props} />;
}
