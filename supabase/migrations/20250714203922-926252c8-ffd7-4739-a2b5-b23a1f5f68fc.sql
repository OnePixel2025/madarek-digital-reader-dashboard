-- Create podcasts table
CREATE TABLE public.podcasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  title TEXT,
  voice TEXT NOT NULL DEFAULT 'alloy',
  duration INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;

-- Create policies for podcasts
CREATE POLICY "Anyone can view podcasts" 
ON public.podcasts 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create podcasts" 
ON public.podcasts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update podcasts" 
ON public.podcasts 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete podcasts" 
ON public.podcasts 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_podcasts_updated_at
BEFORE UPDATE ON public.podcasts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create the podcasts storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('podcasts', 'podcasts', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for podcasts
CREATE POLICY "Podcast audio files are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'podcasts');

CREATE POLICY "Anyone can upload podcast audio files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'podcasts');

CREATE POLICY "Anyone can update podcast audio files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'podcasts');