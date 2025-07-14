import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Bookmark, Mic, MicOff, MessageCircle, Brain, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// PDF Viewer Component using iframe
const PdfViewer = React.forwardRef<HTMLIFrameElement, { src?: string; style?: React.CSSProperties }>(
  ({ src, style }, ref) => {
    return (
      <iframe
        ref={ref}
        src={src ? `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(src)}` : undefined}
        title="PDF Viewer"
        style={{
          width: '100%',
          height: '600px',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          background: '#f9fafb',
          ...style
        }}
      />
    );
  }
);

interface Book {
  id: string;
  title: string;
  author: string | null;
  file_path: string | null;
  page_count: number | null;
}

export const ReadBook = () => {
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  const [isTTSActive, setIsTTSActive] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [readingSessionId, setReadingSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const pdfViewerRef = useRef<HTMLIFrameElement | null>(null);

  // Fetch books from database
  const { data: books = [], isLoading: booksLoading } = useQuery({
    queryKey: ['books-for-reading'],
    queryFn: async () => {
      console.log('Fetching books for reading...');
      const { data, error } = await supabase
        .from('books')
        .select('id, title, author, file_path, page_count')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching books:', error);
        throw error;
      }
      
      console.log('Fetched books for reading:', data);
      return data as Book[];
    }
  });

  // Handle URL parameters for book and page
  useEffect(() => {
    const bookParam = searchParams.get('book');
    const pageParam = searchParams.get('page');
    
    if (bookParam) {
      setSelectedBookId(bookParam);
    } else if (books.length > 0 && !selectedBookId) {
      setSelectedBookId(books[0].id);
    }
    
    if (pageParam) {
      setCurrentPage(parseInt(pageParam, 10));
    }
  }, [books, selectedBookId, searchParams]);

  // Get PDF URL when book is selected
  useEffect(() => {
    const loadPdfUrl = async () => {
      if (!selectedBookId) return;
      
      const selectedBook = books.find(book => book.id === selectedBookId);
      if (!selectedBook?.file_path) return;

      setLoadingPdf(true);
      setPdfError(null);
      setPdfUrl(null);

      try {
        console.log('Getting PDF URL for file:', selectedBook.file_path);
        
        let finalUrl: string;
        
        // Check if file_path is already a full URL
        if (selectedBook.file_path.startsWith('http')) {
          console.log('File path is already a full URL:', selectedBook.file_path);
          finalUrl = selectedBook.file_path;
        } else {
          // Get public URL from Supabase storage
          const { data } = await supabase.storage
            .from('books')
            .getPublicUrl(selectedBook.file_path);
          
          finalUrl = data.publicUrl;
          console.log('Generated public URL:', finalUrl);
        }

        setPdfUrl(finalUrl);
        setLoadingPdf(false);
      } catch (error) {
        console.error('Error loading PDF:', error);
        setPdfError(error instanceof Error ? error.message : 'Failed to load PDF file');
        setLoadingPdf(false);
      }
    };

    loadPdfUrl();
  }, [selectedBookId, books]);

  // Fetch reading progress for selected book
  const { data: bookProgress } = useQuery({
    queryKey: ['book-progress', selectedBookId, user?.id],
    queryFn: async () => {
      if (!selectedBookId || !user?.id) return null;
      
      const { data, error } = await supabase
        .from('book_progress')
        .select('*')
        .eq('book_id', selectedBookId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching book progress:', error);
        return null;
      }

      return data;
    },
    enabled: !!selectedBookId && !!user?.id,
  });

  // Start reading session mutation
  const startSessionMutation = useMutation({
    mutationFn: async ({ bookId, pageStart }: { bookId: string; pageStart: number }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('reading_sessions')
        .insert({
          user_id: user.id,
          book_id: bookId,
          page_start: pageStart,
          start_time: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setReadingSessionId(data.id);
      setSessionStartTime(new Date());
    }
  });

  // End reading session mutation
  const endSessionMutation = useMutation({
    mutationFn: async ({ sessionId, pageEnd }: { sessionId: string; pageEnd: number }) => {
      const endTime = new Date();
      const startTime = sessionStartTime || new Date();
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

      const { error } = await supabase
        .from('reading_sessions')
        .update({
          end_time: endTime.toISOString(),
          page_end: pageEnd,
          duration_minutes: Math.max(durationMinutes, 1) // At least 1 minute
        })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-stats'] });
    }
  });

  // Update book progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ 
      bookId, 
      currentPage, 
      totalPages 
    }: { 
      bookId: string; 
      currentPage: number; 
      totalPages?: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const progressPercentage = totalPages ? (currentPage / totalPages) * 100 : 0;
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-progress'] });
      queryClient.invalidateQueries({ queryKey: ['reading-history'] });
    }
  });

  // Start reading session when book is selected
  useEffect(() => {
    if (selectedBookId && user?.id && !readingSessionId) {
      startSessionMutation.mutate({ 
        bookId: selectedBookId, 
        pageStart: currentPage 
      });
    }
  }, [selectedBookId, user?.id]);

  // Update progress when page changes
  useEffect(() => {
    if (selectedBookId && currentPage > 0) {
      const selectedBook = books.find(book => book.id === selectedBookId);
      updateProgressMutation.mutate({
        bookId: selectedBookId,
        currentPage,
        totalPages: selectedBook?.page_count || undefined
      });
    }
  }, [selectedBookId, currentPage, books]);

  // End session when component unmounts or book changes
  useEffect(() => {
    return () => {
      if (readingSessionId && currentPage > 0) {
        endSessionMutation.mutate({ 
          sessionId: readingSessionId, 
          pageEnd: currentPage 
        });
      }
    };
  }, [readingSessionId, currentPage]);

  const selectedBook = books.find(book => book.id === selectedBookId);

  const handleRetryLoad = () => {
    // Force reload the PDF by clearing and resetting the URL
    const currentUrl = pdfUrl;
    setPdfUrl(null);
    setPdfError(null);
    setTimeout(() => {
      setPdfUrl(currentUrl);
    }, 100);
  };


  if (booksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading books...</p>
        </div>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-stone-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-800 mb-2">No books available</h3>
          <p className="text-stone-600">Upload some books first to start reading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Main Reading Area */}
      <div className="flex-1 bg-white rounded-xl border border-stone-200 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Book Header */}
          <div className="mb-6 text-center">
            <div className="mb-4">
              <select 
                value={selectedBookId || ''} 
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {books.map(book => (
                  <option key={book.id} value={book.id}>
                    {book.title} {book.author ? `- ${book.author}` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedBook && (
              <>
                <h1 className="text-2xl font-bold text-stone-800 mb-2">{selectedBook.title}</h1>
                <p className="text-stone-600">{selectedBook.author || 'Unknown Author'}</p>
              </>
            )}
          </div>

          {/* PDF Display */}
          <div className="flex justify-center">
            {loadingPdf ? (
              <div className="flex items-center justify-center p-8 border-2 border-dashed border-stone-200 rounded-lg w-full h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                  <p className="text-stone-600">Loading PDF...</p>
                </div>
              </div>
            ) : pdfError ? (
              <div className="flex items-center justify-center p-8 border-2 border-red-200 rounded-lg bg-red-50 w-full h-96">
                <div className="text-center">
                  <BookOpen className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-red-800 mb-2">Failed to load PDF</h3>
                  <p className="text-red-600 mb-4 text-sm">{pdfError}</p>
                  <div className="space-y-2">
                    <Button onClick={handleRetryLoad} variant="outline" size="sm">
                      Retry Loading
                    </Button>
                    {pdfUrl && (
                      <p className="text-xs text-red-500 break-all">
                        URL: {pdfUrl}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : pdfUrl ? (
              <div className="w-full">
                <PdfViewer 
                  ref={pdfViewerRef}
                  src={pdfUrl}
                  style={{ width: '100%', height: '600px' }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center p-8 border-2 border-dashed border-stone-200 rounded-lg w-full h-96">
                <div className="text-center">
                  <BookOpen className="w-12 h-12 text-stone-400 mx-auto mb-4" />
                  <p className="text-stone-600">Select a book to start reading</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reading Tools Sidebar */}
      <div className="w-80 space-y-6">
        {/* Reading Controls */}
        <Card className="border-stone-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Reading Tools
            </h3>
            
            <div className="space-y-3">
              <Button 
                variant={isTTSActive ? "default" : "outline"} 
                className="w-full justify-start"
                onClick={() => setIsTTSActive(!isTTSActive)}
              >
                {isTTSActive ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                {isTTSActive ? "Stop Reading" : "Text-to-Speech"}
              </Button>

              <Button variant="outline" className="w-full justify-start">
                <Bookmark className="w-4 h-4 mr-2" />
                Add Bookmark
              </Button>

              <Button variant="outline" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Reading Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Features */}
        <Card className="border-stone-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Assistant
            </h3>
            
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Brain className="w-4 h-4 mr-2" />
                Generate Summary
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowAIChat(!showAIChat)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat about Book
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card className="border-stone-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-stone-800 mb-4">Reading Progress</h3>
            
            <div className="space-y-4">
              {/* Page Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex-1 text-center">
                  <input
                    type="number"
                    value={currentPage}
                    onChange={(e) => setCurrentPage(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 px-2 py-1 text-center border border-stone-200 rounded text-sm"
                    min="1"
                    max={selectedBook?.page_count || undefined}
                  />
                  <span className="text-sm text-stone-500">
                    {selectedBook?.page_count ? ` / ${selectedBook.page_count}` : ''}
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={selectedBook?.page_count ? currentPage >= selectedBook.page_count : false}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Progress Bar */}
              {bookProgress && selectedBook?.page_count && (
                <div className="space-y-2">
                  <Progress value={bookProgress.progress_percentage} className="w-full" />
                  <div className="flex justify-between text-xs text-stone-500">
                    <span>{Math.round(bookProgress.progress_percentage)}% complete</span>
                    <span>Page {bookProgress.current_page} of {selectedBook.page_count}</span>
                  </div>
                </div>
              )}
              
              <div className="text-sm text-stone-600">
                {selectedBook && (
                  <>
                    <div className="flex justify-between mb-1">
                      <span>Book:</span>
                      <span className="text-right truncate">{selectedBook.title}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>Author:</span>
                      <span>{selectedBook.author || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>Total Pages:</span>
                      <span>{selectedBook.page_count || 'Unknown'}</span>
                    </div>
                    {bookProgress && (
                      <div className="flex justify-between">
                        <span>Last Read:</span>
                        <span>{new Date(bookProgress.last_read_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info (only show if there's an error) */}
        {pdfError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <h4 className="font-semibold text-red-800 mb-2">Debug Info</h4>
              <div className="text-xs text-red-600 space-y-1">
                <div>Book ID: {selectedBookId}</div>
                <div>File Path: {selectedBook?.file_path}</div>
                <div>PDF URL: {pdfUrl}</div>
                <div>Error: {pdfError}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Chat Drawer */}
      {showAIChat && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-stone-200 shadow-xl z-50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-stone-800">Chat with Book</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowAIChat(false)}>
              ×
            </Button>
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="bg-stone-100 rounded-lg p-4">
              <p className="text-sm text-stone-700">
                Hi! I'm your AI reading assistant. Ask me anything about "{selectedBook?.title}".
              </p>
            </div>
            
            <div className="flex-1"></div>
            
            <div className="border-t border-stone-200 pt-4">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ask about this book..."
                  className="flex-1 px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Button size="sm">Send</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};