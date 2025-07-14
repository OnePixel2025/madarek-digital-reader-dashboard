-- Fix user_id column types to work with Clerk string IDs
-- Update book_progress table
ALTER TABLE public.book_progress 
ALTER COLUMN user_id TYPE TEXT;

-- Update reading_sessions table  
ALTER TABLE public.reading_sessions 
ALTER COLUMN user_id TYPE TEXT;

-- Update user_favorites table
ALTER TABLE public.user_favorites 
ALTER COLUMN user_id TYPE TEXT;

-- Update user_reading_stats table
ALTER TABLE public.user_reading_stats 
ALTER COLUMN user_id TYPE TEXT;

-- Update profiles table
ALTER TABLE public.profiles 
ALTER COLUMN user_id TYPE TEXT;