
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { BookOpen, Clock, Star, ArrowRight, TrendingUp, Headphones, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';

interface BookProgress {
  id: string;
  book_id: string;
  current_page: number;
  total_pages: number;
  progress_percentage: number;
  is_completed: boolean;
  last_read_at: string;
  book: {
    title: string;
    author: string;
    cover_image_path?: string;
  };
}

interface UserStats {
  total_books_read: number;
  total_reading_hours: number;
  total_favorites: number;
}

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [userStats, setUserStats] = useState<UserStats>({ total_books_read: 0, total_reading_hours: 0, total_favorites: 0 });
  const [recentBooks, setRecentBooks] = useState<BookProgress[]>([]);
  const [lastUncompletedBook, setLastUncompletedBook] = useState<BookProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch user stats
      const { data: stats } = await supabase
        .from('user_reading_stats')
        .select('total_books_read, total_reading_hours')
        .eq('user_id', user.id)
        .single();

      // Fetch favorites count
      const { count: favoritesCount } = await supabase
        .from('user_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch last 5 books with progress
      const { data: booksProgress } = await supabase
        .from('book_progress')
        .select(`
          id,
          book_id,
          current_page,
          total_pages,
          progress_percentage,
          is_completed,
          last_read_at,
          books:book_id (
            title,
            author,
            cover_image_path
          )
        `)
        .eq('user_id', user.id)
        .order('last_read_at', { ascending: false })
        .limit(5);

      // Find last uncompleted book
      const { data: uncompletedBook } = await supabase
        .from('book_progress')
        .select(`
          id,
          book_id,
          current_page,
          total_pages,
          progress_percentage,
          is_completed,
          last_read_at,
          books:book_id (
            title,
            author,
            cover_image_path
          )
        `)
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .order('last_read_at', { ascending: false })
        .limit(1)
        .single();

      setUserStats({
        total_books_read: stats?.total_books_read || 0,
        total_reading_hours: Math.round(stats?.total_reading_hours || 0),
        total_favorites: favoritesCount || 0,
      });

      if (booksProgress) {
        const formattedBooks = booksProgress.map(book => ({
          ...book,
          book: Array.isArray(book.books) ? book.books[0] : book.books
        })) as BookProgress[];
        setRecentBooks(formattedBooks);
      }

      if (uncompletedBook) {
        setLastUncompletedBook({
          ...uncompletedBook,
          book: Array.isArray(uncompletedBook.books) ? uncompletedBook.books[0] : uncompletedBook.books
        } as BookProgress);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueReading = () => {
    if (lastUncompletedBook) {
      navigate(`/read-book/${lastUncompletedBook.book_id}?page=${lastUncompletedBook.current_page}`);
    } else {
      navigate('/library');
    }
  };

  const handleBookClick = (book: BookProgress) => {
    navigate(`/read-book/${book.book_id}?page=${book.current_page}`);
  };

  const stats = [
    { label: 'Books Read', value: userStats.total_books_read.toString(), icon: BookOpen, color: 'text-emerald-600' },
    { label: 'Reading Hours', value: userStats.total_reading_hours.toString(), icon: Clock, color: 'text-blue-600' },
    { label: 'Favorites', value: userStats.total_favorites.toString(), icon: Star, color: 'text-amber-600' },
    { label: 'This Month', value: `${userStats.total_books_read > 0 ? '+' : ''}${userStats.total_books_read}`, icon: TrendingUp, color: 'text-green-600' },
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-stone-200 rounded w-64 mb-4"></div>
            <div className="h-4 bg-stone-200 rounded w-96 mb-6"></div>
            <div className="flex gap-4">
              <div className="h-10 bg-stone-200 rounded w-32"></div>
              <div className="h-10 bg-stone-200 rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-8">
        <h1 className="text-3xl font-bold text-stone-800 mb-2">
          Welcome back! 👋
        </h1>
        <p className="text-stone-600 mb-6">
          Continue your learning journey. You've read {userStats.total_books_read} books!
        </p>
        <div className="flex gap-4">
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={handleContinueReading}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            {lastUncompletedBook ? 'Continue Reading' : 'Start Reading'}
          </Button>
          <Button 
            variant="outline" 
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            onClick={() => navigate('/library')}
          >
            Browse Library
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-stone-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-stone-800">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Continue Reading */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="text-stone-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Continue Reading
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentBooks.length > 0 ? (
              recentBooks.map((book) => (
                <div 
                  key={book.id} 
                  className="flex items-center gap-4 p-4 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                  onClick={() => handleBookClick(book)}
                >
                  <div className="w-12 h-16 rounded bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    {book.book.cover_image_path ? (
                      <img 
                        src={book.book.cover_image_path} 
                        alt={book.book.title}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <BookOpen className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-stone-800 mb-1">{book.book.title}</h4>
                    <p className="text-sm text-stone-600 mb-2">{book.book.author}</p>
                    <div className="flex items-center gap-2">
                      <Progress value={book.progress_percentage} className="flex-1 h-2" />
                      <span className="text-xs text-stone-500">{Math.round(book.progress_percentage)}%</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-400" />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-stone-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-stone-300" />
                <p>No reading history yet</p>
                <p className="text-sm">Start reading to see your progress here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="text-stone-800">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start h-auto p-4 border-stone-200"
              onClick={() => navigate('/library')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-stone-800">Browse New Books</div>
                  <div className="text-sm text-stone-500">Discover latest additions</div>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start h-auto p-4 border-stone-200"
              onClick={() => navigate('/podcasts')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-stone-800">Listen to Podcasts</div>
                  <div className="text-sm text-stone-500">Audio learning on the go</div>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start h-auto p-4 border-stone-200"
              onClick={() => navigate('/ai-chat')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-stone-800">AI Tutor Session</div>
                  <div className="text-sm text-stone-500">Get personalized help</div>
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
