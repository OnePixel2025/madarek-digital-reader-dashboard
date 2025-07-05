
import React, { useState, useEffect } from 'react';
import { BookOpen, Bookmark, Mic, MicOff, MessageCircle, Brain, Settings, ChevronLeft, ChevronRight, Home, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { Document, Page, pdfjs } from 'react-pdf';
import { supabase } from '@/integrations/supabase/client';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

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
  const [showSidebar, setShowSidebar] = useState(true);

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

  const goToPage = (pageNum: number) => {
    setCurrentPage(pageNum);
  };

  if (booksLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-stone-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading books...</p>
        </div>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-stone-50">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-stone-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-800 mb-2">No books available</h3>
          <p className="text-stone-600">Upload some books first to start reading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-stone-900">
      {/* Collapsible Sidebar */}
      <div className={`${showSidebar ? 'w-80' : 'w-12'} bg-stone-800 text-white transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-stone-700 flex items-center justify-between">
          {showSidebar && (
            <div>
              <h2 className="text-lg font-semibold">{selectedBook?.title || 'Book Reader'}</h2>
              <p className="text-stone-400 text-sm">{selectedBook?.author || 'Unknown Author'}</p>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowSidebar(!showSidebar)}
            className="text-white hover:bg-stone-700"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>

        {showSidebar && (
          <>
            {/* Book Selection */}
            <div className="p-4 border-b border-stone-700">
              <select 
                value={selectedBookId || ''} 
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {books.map(book => (
                  <option key={book.id} value={book.id}>
                    {book.title} {book.author ? `- ${book.author}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Page Navigation */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-sm font-medium text-stone-300 mb-3">Pages ({numPages || selectedBook?.page_count || '?'})</h3>
              <div className="space-y-1">
                {numPages && Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                      currentPage === pageNum 
                        ? 'bg-emerald-600 text-white' 
                        : 'text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    Page {pageNum}
                  </button>
                ))}
              </div>
            </div>

            {/* Reading Tools */}
            <div className="p-4 border-t border-stone-700 space-y-2">
              <Button 
                variant={isTTSActive ? "default" : "outline"} 
                size="sm"
                className="w-full justify-start"
                onClick={() => setIsTTSActive(!isTTSActive)}
              >
                {isTTSActive ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                {isTTSActive ? "Stop Reading" : "Text-to-Speech"}
              </Button>

              <Button variant="outline" size="sm" className="w-full justify-start">
                <Bookmark className="w-4 h-4 mr-2" />
                Bookmark
              </Button>

              <Button 
                variant="outline" 
                size="sm"
                className="w-full justify-start"
                onClick={() => setShowAIChat(!showAIChat)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                AI Chat
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-stone-800 text-white px-6 py-3 flex items-center justify-between border-b border-stone-700">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-white hover:bg-stone-700">
              <Home className="w-4 h-4 mr-2" />
              Back to Library
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={goToPrevPage}
                disabled={currentPage <= 1}
                className="text-white hover:bg-stone-700 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                previous
              </Button>
              
              <span className="text-sm px-3 py-1 bg-stone-700 rounded">
                {currentPage} of {numPages || '?'}
              </span>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={goToNextPage}
                disabled={currentPage >= (numPages || 1)}
                className="text-white hover:bg-stone-700 disabled:opacity-50"
              >
                next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Zoom and View Controls */}
            <div className="flex items-center gap-2 text-sm">
              <Button variant="ghost" size="sm" className="text-white hover:bg-stone-700">-</Button>
              <span className="px-2">Fit Width</span>
              <Button variant="ghost" size="sm" className="text-white hover:bg-stone-700">+</Button>
            </div>
          </div>
        </div>

        {/* PDF Display Area */}
        <div className="flex-1 bg-stone-600 overflow-auto flex items-center justify-center p-8">
          {pdfUrl ? (
            <div className="bg-white shadow-2xl">
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center p-20">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                      <p className="text-stone-600">Loading presentation...</p>
                    </div>
                  </div>
                }
              >
                <Page 
                  pageNumber={currentPage} 
                  width={Math.min(1000, window.innerWidth - (showSidebar ? 400 : 100))}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            </div>
          ) : (
            <div className="flex items-center justify-center p-20 bg-white rounded-lg shadow-2xl">
              <div className="text-center">
                <BookOpen className="w-16 h-16 text-stone-400 mx-auto mb-4" />
                <p className="text-stone-600 text-lg">Loading presentation...</p>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="bg-stone-800 px-6 py-2">
          <div className="w-full bg-stone-700 rounded-full h-1">
            <div 
              className="bg-emerald-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${(currentPage / (numPages || 1)) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* AI Chat Drawer */}
      {showAIChat && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-stone-200 shadow-xl z-50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-stone-800">AI Reading Assistant</h3>
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
