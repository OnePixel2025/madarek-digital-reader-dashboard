
-- Update the RLS policies to allow anyone to insert books (not just authenticated users)
-- This makes sense for a public library where anyone should be able to contribute books

DROP POLICY IF EXISTS "Authenticated users can create books" ON public.books;
DROP POLICY IF EXISTS "Authenticated users can update books" ON public.books;
DROP POLICY IF EXISTS "Authenticated users can delete books" ON public.books;

-- Allow anyone to create books (public library system)
CREATE POLICY "Anyone can create books" 
  ON public.books 
  FOR INSERT 
  WITH CHECK (true);

-- Allow anyone to update books
CREATE POLICY "Anyone can update books" 
  ON public.books 
  FOR UPDATE 
  USING (true);

-- Allow anyone to delete books
CREATE POLICY "Anyone can delete books" 
  ON public.books 
  FOR DELETE 
  USING (true);
