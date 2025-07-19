
-- Create a table to store extracted text from PDFs
CREATE TABLE public.book_text_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  extracted_text TEXT NOT NULL,
  page_count INTEGER,
  extraction_method TEXT DEFAULT 'server-side',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(book_id)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.book_text_extractions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view extractions (since books are public)
CREATE POLICY "Anyone can view text extractions" 
  ON public.book_text_extractions 
  FOR SELECT 
  USING (true);

-- Create policy to allow anyone to create extractions
CREATE POLICY "Anyone can create text extractions" 
  ON public.book_text_extractions 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy to allow anyone to update extractions
CREATE POLICY "Anyone can update text extractions" 
  ON public.book_text_extractions 
  FOR UPDATE 
  USING (true);

-- Add trigger to update the updated_at column
CREATE TRIGGER update_book_text_extractions_updated_at
  BEFORE UPDATE ON public.book_text_extractions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
