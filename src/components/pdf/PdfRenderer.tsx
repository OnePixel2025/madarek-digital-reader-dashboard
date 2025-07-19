
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

interface PdfRendererProps {
  pdfUrl: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onProgress?: (progress: { scrollPosition: number; viewportHeight: number; contentHeight: number }) => void;
  className?: string;
}

export const PdfRenderer: React.FC<PdfRendererProps> = ({
  pdfUrl,
  currentPage,
  onPageChange,
  onProgress,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load PDF document
  useEffect(() => {
    const loadPdf = async () => {
      if (!pdfUrl) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const pdf = await pdfjsLib.getDocument({
          url: pdfUrl,
          disableWorker: false,
          isEvalSupported: false
        }).promise;
        
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
        setLoading(false);
      }
    };

    loadPdf();
  }, [pdfUrl]);

  // Render current page
  const renderPage = useCallback(async (pageNumber: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      const page = await pdfDoc.getPage(pageNumber);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;

      const viewport = page.getViewport({ scale, rotation });
      
      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Render page
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      // Report progress
      if (onProgress && containerRef.current) {
        const container = containerRef.current;
        onProgress({
          scrollPosition: container.scrollTop,
          viewportHeight: container.clientHeight,
          contentHeight: container.scrollHeight
        });
      }
    } catch (err) {
      console.error('Error rendering page:', err);
      setError('Failed to render page');
    }
  }, [pdfDoc, scale, rotation, onProgress]);

  // Render page when dependencies change
  useEffect(() => {
    if (pdfDoc && currentPage > 0 && currentPage <= totalPages) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, scale, rotation, renderPage, totalPages]);

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

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleScroll = useCallback(() => {
    if (onProgress && containerRef.current) {
      const container = containerRef.current;
      onProgress({
        scrollPosition: container.scrollTop,
        viewportHeight: container.clientHeight,
        contentHeight: container.scrollHeight
      });
    }
  }, [onProgress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 border border-stone-200 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 border border-red-200 rounded-lg bg-red-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* PDF Controls */}
      <div className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <span className="text-sm text-stone-600 min-w-[80px] text-center">
            {currentPage} / {totalPages}
          </span>
          
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
          
          <span className="text-sm text-stone-600 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleRotate}>
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Canvas Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto border-x border-b border-stone-200 rounded-b-lg bg-gray-100"
        onScroll={handleScroll}
        style={{ maxHeight: '600px' }}
      >
        <div className="flex justify-center p-4">
          <canvas 
            ref={canvasRef}
            className="border border-stone-300 shadow-lg bg-white"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </div>
    </div>
  );
};
