"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
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

type CostItem = {
  totalCost: number;
  category: string;
  provider: string;
  units: number;   // 👈 add this
};

type Call = {
  id: string;
  patient: { name: string };
  createdAt: string;
  recordingUrl: string | null;
  transcript: string | null;
  transcriptStatus: string; // "pending" | "completed" | "failed"
  costItems: CostItem[];
  totalCost: number;
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
                    {c.transcriptStatus === "pending" && (
                      <em className="text-yellow-600">
                        Processing transcript…
                      </em>
                    )}
                    {c.transcriptStatus === "failed" && (
                      <em className="text-red-600">Transcript failed</em>
                    )}
                    {c.transcriptStatus === "completed" && c.transcript && (
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
                            {c.transcript}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    {c.transcriptStatus === "completed" && !c.transcript && (
                      <em>No transcript</em>
                    )}
                  </TableCell>

                  <TableCell>
                    {c.totalCost > 0 ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            ${c.totalCost.toFixed(4)}
                            <Info className="w-3 h-3 text-slate-500" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md bg-white">
                          <DialogHeader>
                            <DialogTitle>Cost Breakdown</DialogTitle>
                          </DialogHeader>
                          <div className="mt-2 space-y-2 text-sm">
                            {c.costItems.map((ci, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between border-b border-slate-200 pb-1"
                              >
                                <span className="capitalize">
                                  {ci.category.toUpperCase()} ({ci.provider})
                                  <span className="ml-2 text-xs text-slate-500">
                                    {ci.category === "stt"
                                      ? `${(ci.units * 60).toFixed(1)}s audio`
                                      : `${ci.units} chars`}
                                  </span>
                                </span>
                                <span>${ci.totalCost.toFixed(4)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between font-semibold pt-2">
                              <span>Total</span>
                              <span>${c.totalCost.toFixed(4)}</span>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <span>$0.0000</span>
                    )}
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
