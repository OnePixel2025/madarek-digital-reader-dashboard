
-- Create a table for storing book information
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  description TEXT,
  isbn TEXT,
  publication_year INTEGER,
  category TEXT,
  language TEXT DEFAULT 'Arabic',
  page_count INTEGER,
  file_size_mb DECIMAL,
  file_path TEXT, -- Path to the PDF file in storage
  cover_image_path TEXT, -- Path to cover image if available
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'processing')),
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for PDF files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('books', 'books', true);

-- Create storage bucket for book covers
INSERT INTO storage.buckets (id, name, public) 
VALUES ('book-covers', 'book-covers', true);

-- Create RLS policies for books table
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read books (public library)
CREATE POLICY "Anyone can view books" 
  ON public.books 
  FOR SELECT 
  USING (true);

-- Allow authenticated users to insert books
CREATE POLICY "Authenticated users can create books" 
  ON public.books 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update books
CREATE POLICY "Authenticated users can update books" 
  ON public.books 
  FOR UPDATE 
  TO authenticated
  USING (true);

-- Allow authenticated users to delete books
CREATE POLICY "Authenticated users can delete books" 
  ON public.books 
  FOR DELETE 
  TO authenticated
  USING (true);

-- Create storage policies for books bucket
CREATE POLICY "Anyone can view book files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'books');

CREATE POLICY "Authenticated users can upload book files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'books');

CREATE POLICY "Authenticated users can update book files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'books');

CREATE POLICY "Authenticated users can delete book files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'books');

-- Create storage policies for book covers bucket
CREATE POLICY "Anyone can view book covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'book-covers');

CREATE POLICY "Authenticated users can upload book covers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'book-covers');

CREATE POLICY "Authenticated users can update book covers"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'book-covers');

CREATE POLICY "Authenticated users can delete book covers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'book-covers');

-- Create an index for better search performance
CREATE INDEX idx_books_title ON public.books USING gin(to_tsvector('arabic', title));
CREATE INDEX idx_books_author ON public.books USING gin(to_tsvector('arabic', author));
CREATE INDEX idx_books_category ON public.books (category);
CREATE INDEX idx_books_status ON public.books (status);
