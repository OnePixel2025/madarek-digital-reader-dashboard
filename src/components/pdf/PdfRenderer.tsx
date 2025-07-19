
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker using react-pdf's recommended approach
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully with', numPages, 'pages');
    setTotalPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setError(error.message || 'Failed to load PDF');
    setLoading(false);
  };

  const onPageLoadSuccess = () => {
    // Report progress when page loads
    if (onProgress && containerRef.current) {
      const container = containerRef.current;
      onProgress({
        scrollPosition: container.scrollTop,
        viewportHeight: container.clientHeight,
        contentHeight: container.scrollHeight
      });
    }
  };

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

      {/* PDF Document Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto border-x border-b border-stone-200 rounded-b-lg bg-gray-100"
        onScroll={handleScroll}
        style={{ maxHeight: '600px' }}
      >
        <div className="flex justify-center p-4">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            }
            error={
              <div className="flex items-center justify-center p-8 text-red-600">
                <p>Failed to load PDF</p>
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              rotate={rotation}
              onLoadSuccess={onPageLoadSuccess}
              className="border border-stone-300 shadow-lg bg-white"
              loading={
                <div className="flex items-center justify-center p-8 border border-stone-300 bg-white" style={{ width: 612 * scale, height: 792 * scale }}>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                </div>
              }
              error={
                <div className="flex items-center justify-center p-8 border border-red-300 bg-red-50 text-red-600" style={{ width: 612 * scale, height: 792 * scale }}>
                  <p>Failed to load page</p>
                </div>
              }
            />
          </Document>
        </div>
      </div>
    </div>
  );
};
