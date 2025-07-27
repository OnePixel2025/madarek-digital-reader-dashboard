-- Remove existing unique constraint on book_id and add composite unique constraint
ALTER TABLE public.book_text_extractions DROP CONSTRAINT IF EXISTS book_text_extractions_book_id_key;

-- Add composite unique constraint on (book_id, extraction_method)
ALTER TABLE public.book_text_extractions 
ADD CONSTRAINT book_text_extractions_book_id_extraction_method_key 
UNIQUE (book_id, extraction_method);