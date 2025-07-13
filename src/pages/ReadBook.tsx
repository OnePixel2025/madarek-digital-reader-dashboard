import React, { useState, useEffect } from 'react';
import { BookOpen, Bookmark, Mic, MicOff, MessageCircle, Brain, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { Document, Page, pdfjs } from 'react-pdf';
import { supabase } from '@/integrations/supabase/client';

// Configure PDF.js worker - Updated configuration
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

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
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

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
          // Try to download the file as blob to avoid CORS issues
          try {
            const { data, error } = await supabase.storage
              .from('books')
              .download(selectedBook.file_path);
            
            if (error) throw error;
            
            // Create blob URL
            const blobUrl = URL.createObjectURL(data);
            finalUrl = blobUrl;
            console.log('Downloaded PDF as blob:', blobUrl);
          } catch (downloadError) {
            console.warn('Failed to download as blob, trying public URL:', downloadError);
            // Fallback to public URL
            const { data } = await supabase.storage
              .from('books')
              .getPublicUrl(selectedBook.file_path);
            
            finalUrl = data.publicUrl;
            console.log('Using public URL as fallback:', finalUrl);
          }
        }

        // Skip URL testing for now - let react-pdf handle it directly
        // CORS issues might prevent fetch testing but react-pdf can still load the file
        console.log('Skipping URL accessibility test due to potential CORS issues');

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

  const selectedBook = books.find(book => book.id === selectedBookId);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully with', numPages, 'pages');
    setNumPages(numPages);
    setPdfError(null);
    setCurrentPage(1); // Reset to first page when new document loads
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF document:', error);
    setPdfError(`Failed to load PDF: ${error.message}`);
  };

  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(numPages || 1, prev + 1));
  };

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
                <div className="mt-4 text-sm text-stone-500">
                  Page {currentPage} of {numPages || selectedBook.page_count || '?'}
                </div>
              </>
            )}
          </div>

          {/* PDF Navigation */}
          {pdfUrl && numPages && (
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
                disabled={currentPage >= numPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* PDF Display */}
          <div className="flex justify-center">
            {loadingPdf ? (
              <div className="flex items-center justify-center p-8 border-2 border-dashed border-stone-200 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                  <p className="text-stone-600">Loading PDF...</p>
                </div>
              </div>
            ) : pdfError ? (
              <div className="flex items-center justify-center p-8 border-2 border-red-200 rounded-lg bg-red-50">
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
              <div className="border border-stone-200 rounded-lg overflow-hidden">
                <Document
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <div className="flex items-center justify-center p-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                        <p className="text-stone-600">Loading PDF document...</p>
                      </div>
                    </div>
                  }
                  error={
                    <div className="flex items-center justify-center p-8 text-red-600">
                      <div className="text-center">
                        <BookOpen className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <p>Error loading PDF document</p>
                        <Button onClick={handleRetryLoad} variant="outline" size="sm" className="mt-2">
                          Retry
                        </Button>
                      </div>
                    </div>
                  }
                  options={{
                    cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/cmaps/',
                    cMapPacked: true,
                    withCredentials: false, // Important for CORS
                  }}
                >
                  <Page 
                    pageNumber={currentPage} 
                    width={800}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={
                      <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                      </div>
                    }
                    error={
                      <div className="flex items-center justify-center p-8 text-red-600">
                        <p>Error loading page {currentPage}</p>
                      </div>
                    }
                  />
                </Document>
              </div>
            ) : (
              <div className="flex items-center justify-center p-8 border-2 border-dashed border-stone-200 rounded-lg">
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