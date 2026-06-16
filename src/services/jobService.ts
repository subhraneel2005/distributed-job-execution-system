import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';
import type { Job, Priority, JobStatus } from '../types/index.js';

export async function createJob(
  taskName: string,
  priority: Priority,
  maxRetries: number,
  payload: Record<string, unknown>
): Promise<Job> {
  const id = uuidv4();
  const result = await query<Job>(
    `INSERT INTO jobs (id, task_name, priority, status, max_retries, payload)
     VALUES ($1, $2, $3, 'QUEUED', $4, $5)
     RETURNING *`,
    [id, taskName, priority, maxRetries, JSON.stringify(payload)]
  );
  return result.rows[0]!;
}

export async function getJobById(jobId: string): Promise<Job | null> {
  const result = await query<Job>('SELECT * FROM jobs WHERE id = $1', [jobId]);
  return result.rows[0] ?? null;
}

export async function getJobs(status?: JobStatus): Promise<Job[]> {
  if (status) {
    const result = await query<Job>(
      'SELECT * FROM jobs WHERE status = $1 ORDER BY priority, created_at',
      [status]
    );
    return result.rows;
  }
  const result = await query<Job>('SELECT * FROM jobs ORDER BY created_at DESC');
  return result.rows;
}

export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  assignedWorker?: string
): Promise<Job | null> {
  const setClauses: string[] = ['status = $2', 'updated_at = NOW()'];
  const params: unknown[] = [jobId, status];
  let paramIndex = 3;

  if (assignedWorker !== undefined) {
    setClauses.push(`assigned_worker = $${paramIndex}`);
    params.push(assignedWorker);
    paramIndex++;
  }

  const result = await query<Job>(
    `UPDATE jobs SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  return result.rows[0] ?? null;
}

export async function incrementRetry(jobId: string): Promise<Job | null> {
  const result = await query<Job>(
    `UPDATE jobs SET retry_count = retry_count + 1, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [jobId]
  );
  return result.rows[0] ?? null;
}

export async function getQueuedJobs(): Promise<Job[]> {
  const result = await query<Job>(
    `SELECT * FROM jobs WHERE status = 'QUEUED'
     ORDER BY
       CASE priority
         WHEN 'HIGH' THEN 0
         WHEN 'MEDIUM' THEN 1
         WHEN 'LOW' THEN 2
       END,
       created_at ASC`
  );
  return result.rows;
}
