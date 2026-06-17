import express from 'express';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import { logger } from '../utils/index.js';
import { errorHandler } from '../middleware/errorHandler.js';
import jobRoutes from './routes/jobs.js';
import workerRoutes from './routes/workers.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

app.use('/api/jobs', jobRoutes);
app.use('/api/workers', workerRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

export default app;
