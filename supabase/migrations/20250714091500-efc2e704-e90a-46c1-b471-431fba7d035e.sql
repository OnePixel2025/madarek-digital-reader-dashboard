-- Fix user_id column types to work with Clerk string IDs
-- First, drop all foreign key constraints and RLS policies that depend on user_id columns

-- Drop foreign key constraints if they exist
ALTER TABLE public.book_progress DROP CONSTRAINT IF EXISTS "book_progress_user_id_fkey";
ALTER TABLE public.reading_sessions DROP CONSTRAINT IF EXISTS "reading_sessions_user_id_fkey";
ALTER TABLE public.user_favorites DROP CONSTRAINT IF EXISTS "user_favorites_user_id_fkey";
ALTER TABLE public.user_reading_stats DROP CONSTRAINT IF EXISTS "user_reading_stats_user_id_fkey";
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS "profiles_user_id_fkey";

-- Drop all RLS policies that depend on user_id columns
DROP POLICY IF EXISTS "Users can view their own book progress" ON public.book_progress;
DROP POLICY IF EXISTS "Users can create their own book progress" ON public.book_progress;
DROP POLICY IF EXISTS "Users can update their own book progress" ON public.book_progress;

DROP POLICY IF EXISTS "Users can view their own reading sessions" ON public.reading_sessions;
DROP POLICY IF EXISTS "Users can create their own reading sessions" ON public.reading_sessions;
DROP POLICY IF EXISTS "Users can update their own reading sessions" ON public.reading_sessions;

DROP POLICY IF EXISTS "Users can view their own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can create their own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.user_favorites;

DROP POLICY IF EXISTS "Users can view their own reading stats" ON public.user_reading_stats;
DROP POLICY IF EXISTS "Users can insert their own reading stats" ON public.user_reading_stats;
DROP POLICY IF EXISTS "Users can update their own reading stats" ON public.user_reading_stats;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Now alter the column types
ALTER TABLE public.book_progress ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.reading_sessions ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.user_favorites ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.user_reading_stats ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.profiles ALTER COLUMN user_id TYPE TEXT;

-- Recreate the RLS policies with TEXT user_id columns using Clerk auth
CREATE POLICY "Users can view their own book progress" 
ON public.book_progress 
FOR SELECT 
USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can create their own book progress" 
ON public.book_progress 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own book progress" 
ON public.book_progress 
FOR UPDATE 
USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can view their own reading sessions" 
ON public.reading_sessions 
FOR SELECT 
USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can create their own reading sessions" 
ON public.reading_sessions 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own reading sessions" 
ON public.reading_sessions 
FOR UPDATE 
USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can view their own favorites" 
ON public.user_favorites 
FOR SELECT 
USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can create their own favorites" 
ON public.user_favorites 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own favorites" 
ON public.user_favorites 
FOR DELETE 
USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can view their own reading stats" 
ON public.user_reading_stats 
FOR SELECT 
USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own reading stats" 
ON public.user_reading_stats 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own reading stats" 
ON public.user_reading_stats 
FOR UPDATE 
USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.jwt() ->> 'sub' = user_id);