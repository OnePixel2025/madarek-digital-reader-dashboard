

-- Check if the books bucket exists and create it if it doesn't
INSERT INTO storage.buckets (id, name, public)
VALUES ('books', 'books', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;

-- Create storage policies for the books bucket
DROP POLICY IF EXISTS "Allow uploads to books bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to books bucket" ON storage.objects;  
DROP POLICY IF EXISTS "Allow delete from books bucket" ON storage.objects;

-- Allow anyone to upload to books bucket (no authentication required)
CREATE POLICY "Allow uploads to books bucket" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'books');

-- Allow anyone to view books bucket
CREATE POLICY "Allow public access to books bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'books');

-- Allow anyone to delete from books bucket
CREATE POLICY "Allow delete from books bucket" ON storage.objects
FOR DELETE USING (bucket_id = 'books');

