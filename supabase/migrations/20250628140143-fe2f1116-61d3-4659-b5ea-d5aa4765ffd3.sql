
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

CREATE POLICY "Allow uploads to books bucket" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'books');

CREATE POLICY "Allow public access to books bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'books');

CREATE POLICY "Allow delete from books bucket" ON storage.objects
FOR DELETE USING (bucket_id = 'books');
