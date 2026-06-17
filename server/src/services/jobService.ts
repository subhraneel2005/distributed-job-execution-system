import { v4 as uuidv4 } from 'uuid';
import { eq, asc, desc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { jobs } from '../db/schema.js';
import type { Job, Priority, JobStatus } from '../types/index.js';

export async function createJob(
  taskName: string,
  priority: Priority,
  maxRetries: number,
  payload: Record<string, unknown>,
): Promise<Job> {
  const [row] = await db
    .insert(jobs)
    .values({
      id: uuidv4(),
      task_name: taskName,
      priority,
      status: 'QUEUED',
      max_retries: maxRetries,
      payload,
    })
    .returning();
  return row!;
}

export async function getJobById(jobId: string): Promise<Job | null> {
  const [row] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, jobId));
  return row ?? null;
}

export async function getJobs(status?: JobStatus): Promise<Job[]> {
  if (status) {
    return db
      .select()
      .from(jobs)
      .where(eq(jobs.status, status))
      .orderBy(asc(jobs.priority), asc(jobs.created_at));
  }
  return db
    .select()
    .from(jobs)
    .orderBy(desc(jobs.created_at));
}

export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  assignedWorker?: string,
): Promise<Job | null> {
  const [row] = await db
    .update(jobs)
    .set({
      status,
      assigned_worker: assignedWorker,
      updated_at: new Date(),
    })
    .where(eq(jobs.id, jobId))
    .returning();
  return row ?? null;
}

export async function incrementRetry(jobId: string): Promise<Job | null> {
  const [row] = await db
    .update(jobs)
    .set({
      retry_count: sql`retry_count + 1`,
      updated_at: new Date(),
    })
    .where(eq(jobs.id, jobId))
    .returning();
  return row ?? null;
}

export async function getQueuedJobs(): Promise<Job[]> {
  return db
    .select()
    .from(jobs)
    .where(eq(jobs.status, 'QUEUED'))
    .orderBy(
      sql`CASE priority WHEN 'HIGH' THEN 0 WHEN 'MEDIUM' THEN 1 WHEN 'LOW' THEN 2 END`,
      asc(jobs.created_at),
    );
}
