import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Alternative approach using pdf-parse which works better with Deno
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { bookId } = await req.json()
    
    if (!bookId) {
      throw new Error('Book ID is required')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if text extraction already exists
    const { data: existingExtraction } = await supabase
      .from('book_text_extractions')
      .select('*')
      .eq('book_id', bookId)
      .single()

    if (existingExtraction) {
      return new Response(
        JSON.stringify({ 
          text: existingExtraction.extracted_text,
          pageCount: existingExtraction.page_count,
          cached: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get book details
    const { data: book } = await supabase
      .from('books')
      .select('file_path, title')
      .eq('id', bookId)
      .single()

    if (!book?.file_path) {
      throw new Error('Book file not found')
    }

    // Get the PDF file from storage
    const { data: fileData } = await supabase.storage
      .from('books')
      .download(book.file_path)

    if (!fileData) {
      throw new Error('Failed to download PDF file')
    }

    // Convert blob to array buffer
    const buffer = await fileData.arrayBuffer()
    
    let extractedText = ''
    let pageCount = 0

    try {
      // Method 1: Try with pdf-parse (simpler, more reliable for Deno)
      const pdfParse = await import('https://esm.sh/pdf-parse@1.1.1')
      
      const data = await pdfParse.default(new Uint8Array(buffer))
      extractedText = data.text
      pageCount = data.numpages
      
    } catch (pdfParseError) {
      console.log('pdf-parse failed, trying alternative method:', pdfParseError.message)
      
      try {
        // Method 2: Try with a specific pdf.js configuration for Deno
        const pdfjsLib = await import('https://esm.sh/pdfjs-dist@3.11.174/legacy/build/pdf.js')
        
        // Configure for server-side usage
        if (pdfjsLib.GlobalWorkerOptions) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = null
        }
        
        const pdf = await pdfjsLib.getDocument({
          data: new Uint8Array(buffer),
          verbosity: 0,
          isEvalSupported: false,
          disableWorker: true,
          useSystemFonts: true
        }).promise
        
        pageCount = pdf.numPages
        
        for (let i = 1; i <= pageCount; i++) {
          try {
            const page = await pdf.getPage(i)
            const textContent = await page.getTextContent()
            const pageText = textContent.items
              .filter((item: any) => item.str)
              .map((item: any) => item.str)
              .join(' ')
            
            extractedText += pageText + '\n\n'
          } catch (pageError) {
            console.error(`Error extracting page ${i}:`, pageError)
            extractedText += `[Error extracting page ${i}]\n\n`
          }
        }
        
      } catch (pdfjsError) {
        console.log('pdf.js also failed:', pdfjsError.message)
        
        // Method 3: Fallback to a simple text extraction attempt
        try {
          const textDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false })
          const rawText = textDecoder.decode(new Uint8Array(buffer))
          
          // Look for text patterns in the PDF
          const textMatches = rawText.match(/\(([^)]+)\)/g)
          if (textMatches && textMatches.length > 10) {
            extractedText = textMatches
              .map(match => match.slice(1, -1))
              .filter(text => text.length > 2 && /[a-zA-Z]/.test(text))
              .join(' ')
            
            // Estimate page count from PDF structure
            const pageMatches = rawText.match(/\/Type\s*\/Page[^s]/g)
            pageCount = pageMatches ? pageMatches.length : 1
          } else {
            throw new Error('Could not extract readable text from PDF')
          }
        } catch (fallbackError) {
          throw new Error('All PDF extraction methods failed. PDF might be corrupted, encrypted, or image-based.')
        }
      }
    }

    // Clean up the extracted text
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim()

    if (extractedText.length < 50) {
      throw new Error('Extracted text is too short. PDF might be image-based or corrupted.')
    }

    // Store the extracted text in the database
    const { error: insertError } = await supabase
      .from('book_text_extractions')
      .insert({
        book_id: bookId,
        extracted_text: extractedText,
        page_count: pageCount,
        extraction_method: 'server-side-multi-method'
      })

    if (insertError) {
      console.error('Error storing extracted text:', insertError)
      // Continue anyway, we can still return the text
    }

    return new Response(
      JSON.stringify({ 
        text: extractedText,
        pageCount,
        cached: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error extracting PDF text:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        suggestion: 'PDF might be image-based, encrypted, or corrupted. Consider using OCR for scanned documents.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})