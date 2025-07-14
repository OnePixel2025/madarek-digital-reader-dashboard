import React, { useRef, useEffect, useCallback } from 'react';

interface PDFViewerWithTrackingProps {
  src?: string;
  style?: React.CSSProperties;
  onPageChange?: (currentPage: number, totalPages: number) => void;
  initialPage?: number;
}

export const PDFViewerWithTracking = React.forwardRef<HTMLIFrameElement, PDFViewerWithTrackingProps>(
  ({ src, style, onPageChange, initialPage = 1 }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const lastReportedPageRef = useRef<number>(0);
    const pageCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Combined ref handling
    useEffect(() => {
      if (typeof ref === 'function') {
        ref(iframeRef.current);
      } else if (ref) {
        ref.current = iframeRef.current;
      }
    }, [ref]);

    // Function to get current page from PDF.js viewer
    const getCurrentPageInfo = useCallback((): { currentPage: number; totalPages: number } | null => {
      try {
        const iframe = iframeRef.current;
        if (!iframe?.contentWindow) return null;

        // Access PDF.js viewer state
        const pdfViewer = (iframe.contentWindow as any)?.PDFViewerApplication;
        if (!pdfViewer?.pdfDocument) return null;

        const currentPage = pdfViewer.page || 1;
        const totalPages = pdfViewer.pagesCount || 0;

        return { currentPage, totalPages };
      } catch (error) {
        // Silently fail - this is expected when iframe is not ready
        return null;
      }
    }, []);

    // Function to navigate to a specific page
    const goToPage = useCallback((pageNumber: number) => {
      try {
        const iframe = iframeRef.current;
        if (!iframe?.contentWindow) return;

        const pdfViewer = (iframe.contentWindow as any)?.PDFViewerApplication;
        if (pdfViewer?.page) {
          pdfViewer.page = pageNumber;
        }
      } catch (error) {
        console.warn('Could not navigate to page:', error);
      }
    }, []);

    // Set up page monitoring
    useEffect(() => {
      if (!src) return;

      const checkPageChanges = () => {
        const pageInfo = getCurrentPageInfo();
        if (pageInfo && pageInfo.currentPage !== lastReportedPageRef.current) {
          lastReportedPageRef.current = pageInfo.currentPage;
          onPageChange?.(pageInfo.currentPage, pageInfo.totalPages);
        }
      };

      // Wait for iframe to load, then start monitoring
      const iframe = iframeRef.current;
      if (iframe) {
        const handleLoad = () => {
          // Wait a bit more for PDF.js to initialize
          setTimeout(() => {
            // Navigate to initial page if specified
            if (initialPage > 1) {
              goToPage(initialPage);
            }
            
            // Start monitoring page changes
            pageCheckIntervalRef.current = setInterval(checkPageChanges, 1000);
            
            // Initial check
            checkPageChanges();
          }, 2000);
        };

        iframe.addEventListener('load', handleLoad);

        return () => {
          iframe.removeEventListener('load', handleLoad);
          if (pageCheckIntervalRef.current) {
            clearInterval(pageCheckIntervalRef.current);
          }
        };
      }
    }, [src, onPageChange, initialPage, getCurrentPageInfo, goToPage]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (pageCheckIntervalRef.current) {
          clearInterval(pageCheckIntervalRef.current);
        }
      };
    }, []);

    // Expose navigation methods to parent component
    useEffect(() => {
      if (iframeRef.current) {
        (iframeRef.current as any).goToPage = goToPage;
        (iframeRef.current as any).getCurrentPageInfo = getCurrentPageInfo;
      }
    }, [goToPage, getCurrentPageInfo]);

    return (
      <iframe
        ref={iframeRef}
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

PDFViewerWithTracking.displayName = 'PDFViewerWithTracking';