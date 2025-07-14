-- Temporarily disable RLS and drop policies to simplify Clerk integration
-- We'll handle user filtering in the application code instead

-- Disable RLS on all user tables
ALTER TABLE public.book_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reading_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
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