-- Create a function to get current user ID from Clerk authentication
CREATE OR REPLACE FUNCTION auth.current_user_id() 
RETURNS TEXT AS $$
BEGIN
  -- For now, we'll extract from the request headers
  -- This is a simplified approach for Clerk integration
  RETURN current_setting('request.jwt.claims', true)::json->>'sub';
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update all RLS policies to use our custom function
DROP POLICY IF EXISTS "Users can view their own book progress" ON public.book_progress;
DROP POLICY IF EXISTS "Users can create their own book progress" ON public.book_progress;
DROP POLICY IF EXISTS "Users can update their own book progress" ON public.book_progress;

CREATE POLICY "Users can view their own book progress" 
ON public.book_progress 
FOR SELECT 
USING (auth.current_user_id() = user_id);

CREATE POLICY "Users can create their own book progress" 
ON public.book_progress 
FOR INSERT 
WITH CHECK (auth.current_user_id() = user_id);

CREATE POLICY "Users can update their own book progress" 
ON public.book_progress 
FOR UPDATE 
USING (auth.current_user_id() = user_id);

-- Update reading_sessions policies
DROP POLICY IF EXISTS "Users can view their own reading sessions" ON public.reading_sessions;
DROP POLICY IF EXISTS "Users can create their own reading sessions" ON public.reading_sessions;
DROP POLICY IF EXISTS "Users can update their own reading sessions" ON public.reading_sessions;

CREATE POLICY "Users can view their own reading sessions" 
ON public.reading_sessions 
FOR SELECT 
USING (auth.current_user_id() = user_id);

CREATE POLICY "Users can create their own reading sessions" 
ON public.reading_sessions 
FOR INSERT 
WITH CHECK (auth.current_user_id() = user_id);

CREATE POLICY "Users can update their own reading sessions" 
ON public.reading_sessions 
FOR UPDATE 
USING (auth.current_user_id() = user_id);

-- Update user_favorites policies
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can create their own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.user_favorites;

CREATE POLICY "Users can view their own favorites" 
ON public.user_favorites 
FOR SELECT 
USING (auth.current_user_id() = user_id);

CREATE POLICY "Users can create their own favorites" 
ON public.user_favorites 
FOR INSERT 
WITH CHECK (auth.current_user_id() = user_id);

CREATE POLICY "Users can delete their own favorites" 
ON public.user_favorites 
FOR DELETE 
USING (auth.current_user_id() = user_id);

-- Update user_reading_stats policies
DROP POLICY IF EXISTS "Users can view their own reading stats" ON public.user_reading_stats;
DROP POLICY IF EXISTS "Users can insert their own reading stats" ON public.user_reading_stats;
DROP POLICY IF EXISTS "Users can update their own reading stats" ON public.user_reading_stats;

CREATE POLICY "Users can view their own reading stats" 
ON public.user_reading_stats 
FOR SELECT 
USING (auth.current_user_id() = user_id);

CREATE POLICY "Users can insert their own reading stats" 
ON public.user_reading_stats 
FOR INSERT 
WITH CHECK (auth.current_user_id() = user_id);

CREATE POLICY "Users can update their own reading stats" 
ON public.user_reading_stats 
FOR UPDATE 
USING (auth.current_user_id() = user_id);

-- Update profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.current_user_id() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.current_user_id() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.current_user_id() = user_id);