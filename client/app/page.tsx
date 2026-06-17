'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { fetchJobs, fetchWorkers, fetchHealth, type Job, type Worker } from "@/lib/api"
import Link from "next/link"

const statusColors: Record<string, string> = {
  QUEUED: "bg-blue-500",
  ASSIGNED: "bg-yellow-500",
  RUNNING: "bg-purple-500",
  COMPLETED: "bg-green-500",
  FAILED: "bg-red-500",
  FAILED_QUEUE: "bg-orange-500",
  ONLINE: "bg-green-500",
  BUSY: "bg-yellow-500",
  OFFLINE: "bg-gray-500",
  DEAD: "bg-red-500",
}

function JobStatusBadge({ status }: { status: string }) {
  return <Badge className={statusColors[status] ?? "bg-gray-500"}>{status}</Badge>
}

function WorkerStatusBadge({ status }: { status: string }) {
  return <Badge className={statusColors[status] ?? "bg-gray-500"}>{status}</Badge>
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [health, setHealth] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchJobs(),
      fetchWorkers(),
      fetchHealth().then((h) => h.status).catch(() => 'down'),
    ]).then(([jobsData, workersData, healthStatus]) => {
      setJobs(jobsData)
      setWorkers(workersData)
      setHealth(healthStatus)
    }).catch(() => {
      setHealth('down')
    }).finally(() => setLoading(false))
  }, [])

  const statusCounts = jobs.reduce(
    (acc, j) => {
      acc[j.status] = (acc[j.status] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const workerStatusCounts = workers.reduce(
    (acc, w) => {
      acc[w.status] = (acc[w.status] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-medium">Dashboard</h1>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Dashboard</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Server:</span>
          <Badge variant={health === 'ok' ? 'default' : 'destructive'}>
            {health === 'ok' ? 'UP' : 'DOWN'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {['QUEUED', 'ASSIGNED', 'RUNNING', 'COMPLETED', 'FAILED', 'FAILED_QUEUE'].map((s) => (
          <Card key={s}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">
                {s.replace('_', ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-medium">{statusCounts[s] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
        {['ONLINE', 'BUSY', 'OFFLINE', 'DEAD'].map((s) => (
          <Card key={s}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">
                Workers {s}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-medium">{workerStatusCounts[s] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Retries</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.slice(0, 10).map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <Link href={`/jobs/${job.id}`} className="hover:underline">
                      {job.task_name}
                    </Link>
                  </TableCell>
                  <TableCell><JobStatusBadge status={job.priority} /></TableCell>
                  <TableCell><JobStatusBadge status={job.status} /></TableCell>
                  <TableCell className="text-xs">{job.retry_count}/{job.max_retries}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(job.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {jobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No jobs yet
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
