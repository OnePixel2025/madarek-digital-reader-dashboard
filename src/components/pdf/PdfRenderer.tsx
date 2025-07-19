
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { initializePdfWorker, getWorkerStatus } from '@/utils/pdfWorker';

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
  const [workerReady, setWorkerReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Initialize PDF worker on component mount
  useEffect(() => {
    const setupWorker = async () => {
      console.log('Setting up PDF worker...');
      const success = await initializePdfWorker();
      setWorkerReady(success);
      
      if (!success) {
        const { error } = getWorkerStatus();
        setError(`PDF Worker initialization failed: ${error}`);
        setLoading(false);
      }
    };

    setupWorker();
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully with', numPages, 'pages');
    setTotalPages(numPages);
    setLoading(false);
    setError(null);
    setRetryCount(0);
    setLoadingProgress(100);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setError(error.message || 'Failed to load PDF');
    setLoading(false);
    setLoadingProgress(0);
  };

  const onDocumentLoadProgress = ({ loaded, total }: { loaded: number; total: number }) => {
    if (total > 0) {
      const progress = Math.round((loaded / total) * 100);
      setLoadingProgress(progress);
      console.log(`PDF loading progress: ${progress}%`);
    }
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

  const onPageLoadError = (error: Error) => {
    console.error('Error loading page:', error);
  };

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    setLoading(true);
    setError(null);
    setLoadingProgress(0);
    
    // Re-initialize worker if needed
    if (!workerReady) {
      const success = await initializePdfWorker();
      setWorkerReady(success);
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 border border-stone-200 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-stone-600 mb-2">Loading PDF...</p>
          {loadingProgress > 0 && (
            <div className="w-48 mx-auto">
              <div className="bg-stone-200 rounded-full h-2">
                <div 
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <p className="text-xs text-stone-500 mt-1">{loadingProgress}%</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col gap-4 p-6 border border-red-200 rounded-lg bg-red-50">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            <div className="space-y-2">
              <p className="font-medium">PDF Loading Error</p>
              <p className="text-sm">{error}</p>
              {retryCount > 0 && (
                <p className="text-xs">Retry attempt: {retryCount}</p>
              )}
            </div>
          </AlertDescription>
        </Alert>
        
        <div className="flex gap-2">
          <Button onClick={handleRetry} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Loading
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  // Worker not ready state
  if (!workerReady) {
    return (
      <div className="flex flex-col gap-4 p-6 border border-amber-200 rounded-lg bg-amber-50">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            <div className="space-y-2">
              <p className="font-medium">PDF Worker Initializing</p>
              <p className="text-sm">Setting up PDF rendering engine...</p>
            </div>
          </AlertDescription>
        </Alert>
        
        <Button onClick={handleRetry} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Setup
        </Button>
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
            onLoadProgress={onDocumentLoadProgress}
            loading={
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                  <p className="text-sm text-stone-600">Loading document...</p>
                </div>
              </div>
            }
            error={
              <div className="flex items-center justify-center p-8 text-red-600">
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>Failed to load PDF document</p>
                </div>
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              rotate={rotation}
              onLoadSuccess={onPageLoadSuccess}
              onLoadError={onPageLoadError}
              className="border border-stone-300 shadow-lg bg-white"
              loading={
                <div className="flex items-center justify-center p-8 border border-stone-300 bg-white" style={{ width: 612 * scale, height: 792 * scale }}>
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                    <p className="text-xs text-stone-600">Loading page...</p>
                  </div>
                </div>
              }
              error={
                <div className="flex items-center justify-center p-8 border border-red-300 bg-red-50 text-red-600" style={{ width: 612 * scale, height: 792 * scale }}>
                  <div className="text-center">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-sm">Failed to load page</p>
                  </div>
                </div>
              }
            />
          </Document>
        </div>
      </div>
    </div>
  );
};
