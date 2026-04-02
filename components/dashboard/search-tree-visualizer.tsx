"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, PauseCircle, PlayCircle, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SolverLogEntry, SolverPhase } from "@/hooks/use-nqueen-solver";

type SearchTreeVisualizerProps = {
  logs: SolverLogEntry[];
  phase: SolverPhase;
  boardSize: number;
};

type TreeNodeStatus = "pending" | "active" | "dead" | "success";

type TreeNode = {
  id: string;
  parentId: string | null;
  depth: number;
  row: number;
  col: number;
  status: TreeNodeStatus;
  step: number;
  x: number;
  y: number;
};

type TreeEdge = {
  id: string;
  from: string;
  to: string;
};

type BuiltTree = {
  nodes: TreeNode[];
  edges: TreeEdge[];
  currentPathIds: Set<string>;
};

const ROOT_ID = "root";
const NODE_LIMIT = 380;
const H_SPACING = 130;
const V_SPACING = 54;

function buildTree(logs: SolverLogEntry[], visibleEvents: number): BuiltTree {
  const nodesMap = new Map<string, TreeNode>();
  const edges: TreeEdge[] = [];
  const depthCounters = new Map<number, number>();
  const stackByRow: Array<string | null> = [];
  const workerLeafById = new Map<number, string>();
  let currentPathIds = new Set<string>();

  nodesMap.set(ROOT_ID, {
    id: ROOT_ID,
    parentId: null,
    depth: 0,
    row: -1,
    col: -1,
    status: "active",
    step: 0,
    x: 0,
    y: 0
  });

  const chronological = [...logs].reverse().slice(0, visibleEvents);

  /**
   * Extracts worker id from parallel log entries such as "Worker 3 ...".
   */
  function parseWorkerId(message: string) {
    const match = message.match(/Worker\s+(\d+)/i);
    if (!match) {
      return null;
    }
    return Number(match[1]);
  }

  /**
   * Extracts root branch coordinates from worker status message.
   */
  function parseBranchFromWorkerMessage(message: string) {
    const match = message.match(/row0-col(\d+)(?:,\s*row1-col(\d+))?/i);
    if (!match) {
      return null;
    }

    const row0 = Number(match[1]) - 1;
    const row1 = typeof match[2] === "string" ? Number(match[2]) - 1 : null;
    if (Number.isNaN(row0) || row0 < 0) {
      return null;
    }

    if (row1 === null || Number.isNaN(row1) || row1 < 0) {
      return { row0, row1: null };
    }

    return { row0, row1 };
  }

  /**
   * Creates one rendered node and edge if sampling limit has not been reached.
   */
  function createNode(parentId: string, row: number, col: number, step: number) {
    if (nodesMap.size >= NODE_LIMIT) {
      return null;
    }

    const depth = row + 1;
    const indexInDepth = depthCounters.get(depth) ?? 0;
    depthCounters.set(depth, indexInDepth + 1);
    const id = `node-${step}-${row}-${col}-${indexInDepth}`;

    const node: TreeNode = {
      id,
      parentId,
      depth,
      row,
      col,
      status: "pending",
      step,
      x: depth * H_SPACING,
      y: indexInDepth * V_SPACING
    };

    nodesMap.set(id, node);
    edges.push({
      id: `edge-${parentId}-${id}`,
      from: parentId,
      to: id
    });

    return id;
  }

  for (const entry of chronological) {
    if (nodesMap.size >= NODE_LIMIT) {
      break;
    }

    if (entry.eventType === "worker-update") {
      const workerId = parseWorkerId(entry.message);
      const branch = parseBranchFromWorkerMessage(entry.message);

      if (entry.message.includes("solving branch") && branch) {
        const row0Id = createNode(ROOT_ID, 0, branch.row0, entry.step);
        if (row0Id) {
          let leafId = row0Id;
          const row0Node = nodesMap.get(row0Id);
          if (row0Node && row0Node.status !== "success") {
            row0Node.status = "active";
          }

          if (branch.row1 !== null) {
            const row1Id = createNode(row0Id, 1, branch.row1, entry.step + 1);
            if (row1Id) {
              const row1Node = nodesMap.get(row1Id);
              if (row1Node && row1Node.status !== "success") {
                row1Node.status = "active";
              }
              leafId = row1Id;
            }
          }

          if (workerId !== null) {
            workerLeafById.set(workerId, leafId);
          }
          currentPathIds = new Set([ROOT_ID, row0Id, leafId]);
        }
      } else if (entry.message.includes("completed task") && workerId !== null) {
        const leaf = workerLeafById.get(workerId);
        if (leaf) {
          const node = nodesMap.get(leaf);
          if (node && node.status !== "success") {
            const solutionsMatch = entry.message.match(/\((\d+)\s+solutions\)/i);
            const solutions = solutionsMatch ? Number(solutionsMatch[1]) : 0;
            node.status = solutions > 0 ? "success" : "dead";
          }
        }
      } else if (entry.message.toLowerCase().includes("solution found")) {
        const workerIdFromMessage = parseWorkerId(entry.message);
        if (workerIdFromMessage !== null) {
          const leaf = workerLeafById.get(workerIdFromMessage);
          if (leaf) {
            const node = nodesMap.get(leaf);
            if (node) {
              node.status = "success";
              currentPathIds = new Set([ROOT_ID, leaf]);
            }
          }
        }
      }

      continue;
    }

    if (entry.row === null || entry.col === null) {
      if (entry.eventType === "solution-found") {
        const path = stackByRow.filter(Boolean) as string[];
        for (const nodeId of path) {
          const node = nodesMap.get(nodeId);
          if (node) {
            node.status = "success";
          }
        }
        currentPathIds = new Set(path);
      }
      continue;
    }

    const parentId = entry.row > 0 ? stackByRow[entry.row - 1] ?? ROOT_ID : ROOT_ID;
    const currentId = stackByRow[entry.row];

    if (entry.eventType === "trying-move") {
      const nodeId = createNode(parentId, entry.row, entry.col, entry.step);
      if (nodeId) {
        stackByRow[entry.row] = nodeId;
        stackByRow.length = entry.row + 1;
      }
      continue;
    }

    if (!currentId) {
      continue;
    }

    const currentNode = nodesMap.get(currentId);
    if (!currentNode) {
      continue;
    }

    if (entry.eventType === "queen-placed") {
      currentNode.status = currentNode.status === "success" ? "success" : "active";
      currentPathIds = new Set(stackByRow.filter(Boolean) as string[]);
      continue;
    }

    if (entry.eventType === "invalid-move" || entry.eventType === "backtracking") {
      if (currentNode.status !== "success") {
        currentNode.status = "dead";
      }
      if (entry.eventType === "backtracking") {
        stackByRow[entry.row] = null;
      }
      continue;
    }
  }

  const nodes = Array.from(nodesMap.values());
  return {
    nodes,
    edges,
    currentPathIds
  };
}

function getStatusColor(status: TreeNodeStatus) {
  if (status === "active") {
    return "#4de2e6";
  }
  if (status === "dead") {
    return "#fb7185";
  }
  if (status === "success") {
    return "#34d399";
  }
  return "#94a3b8";
}

export function SearchTreeVisualizer({ logs, phase, boardSize }: SearchTreeVisualizerProps) {
  const [visibleEvents, setVisibleEvents] = useState(logs.length);
  const [autoplay, setAutoplay] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 18, y: 16 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomRef = useRef(1);
  const offsetRef = useRef({ x: 18, y: 16 });

  const isSolverRunning = phase === "solving" || phase === "stepping" || phase === "enumerating";
  const MIN_ZOOM = 0.45;
  const MAX_ZOOM = 2.8;

  /**
   * Zooms while preserving cursor-anchored world position.
   */
  const zoomAtPoint = (
    clientX: number,
    clientY: number,
    nextZoom: number,
    source?: { zoom: number; offset: { x: number; y: number } }
  ) => {
    const container = containerRef.current;
    if (!container) {
      setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom)));
      return;
    }

    const currentZoom = source?.zoom ?? zoom;
    const currentOffset = source?.offset ?? offset;
    const rect = container.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
    const worldX = (localX - currentOffset.x) / currentZoom;
    const worldY = (localY - currentOffset.y) / currentZoom;

    setZoom(clampedZoom);
    setOffset({
      x: localX - worldX * clampedZoom,
      y: localY - worldY * clampedZoom
    });
  };

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const zoomFactor = Math.exp(-event.deltaY * 0.0015);
      const container = containerRef.current;
      if (!container) {
        return;
      }
      const rect = container.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      const currentZoom = zoomRef.current;
      const currentOffset = offsetRef.current;
      const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom * zoomFactor));
      const worldX = (localX - currentOffset.x) / currentZoom;
      const worldY = (localY - currentOffset.y) / currentZoom;

      setZoom(nextZoom);
      setOffset({
        x: localX - worldX * nextZoom,
        y: localY - worldY * nextZoom
      });
    };

    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      element.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    if (autoplay) {
      setVisibleEvents(logs.length);
    }
  }, [autoplay, logs.length]);

  useEffect(() => {
    if (!autoplay || !isSolverRunning) {
      return;
    }

    const timer = setInterval(() => {
      setVisibleEvents(logs.length);
    }, 120);

    return () => clearInterval(timer);
  }, [autoplay, isSolverRunning, logs.length]);

  const safeVisibleEvents = Math.max(0, Math.min(visibleEvents, logs.length));
  const tree = useMemo(() => buildTree(logs, safeVisibleEvents), [logs, safeVisibleEvents]);

  const bounds = useMemo(() => {
    const maxX = tree.nodes.reduce((max, node) => Math.max(max, node.x), 0);
    const maxY = tree.nodes.reduce((max, node) => Math.max(max, node.y), 0);
    return {
      width: maxX + 180,
      height: maxY + 120
    };
  }, [tree.nodes]);

  const nodesById = useMemo(() => {
    const map = new Map<string, TreeNode>();
    tree.nodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [tree.nodes]);

  return (
    <section className="rounded-xl border border-border/70 bg-card/60 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Search Tree Visualizer</p>
          <p className="text-xs text-muted-foreground">
            Recursive branch map for N={boardSize} (sampled to {NODE_LIMIT} nodes for responsiveness).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant={autoplay ? "default" : "outline"} size="sm" onClick={() => setAutoplay((current) => !current)}>
            {autoplay ? (
              <>
                <PauseCircle className="mr-1.5 h-4 w-4" />
                Auto Replay
              </>
            ) : (
              <>
                <PlayCircle className="mr-1.5 h-4 w-4" />
                Manual Replay
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const container = containerRef.current;
              if (!container) {
                setZoom((current) => Math.max(MIN_ZOOM, current - 0.12));
                return;
              }
              const rect = container.getBoundingClientRect();
              zoomAtPoint(rect.left + rect.width / 2, rect.top + rect.height / 2, zoom - 0.12);
            }}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const container = containerRef.current;
              if (!container) {
                setZoom((current) => Math.min(MAX_ZOOM, current + 0.12));
                return;
              }
              const rect = container.getBoundingClientRect();
              zoomAtPoint(rect.left + rect.width / 2, rect.top + rect.height / 2, zoom + 0.12);
            }}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 18, y: 16 });
            }}
          >
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Reset View
          </Button>
        </div>
      </div>

      <div className="mb-2 rounded-md border border-border/60 bg-background/35 p-2">
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Replay Progress</span>
          <span>
            {safeVisibleEvents} / {logs.length} events
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={Math.max(logs.length, 1)}
          step={1}
          value={safeVisibleEvents}
          onChange={(event) => {
            setAutoplay(false);
            setVisibleEvents(Number(event.target.value));
          }}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
        />
      </div>

      <div
        ref={containerRef}
        className="relative h-[320px] overflow-hidden overscroll-contain rounded-lg border border-border/60 bg-background/25"
        onMouseDown={(event) => {
          event.preventDefault();
          setIsPanning(true);
          panStartRef.current = { x: event.clientX - offset.x, y: event.clientY - offset.y };
        }}
        onMouseMove={(event) => {
          if (!isPanning || !panStartRef.current) {
            return;
          }
          setOffset({
            x: event.clientX - panStartRef.current.x,
            y: event.clientY - panStartRef.current.y
          });
        }}
        onMouseUp={() => {
          setIsPanning(false);
          panStartRef.current = null;
        }}
        onMouseLeave={() => {
          setIsPanning(false);
          panStartRef.current = null;
        }}
        style={{ cursor: isPanning ? "grabbing" : "grab", touchAction: "none" }}
      >
        <div className="pointer-events-none absolute right-2 top-2 z-10 rounded-md border border-border/60 bg-background/70 px-2 py-1 text-[10px] text-muted-foreground">
          <Maximize2 className="mr-1 inline h-3 w-3" />
          Drag to pan, wheel to zoom
        </div>

        <svg className="h-full w-full" viewBox={`0 0 ${bounds.width} ${bounds.height}`}>
          <g transform={`translate(${offset.x}, ${offset.y}) scale(${zoom})`}>
            {tree.edges.map((edge) => {
              const from = nodesById.get(edge.from);
              const to = nodesById.get(edge.to);
              if (!from || !to) {
                return null;
              }

              const active = tree.currentPathIds.has(edge.to);
              return (
                <line
                  key={edge.id}
                  x1={from.x + 16}
                  y1={from.y + 16}
                  x2={to.x + 16}
                  y2={to.y + 16}
                  stroke={active ? "#4de2e6" : "#475569"}
                  strokeOpacity={active ? 0.9 : 0.45}
                  strokeWidth={active ? 2.2 : 1.2}
                />
              );
            })}

            {tree.nodes.map((node) => {
              const isRoot = node.id === ROOT_ID;
              const statusColor = isRoot ? "#38bdf8" : getStatusColor(node.status);
              const isActivePath = tree.currentPathIds.has(node.id);

              return (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  <circle
                    cx={16}
                    cy={16}
                    r={isActivePath ? 9.5 : 8}
                    fill={statusColor}
                    fillOpacity={isRoot ? 0.88 : 0.82}
                    stroke={isActivePath ? "#f8fafc" : "#0f172a"}
                    strokeWidth={isActivePath ? 2 : 1.2}
                  />
                  {!isRoot && (
                    <text x={30} y={20} fill="#cbd5e1" fontSize="10">
                      R{node.row + 1} C{node.col + 1}
                    </text>
                  )}
                  {isRoot && (
                    <text x={30} y={20} fill="#cbd5e1" fontSize="10">
                      Root
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
        <span className="rounded-md border border-border/60 bg-background/35 px-2 py-1">Blue: root</span>
        <span className="rounded-md border border-border/60 bg-background/35 px-2 py-1">Cyan: active branch</span>
        <span className="rounded-md border border-border/60 bg-background/35 px-2 py-1">Red: dead end</span>
        <span className="rounded-md border border-border/60 bg-background/35 px-2 py-1">Green: solution path</span>
      </div>
    </section>
  );
}
