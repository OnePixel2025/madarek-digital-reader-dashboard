import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface TextProcessingStatusProps {
  bookId: string;
  onComplete?: () => void;
}

interface ProcessingJob {
  id: string;
  status: string;
  progress: number;
  total_chunks: number;
  processed_chunks: number;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export const TextProcessingStatus = ({ bookId, onComplete }: TextProcessingStatusProps) => {
  const [job, setJob] = useState<ProcessingJob | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    const fetchJobStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('text_processing_jobs')
          .select('*')
          .eq('book_id', bookId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error('Error fetching job status:', error);
          return;
        }

        setJob(data);

        // Stop polling if job is completed or failed
        if (data.status === 'completed' || data.status === 'failed') {
          setIsPolling(false);
          if (data.status === 'completed' && onComplete) {
            onComplete();
          }
        }
      } catch (error) {
        console.error('Error in fetchJobStatus:', error);
      }
    };

    // Initial fetch
    fetchJobStatus();

    // Set up polling if needed
    let intervalId: NodeJS.Timeout;
    if (isPolling) {
      intervalId = setInterval(fetchJobStatus, 3000); // Poll every 3 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [bookId, isPolling, onComplete]);

  if (!job) {
    return null;
  }

  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
    }
  };

  const getStatusMessage = () => {
    switch (job.status) {
      case 'pending':
        return 'Waiting to start text processing...';
      case 'processing':
        return `Processing text... (${job.processed_chunks}/${job.total_chunks} chunks)`;
      case 'completed':
        return 'Text processing completed successfully!';
      case 'failed':
        return `Text processing failed: ${job.error_message || 'Unknown error'}`;
      default:
        return 'Unknown status';
    }
  };

  const getAlertVariant = () => {
    switch (job.status) {
      case 'completed':
        return 'default'; // Success styling
      case 'failed':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Alert variant={getAlertVariant()} className="mt-4">
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <AlertDescription className="flex-1">
          <div className="space-y-2">
            <p className="text-sm font-medium">{getStatusMessage()}</p>
            
            {job.status === 'processing' && job.total_chunks && (
              <div className="space-y-1">
                <Progress 
                  value={job.progress} 
                  className="w-full h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Progress: {job.progress}% ({job.processed_chunks}/{job.total_chunks} chunks)
                </p>
              </div>
            )}

            {job.status === 'failed' && job.error_message && (
              <p className="text-xs text-red-600 mt-1">
                Error: {job.error_message}
              </p>
            )}
          </div>
        </AlertDescription>
      </div>
    </Alert>
  );
};