import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { toast } from '@/hooks/use-toast';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFViewerDirectProps {
  src: string;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  style?: React.CSSProperties;
  className?: string;
}

export const PDFViewerDirect: React.FC<PDFViewerDirectProps> = ({
  src,
  onPageChange,
  currentPage = 1,
  style,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(currentPage);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1.5);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  // Debounced function for page change events
  const debouncedPageChange = useCallback(
    debounce((page: number) => {
      if (onPageChange) {
        onPageChange(page);
      }
    }, 500),
    [onPageChange]
  );

  // Load PDF document
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        const pdf = await pdfjsLib.getDocument({
          url: src,
          disableAutoFetch: true,
          disableStream: false,
        }).promise;
        
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setLoading(false);
      } catch (error) {
        console.error('Error loading PDF:', error);
        toast({
          title: "PDF Loading Error",
          description: "Failed to load the PDF file. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    if (src) {
      loadPDF();
    }
  }, [src]);

  // Render page
  const renderPage = useCallback(async (page: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      // Cancel previous render task if exists
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const pdfPage = await pdfDoc.getPage(page);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;

      const viewport = pdfPage.getViewport({ scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      renderTaskRef.current = pdfPage.render(renderContext);
      await renderTaskRef.current.promise;
      renderTaskRef.current = null;

      // Update page number and trigger change
      if (pageNum !== page) {
        setPageNum(page);
        debouncedPageChange(page);
      }
    } catch (error: any) {
      if (error.name !== 'RenderingCancelledException') {
        console.error('Error rendering page:', error);
      }
    }
  }, [pdfDoc, scale, pageNum, debouncedPageChange]);

  // Handle external page changes
  useEffect(() => {
    if (currentPage !== pageNum && currentPage > 0 && currentPage <= numPages) {
      renderPage(currentPage);
    }
  }, [currentPage, numPages, renderPage]);

  // Render initial page when PDF loads
  useEffect(() => {
    if (pdfDoc && numPages > 0) {
      renderPage(Math.min(pageNum, numPages));
    }
  }, [pdfDoc, numPages, renderPage]);

  // Handle scroll for automatic page navigation
  const handleScroll = useCallback(
    debounce((e: Event) => {
      const container = e.target as HTMLDivElement;
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      
      // Calculate which page should be visible based on scroll position
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
      const targetPage = Math.ceil(scrollPercentage * numPages) || 1;
      
      if (targetPage !== pageNum && targetPage > 0 && targetPage <= numPages) {
        renderPage(targetPage);
      }
    }, 200),
    [numPages, pageNum, renderPage]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!containerRef.current?.contains(document.activeElement)) return;
    
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        if (pageNum > 1) {
          renderPage(pageNum - 1);
        }
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        if (pageNum < numPages) {
          renderPage(pageNum + 1);
        }
        break;
      case 'Home':
        e.preventDefault();
        renderPage(1);
        break;
      case 'End':
        e.preventDefault();
        renderPage(numPages);
        break;
    }
  }, [pageNum, numPages, renderPage]);

  // Handle wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale(prev => Math.max(0.5, Math.min(3, prev + delta)));
    }
  }, []);

  // Setup event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    container.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('keydown', handleKeyDown);

    // Make container focusable for keyboard events
    container.tabIndex = 0;

    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleScroll, handleWheel, handleKeyDown]);

  // Navigation functions
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= numPages) {
      renderPage(page);
    }
  }, [numPages, renderPage]);

  const nextPage = useCallback(() => {
    if (pageNum < numPages) {
      renderPage(pageNum + 1);
    }
  }, [pageNum, numPages, renderPage]);

  const prevPage = useCallback(() => {
    if (pageNum > 1) {
      renderPage(pageNum - 1);
    }
  }, [pageNum, renderPage]);

  // Re-render when scale changes
  useEffect(() => {
    if (pdfDoc && pageNum > 0) {
      renderPage(pageNum);
    }
  }, [scale, pdfDoc, pageNum, renderPage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 border-2 border-dashed border-stone-200 rounded-lg w-full h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (!pdfDoc) {
    return (
      <div className="flex items-center justify-center p-8 border-2 border-red-200 rounded-lg bg-red-50 w-full h-96">
        <div className="text-center">
          <p className="text-red-600">Failed to load PDF</p>
          <p>{pdfDoc}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative border border-border rounded-lg overflow-auto focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
      style={{ 
        height: '600px',
        background: '#f5f5f5',
        ...style 
      }}
    >
      {/* PDF Canvas */}
      <div className="flex justify-center p-4">
        <canvas
          ref={canvasRef}
          className="shadow-lg bg-white"
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />
      </div>

      {/* Controls overlay */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur rounded-lg px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={prevPage}
            disabled={pageNum <= 1}
            className="px-2 py-1 bg-primary text-primary-foreground rounded disabled:opacity-50"
          >
            ←
          </button>
          <span className="px-2">
            {pageNum} / {numPages}
          </span>
          <button
            onClick={nextPage}
            disabled={pageNum >= numPages}
            className="px-2 py-1 bg-primary text-primary-foreground rounded disabled:opacity-50"
          >
            →
          </button>
          <span className="text-xs text-muted-foreground ml-2">
            Zoom: {Math.round(scale * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}