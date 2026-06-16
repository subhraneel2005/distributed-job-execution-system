import { Router } from 'express';
import { z } from 'zod';
import * as workerService from '../../services/workerService.js';
import { AppError } from '../../middleware/errorHandler.js';
import { logger } from '../../utils/index.js';

const router = Router();

const registerSchema = z.object({
  maxCapacity: z.number().int().min(1).default(5),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

router.post('/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const worker = await workerService.registerWorker(body.maxCapacity, body.metadata);
    logger.info({ workerId: worker.id }, 'Worker registered');
    res.status(201).json(worker);
  } catch (err) {
    next(err);
  }
});

router.post('/:workerId/heartbeat', async (req, res, next) => {
  try {
    const worker = await workerService.updateHeartbeat(req.params.workerId!);
    if (!worker) {
      throw new AppError(404, 'Worker not found');
    }
    res.json(worker);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (_req, res, next) => {
  try {
    const workers = await workerService.getWorkers();
    res.json(workers);
  } catch (err) {
    next(err);
  }
});

export default router;
