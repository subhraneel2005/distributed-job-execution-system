import { Router } from 'express';
import { z } from 'zod';
import * as jobService from '../../services/jobService.js';
import * as historyService from '../../services/historyService.js';
import { AppError } from '../../middleware/errorHandler.js';
import { logger } from '../../utils/index.js';
import type { JobStatus } from '../../types/index.js';

const router = Router();

const createJobSchema = z.object({
  taskName: z.string().min(1),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  maxRetries: z.number().int().min(0).default(3),
  payload: z.record(z.string(), z.unknown()).default({}),
});

router.post('/', async (req, res, next) => {
  try {
    const body = createJobSchema.parse(req.body);
    const job = await jobService.createJob(
      body.taskName,
      body.priority,
      body.maxRetries,
      body.payload
    );
    await historyService.recordHistory(job.id, null, 'CREATED', 'QUEUED', 'Job created');
    logger.info({ jobId: job.id, taskName: body.taskName }, 'Job created');
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
});

router.get('/history/:jobId', async (req, res, next) => {
  try {
    const job = await jobService.getJobById(req.params.jobId!);
    if (!job) {
      throw new AppError(404, 'Job not found');
    }
    const history = await historyService.getJobHistory(req.params.jobId!);
    res.json(history);
  } catch (err) {
    next(err);
  }
});

router.get('/:jobId', async (req, res, next) => {
  try {
    const job = await jobService.getJobById(req.params.jobId!);
    if (!job) {
      throw new AppError(404, 'Job not found');
    }
    res.json(job);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const status = req.query.status as JobStatus | undefined;
    const jobs = await jobService.getJobs(status);
    res.json(jobs);
  } catch (err) {
    next(err);
  }
});

export default router;
