import * as jobService from '../services/jobService.js';
import * as historyService from '../services/historyService.js';
import * as workerService from '../services/workerService.js';
import { logger } from '../utils/index.js';

export async function handleJobFailure(
  jobId: string,
  workerId: string | null
): Promise<void> {
  const job = await jobService.getJobById(jobId);
  if (!job) {
    logger.warn({ jobId }, 'Cannot handle failure: job not found');
    return;
  }

  await jobService.updateJobStatus(jobId, 'FAILED');
  await historyService.recordHistory(
    jobId,
    workerId,
    job.status,
    'FAILED',
    'Job execution failed'
  );

  if (job.retry_count <= job.max_retries) {
    const updatedJob = await jobService.incrementRetry(jobId);
    if (!updatedJob) return;

    if (updatedJob.retry_count <= updatedJob.max_retries) {
      await jobService.updateJobStatus(jobId, 'QUEUED');
      if (workerId) {
        await workerService.releaseJobFromWorker(jobId, workerId);
      }
      await historyService.recordHistory(
        jobId,
        null,
        'FAILED',
        'QUEUED',
        `Retry ${updatedJob.retry_count}/${updatedJob.max_retries}`
      );
      logger.info(
        { jobId, retryCount: updatedJob.retry_count, maxRetries: updatedJob.max_retries },
        'Job queued for retry'
      );
    } else {
      await jobService.updateJobStatus(jobId, 'FAILED_QUEUE');
      if (workerId) {
        await workerService.releaseJobFromWorker(jobId, workerId);
      }
      await historyService.recordHistory(
        jobId,
        null,
        'FAILED',
        'FAILED_QUEUE',
        'Max retries exceeded'
      );
      logger.info({ jobId }, 'Job moved to failed queue');
    }
  } else {
    await jobService.updateJobStatus(jobId, 'FAILED_QUEUE');
    if (workerId) {
      await workerService.releaseJobFromWorker(jobId, workerId);
    }
    await historyService.recordHistory(
      jobId,
      null,
      'FAILED',
      'FAILED_QUEUE',
      'Max retries exceeded'
    );
    logger.info({ jobId }, 'Job moved to failed queue');
  }
}
