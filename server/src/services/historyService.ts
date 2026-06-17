import { v4 as uuidv4 } from 'uuid';
import { eq, asc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { executionHistory } from '../db/schema.js';
import type { ExecutionHistory } from '../types/index.js';

export async function recordHistory(
  jobId: string,
  workerId: string | null,
  fromStatus: string | null,
  toStatus: string,
  reason: string | null,
): Promise<ExecutionHistory> {
  const [row] = await db
    .insert(executionHistory)
    .values({
      id: uuidv4(),
      job_id: jobId,
      worker_id: workerId,
      from_status: fromStatus,
      to_status: toStatus,
      reason,
    })
    .returning();
  return row!;
}

export async function getJobHistory(jobId: string): Promise<ExecutionHistory[]> {
  return db
    .select()
    .from(executionHistory)
    .where(eq(executionHistory.job_id, jobId))
    .orderBy(asc(executionHistory.created_at));
}
