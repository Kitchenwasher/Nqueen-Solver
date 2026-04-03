import { memo, type ComponentProps } from "react";

import { Chessboard } from "@/components/chessboard/chessboard";

type SolverBoardProps = ComponentProps<typeof Chessboard>;

function SolverBoardComponent(props: SolverBoardProps) {
  return <Chessboard {...props} />;
}

export const SolverBoard = memo(SolverBoardComponent);
