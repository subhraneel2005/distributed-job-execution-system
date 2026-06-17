'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { fetchWorkers, registerWorker, sendHeartbeat, type Worker } from "@/lib/api"

const statusColors: Record<string, string> = {
  ONLINE: "bg-green-500",
  BUSY: "bg-yellow-500",
  OFFLINE: "bg-gray-500",
  DEAD: "bg-red-500",
}

function StatusBadge({ status }: { status: string }) {
  return <Badge className={statusColors[status] ?? "bg-gray-500"}>{status}</Badge>
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [capacity, setCapacity] = useState(5)
  const [submitting, setSubmitting] = useState(false)

  function load() {
    setLoading(true)
    fetchWorkers()
      .then(setWorkers)
      .catch(() => toast.error("Failed to load workers"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const worker = await registerWorker({ maxCapacity: capacity, metadata: {} })
      toast.success("Worker registered")
      setOpen(false)
      setCapacity(5)
      load()
    } catch {
      toast.error("Failed to register worker")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleHeartbeat(id: string) {
    try {
      await sendHeartbeat(id)
      toast.success("Heartbeat sent")
      load()
    } catch {
      toast.error("Failed to send heartbeat")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Workers</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
              <Button>Register Worker</Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register Worker</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="capacity">Max Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Registering..." : "Register"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Jobs</TableHead>
                  <TableHead>Last Heartbeat</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.map((worker) => (
                  <TableRow key={worker.id}>
                    <TableCell className="font-mono text-xs">{worker.id.slice(0, 12)}...</TableCell>
                    <TableCell><StatusBadge status={worker.status} /></TableCell>
                    <TableCell className="text-xs">{worker.current_jobs_processing}/{worker.max_capacity}</TableCell>
                    <TableCell className="text-xs">{worker.assigned_jobs.length}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {worker.last_heartbeat ? new Date(worker.last_heartbeat).toLocaleString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleHeartbeat(worker.id)}
                        disabled={worker.status === 'DEAD'}
                      >
                        Heartbeat
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {workers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No workers registered
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
