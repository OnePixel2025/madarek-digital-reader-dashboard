import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Calendar, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface BookProgress {
  id: string;
  current_page: number;
  total_pages: number | null;
  progress_percentage: number;
  is_completed: boolean;
  last_read_at: string;
  book: {
    id: string;
    title: string;
    author: string | null;
    cover_image_path: string | null;
    file_path: string | null;
  };
}

export const ReadingHistory = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const { data: readingHistory = [], isLoading } = useQuery({
    queryKey: ['reading-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('book_progress')
        .select(`
          id,
          current_page,
          total_pages,
          progress_percentage,
          is_completed,
          last_read_at,
          book:books (
            id,
            title,
            author,
            cover_image_path,
            file_path
          )
        `)
        .eq('user_id', user.id)
        .order('last_read_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching reading history:', error);
        toast({
          title: "Error",
          description: "Failed to fetch reading history",
          variant: "destructive"
        });
        return [];
      }

      return data as BookProgress[];
    },
    enabled: !!user?.id,
  });

  const { data: readingStats } = useQuery({
    queryKey: ['reading-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_reading_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching reading stats:', error);
        return null;
      }

      return data;
    },
    enabled: !!user?.id,
  });

  const handleContinueReading = (bookId: string, currentPage: number) => {
    navigate(`/read?book=${bookId}&page=${currentPage}`);
  };

  const formatReadingTime = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`;
    }
    return `${Math.round(hours * 10) / 10} hours`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BookOpen className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reading History</h1>
          <p className="text-muted-foreground">Continue where you left off</p>
        </div>
      </div>

      {/* Reading Stats */}
      {readingStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{readingStats.total_books_read}</p>
                  <p className="text-sm text-muted-foreground">Books Read</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">
                    {formatReadingTime(Number(readingStats.total_reading_hours))}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Reading Time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{readingStats.current_streak_days}</p>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Books */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Recently Read Books
          </CardTitle>
        </CardHeader>
        <CardContent>
          {readingHistory.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No reading history yet</h3>
              <p className="text-muted-foreground mb-4">
                Start reading a book to see your reading history here
              </p>
              <Button onClick={() => navigate('/library')}>
                Browse Library
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {readingHistory.map((progress) => (
                <div
                  key={progress.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  {/* Book Cover */}
                  <div className="w-16 h-20 bg-muted rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                    {progress.book.cover_image_path ? (
                      <img
                        src={progress.book.cover_image_path}
                        alt={progress.book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>

                  {/* Book Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{progress.book.title}</h3>
                    {progress.book.author && (
                      <p className="text-sm text-muted-foreground">by {progress.book.author}</p>
                    )}
                    
                    {/* Progress */}
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <Progress value={progress.progress_percentage} className="flex-1" />
                        <span className="text-sm text-muted-foreground">
                          {Math.round(progress.progress_percentage)}%
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Page {progress.current_page}
                          {progress.total_pages && ` of ${progress.total_pages}`}
                        </span>
                        <span>Last read: {formatDate(progress.last_read_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-col items-end gap-2">
                    {progress.is_completed ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        In Progress
                      </Badge>
                    )}
                    
                    <Button
                      size="sm"
                      onClick={() => handleContinueReading(progress.book.id, progress.current_page)}
                      disabled={!progress.book.file_path}
                    >
                      {progress.is_completed ? 'Read Again' : 'Continue Reading'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};