-- Create collections table
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_color TEXT DEFAULT 'bg-gradient-to-br from-emerald-400 to-emerald-600',
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  book_count INTEGER NOT NULL DEFAULT 0,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collection_books junction table (many-to-many)
CREATE TABLE public.collection_books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collection_id, book_id)
);

-- Enable Row Level Security
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_books ENABLE ROW LEVEL SECURITY;

-- Create policies for collections
CREATE POLICY "Users can view their own collections" 
ON public.collections 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own collections" 
ON public.collections 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own collections" 
ON public.collections 
FOR UPDATE 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own collections" 
ON public.collections 
FOR DELETE 
USING (auth.uid()::text = user_id);

-- Create policies for collection_books
CREATE POLICY "Users can view books in their collections" 
ON public.collection_books 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.collections 
    WHERE collections.id = collection_books.collection_id 
    AND collections.user_id = auth.uid()::text
  )
);

CREATE POLICY "Users can add books to their collections" 
ON public.collection_books 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.collections 
    WHERE collections.id = collection_books.collection_id 
    AND collections.user_id = auth.uid()::text
  )
);

CREATE POLICY "Users can remove books from their collections" 
ON public.collection_books 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.collections 
    WHERE collections.id = collection_books.collection_id 
    AND collections.user_id = auth.uid()::text
  )
);

-- Create policies for user_favorites (books)
CREATE POLICY "Users can view their own favorites" 
ON public.user_favorites 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can add their own favorites" 
ON public.user_favorites 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can remove their own favorites" 
ON public.user_favorites 
FOR DELETE 
USING (auth.uid()::text = user_id);

-- Create function to update collection book count
CREATE OR REPLACE FUNCTION public.update_collection_book_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.collections 
    SET book_count = book_count + 1, updated_at = now()
    WHERE id = NEW.collection_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.collections 
    SET book_count = book_count - 1, updated_at = now()
    WHERE id = OLD.collection_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update book count
CREATE TRIGGER update_collection_book_count_on_insert
  AFTER INSERT ON public.collection_books
  FOR EACH ROW
  EXECUTE FUNCTION public.update_collection_book_count();

CREATE TRIGGER update_collection_book_count_on_delete
  AFTER DELETE ON public.collection_books
  FOR EACH ROW
  EXECUTE FUNCTION public.update_collection_book_count();

-- Create trigger for updating collection timestamps
CREATE TRIGGER update_collections_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();