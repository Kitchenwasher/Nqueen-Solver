import type { ParallelSolveTask, ParallelWorkerPoolProgress, ParallelWorkerResult } from "@/lib/parallel/types";

type PoolWorker = {
  id: number;
  worker: Worker;
  busy: boolean;
};

type RunHandlers = {
  shouldStop: () => boolean;
  onTaskStart?: (task: ParallelSolveTask, workerId: number) => void;
  onTaskComplete?: (result: ParallelWorkerResult) => void;
  onProgress?: (progress: ParallelWorkerPoolProgress) => void;
};

export class ParallelWorkerPool {
  private readonly workers: PoolWorker[];

  private stopped = false;

  constructor(private readonly workerCount: number) {
    this.workers = Array.from({ length: workerCount }, (_, index) => ({
      id: index + 1,
      worker: new Worker(new URL("../../workers/nqueen-parallel.worker.ts", import.meta.url), { type: "module" }),
      busy: false
    }));
  }

  /**
   * Terminates all worker instances and marks pool as stopped.
   */
  stop() {
    if (this.stopped) {
      return;
    }

    this.stopped = true;
    this.workers.forEach((entry) => {
      entry.busy = false;
      entry.worker.terminate();
    });
  }

  /**
   * Runs provided tasks until queue is exhausted or stop condition is met.
   * Scheduling model: work-stealing style assignment to next available worker.
   */
  run(tasks: ParallelSolveTask[], handlers: RunHandlers): Promise<ParallelWorkerResult[]> {
    return new Promise((resolve) => {
      const results: ParallelWorkerResult[] = [];
      const queue = [...tasks];
      let completed = 0;
      let active = 0;
      let finished = false;

      const emitProgress = () => {
        handlers.onProgress?.({
          activeWorkers: active,
          tasksCompleted: completed,
          tasksTotal: tasks.length,
          tasksRemaining: Math.max(tasks.length - completed - active, 0)
        });
      };

      const finalize = () => {
        if (finished) {
          return;
        }

        finished = true;
        this.stop();
        resolve(results);
      };

      const assign = (entry: PoolWorker) => {
        if (finished || this.stopped || handlers.shouldStop()) {
          finalize();
          return;
        }

        const nextTask = queue.shift();
        if (!nextTask) {
          if (active === 0) {
            finalize();
          }
          return;
        }

        entry.busy = true;
        active += 1;
        handlers.onTaskStart?.(nextTask, entry.id);
        emitProgress();
        entry.worker.postMessage({ type: "solve", task: nextTask });
      };

      this.workers.forEach((entry) => {
        entry.worker.onmessage = (event: MessageEvent<Omit<ParallelWorkerResult, "workerId">>) => {
          if (finished || this.stopped) {
            return;
          }

          entry.busy = false;
          active = Math.max(active - 1, 0);
          completed += 1;

          const result: ParallelWorkerResult = {
            ...event.data,
            workerId: entry.id
          };
          results.push(result);
          handlers.onTaskComplete?.(result);
          emitProgress();

          if (handlers.shouldStop()) {
            finalize();
            return;
          }

          assign(entry);

          if (completed >= tasks.length && active === 0) {
            finalize();
          }
        };

        entry.worker.onerror = () => {
          entry.busy = false;
          active = Math.max(active - 1, 0);
          completed += 1;
          emitProgress();

          if (completed >= tasks.length && active === 0) {
            finalize();
          } else {
            assign(entry);
          }
        };
      });

      this.workers.forEach((entry) => assign(entry));
    });
  }
}
