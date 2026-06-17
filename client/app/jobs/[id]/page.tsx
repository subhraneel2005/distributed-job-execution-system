'use client'

import { useEffect, useState, use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import Link from "next/link"
import { fetchJob, fetchJobHistory, type Job, type ExecutionHistory } from "@/lib/api"

const statusColors: Record<string, string> = {
  QUEUED: "bg-blue-500",
  ASSIGNED: "bg-yellow-500",
  RUNNING: "bg-purple-500",
  COMPLETED: "bg-green-500",
  FAILED: "bg-red-500",
  FAILED_QUEUE: "bg-orange-500",
}

function StatusBadge({ status }: { status: string }) {
  return <Badge className={statusColors[status] ?? "bg-gray-500"}>{status}</Badge>
}

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [job, setJob] = useState<Job | null>(null)
  const [history, setHistory] = useState<ExecutionHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchJob(id), fetchJobHistory(id)])
      .then(([j, h]) => {
        setJob(j)
        setHistory(h)
      })
      .catch(() => toast.error("Failed to load job"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-medium">Job not found</h1>
        <Link href="/jobs"><Button variant="outline">Back to Jobs</Button></Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/jobs"><Button variant="outline" size="sm">&larr; Back</Button></Link>
        <h1 className="text-2xl font-medium">{job.task_name}</h1>
        <StatusBadge status={job.status} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Job ID</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-mono break-all">{job.id}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={job.priority} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Retries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{job.retry_count} / {job.max_retries}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Assigned Worker</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-mono">{job.assigned_worker ?? 'None'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs">{new Date(job.created_at).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs">{new Date(job.updated_at).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Execution History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Worker</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>{h.from_status ?? '-'}</TableCell>
                  <TableCell><StatusBadge status={h.to_status} /></TableCell>
                  <TableCell className="text-xs">{h.reason ?? '-'}</TableCell>
                  <TableCell className="text-xs font-mono">
                    {h.worker_id ? h.worker_id.slice(0, 8) + '...' : '-'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(h.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No history
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
