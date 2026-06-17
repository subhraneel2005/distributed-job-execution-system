import * as jobService from '../services/jobService.js';
import * as historyService from '../services/historyService.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/index.js';

export async function getFailedJobs() {
  return jobService.getJobs('FAILED_QUEUE');
}

export async function replayJob(jobId: string): Promise<void> {
  const job = await jobService.getJobById(jobId);
  if (!job) {
    throw new AppError(404, 'Job not found');
  }
  if (job.status !== 'FAILED_QUEUE') {
    throw new AppError(400, 'Job is not in failed queue');
  }

  await jobService.updateJobStatus(jobId, 'QUEUED');
  await historyService.recordHistory(
    jobId,
    null,
    'FAILED_QUEUE',
    'QUEUED',
    'Replayed from DLQ'
  );
  logger.info({ jobId }, 'Job replayed from DLQ');
}

export async function replayAllJobs(): Promise<{ replayed: number }> {
  const failedJobs = await getFailedJobs();
  for (const job of failedJobs) {
    await replayJob(job.id);
  }
  logger.info({ count: failedJobs.length }, 'All failed jobs replayed from DLQ');
  return { replayed: failedJobs.length };
}
