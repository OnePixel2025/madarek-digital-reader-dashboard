
import React, { useState, useEffect } from 'react';
import { BookOpen, Bookmark, Mic, MicOff, MessageCircle, Brain, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { Document, Page, pdfjs } from 'react-pdf';
import { supabase } from '@/integrations/supabase/client';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface Book {
  id: string;
  title: string;
  author: string | null;
  file_path: string | null;
  page_count: number | null;
}

export const ReadBook = () => {
  const [isTTSActive, setIsTTSActive] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

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

  // Auto-select first book if none selected
  useEffect(() => {
    if (books.length > 0 && !selectedBookId) {
      setSelectedBookId(books[0].id);
    }
  }, [books, selectedBookId]);

  // Get PDF URL when book is selected
  useEffect(() => {
    const loadPdfUrl = async () => {
      if (!selectedBookId) return;
      
      const selectedBook = books.find(book => book.id === selectedBookId);
      if (!selectedBook?.file_path) return;

      try {
        console.log('Getting PDF URL for file:', selectedBook.file_path);
        const { data } = await supabase.storage
          .from('books')
          .getPublicUrl(selectedBook.file_path);
        
        console.log('PDF URL:', data.publicUrl);
        setPdfUrl(data.publicUrl);
      } catch (error) {
        console.error('Error getting PDF URL:', error);
      }
    };

    loadPdfUrl();
  }, [selectedBookId, books]);

  const selectedBook = books.find(book => book.id === selectedBookId);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully with', numPages, 'pages');
    setNumPages(numPages);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
  };

  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(numPages || 1, prev + 1));
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
                <div className="mt-4 text-sm text-stone-500">
                  Page {currentPage} of {numPages || selectedBook.page_count || '?'}
                </div>
              </>
            )}
          </div>

          {/* PDF Navigation */}
          {pdfUrl && (
            <div className="flex items-center justify-center gap-4 mb-6">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToPrevPage}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <span className="text-sm text-stone-600">
                Page {currentPage} of {numPages}
              </span>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToNextPage}
                disabled={currentPage >= (numPages || 1)}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* PDF Display */}
          <div className="flex justify-center">
            {pdfUrl ? (
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  </div>
                }
              >
                <Page 
                  pageNumber={currentPage} 
                  width={800}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            ) : (
              <div className="flex items-center justify-center p-8 border-2 border-dashed border-stone-200 rounded-lg">
                <div className="text-center">
                  <BookOpen className="w-12 h-12 text-stone-400 mx-auto mb-4" />
                  <p className="text-stone-600">Loading PDF...</p>
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
              <div>
                <div className="flex justify-between text-sm text-stone-600 mb-2">
                  <span>Current Page</span>
                  <span>{Math.round((currentPage / (numPages || 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentPage / (numPages || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>

              <Separator />

              <div className="text-sm text-stone-600">
                <div className="flex justify-between mb-1">
                  <span>Total Pages:</span>
                  <span>{numPages || selectedBook?.page_count || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Page:</span>
                  <span>{currentPage}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
