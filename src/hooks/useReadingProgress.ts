
import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';

interface ReadingProgressData {
  scrollPosition: number;
  viewportHeight: number;
  contentHeight: number;
}

interface UseReadingProgressProps {
  bookId: string;
  totalPages?: number;
}

export const useReadingProgress = ({ bookId, totalPages }: UseReadingProgressProps) => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [readingTime, setReadingTime] = useState(0);
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [progressData, setProgressData] = useState<ReadingProgressData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load existing progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      if (!bookId || !user?.id || isLoaded) return;
      
      try {
        const { data, error } = await supabase
          .from('book_progress')
          .select('current_page, progress_percentage')
          .eq('book_id', bookId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data) {
          setCurrentPage(data.current_page || 1);
        }
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load reading progress:', error);
        setIsLoaded(true);
      }
    };

    loadProgress();
  }, [bookId, user?.id, isLoaded]);

  // Start reading session after progress is loaded
  useEffect(() => {
    if (bookId && user?.id && isLoaded) {
      setSessionStart(new Date());
      
      // Start timer for reading time
      const interval = setInterval(() => {
        setReadingTime(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [bookId, user?.id, isLoaded]);

  // Update book progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ 
      currentPage, 
      progressPercentage,
      readingTimeSeconds 
    }: { 
      currentPage: number; 
      progressPercentage: number;
      readingTimeSeconds: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const isCompleted = totalPages ? currentPage >= totalPages : false;

      const { error } = await supabase
        .from('book_progress')
        .upsert({
          user_id: user.id,
          book_id: bookId,
          current_page: currentPage,
          total_pages: totalPages,
          progress_percentage: progressPercentage,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          last_read_at: new Date().toISOString()
        });

      if (error) throw error;

      // Also update reading session
      const { error: sessionError } = await supabase
        .from('reading_sessions')
        .insert({
          user_id: user.id,
          book_id: bookId,
          page_start: currentPage,
          page_end: currentPage,
          start_time: sessionStart?.toISOString() || new Date().toISOString(),
          end_time: new Date().toISOString(),
          duration_minutes: Math.max(1, Math.round(readingTimeSeconds / 60))
        });

      if (sessionError) {
        console.warn('Failed to update reading session:', sessionError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-progress'] });
      queryClient.invalidateQueries({ queryKey: ['reading-stats'] });
    }
  });

  const updatePage = useCallback((page: number) => {
    setCurrentPage(page);
    
    // Calculate progress percentage based on page
    let progressPercentage = 0;
    if (totalPages) {
      progressPercentage = (page / totalPages) * 100;
    }

    // Update progress immediately without debouncing for page changes
    updateProgressMutation.mutate({
      currentPage: page,
      progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
      readingTimeSeconds: readingTime
    });
  }, [totalPages, readingTime, updateProgressMutation]);

  const updateScrollProgress = useCallback((scrollPercentage: number) => {
    // For single-page PDF viewer, use scroll percentage to update progress within current page
    if (totalPages) {
      const basePageProgress = ((currentPage - 1) / totalPages) * 100;
      const scrollContribution = (scrollPercentage / 100) * (100 / totalPages);
      const progressPercentage = basePageProgress + scrollContribution;

      // Debounced update for scroll progress
      const timeoutId = setTimeout(() => {
        updateProgressMutation.mutate({
          currentPage,
          progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
          readingTimeSeconds: readingTime
        });
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [currentPage, totalPages, readingTime, updateProgressMutation]);

  return {
    currentPage,
    readingTime,
    updatePage,
    updateScrollProgress,
    isUpdating: updateProgressMutation.isPending
  };
};
