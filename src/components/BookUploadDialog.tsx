
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { TextProcessingStatus } from './TextProcessingStatus';

// Extend Window interface for PDF.js and Tesseract
declare global {
  interface Window {
    pdfjsLib?: any;
    Tesseract?: any;
  }
}

interface BookUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookUploadDialog = ({ open, onClose, onSuccess }: BookUploadDialogProps) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    publication_year: '',
    category: '',
    language: 'Arabic',
    page_count: '',
    file_size_mb: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionStatus, setExtractionStatus] = useState('');
  const [uploadedBookId, setUploadedBookId] = useState<string | null>(null);
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      description: '',
      publication_year: '',
      category: '',
      language: 'Arabic',
      page_count: '',
      file_size_mb: ''
    });
    setSelectedFile(null);
    setUploadedBookId(null);
    setIsExtractingText(false);
    setExtractionProgress(0);
    setExtractionStatus('');
  };

  const handleClose = () => {
    // Only allow closing if not currently uploading or extracting
    if (!isSubmitting && !isExtractingText) {
      resetForm();
      onClose();
    }
  };

  const handleSuccess = () => {
    resetForm();
    onSuccess();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Error",
          description: "Please select a PDF file",
          variant: "destructive",
        });
        return;
      }
      console.log('Selected file:', file.name, 'Size:', file.size, 'Type:', file.type);
      setSelectedFile(file);
      // Auto-populate file size
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
      setFormData(prev => ({
        ...prev,
        file_size_mb: fileSizeMB
      }));
    }
  };

  const sanitizeFileName = (fileName: string): string => {
    // Remove or replace problematic characters
    let sanitized = fileName
      // Replace Arabic and special characters with safe alternatives
      .replace(/[^\w\-_.]/g, '_') // Replace non-word characters with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single underscore
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .toLowerCase(); // Convert to lowercase for consistency
    
    // Ensure the filename isn't empty after sanitization
    if (!sanitized || sanitized === '.pdf') {
      sanitized = 'book_' + Date.now() + '.pdf';
    }
    
    console.log('Original filename:', fileName);
    console.log('Sanitized filename:', sanitized);
    
    return sanitized;
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const timestamp = Date.now();
    const sanitizedName = sanitizeFileName(file.name);
    const fileName = `${timestamp}-${sanitizedName}`;
    
    console.log('Uploading file to bucket "books" with name:', fileName);
    
    const { data, error } = await supabase.storage
      .from('books')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    console.log('File uploaded successfully:', data);
    return data.path;
  };

  /**
   * Load required OCR libraries (PDF.js and Tesseract.js)
   */
  const loadOCRLibraries = async (): Promise<void> => {
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
   * Extract text from uploaded PDF using OCR
   */
  const extractTextFromPDF = async (bookId: string, filePath: string, language: string): Promise<void> => {
    setIsExtractingText(true);
    setExtractionProgress(0);
    setExtractionStatus('Loading OCR libraries...');

    try {
      // Load required libraries
      await loadOCRLibraries();

      // Get language code for OCR
      const ocrLanguage = language === "Arabic" ? "ara" : 'eng';
      
      // Create PDF URL
      const pdfUrl = `https://ripsrvyzgvyvfisvcnwk.supabase.co/storage/v1/object/public/books/${filePath}`;

      setExtractionStatus('Starting text extraction...');
      
      let extractedText = "";
      let worker = null;
      
      try {
        // Initialize Tesseract worker
        setExtractionStatus('Initializing OCR engine...');
        worker = await window.Tesseract.createWorker();
        await worker.loadLanguage(ocrLanguage);
        await worker.initialize(ocrLanguage);
        
        setExtractionStatus('Loading PDF document...');
        
        // Load PDF document
        const pdf = await window.pdfjsLib.getDocument(pdfUrl).promise;
        const totalPages = pdf.numPages;
        
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
        
        const finalText = extractedText.trim();
        
        // Save raw extracted text to database first
        const { error: insertError } = await supabase
          .from('book_text_extractions')
          .upsert({
            book_id: bookId,
            extracted_text: finalText,
            extraction_method: 'ocr-tesseract',
            page_count: totalPages,
            needs_ocr: false,
            ocr_status: 'completed'
          }, {
            onConflict: 'book_id,extraction_method'
          });

        if (insertError) {
          console.error('Error saving extracted text:', insertError);
          throw new Error(`Failed to save extracted text: ${insertError.message}`);
        }

        console.log('Text extraction completed:', {
          textLength: finalText.length,
          pageCount: totalPages
        });
        
        setExtractionStatus('Starting AI text processing...');
        
        // Start background AI processing
        try {
          const { data: processResponse, error: processError } = await supabase
            .functions
            .invoke('process-extracted-text', {
              body: { 
                text: finalText,
                bookId: bookId,
                language: language 
              }
            });

          if (processError) {
            console.error('Error starting text processing:', processError);
            setExtractionStatus('Text extraction completed! AI processing failed to start.');
          } else {
            console.log('Background text processing started:', processResponse);
            setExtractionStatus('Text extraction completed! AI processing started in background.');
          }
        } catch (processError) {
          console.error('Failed to start background processing:', processError);
          setExtractionStatus('Text extraction completed! AI processing failed to start.');
        }
        
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
      console.error('Error in text extraction:', error);
      throw error;
    } finally {
      setIsExtractingText(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a PDF file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    console.log('Starting book upload process...');

    try {
      // Upload the PDF file
      console.log('Step 1: Uploading PDF file...');
      const filePath = await uploadFile(selectedFile);
      console.log('File uploaded with path:', filePath);

      const bookData = {
        title: formData.title.trim(),
        author: formData.author.trim() || null,
        description: formData.description.trim() || null,
        publication_year: formData.publication_year ? parseInt(formData.publication_year) : null,
        category: formData.category.trim() || null,
        language: formData.language,
        page_count: formData.page_count ? parseInt(formData.page_count) : null,
        file_size_mb: formData.file_size_mb ? parseFloat(formData.file_size_mb) : null,
        file_path: filePath,
        status: 'active'
      };

      console.log('Step 2: Inserting book data:', bookData);

      const { data: insertedBook, error } = await supabase
        .from('books')
        .insert([bookData])
        .select();

      if (error) {
        console.error('Error inserting book data:', error);
        throw error;
      }

      console.log('Book inserted successfully:', insertedBook);

      const bookId = insertedBook[0].id;
      setUploadedBookId(bookId);

      toast({
        title: "Success",
        description: "Book uploaded successfully! Starting text extraction...",
      });

      // Start text extraction in the background
      extractTextFromPDF(bookId, filePath, formData.language).catch((error) => {
        console.error('Text extraction failed:', error);
        toast({
          title: "Text extraction failed",
          description: "The book was uploaded but text extraction failed. You can try again later.",
          variant: "destructive",
        });
      });
    } catch (error) {
      console.error('Error in upload process:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload book",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload New Book
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter book title"
                required
              />
            </div>

            <div>
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => handleInputChange('author', e.target.value)}
                placeholder="Enter author name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter book description"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="file">PDF File *</Label>
            <div className="border-2 border-dashed border-stone-300 rounded-lg p-6 text-center">
              <input
                id="file"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label 
                htmlFor="file" 
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <FileText className="w-8 h-8 text-stone-400" />
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-medium text-stone-800">{selectedFile.name}</p>
                    <p className="text-xs text-stone-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-stone-800">Click to upload PDF</p>
                    <p className="text-xs text-stone-500">PDF files only</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="publication_year">Publication Year</Label>
              <Input
                id="publication_year"
                type="number"
                value={formData.publication_year}
                onChange={(e) => handleInputChange('publication_year', e.target.value)}
                placeholder="e.g., 2024"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                placeholder="e.g., History, Literature"
              />
            </div>

            <div>
              <Label htmlFor="language">Language</Label>
              <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arabic">Arabic</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="French">French</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="page_count">Page Count</Label>
              <Input
                id="page_count"
                type="number"
                value={formData.page_count}
                onChange={(e) => handleInputChange('page_count', e.target.value)}
                placeholder="Number of pages"
              />
            </div>

            <div>
              <Label htmlFor="file_size_mb">File Size (MB)</Label>
              <Input
                id="file_size_mb"
                type="number"
                step="0.1"
                value={formData.file_size_mb}
                onChange={(e) => handleInputChange('file_size_mb', e.target.value)}
                placeholder="Auto-filled when file selected"
                readOnly
              />
            </div>
          </div>

          {/* Text Extraction Progress */}
          {isExtractingText && (
            <div className="space-y-3 p-4 bg-stone-50 rounded-lg border">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Extracting text from PDF...</span>
              </div>
              <Progress value={extractionProgress} className="w-full" />
              <p className="text-xs text-stone-600">{extractionStatus}</p>
            </div>
          )}

          {/* Text Processing Status */}
          {uploadedBookId && (
            <TextProcessingStatus 
              bookId={uploadedBookId} 
              onComplete={() => {
                toast({
                  title: "Text Processing Complete",
                  description: "Your book is now ready for AI features like summaries and chat!",
                });
              }}
            />
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting || isExtractingText}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isExtractingText}>
              {isSubmitting ? 'Uploading...' : 'Upload Book'}
            </Button>
            {uploadedBookId && !isExtractingText && (
              <Button type="button" onClick={handleSuccess} className="ml-2">
                Done
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
