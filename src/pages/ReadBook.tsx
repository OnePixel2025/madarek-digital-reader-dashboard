import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Mic, MicOff, MessageCircle, Brain, Settings, X, Play, Pause, Volume2, VolumeX, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, FileText, Copy, Download } from 'lucide-react';

// Enhanced PDF Viewer Component with OCR functionality
const EnhancedPdfViewer = ({ 
  pdfUrl, 
  currentPage, 
  onPageChange, 
  totalPages, 
  onScrollProgress,
  onTextExtracted,
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
  
  // OCR states
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionStatus, setExtractionStatus] = useState('');
  const [tesseractWorker, setTesseractWorker] = useState(null);
  const [ocrLanguage, setOcrLanguage] = useState('eng');
  const [ocrQuality, setOcrQuality] = useState(2);
  const [pageLimit, setPageLimit] = useState('');

  // Load PDF.js and Tesseract from CDN
  useEffect(() => {
    const loadLibraries = async () => {
      // Load PDF.js
      if (!window.pdfjsLib) {
        const pdfScript = document.createElement('script');
        pdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        pdfScript.onload = () => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          setPdfLib(window.pdfjsLib);
        };
        document.head.appendChild(pdfScript);
      } else {
        setPdfLib(window.pdfjsLib);
      }

      // Load Tesseract
      if (!window.Tesseract) {
        const tesseractScript = document.createElement('script');
        tesseractScript.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js';
        document.head.appendChild(tesseractScript);
      }
    };

    loadLibraries();

    return () => {
      // Cleanup scripts if needed
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

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const maxScroll = scrollHeight - clientHeight;
      const scrollPercentage = maxScroll > 0 
        ? Math.min(100, (scrollTop / maxScroll) * 100) 
        : 100;
      onScrollProgress?.(scrollPercentage);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [onScrollProgress]);

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

  // OCR Text Extraction Function
  const extractTextWithOCR = async () => {
    if (!pdfDoc || !window.Tesseract) {
      setError('OCR libraries not loaded');
      return;
    }

    setIsExtracting(true);
    setExtractionProgress(0);
    setExtractionStatus('Initializing OCR...');

    try {
      // Initialize Tesseract worker
      const worker = await window.Tesseract.createWorker();
      await worker.loadLanguage(ocrLanguage);
      await worker.initialize(ocrLanguage);
      setTesseractWorker(worker);

      setExtractionStatus('OCR engine ready');

      const numPages = pageLimit ? Math.min(parseInt(pageLimit), totalPages) : totalPages;
      let extractedText = "";
      let processedPages = 0;

      // Process each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        setExtractionStatus(`Processing page ${pageNum}/${numPages}`);

        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: ocrQuality });

        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        // Convert canvas to image data URL
        const imageDataUrl = canvas.toDataURL('image/png');

        // Perform OCR
        const { data: { text } } = await worker.recognize(imageDataUrl);
        extractedText += `\n--- Page ${pageNum} ---\n${text}\n`;

        // Update progress
        processedPages++;
        const progress = (processedPages / numPages) * 100;
        setExtractionProgress(progress);

        // Clean up canvas
        canvas.remove();
      }

      await worker.terminate();
      setTesseractWorker(null);
      
      // Call callback with extracted text
      onTextExtracted?.(extractedText.trim());
      
      setExtractionStatus('Text extraction completed!');
      
    } catch (error) {
      console.error('OCR extraction error:', error);
      setError(`Error extracting text: ${error.message}`);
      if (tesseractWorker) {
        await tesseractWorker.terminate();
        setTesseractWorker(null);
      }
    } finally {
      setIsExtracting(false);
      setTimeout(() => {
        setExtractionStatus('');
        setExtractionProgress(0);
      }, 3000);
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
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-stone-200 rounded-lg hover:bg-stone-300">
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`border border-stone-200 rounded-lg overflow-hidden ${className}`}>
      {/* PDF Controls with OCR */}
      <div className="bg-stone-50 border-b border-stone-200 p-3 space-y-3">
        {/* Navigation and zoom controls */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 border border-stone-300 rounded hover:bg-stone-100 disabled:opacity-50"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1">
              <span className="text-sm text-stone-600">Page {currentPage} of {totalPages}</span>
            </div>
            
            <button
              className="px-3 py-1 border border-stone-300 rounded hover:bg-stone-100 disabled:opacity-50"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-stone-300 rounded hover:bg-stone-100" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-stone-600 min-w-[3rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button className="px-3 py-1 border border-stone-300 rounded hover:bg-stone-100" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </button>
            <button className="px-3 py-1 border border-stone-300 rounded hover:bg-stone-100" onClick={handleRotate}>
              <RotateCw className="w-4 h-4" />
            </button>
            <button className="px-3 py-1 border border-stone-300 rounded hover:bg-stone-100" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* OCR Controls */}
        <div className="border-t border-stone-200 pt-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-stone-700">Language:</label>
              <select 
                value={ocrLanguage} 
                onChange={(e) => setOcrLanguage(e.target.value)}
                className="px-2 py-1 border border-stone-300 rounded text-sm"
                disabled={isExtracting}
              >
                <option value="eng">English</option>
                <option value="ara">Arabic</option>
                <option value="fra">French</option>
                <option value="spa">Spanish</option>
                <option value="deu">German</option>
                <option value="chi_sim">Chinese</option>
                <option value="jpn">Japanese</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-stone-700">Quality:</label>
              <select 
                value={ocrQuality} 
                onChange={(e) => setOcrQuality(parseInt(e.target.value))}
                className="px-2 py-1 border border-stone-300 rounded text-sm"
                disabled={isExtracting}
              >
                <option value="1">Low (Faster)</option>
                <option value="2">Medium</option>
                <option value="3">High</option>
                <option value="4">Very High</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-stone-700">Pages:</label>
              <select 
                value={pageLimit} 
                onChange={(e) => setPageLimit(e.target.value)}
                className="px-2 py-1 border border-stone-300 rounded text-sm"
                disabled={isExtracting}
              >
                <option value="">All Pages</option>
                <option value="1">1 Page</option>
                <option value="5">5 Pages</option>
                <option value="10">10 Pages</option>
                <option value="20">20 Pages</option>
              </select>
            </div>

            <button
              onClick={extractTextWithOCR}
              disabled={isExtracting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {isExtracting ? 'Extracting...' : 'Extract Text (OCR)'}
            </button>
          </div>

          {/* Progress Bar */}
          {isExtracting && (
            <div className="mt-3 space-y-2">
              <div className="text-sm text-stone-600">{extractionStatus}</div>
              <div className="w-full bg-stone-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${extractionProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* PDF Viewer */}
      <div
        ref={scrollContainerRef}
        className="bg-stone-100 overflow-auto"
        style={{ height: isFullscreen ? 'calc(100vh - 120px)' : '700px' }}
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

// Main component demonstrating the enhanced PDF viewer
export default function EnhancedPDFReaderWithOCR() {
  const [pdfUrl, setPdfUrl] = useState('https://ripsrvyzgvyvfisvcnwk.supabase.co/storage/v1/object/public/books//1751119925694-book_1751119925694.pdf');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [showTextModal, setShowTextModal] = useState(false);

  const handleTextExtracted = (text) => {
    setExtractedText(text);
    setShowTextModal(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      alert('Text copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const downloadText = () => {
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted-text.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-stone-800 mb-4">Enhanced PDF Reader with OCR</h1>
        <div className="flex gap-4 items-center mb-4">
          <input 
            type="url" 
            value={pdfUrl}
            onChange={(e) => setPdfUrl(e.target.value)}
            placeholder="Enter PDF URL"
            className="flex-1 px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <EnhancedPdfViewer
        pdfUrl={pdfUrl}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        totalPages={totalPages}
        onScrollProgress={setScrollProgress}
        onTextExtracted={handleTextExtracted}
        className="w-full"
      />

      {/* Text Extraction Modal */}
      {showTextModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-stone-200">
              <h3 className="text-lg font-semibold">Extracted Text</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={downloadText}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => setShowTextModal(false)}
                  className="px-3 py-1 bg-stone-600 text-white rounded hover:bg-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <pre className="whitespace-pre-wrap text-sm text-stone-700 font-mono leading-relaxed">
                {extractedText}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}