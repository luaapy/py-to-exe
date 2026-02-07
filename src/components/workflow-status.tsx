'use client'

import { useState, useEffect } from 'react'
import { Progress } from "@/components/ui/progress"
import { getLatestWorkflowRun, checkWorkflowStatus, getWorkflowArtifacts } from '@/app/actions/github'
import { Loader2, CheckCircle2 } from "lucide-react"

interface WorkflowStatusProps {
  workflowFileName: string;
  commitSha: string;
  onComplete: (runId: number, artifacts: { id: number; name: string }[]) => void;
  onError: (error: string) => void;
}

export function WorkflowStatus({ workflowFileName, commitSha, onComplete, onError }: WorkflowStatusProps) {
  const [status, setStatus] = useState<string>("queued");
  const [progress, setProgress] = useState(0);
  const [runId, setRunId] = useState<number | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let attempts = 0;

    const poll = async () => {
      try {
        if (!runId) {
          // Poll for run ID
          const run = await getLatestWorkflowRun(workflowFileName, commitSha);
          if (run) {
            setRunId(run.runId);
            setStatus(run.status || "queued");
          } else {
             // Not found yet
             attempts++;
             if (attempts > 24) { // 2 minutes (24 * 5s)
                 onError("Workflow failed to start in time (2 mins timeout).");
                 clearInterval(intervalId);
             }
             return;
          }
        } else {
          // Poll for status
          const runStatus = await checkWorkflowStatus(runId);
          setStatus(runStatus.status || "queued");

          if (runStatus.status === "completed") {
            clearInterval(intervalId);
            setProgress(100);
            
            if (runStatus.conclusion === "success") {
                // Get artifacts
                const artifacts = await getWorkflowArtifacts(runId);
                onComplete(runId, artifacts);
            } else {
                onError(`Workflow failed with conclusion: ${runStatus.conclusion}`);
            }
          } else if (runStatus.status === "in_progress") {
             // Simulate progress or set to fixed
             setProgress(prev => Math.min(prev + 5, 90));
          }
        }
      } catch (err) {
        console.error(err);
        // Don't stop polling immediately on one error, but maybe log it
      }
    };

    // Poll every 5 seconds
    intervalId = setInterval(poll, 5000);
    poll(); // Initial call

    return () => clearInterval(intervalId);
  }, [runId, workflowFileName, commitSha, onComplete, onError]);

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Processing Status</h3>
            <span className="text-sm text-muted-foreground capitalize">{status.replace('_', ' ')}</span>
        </div>
        
        <Progress value={progress} className="w-full" />
        
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            {status === 'completed' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
                <Loader2 className="h-4 w-4 animate-spin" />
            )}
            <span>
                {status === 'queued' && "Workflow queued..."}
                {status === 'in_progress' && "Processing..."}
                {status === 'completed' && "Conversion completed!"}
            </span>
        </div>
    </div>
  )
}
