-- Disable RLS on conversations table since we're using Clerk auth instead of Supabase auth
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies for conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.conversations;

-- Disable RLS on chat_messages table since we're using Clerk auth
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies for chat_messages
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON public.chat_messages;