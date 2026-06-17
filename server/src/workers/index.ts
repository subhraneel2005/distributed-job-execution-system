import * as workerService from '../services/workerService.js';
import * as jobService from '../services/jobService.js';
import * as historyService from '../services/historyService.js';
import { handleJobFailure } from '../retry/index.js';
import { logger } from '../utils/index.js';

interface SimulatedWorker {
  id: string;
  heartbeatInterval: ReturnType<typeof setInterval>;
  executionInterval: ReturnType<typeof setInterval>;
}

const simulatedWorkers: Map<string, SimulatedWorker> = new Map();

export async function spawnWorker(maxCapacity: number = 3): Promise<string> {
  const worker = await workerService.registerWorker(maxCapacity, { simulated: true });

  const heartbeatInterval = setInterval(async () => {
    try {
      await workerService.updateHeartbeat(worker.id);
    } catch (err) {
      logger.error({ err, workerId: worker.id }, 'Heartbeat send failed');
    }
  }, 5000);

  const executionInterval = setInterval(async () => {
    try {
      await processJobs(worker.id);
    } catch (err) {
      logger.error({ err, workerId: worker.id }, 'Job processing failed');
    }
  }, 4000);

  simulatedWorkers.set(worker.id, {
    id: worker.id,
    heartbeatInterval,
    executionInterval,
  });

  logger.info({ workerId: worker.id, maxCapacity }, 'Simulated worker spawned');
  return worker.id;
}

async function processJobs(workerId: string): Promise<void> {
  const worker = await workerService.getWorkerById(workerId);
  if (!worker || worker.status === 'DEAD') return;

  const assignedJobs = worker.assigned_jobs;
  if (assignedJobs.length === 0) return;

  const currentJob = await jobService.getJobById(assignedJobs[0]!);
  if (!currentJob) return;

  if (currentJob.status === 'ASSIGNED') {
    await jobService.updateJobStatus(currentJob.id, 'RUNNING');
    await historyService.recordHistory(
      currentJob.id,
      workerId,
      'ASSIGNED',
      'RUNNING',
      'Execution started'
    );
    logger.info({ jobId: currentJob.id, workerId }, 'Job execution started');

    const success = Math.random() < 0.8;
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

    if (success) {
      await jobService.updateJobStatus(currentJob.id, 'COMPLETED');
      await workerService.releaseJobFromWorker(currentJob.id, workerId);
      await historyService.recordHistory(
        currentJob.id,
        workerId,
        'RUNNING',
        'COMPLETED',
        'Execution completed'
      );
      logger.info({ jobId: currentJob.id, workerId }, 'Job completed successfully');
    } else {
      await handleJobFailure(currentJob.id, workerId);
      logger.info({ jobId: currentJob.id, workerId }, 'Job execution failed');
    }
  }
}

export function stopWorker(workerId: string): void {
  const worker = simulatedWorkers.get(workerId);
  if (!worker) {
    logger.warn({ workerId }, 'Worker not found');
    return;
  }
  clearInterval(worker.heartbeatInterval);
  clearInterval(worker.executionInterval);
  simulatedWorkers.delete(workerId);
  logger.info({ workerId }, 'Simulated worker stopped');
}

export function stopAllWorkers(): void {
  for (const workerId of simulatedWorkers.keys()) {
    stopWorker(workerId);
  }
}

export function getActiveWorkers(): string[] {
  return Array.from(simulatedWorkers.keys());
}
