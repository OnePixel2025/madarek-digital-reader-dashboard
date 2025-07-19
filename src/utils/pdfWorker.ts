
import { pdfjs } from 'react-pdf';

let workerInitialized = false;
let workerError: string | null = null;

export const initializePdfWorker = async (): Promise<boolean> => {
  if (workerInitialized && !workerError) {
    return true;
  }

  try {
    console.log('Initializing PDF.js worker...');
    
    // Try multiple worker sources with fallback
    const workerSources = [
      // Primary: Use version-specific worker from unpkg
      `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
      // Fallback 1: Use latest version
      'https://unpkg.com/pdfjs-dist@latest/build/pdf.worker.min.js',
      // Fallback 2: Use jsDelivr CDN
      `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
    ];

    for (const workerSrc of workerSources) {
      try {
        // Test if the worker URL is accessible
        const response = await fetch(workerSrc, { method: 'HEAD' });
        if (response.ok) {
          pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
          console.log('PDF.js worker configured successfully:', workerSrc);
          workerInitialized = true;
          workerError = null;
          return true;
        }
      } catch (error) {
        console.warn(`Failed to load worker from ${workerSrc}:`, error);
        continue;
      }
    }

    throw new Error('All worker sources failed to load');
  } catch (error) {
    console.error('Failed to initialize PDF.js worker:', error);
    workerError = error instanceof Error ? error.message : 'Unknown worker error';
    return false;
  }
};

export const getWorkerStatus = () => ({
  initialized: workerInitialized,
  error: workerError
});
