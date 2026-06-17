import * as workerService from '../services/workerService.js';
import * as jobService from '../services/jobService.js';
import * as historyService from '../services/historyService.js';
import { handleJobFailure } from '../retry/index.js';
import { logger } from '../utils/index.js';

const HEARTBEAT_TIMEOUT_MS = 10000;

let intervalId: ReturnType<typeof setInterval> | null = null;

export async function checkHeartbeats(): Promise<void> {
  try {
    const workers = await workerService.getWorkers();
    const now = Date.now();

    for (const worker of workers) {
      if (worker.status === 'DEAD' || worker.status === 'OFFLINE') continue;
      if (!worker.last_heartbeat) continue;

      const lastBeat = worker.last_heartbeat.getTime();
      if (now - lastBeat <= HEARTBEAT_TIMEOUT_MS) continue;

      logger.warn(
        { workerId: worker.id, lastHeartbeat: worker.last_heartbeat },
        'Worker heartbeat timeout - marking as DEAD'
      );

      await workerService.updateWorkerStatus(worker.id, 'DEAD');

      for (const jobId of worker.assigned_jobs) {
        const job = await jobService.getJobById(jobId);
        if (!job) continue;

        if (job.status === 'ASSIGNED' || job.status === 'RUNNING') {
          await handleJobFailure(jobId, worker.id);
        }
      }

      await workerService.releaseAllWorkerJobs(worker.id);
    }
  } catch (err) {
    logger.error({ err }, 'Heartbeat check error');
  }
}

export function startHeartbeatMonitor(intervalMs: number = 3000): void {
  logger.info({ intervalMs }, 'Starting heartbeat monitor');
  checkHeartbeats();
  intervalId = setInterval(checkHeartbeats, intervalMs);
}

export function stopHeartbeatMonitor(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('Heartbeat monitor stopped');
  }
}
