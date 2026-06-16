import * as jobService from '../services/jobService.js';
import * as workerService from '../services/workerService.js';
import * as historyService from '../services/historyService.js';
import { logger } from '../utils/index.js';

let intervalId: ReturnType<typeof setInterval> | null = null;

export async function scheduleJobs(): Promise<void> {
  try {
    const queuedJobs = await jobService.getQueuedJobs();
    if (queuedJobs.length === 0) return;

    const availableWorkers = await workerService.getAvailableWorkers();
    if (availableWorkers.length === 0) return;

    let workerIndex = 0;

    for (const job of queuedJobs) {
      if (workerIndex >= availableWorkers.length) break;

      const worker = availableWorkers[workerIndex]!;

      if (job.status !== 'QUEUED') continue;

      await jobService.updateJobStatus(job.id, 'ASSIGNED', worker.id);
      await workerService.assignJobToWorker(job.id, worker.id);
      await historyService.recordHistory(
        job.id,
        worker.id,
        'QUEUED',
        'ASSIGNED',
        'Scheduled to worker'
      );

      logger.info({ jobId: job.id, workerId: worker.id }, 'Job assigned to worker');
      workerIndex++;
    }
  } catch (err) {
    logger.error({ err }, 'Scheduler error');
  }
}

export function startScheduler(intervalMs: number = 3000): void {
  logger.info({ intervalMs }, 'Starting scheduler');
  scheduleJobs();
  intervalId = setInterval(scheduleJobs, intervalMs);
}

export function stopScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('Scheduler stopped');
  }
}
