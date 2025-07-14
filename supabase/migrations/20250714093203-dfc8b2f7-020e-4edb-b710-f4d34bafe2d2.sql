-- Create missing triggers for the database functions

-- Trigger to update reading stats when a reading session is completed
CREATE TRIGGER update_reading_stats_trigger
  AFTER INSERT OR UPDATE ON public.reading_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reading_stats();

-- Trigger to update books read count when book progress is marked as completed
CREATE TRIGGER update_books_read_count_trigger
  AFTER UPDATE ON public.book_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_books_read_count();