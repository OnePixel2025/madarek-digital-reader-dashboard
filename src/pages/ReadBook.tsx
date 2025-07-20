import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Mic, MicOff, MessageCircle, Brain, Settings, X, Play, Pause, Volume2, VolumeX, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { BookmarksPanel } from '@/components/pdf/BookmarksPanel';
import { useReadingProgress } from '@/hooks/useReadingProgress';

interface Book {
  id: string;
  title: string;
  author: string | null;
  file_path: string | null;
  page_count: number | null;
}

// Enhanced PDF Viewer Component with simplified controls (no built-in progress)
const EnhancedPdfViewer = ({ 
  pdfUrl, 
  currentPage, 
  onPageChange, 
  totalPages, 
  className = "" 
}) => {
  const containerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(1.2);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfLib, setPdfLib] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageRendering, setPageRendering] = useState(false);

  // Load PDF.js from CDN
  useEffect(() => {
    if (window.pdfjsLib) {
      setPdfLib(window.pdfjsLib);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      setPdfLib(window.pdfjsLib);
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Initialize PDF document when URL and library are available
  useEffect(() => {
    if (!pdfLib || !pdfUrl) return;

    const loadPDF = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const pdf = await pdfLib.getDocument(pdfUrl).promise;
        setPdfDoc(pdf);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [pdfLib, pdfUrl]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || pageRendering) return;

    const renderPage = async () => {
      setPageRendering(true);
      try {
        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const viewport = page.getViewport({ scale, rotation });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        context.clearRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
      } catch (err) {
        console.error('Error rendering page:', err);
        setError(err.message);
      } finally {
        setPageRendering(false);
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, scale, rotation]);

  const handlePrevPage = () => currentPage > 1 && onPageChange(currentPage - 1);
  const handleNextPage = () => currentPage < totalPages && onPageChange(currentPage + 1);
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 border-2 border-dashed border-stone-200 rounded-lg w-full h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 border-2 border-dashed border-stone-200 rounded-lg w-full h-96">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Failed to load PDF</h3>
          <p className="text-red-600 mb-4 text-sm">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`border border-stone-200 rounded-lg overflow-hidden ${className}`}>
      {/* PDF Controls - Simplified without progress */}
      <div className="bg-stone-50 border-b border-stone-200 p-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-1">
            <span className="text-sm text-stone-600">Page {currentPage} of {totalPages}</span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-stone-600 min-w-[3rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleRotate}>
            <RotateCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      
      {/* PDF Viewer - Made scrollable */}
      <div
        ref={scrollContainerRef}
        className="bg-stone-100 overflow-auto"
        style={{ height: isFullscreen ? 'calc(100vh - 80px)' : '700px' }}
      >
        <div className="flex justify-center p-4">
          <div className="bg-white shadow-lg relative">
            <canvas ref={canvasRef} className="max-w-full h-auto" />
            {pageRendering && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ReadBook = () => {
  const { user } = useUser();
  const { bookId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isTTSActive, setIsTTSActive] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfError, setPdfError] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [bookSummary, setBookSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [ttsAudio, setTtsAudio] = useState(null);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState('Aria');
  const audioRef = useRef(null);

  // Reading progress tracking states for sidebar
  const [readingProgress, setReadingProgress] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [timeSpentOnPage, setTimeSpentOnPage] = useState(0);
  const [totalReadingTime, setTotalReadingTime] = useState(0);
  const [pagesRead, setPagesRead] = useState(new Set());
  const timeIntervalRef = useRef(null);

  // Load summary from localStorage when book changes
  useEffect(() => {
    if (selectedBookId) {
      const savedSummary = localStorage.getItem(`book-summary-${selectedBookId}`);
      if (savedSummary) {
        setBookSummary(savedSummary);
      } else {
        setBookSummary(null);
      }
    }
  }, [selectedBookId]);

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
      return data;
    }
  });

  // Handle URL parameters for book and page
  useEffect(() => {
    if (bookId) {
      setSelectedBookId(bookId);
    } else if (books.length > 0 && !selectedBookId) {
      const firstBookId = books[0].id;
      setSelectedBookId(firstBookId);
      navigate(`/read-book/${firstBookId}`, { replace: true });
    }
  }, [bookId, books, selectedBookId, navigate]);

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
        
        let finalUrl;
        
        if (selectedBook.file_path.startsWith('http')) {
          console.log('File path is already a full URL:', selectedBook.file_path);
          finalUrl = selectedBook.file_path;
        } else {
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

  const selectedBook = books.find(book => book.id === selectedBookId);

  // Initialize reading progress hook
  const { 
    currentPage, 
    readingTime, 
    updatePage, 
    updateScrollProgress, 
    isUpdating 
  } = useReadingProgress({ 
    bookId: selectedBookId || '', 
    totalPages: selectedBook?.page_count || undefined 
  });

  // Track time spent on current page (for sidebar progress)
  useEffect(() => {
    setTimeSpentOnPage(0);

    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
    }

    timeIntervalRef.current = setInterval(() => {
      setTimeSpentOnPage(prev => prev + 1);
      setTotalReadingTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, [currentPage]);

  // Update pages read and calculate progress for sidebar
  useEffect(() => {
    if (currentPage && selectedBook?.page_count) {
      setPagesRead(prev => {
        const newPagesRead = new Set(prev);
        newPagesRead.add(currentPage);
        const progressPercentage = (newPagesRead.size / selectedBook.page_count) * 100;
        setReadingProgress(progressPercentage);
        return newPagesRead;
      });
    }
  }, [currentPage, selectedBook?.page_count]);

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

  const handleRetryLoad = () => {
    const currentUrl = pdfUrl;
    setPdfUrl(null);
    setPdfError(null);
    setTimeout(() => {
      setPdfUrl(currentUrl);
    }, 100);
  };

  const handleGenerateSummary = async () => {
    if (!selectedBookId) {
      toast({
        title: "No book selected",
        description: "Please select a book to generate a summary.",
        variant: "destructive",
      });
      return;
    }

    setSummaryLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-book-summary', {
        body: { bookId: selectedBookId }
      });

      if (error) throw error;

      localStorage.setItem(`book-summary-${selectedBookId}`, data.summary);
      setBookSummary(data.summary);
      setShowSummaryDialog(true);
      
      toast({
        title: "Summary generated",
        description: "Your book summary is ready!",
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: "Error generating summary",
        description: error instanceof Error ? error.message : "Failed to generate book summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleViewSummary = () => {
    if (bookSummary) {
      setShowSummaryDialog(true);
    }
  };

  const handleGenerateTTS = async () => {
    if (!selectedBookId) {
      toast({
        title: "No book selected",
        description: "Please select a book to generate audio.",
        variant: "destructive",
      });
      return;
    }

    setTtsLoading(true);
    try {
      console.log('Starting server-side text extraction for book:', selectedBookId);
      
      const extractedText = await extractTextFromPDF(selectedBookId);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the PDF');
      }

      console.log('Text extracted successfully, generating audio...');
      
      const textForTTS = extractedText.substring(0, 5000);
      
      const { data, error } = await supabase.functions.invoke('generate-book-tts', {
        body: { 
          bookId: selectedBookId,
          text: textForTTS,
          voice: selectedVoice
        }
      });

      if (error) throw error;

      if (data?.audioUrl) {
        setTtsAudio(data.audioUrl);
        setIsTTSActive(true);
        
        if (audioRef.current) {
          audioRef.current.src = data.audioUrl;
          audioRef.current.load();
        }
        
        toast({
          title: "Audio generated successfully",
          description: `Generated audio for ${textForTTS.length} characters of text!`,
        });
      } else {
        throw new Error('No audio URL returned from the service');
      }
      
    } catch (error) {
      console.error('Error generating TTS:', error);
      toast({
        title: "Error generating audio",
        description: error instanceof Error ? error.message : "Failed to generate text-to-speech audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTtsLoading(false);
    }
  };

  const extractTextFromPDF = async (bookId) => {
    try {
      console.log('Calling server-side text extraction for book:', bookId);
      
      const { data, error } = await supabase.functions.invoke('extract-pdf-text', {
        body: { bookId }
      });

      if (error) {
        console.error('Server-side extraction error:', error);
        throw new Error(error.message || 'Failed to extract text from PDF');
      }

      if (!data?.text) {
        throw new Error('No text was extracted from the PDF');
      }

      console.log(`Text extraction ${data.cached ? 'retrieved from cache' : 'completed'}:`, {
        textLength: data.text.length,
        pageCount: data.pageCount,
        cached: data.cached
      });

      return data.text;
    } catch (error) {
      console.error('Error in server-side text extraction:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to extract text from PDF. Please try again.');
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !ttsAudio) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [ttsAudio]);

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
        <div className="max-w-6xl mx-auto">
          {/* Book Header */}
          <div className="mb-6 text-center">
            <div className="mb-4">
              <select 
                value={selectedBookId || ''} 
                onChange={(e) => {
                  const newBookId = e.target.value;
                  setSelectedBookId(newBookId);
                  navigate(`/read-book/${newBookId}`);
                }}
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

          {/* Enhanced PDF Display */}
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
                  <Button onClick={handleRetryLoad} variant="outline" size="sm">
                    Retry Loading
                  </Button>
                </div>
              </div>
            ) : pdfUrl ? (
              <div className="w-full">
                <EnhancedPdfViewer
                  pdfUrl={pdfUrl}
                  currentPage={currentPage}
                  totalPages={selectedBook?.page_count || 1}
                  onPageChange={updatePage}
                  className="w-full"
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
              {/* Voice Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">Voice</label>
                <select 
                  value={selectedVoice} 
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  disabled={ttsLoading || isTTSActive}
                >
                  <option value="Aria">Aria (Female)</option>
                  <option value="Roger">Roger (Male)</option>
                  <option value="Sarah">Sarah (Female)</option>
                  <option value="Laura">Laura (Female)</option>
                  <option value="Charlie">Charlie (Male)</option>
                  <option value="George">George (Male)</option>
                  <option value="Callum">Callum (Male)</option>
                  <option value="River">River (Neutral)</option>
                  <option value="Liam">Liam (Male)</option>
                  <option value="Charlotte">Charlotte (Female)</option>
                  <option value="Alice">Alice (Female)</option>
                  <option value="Matilda">Matilda (Female)</option>
                  <option value="Will">Will (Male)</option>
                  <option value="Jessica">Jessica (Female)</option>
                  <option value="Eric">Eric (Male)</option>
                  <option value="Chris">Chris (Male)</option>
                  <option value="Brian">Brian (Male)</option>
                  <option value="Daniel">Daniel (Male)</option>
                  <option value="Lily">Lily (Female)</option>
                  <option value="Bill">Bill (Male)</option>
                </select>
              </div>

              {!isTTSActive ? (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleGenerateTTS}
                  disabled={ttsLoading || !selectedBookId}
                >
                  <Mic className="w-4 h-4 mr-2" />
                  {ttsLoading ? "Generating Audio..." : "Generate Audio with ElevenLabs"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button 
                    variant="default" 
                    className="w-full justify-start"
                    onClick={togglePlayPause}
                    disabled={!ttsAudio}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    {isPlaying ? "Pause Audio" : "Play Audio"}
                  </Button>
                  
                  {/* Audio Controls */}
                  {ttsAudio && (
                    <div className="space-y-2 p-3 bg-stone-50 rounded-lg">
                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-stone-500">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                                                </div>
                      <div className="w-full bg-stone-200 rounded-full h-1">
                        <div 
                          className="bg-emerald-600 h-1 rounded-full transition-all"
                          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                        />
                      </div>
                      
                      {/* Volume Control */}
                      <div className="flex items-center gap-2">
                        {volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={volume}
                          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                          className="flex-1 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      
                      {/* Stop Button */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setIsTTSActive(false);
                          setIsPlaying(false);
                          if (audioRef.current) {
                            audioRef.current.pause();
                            audioRef.current.currentTime = 0;
                          }
                        }}
                      >
                        <MicOff className="w-4 h-4 mr-2" />
                        Stop Audio
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <Button variant="outline" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Reading Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bookmarks Panel */}
        {selectedBookId && (
          <BookmarksPanel
            bookId={selectedBookId}
            currentPage={currentPage}
            onPageJump={updatePage}
          />
        )}

        {/* AI Features */}
        <Card className="border-stone-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Assistant
            </h3>
            
            <div className="space-y-3">
              {bookSummary ? (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleViewSummary}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  View Summary
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleGenerateSummary}
                  disabled={summaryLoading || !selectedBookId}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  {summaryLoading ? "Generating..." : "Generate Summary"}
                </Button>
              )}

              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate(`/ai-chat?bookId=${selectedBookId}`)}
                disabled={!selectedBookId}
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
              {/* Progress Bar */}
              {bookProgress && selectedBook?.page_count && (
                <div className="space-y-2">
                  <Progress value={bookProgress.progress_percentage} className="w-full" />
                  <div className="flex justify-between text-xs text-stone-500">
                    <span>{Math.round(bookProgress.progress_percentage)}% complete</span>
                    <span>Page {currentPage} of {selectedBook.page_count}</span>
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
                    <div className="flex justify-between mb-1">
                      <span>Reading Time:</span>
                      <span>{formatTime(readingTime)}</span>
                    </div>
                    {bookProgress && (
                      <div className="flex justify-between">
                        <span>Last Read:</span>
                        <span>{new Date(bookProgress.last_read_at).toLocaleDateString()}</span>
                      </div>
                    )}
                    {isUpdating && (
                      <div className="text-xs text-emerald-600 mt-2">
                        Saving progress...
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Book Summary Dialog */}
      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Book Summary
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-b border-stone-200 pb-4">
              <h4 className="font-medium text-stone-800 mb-1">{selectedBook?.title}</h4>
              {selectedBook?.author && (
                <p className="text-sm text-stone-600">by {selectedBook.author}</p>
              )}
            </div>
            
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm text-stone-700 leading-relaxed">
                {bookSummary}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} />
    </div>
  );
};