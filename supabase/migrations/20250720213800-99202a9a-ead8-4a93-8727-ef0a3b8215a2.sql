-- Add RLS policies for book_progress table
CREATE POLICY "Users can view their own progress" 
ON public.book_progress 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own progress" 
ON public.book_progress 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.book_progress 
FOR UPDATE 
USING (auth.uid()::text = user_id);

-- Add RLS policies for reading_sessions table
CREATE POLICY "Users can view their own sessions" 
ON public.reading_sessions 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own sessions" 
ON public.reading_sessions 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own sessions" 
ON public.reading_sessions 
FOR UPDATE 
USING (auth.uid()::text = user_id);

-- Add RLS policies for user_reading_stats table
CREATE POLICY "Users can view their own reading stats" 
ON public.user_reading_stats 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own reading stats" 
ON public.user_reading_stats 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own reading stats" 
ON public.user_reading_stats 
FOR UPDATE 
USING (auth.uid()::text = user_id);

-- Add RLS policies for user_favorites table
CREATE POLICY "Users can view their own favorites" 
ON public.user_favorites 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own favorites" 
ON public.user_favorites 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own favorites" 
ON public.user_favorites 
FOR DELETE 
USING (auth.uid()::text = user_id);

-- Add RLS policies for collections table
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

-- Add RLS policies for collection_books table
CREATE POLICY "Users can view their own collection books" 
ON public.collection_books 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.collections 
  WHERE collections.id = collection_books.collection_id 
  AND collections.user_id = auth.uid()::text
));

CREATE POLICY "Users can add books to their own collections" 
ON public.collection_books 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.collections 
  WHERE collections.id = collection_books.collection_id 
  AND collections.user_id = auth.uid()::text
));

CREATE POLICY "Users can remove books from their own collections" 
ON public.collection_books 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.collections 
  WHERE collections.id = collection_books.collection_id 
  AND collections.user_id = auth.uid()::text
));

-- Add RLS policies for conversations table
CREATE POLICY "Users can view their own conversations" 
ON public.conversations 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own conversations" 
ON public.conversations 
FOR UPDATE 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own conversations" 
ON public.conversations 
FOR DELETE 
USING (auth.uid()::text = user_id);

-- Add RLS policies for chat_messages table
CREATE POLICY "Users can view messages from their conversations" 
ON public.chat_messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.conversations 
  WHERE conversations.id = chat_messages.conversation_id 
  AND conversations.user_id = auth.uid()::text
));

CREATE POLICY "Users can create messages in their conversations" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.conversations 
  WHERE conversations.id = chat_messages.conversation_id 
  AND conversations.user_id = auth.uid()::text
));

-- Add RLS policies for profiles table
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid()::text = user_id);

-- Enable RLS on all tables
ALTER TABLE public.book_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reading_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;