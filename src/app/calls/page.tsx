"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Spinner from "@/components/Spinner";

type Transcript = { text: string };
type CostItem = { totalCost: number; category: string };

type Call = {
  id: string;
  patient: { name: string };
  createdAt: string;
  recordingUrl: string | null;
  transcripts: Transcript[];
  costItems: CostItem[];
};

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchCalls();
  }, []);

  async function fetchCalls() {
    setLoading(true);
    const r = await fetch("/api/calls");
    setCalls(await r.json());
    setLoading(false);
  }
  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">Call Logs</h2>
        <Spinner />
      </div>
    );
  }
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Call Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Recording</TableHead>
                <TableHead>Transcript</TableHead>
                <TableHead>Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calls.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.patient?.name || "Unknown"}</TableCell>
                  <TableCell>
                    {new Date(c.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {c.recordingUrl ? (
                      <audio controls src={c.recordingUrl}></audio>
                    ) : (
                      "No recording"
                    )}
                  </TableCell>
                  <TableCell>
                    {c.transcripts.length > 0 ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="secondary" size="sm">
                            View Transcript
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-white">
                          <DialogHeader>
                            <DialogTitle>Transcript</DialogTitle>
                          </DialogHeader>
                          <div className="mt-2 whitespace-pre-wrap text-sm max-h-[60vh] overflow-y-auto">
                            {c.transcripts[0].text}
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <em>No transcript</em>
                    )}
                  </TableCell>
                  <TableCell>
                    $
                    {c.costItems
                      .reduce((sum, item) => sum + (item.totalCost || 0), 0)
                      .toFixed(4)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
