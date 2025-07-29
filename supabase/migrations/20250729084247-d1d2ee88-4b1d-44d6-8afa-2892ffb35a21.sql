-- Create table for tracking text processing jobs
CREATE TABLE public.text_processing_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INTEGER NOT NULL DEFAULT 0,
  total_chunks INTEGER DEFAULT NULL,
  processed_chunks INTEGER NOT NULL DEFAULT 0,
  error_message TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Enable RLS
ALTER TABLE public.text_processing_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view processing jobs" 
ON public.text_processing_jobs 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create processing jobs" 
ON public.text_processing_jobs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update processing jobs" 
ON public.text_processing_jobs 
FOR UPDATE 
USING (true);

-- Add trigger for updating timestamps
CREATE TRIGGER update_text_processing_jobs_updated_at
BEFORE UPDATE ON public.text_processing_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();