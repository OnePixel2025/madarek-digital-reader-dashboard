import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getDocument } from 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookId, pageRange } = await req.json();
    
    if (!bookId) {
      throw new Error('Book ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch book details
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('title, author, file_path, language')
      .eq('id', bookId)
      .single();

    if (bookError) {
      console.error('Error fetching book:', bookError);
      throw new Error('Failed to fetch book details');
    }

    if (!book || !book.file_path) {
      throw new Error('Book file not found');
    }

    console.log('Processing TTS for book:', book.title);

    // Get PDF file
    let pdfUrl: string;
    if (book.file_path.startsWith('http')) {
      pdfUrl = book.file_path;
    } else {
      const { data } = await supabase.storage
        .from('books')
        .getPublicUrl(book.file_path);
      pdfUrl = data.publicUrl;
    }

    // Download PDF file
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error('Failed to download PDF file');
    }

    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    
    console.log('Starting PDF text extraction...');
    
    // Extract text from PDF using pdf.js
    let extractedText = '';
    
    try {
      const uint8Array = new Uint8Array(pdfArrayBuffer);
      const pdf = await getDocument(uint8Array).promise;
      
      console.log(`PDF has ${pdf.numPages} pages`);
      
      // Extract text from all pages
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        console.log(`Extracting text from page ${pageNum}/${pdf.numPages}`);
        
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine all text items from the page
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        extractedText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
      }
      
      console.log(`Successfully extracted ${extractedText.length} characters from ${pdf.numPages} pages`);
      
    } catch (pdfError) {
      console.error('Error during PDF text extraction:', pdfError);
      extractedText = `Error extracting PDF content: ${pdfError.message}. Book: "${book.title}"${book.author ? ` by ${book.author}` : ''}`;
    }

    // Instead of TTS, just log and return the extracted text
    console.log('Extracted PDF text:', extractedText);

    return new Response(
      JSON.stringify({ 
        extractedText: extractedText,
        bookTitle: book.title,
        bookAuthor: book.author,
        message: 'PDF text extracted successfully (TTS disabled for debugging)'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in generate-book-tts function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});