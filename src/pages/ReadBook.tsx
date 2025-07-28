import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BookOpen, Mic, MicOff, MessageCircle, Brain, Settings, X, Play, Pause, Volume2, VolumeX, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, TextSelect, Loader2 } from 'lucide-react';
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

// Extend Window interface for PDF.js
declare global {
  interface Window {
    pdfjsLib?: any;
    Tesseract?: any;
  }
}

interface Book {
  id: string;
  title: string;
  author: string | null;
  file_path: string | null;
  page_count: number | null;
  language?: string;
}

// Enhanced PDF Viewer Component with simplified controls (no built-in progress)
const EnhancedPdfViewer = ({ 
  pdfUrl, 
  currentPage, 
  onPageChange, 
  totalPages, 
  onScrollProgress,
  className = "" 
}) => {
  const containerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const pagesContainerRef = useRef(null);
  const [scale, setScale] = useState(1.2);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfLib, setPdfLib] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [renderedPages, setRenderedPages] = useState(new Set());
  const [pageElements, setPageElements] = useState(new Map());
  const [isScrolling, setIsScrolling] = useState(false);
  const [renderingPages, setRenderingPages] = useState(new Set());
  const renderTasksRef = useRef(new Map());
  const renderQueueRef = useRef([]);
  const scrollTimeoutRef = useRef(null);

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
    script.onerror = () => {
      setError('Failed to load PDF.js library');
      setIsLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Initialize PDF document when URL and library are available
  useEffect(() => {
    if (!pdfLib || !pdfUrl) return;

    const loadPDF = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Cancel all existing render tasks and clear state
        renderTasksRef.current.forEach((task) => {
          try {
            task.cancel();
          } catch (e) {
            // Ignore cancellation errors
          }
        });
        renderTasksRef.current.clear();
        renderQueueRef.current = [];
        
        setRenderedPages(new Set());
        setRenderingPages(new Set());
        setPageElements(new Map());

        const pdf = await pdfLib.getDocument(pdfUrl).promise;
        setPdfDoc(pdf);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError(err.message || 'Failed to load PDF');
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [pdfLib, pdfUrl]);

  // Get currently visible pages
  const getVisiblePages = useCallback(() => {
    if (!scrollContainerRef.current || !pagesContainerRef.current) return [];

    const scrollContainer = scrollContainerRef.current;
    const scrollTop = scrollContainer.scrollTop;
    const scrollBottom = scrollTop + scrollContainer.clientHeight;
    const visiblePages = [];

    pageElements.forEach((elements, pageNum) => {
      const pageContainer = elements.container;
      const pageTop = pageContainer.offsetTop;
      const pageBottom = pageTop + pageContainer.offsetHeight;

      if (pageBottom >= scrollTop && pageTop <= scrollBottom) {
        visiblePages.push(pageNum);
      }
    });

    return visiblePages.sort((a, b) => a - b);
  }, [pageElements]);

  // Create page containers when PDF is loaded
  useEffect(() => {
    if (!pdfDoc || !pagesContainerRef.current) return;

    const container = pagesContainerRef.current;
    container.innerHTML = '';
    
    const newPageElements = new Map();

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const pageContainer = document.createElement('div');
      pageContainer.className = 'page-container mb-4 flex justify-center';
      pageContainer.setAttribute('data-page', pageNum);
      
      const pageWrapper = document.createElement('div');
      pageWrapper.className = 'bg-white shadow-lg relative';
      
      const canvas = document.createElement('canvas');
      canvas.className = 'max-w-full h-auto';
      canvas.setAttribute('data-page', pageNum); // Add page identifier to canvas
      
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'absolute inset-0 flex items-center justify-center bg-white bg-opacity-75';
      loadingDiv.innerHTML = '<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>';
      
      pageWrapper.appendChild(canvas);
      pageWrapper.appendChild(loadingDiv);
      pageContainer.appendChild(pageWrapper);
      container.appendChild(pageContainer);
      
      newPageElements.set(pageNum, { canvas, loadingDiv, container: pageContainer });
    }
    
    setPageElements(newPageElements);
    
    // Queue initial visible pages for rendering
    setTimeout(() => {
      const visiblePages = getVisiblePages();
      visiblePages.forEach(pageNum => {
        queuePageRender(pageNum);
      });
    }, 100);
  }, [pdfDoc, totalPages, getVisiblePages, queuePageRender]);

  // Cancel any existing render task for a page
  const cancelRenderTask = useCallback((pageNum) => {
    const existingTask = renderTasksRef.current.get(pageNum);
    if (existingTask) {
      try {
        existingTask.cancel();
      } catch (e) {
        // Ignore cancellation errors
      }
      renderTasksRef.current.delete(pageNum);
    }
  }, []);

  // Process render queue
  const processRenderQueue = useCallback(async () => {
    if (renderQueueRef.current.length === 0) return;

    const pageNum = renderQueueRef.current.shift();
    if (!pageNum || renderingPages.has(pageNum) || renderedPages.has(pageNum)) {
      // Continue processing queue
      setTimeout(processRenderQueue, 0);
      return;
    }

    try {
      setRenderingPages(prev => new Set([...prev, pageNum]));
      
      const page = await pdfDoc.getPage(pageNum);
      const { canvas, loadingDiv } = pageElements.get(pageNum);
      
      if (!canvas || !loadingDiv) {
        setRenderingPages(prev => {
          const newSet = new Set(prev);
          newSet.delete(pageNum);
          return newSet;
        });
        setTimeout(processRenderQueue, 0);
        return;
      }

      // Cancel any existing render task for this page
      cancelRenderTask(pageNum);

      const context = canvas.getContext('2d');
      const viewport = page.getViewport({ scale, rotation });

      canvas.height = viewport.height;
      canvas.width = viewport.width;
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Create and store the render task
      const renderTask = page.render({
        canvasContext: context,
        viewport: viewport
      });

      renderTasksRef.current.set(pageNum, renderTask);

      await renderTask.promise;

      // Clean up the render task
      renderTasksRef.current.delete(pageNum);
      
      loadingDiv.style.display = 'none';
      setRenderedPages(prev => new Set([...prev, pageNum]));
      setRenderingPages(prev => {
        const newSet = new Set(prev);
        newSet.delete(pageNum);
        return newSet;
      });
      
    } catch (err) {
      if (err.name !== 'RenderingCancelledException') {
        console.error(`Error rendering page ${pageNum}:`, err);
      }
      
      setRenderingPages(prev => {
        const newSet = new Set(prev);
        newSet.delete(pageNum);
        return newSet;
      });
      
      // Clean up the render task
      renderTasksRef.current.delete(pageNum);
    }

    // Continue processing queue after a small delay
    setTimeout(processRenderQueue, 10);
  }, [pdfDoc, pageElements, scale, rotation, renderedPages, renderingPages, cancelRenderTask]);

  // Re-render all pages when scale or rotation changes
  useEffect(() => {
    if (!pdfDoc || pageElements.size === 0) return;

    // Cancel all existing render tasks
    renderTasksRef.current.forEach((task, pageNum) => {
      try {
        task.cancel();
      } catch (e) {
        // Ignore cancellation errors
      }
    });
    renderTasksRef.current.clear();

    // Clear render queue
    renderQueueRef.current = [];
    
    // Reset states
    setRenderedPages(new Set());
    setRenderingPages(new Set());
    
    // Show loading indicators and clear canvases
    pageElements.forEach(({ canvas, loadingDiv }) => {
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      loadingDiv.style.display = 'flex';
    });

    // Queue visible pages first, then others
    const renderVisiblePages = () => {
      const visiblePages = getVisiblePages();
      
      // Queue visible pages first
      visiblePages.forEach(pageNum => {
        queuePageRender(pageNum);
      });
      
      // Then queue remaining pages
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        if (!visiblePages.includes(pageNum)) {
          queuePageRender(pageNum);
        }
      }
    };

    // Small delay to ensure canvas contexts are ready
    setTimeout(renderVisiblePages, 50);
  }, [pdfDoc, pageElements, scale, rotation, totalPages, getVisiblePages, queuePageRender]);

  // Add page to render queue
  const queuePageRender = useCallback((pageNum) => {
    if (!renderQueueRef.current.includes(pageNum) && 
        !renderingPages.has(pageNum) && 
        !renderedPages.has(pageNum)) {
      renderQueueRef.current.push(pageNum);
      processRenderQueue();
    }
  }, [renderingPages, renderedPages, processRenderQueue]);
  
  // Update current page based on scroll position
  const updateCurrentPageFromScroll = useCallback(() => {
    const visiblePages = getVisiblePages();
    if (visiblePages.length > 0) {
      const scrollContainer = scrollContainerRef.current;
      const scrollTop = scrollContainer.scrollTop;
      const containerHeight = scrollContainer.clientHeight;
      const centerPoint = scrollTop + containerHeight / 2;

      let closestPage = visiblePages[0];
      let closestDistance = Infinity;

      visiblePages.forEach(pageNum => {
        const pageContainer = pageElements.get(pageNum)?.container;
        if (pageContainer) {
          const pageCenter = pageContainer.offsetTop + pageContainer.offsetHeight / 2;
          const distance = Math.abs(centerPoint - pageCenter);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestPage = pageNum;
          }
        }
      });

      if (closestPage !== currentPage) {
        onPageChange(closestPage);
      }
    }
  }, [getVisiblePages, pageElements, currentPage, onPageChange]);

  // Handle scroll events
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      // Calculate scroll progress
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const maxScroll = scrollHeight - clientHeight;
      const scrollPercentage = maxScroll > 0 
        ? Math.min(100, (scrollTop / maxScroll) * 100) 
        : 100;
      onScrollProgress?.(scrollPercentage);

      // Update current page based on scroll position
      setIsScrolling(true);
      
      // Clear previous timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Set new timeout to update current page after scrolling stops
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
        updateCurrentPageFromScroll();
      }, 150);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [onScrollProgress, updateCurrentPageFromScroll]);

  // Scroll to specific page when currentPage changes (but not during scrolling)
  useEffect(() => {
    if (isScrolling || !pageElements.has(currentPage)) return;

    const pageContainer = pageElements.get(currentPage)?.container;
    if (pageContainer && scrollContainerRef.current) {
      const scrollContainer = scrollContainerRef.current;
      const containerTop = scrollContainer.offsetTop;
      const pageTop = pageContainer.offsetTop;
      
      scrollContainer.scrollTo({
        top: pageTop - containerTop - 20, // 20px offset for better visibility
        behavior: 'smooth'
      });
    }
  }, [currentPage, pageElements, isScrolling]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

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
      {/* PDF Controls */}
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
      
      {/* PDF Viewer - Continuous scrolling through all pages */}
      <div
        ref={scrollContainerRef}
        className="bg-stone-100 overflow-auto"
        style={{ height: isFullscreen ? 'calc(100vh - 80px)' : '700px' }}
      >
        <div ref={pagesContainerRef} className="p-4">
          {/* Pages will be dynamically inserted here */}
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

  
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionStatus, setExtractionStatus] = useState('');
  const [showExtractedTextDialog, setShowExtractedTextDialog] = useState(false);
  
  // Exam states
  const [examData, setExamData] = useState(null);
  const [examLoading, setExamLoading] = useState(false);
  const [showExamDialog, setShowExamDialog] = useState(false);

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
        .select('id, title, author, file_path, page_count, language')
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

  // Extract and process text from PDF
  const extractAndProcessText = async (bookId: string) => {
    try {
      console.log('Starting text extraction and processing for book:', bookId);
      
      // First, try to get existing processed text from database
      const { data: existingExtraction } = await supabase
        .from('book_text_extractions')
        .select('extracted_text')
        .eq('book_id', bookId)
        .eq('extraction_method', 'processed')
        .maybeSingle();

      if (existingExtraction?.extracted_text) {
        console.log('Found existing processed text');
        return existingExtraction.extracted_text;
      }

      // Check if raw OCR extraction exists
      const { data: rawExtraction } = await supabase
        .from('book_text_extractions')
        .select('extracted_text, page_count')
        .eq('book_id', bookId)
        .eq('extraction_method', 'ocr-tesseract')
        .maybeSingle();

      let rawText = rawExtraction?.extracted_text;
      let pageCount = rawExtraction?.page_count;

      // If no raw text exists, extract it using client-side OCR
      if (!rawText) {
        console.log('No existing OCR text found, extracting using client-side OCR...');
        
        // Get the book to access its PDF
        const selectedBook = books.find(book => book.id === bookId);
        if (!selectedBook?.file_path) {
          throw new Error('Book file path not found');
        }

        // Set up for OCR extraction
        setIsExtractingText(true);
        setExtractionProgress(0);
        setExtractionStatus('Loading OCR libraries...');

        try {
          // Load required libraries
          await loadOCRLibraries();

          // Get language from selected book
          const language = selectedBook.language === "Arabic" ? "ara" : 'eng';
          
          // Create PDF URL
          const pdfUrl = `https://ripsrvyzgvyvfisvcnwk.supabase.co/storage/v1/object/public/books/${selectedBook.file_path}`;

          setExtractionStatus('Starting text extraction...');
          
          let extractedText = "";
          let worker = null;
          
          try {
            // Initialize Tesseract worker
            setExtractionStatus('Initializing OCR engine...');
            worker = await window.Tesseract.createWorker();
            await worker.loadLanguage(language);
            await worker.initialize(language);
            
            setExtractionStatus('Loading PDF document...');
            
            // Load PDF document
            const pdf = await window.pdfjsLib.getDocument(pdfUrl).promise;
            const totalPages = pdf.numPages;
            pageCount = totalPages;
            
            setExtractionStatus(`Processing ${totalPages} pages...`);
            
            let processedPages = 0;
            
            // Process each page
            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
              setExtractionStatus(`Processing page ${pageNum}/${totalPages}`);
              
              try {
                // Get PDF page
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 3 }); // High quality
                
                // Create canvas for rendering
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                // Render PDF page to canvas
                await page.render({
                  canvasContext: context,
                  viewport: viewport,
                }).promise;
                
                // Perform OCR on the canvas
                const { data: { text } } = await worker.recognize(canvas);
                
                // Add page text to result with separator
                if (text.trim()) {
                  extractedText += `\n--- Page ${pageNum} ---\n${text.trim()}\n`;
                }
                
                // Clean up canvas
                canvas.remove();
                
              } catch (pageError) {
                console.warn(`Failed to process page ${pageNum}:`, pageError);
                extractedText += `\n--- Page ${pageNum} (Error) ---\nFailed to extract text from this page\n`;
              }
              
              // Update progress
              processedPages++;
              const progress = (processedPages / totalPages) * 100;
              setExtractionProgress(progress);
            }
            
            // Clean up worker
            await worker.terminate();
            worker = null;
            
            rawText = extractedText.trim();
            
            // Save raw OCR text to database using upsert
            const { error: insertError } = await supabase
              .from('book_text_extractions')
              .upsert({
                book_id: bookId,
                extracted_text: rawText,
                extraction_method: 'ocr-tesseract',
                page_count: pageCount,
                needs_ocr: false,
                ocr_status: 'completed'
              }, {
                onConflict: 'book_id,extraction_method'
              });

            if (insertError) {
              console.error('Error saving raw OCR text:', insertError);
              throw new Error(`Failed to save OCR text: ${insertError.message}`);
            }

            console.log('Client-side OCR extraction completed:', {
              textLength: rawText.length,
              pageCount: pageCount
            });
            
          } catch (error) {
            // Clean up worker on error
            if (worker) {
              try {
                await worker.terminate();
              } catch (cleanupError) {
                console.warn('Failed to cleanup worker:', cleanupError);
              }
            }
            throw error;
          }
          
        } finally {
          setIsExtractingText(false);
        }
      }

      if (!rawText || rawText.trim().length === 0) {
        throw new Error('No text could be extracted from the PDF');
      }

      console.log('Raw text available, processing with LLM...');
      
      // Get book language for processing
      const selectedBook = books.find(book => book.id === bookId);
      const language = selectedBook?.language || 'eng';

      // Process text with LLM for cleaning and formatting
      const { data: processData, error: processError } = await supabase.functions.invoke('process-extracted-text', {
        body: { 
          text: rawText,
          language: language
        }
      });

      if (processError) {
        throw new Error(`Text processing failed: ${processError.message}`);
      }

      const processedText = processData?.processedText;
      if (!processedText) {
        throw new Error('Failed to process extracted text');
      }

      console.log('Text processing completed. Processed text preview:', processedText.substring(0, 500));

      // Save processed text to database using upsert
      const { error: processedInsertError } = await supabase
        .from('book_text_extractions')
        .upsert({
          book_id: bookId,
          extracted_text: processedText,
          extraction_method: 'processed',
          page_count: pageCount
        }, {
          onConflict: 'book_id,extraction_method'
        });

      if (processedInsertError) {
        console.error('Error saving processed text:', processedInsertError);
        throw new Error(`Failed to save processed text: ${processedInsertError.message}`);
      }

      console.log('Text extraction and processing completed successfully');
      return processedText;

    } catch (error) {
      console.error('Error in extractAndProcessText:', error);
      throw error;
    }
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
      // Extract and process text first
      await extractAndProcessText(selectedBookId);

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

  const handleGenerateExam = async () => {
    if (!selectedBookId) {
      toast({
        title: "No book selected",
        description: "Please select a book to generate an exam.",
        variant: "destructive",
      });
      return;
    }

    setExamLoading(true);
    try {
      // Extract and process text first
      await extractAndProcessText(selectedBookId);

      const { data, error } = await supabase.functions.invoke('generate-book-exam', {
        body: { bookId: selectedBookId }
      });

      if (error) throw error;

      if (data.success) {
        setExamData(data.exam);
        setShowExamDialog(true);
        
        toast({
          title: "Exam generated successfully",
          description: "Your personalized exam is ready!",
        });
      } else {
        throw new Error(data.error || 'Failed to generate exam');
      }
    } catch (error) {
      console.error('Error generating exam:', error);
      toast({
        title: "Error generating exam",
        description: error instanceof Error ? error.message : "Failed to generate exam. Please ensure the book text has been extracted.",
        variant: "destructive",
      });
    } finally {
      setExamLoading(false);
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
      console.log('Starting text extraction and processing for TTS...');
      
      // Extract and process text first
      const processedText = await extractAndProcessText(selectedBookId);
      
      if (!processedText || processedText.trim().length === 0) {
        throw new Error('No processed text available for TTS generation');
      }

      console.log('Processed text ready, generating audio...');
      
      // Use first 500 characters of processed text for TTS
      const textForTTS = processedText.substring(0, 500);
      
      const { data: ttsData, error: ttsError } = await supabase.functions.invoke('generate-book-tts', {
        body: { 
          bookId: selectedBookId,
          text: textForTTS,
          voice: selectedVoice
        }
      });

      if (ttsError) throw ttsError;

      if (ttsData?.audioUrl) {
        setTtsAudio(ttsData.audioUrl);
        setIsTTSActive(true);
        
        if (audioRef.current) {
          audioRef.current.src = ttsData.audioUrl;
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

  /*
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
  */

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

  /**
   * Load required OCR libraries (PDF.js and Tesseract.js)
   */
  const loadOCRLibraries = async () => {
    return new Promise<void>((resolve, reject) => {
      // Check if libraries are already loaded
      if (window.pdfjsLib && window.Tesseract) {
        // Set PDF.js worker if needed
        if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        resolve();
        return;
      }

      let scriptsLoaded = 0;
      const totalScripts = 2;
      
      const checkComplete = () => {
        scriptsLoaded++;
        if (scriptsLoaded === totalScripts) {
          // Set PDF.js worker
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
              'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          }
          resolve();
        }
      };
      
      // Load PDF.js
      const pdfScript = document.createElement('script');
      pdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      pdfScript.onload = checkComplete;
      pdfScript.onerror = () => reject(new Error('Failed to load PDF.js'));
      document.head.appendChild(pdfScript);
      
      // Load Tesseract.js
      const tesseractScript = document.createElement('script');
      tesseractScript.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js';
      tesseractScript.onload = checkComplete;
      tesseractScript.onerror = () => reject(new Error('Failed to load Tesseract.js'));
      document.head.appendChild(tesseractScript);
    });
  };

  /**
   * Extract text from PDF using OCR
   */
  const extractTextFromPDF = async () => {
    if (!pdfUrl) {
      toast({
        title: "No PDF loaded",
        description: "Please load a PDF first",
        variant: "destructive",
      });
      return;
    }

    setIsExtractingText(true);
    setExtractionProgress(0);
    setExtractionStatus('Initializing...');
    setExtractedText(null);

    try {
      // Load required libraries
      setExtractionStatus('Loading OCR libraries...');
      await loadOCRLibraries();

      // Get language from selected book or default to English
      const language = selectedBook?.language === "Arabic" ? "ara" : 'eng';

      // Extract text
      setExtractionStatus('Starting text extraction...');
      
      let extractedText = "";
      let worker = null;
      
      try {
        // Initialize Tesseract worker
        setExtractionStatus('Initializing OCR engine...');
        worker = await window.Tesseract.createWorker();
        await worker.loadLanguage(language);
        await worker.initialize(language);
        
        setExtractionStatus('Loading PDF document...');
        
        // Load PDF document
        const pdf = await window.pdfjsLib.getDocument(pdfUrl).promise;
        const totalPages = pdf.numPages;
        const pageLimit = totalPages;
        // const pageLimit = Math.min(10, totalPages); // Limit to first 10 pages for demo
        
        setExtractionStatus(`Processing ${pageLimit} pages...`);
        
        let processedPages = 0;
        
        // Process each page
        for (let pageNum = 1; pageNum <= pageLimit; pageNum++) {
          setExtractionStatus(`Processing page ${pageNum}/${pageLimit}`);
          
          try {
            // Get PDF page
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 3 }); // High quality
            
            // Create canvas for rendering
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            // Render PDF page to canvas
            await page.render({
              canvasContext: context,
              viewport: viewport,
            }).promise;
            
            // Perform OCR on the canvas
            const { data: { text } } = await worker.recognize(canvas);
            
            // Add page text to result with separator
            if (text.trim()) {
              extractedText += `\n--- Page ${pageNum} ---\n${text.trim()}\n`;
            }
            
            // Clean up canvas
            canvas.remove();
            
          } catch (pageError) {
            console.warn(`Failed to process page ${pageNum}:`, pageError);
            extractedText += `\n--- Page ${pageNum} (Error) ---\nFailed to extract text from this page\n`;
          }
          
          // Update progress
          processedPages++;
          const progress = (processedPages / pageLimit) * 100;
          setExtractionProgress(progress);
        }
        
        // Clean up worker
        await worker.terminate();
        worker = null;
        
        setExtractedText(extractedText.trim());
        setExtractionStatus('Text extraction completed!');
        setShowExtractedTextDialog(true);
        
        toast({
          title: "Text extracted successfully",
          description: `Extracted text from ${pageLimit} pages (${extractedText.length} characters)`,
        });

        // Log the extracted text
        console.log('Extracted text:', extractedText);
        console.log('Text language:', language);

      } catch (error) {
        // Clean up worker on error
        if (worker) {
          try {
            await worker.terminate();
          } catch (cleanupError) {
            console.warn('Failed to cleanup worker:', cleanupError);
          }
        }
        throw error;
      }
      
    } catch (error) {
      console.error('Text extraction error:', error);
      toast({
        title: "Extraction failed",
        description: error instanceof Error ? error.message : "Failed to extract text",
        variant: "destructive",
      });
      setExtractionStatus(`Error: ${error.message}`);
    } finally {
      setIsExtractingText(false);
    }
  };

  const calculateOverallProgress = () => {
  if (!selectedBook?.page_count) return 0;
  
  const pageProgress = ((currentPage - 1) / selectedBook.page_count) * 100;
  const currentPageWeight = (1 / selectedBook.page_count) * 100;
  const currentPageContribution = (scrollProgress / 100) * currentPageWeight;
  
  return pageProgress + currentPageContribution; // Accurate progress calculation
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
  onScrollProgress={setScrollProgress}
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
              {/* <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={extractTextFromPDF}
                disabled={isExtractingText || !pdfUrl}
              >
                {isExtractingText ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Extracting ({extractionProgress}%)...
                  </>
                ) : (
                  <>
                    <TextSelect className="w-4 h-4 mr-2" />
                    Extract Text from PDF
                  </>
                )}
              </Button> */}
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

              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleGenerateExam}
                disabled={!selectedBookId || examLoading}
              >
                <Brain className="w-4 h-4 mr-2" />
                {examLoading ? "Creating Exam..." : "Exam about the book"}
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
              {selectedBook?.page_count && (
  <div className="space-y-2">
    <Progress 
      value={calculateOverallProgress()} 
      className="w-full" 
    />
    <div className="flex justify-between text-xs text-stone-500">
      <span>{Math.round(calculateOverallProgress())}% complete</span>
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

      {/* Exam Dialog */}
      <Dialog open={showExamDialog} onOpenChange={setShowExamDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{examData?.title || 'Book Exam'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {examData?.instructions && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800 text-sm">{examData.instructions}</p>
              </div>
            )}
            
            {examData?.multipleChoice && examData.multipleChoice.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Multiple Choice Questions</h3>
                <div className="space-y-4">
                  {examData.multipleChoice.map((question, index) => (
                    <div key={index} className="p-4 border border-stone-200 rounded-lg">
                      <p className="font-medium mb-3">{index + 1}. {question.question}</p>
                      <div className="space-y-2">
                        {question.options?.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`question-${index}`}
                              id={`q${index}-option${optionIndex}`}
                              className="text-emerald-600"
                            />
                            <label htmlFor={`q${index}-option${optionIndex}`} className="text-sm">
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {examData?.essayQuestions && examData.essayQuestions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Essay Questions</h3>
                <div className="space-y-4">
                  {examData.essayQuestions.map((question, index) => (
                    <div key={index} className="p-4 border border-stone-200 rounded-lg">
                      <p className="font-medium mb-2">
                        {index + 1}. {question.question}
                      </p>
                      {question.points && (
                        <p className="text-sm text-stone-600 mb-2">
                          Points: {question.points}
                        </p>
                      )}
                      {question.suggestedLength && (
                        <p className="text-sm text-stone-600 mb-3">
                          Suggested length: {question.suggestedLength}
                        </p>
                      )}
                      <textarea
                        className="w-full h-32 p-3 border border-stone-200 rounded-lg resize-vertical"
                        placeholder="Write your answer here..."
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {examData?.rawContent && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Exam Content</h3>
                <div className="p-4 bg-stone-50 rounded-lg">
                  <div className="whitespace-pre-wrap text-stone-700 text-sm">
                    {examData.rawContent}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowExamDialog(false)}>
                Close
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Submit Exam
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* <Dialog open={showExtractedTextDialog} onOpenChange={setShowExtractedTextDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TextSelect className="w-5 h-5" />
              Extracted Text from PDF
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {extractionStatus && (
              <div className="text-sm text-stone-500 mb-2">
                Status: {extractionStatus}
              </div>
            )}

            {extractedText ? (
              <div className="space-y-4">
                <div className="p-4 bg-stone-50 rounded-lg border border-stone-200">
                  <div className="whitespace-pre-wrap text-sm font-mono max-h-[60vh] overflow-y-auto">
                    {extractedText}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-stone-500">
                    Language: {selectedBook?.language || 'eng'} | 
                    Characters: {extractedText.length}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        if (extractedText) {
                          navigator.clipboard.writeText(extractedText);
                          toast({
                            title: "Copied to clipboard",
                            description: "The extracted text has been copied to your clipboard",
                          });
                        }
                      }}
                    >
                      Copy Text
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <p className="text-stone-500">No text extracted yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog> */}

      {/* Hidden Audio Element */}
      <audio ref={audioRef} />
    </div>
  );
};