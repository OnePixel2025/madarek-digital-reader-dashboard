-- Create profiles table for users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create reading sessions table to track reading time
CREATE TABLE public.reading_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  page_start INTEGER,
  page_end INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on reading sessions
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for reading sessions
CREATE POLICY "Users can view their own reading sessions" 
ON public.reading_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reading sessions" 
ON public.reading_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading sessions" 
ON public.reading_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create user favorites table
CREATE TABLE public.user_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- Enable RLS on user favorites
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for user favorites
CREATE POLICY "Users can view their own favorites" 
ON public.user_favorites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites" 
ON public.user_favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
ON public.user_favorites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create user reading stats table for aggregated statistics
CREATE TABLE public.user_reading_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_books_read INTEGER NOT NULL DEFAULT 0,
  total_reading_hours NUMERIC NOT NULL DEFAULT 0,
  current_streak_days INTEGER NOT NULL DEFAULT 0,
  longest_streak_days INTEGER NOT NULL DEFAULT 0,
  last_reading_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user reading stats
ALTER TABLE public.user_reading_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for user reading stats
CREATE POLICY "Users can view their own reading stats" 
ON public.user_reading_stats 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading stats" 
ON public.user_reading_stats 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reading stats" 
ON public.user_reading_stats 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create book progress table to track reading progress
CREATE TABLE public.book_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  current_page INTEGER NOT NULL DEFAULT 1,
  total_pages INTEGER,
  progress_percentage NUMERIC NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- Enable RLS on book progress
ALTER TABLE public.book_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for book progress
CREATE POLICY "Users can view their own book progress" 
ON public.book_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own book progress" 
ON public.book_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own book progress" 
ON public.book_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_reading_stats_updated_at
BEFORE UPDATE ON public.user_reading_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_book_progress_updated_at
BEFORE UPDATE ON public.book_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update reading stats when a reading session ends
CREATE OR REPLACE FUNCTION public.update_reading_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update reading stats when a session is completed
  IF NEW.end_time IS NOT NULL AND NEW.duration_minutes IS NOT NULL THEN
    INSERT INTO public.user_reading_stats (user_id, total_reading_hours, last_reading_date)
    VALUES (NEW.user_id, NEW.duration_minutes::NUMERIC / 60, CURRENT_DATE)
    ON CONFLICT (user_id) 
    DO UPDATE SET
      total_reading_hours = user_reading_stats.total_reading_hours + (NEW.duration_minutes::NUMERIC / 60),
      last_reading_date = CURRENT_DATE,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update reading stats
CREATE TRIGGER update_reading_stats_trigger
AFTER UPDATE ON public.reading_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_reading_stats();

-- Create function to update reading stats when book is completed
CREATE OR REPLACE FUNCTION public.update_books_read_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update books read count when a book is marked as completed
  IF NEW.is_completed = TRUE AND (OLD.is_completed IS NULL OR OLD.is_completed = FALSE) THEN
    INSERT INTO public.user_reading_stats (user_id, total_books_read)
    VALUES (NEW.user_id, 1)
    ON CONFLICT (user_id) 
    DO UPDATE SET
      total_books_read = user_reading_stats.total_books_read + 1,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update books read count
CREATE TRIGGER update_books_read_count_trigger
AFTER UPDATE ON public.book_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_books_read_count();