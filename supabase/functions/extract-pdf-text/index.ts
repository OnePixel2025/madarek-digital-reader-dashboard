import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

    // Convert to array buffer
    const buffer = await fileData.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)
    
    // Simple text extraction approach
    let extractedText = ''
    let pageCount = 1

    try {
      // Convert buffer to string and look for text patterns
      const decoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false })
      const pdfString = decoder.decode(uint8Array)
      
      // Extract text from parentheses (most common PDF text storage)
      const textMatches = pdfString.match(/\(([^)]{2,})\)/g)
      
      if (textMatches && textMatches.length > 0) {
        extractedText = textMatches
          .map(match => match.slice(1, -1)) // Remove parentheses
          .filter(text => text.length > 1 && /[a-zA-Z]/.test(text)) // Filter meaningful text
          .join(' ')
          .replace(/\\[nrt]/g, ' ') // Replace escape sequences
          .replace(/\s+/g, ' ')
          .trim()
      }
      
      // Try to count pages
      const pageMatches = pdfString.match(/\/Type\s*\/Page[^s]/g)
      if (pageMatches) {
        pageCount = pageMatches.length
      }
      
      // If no text found, indicate it might be image-based
      if (extractedText.length < 50) {
        extractedText = `This PDF appears to be image-based or encrypted. 

File information:
- Size: ${Math.round(buffer.byteLength / 1024)} KB
- Estimated pages: ${pageCount}
- Text extraction method: Simple pattern matching

This PDF likely contains:
- Scanned images instead of text
- Encrypted/protected content
- Complex formatting not supported by simple extraction

Recommendations:
1. Use Google Drive: Upload PDF → Right-click → "Open with Google Docs" (auto-OCR)
2. Try Adobe Acrobat Pro with OCR
3. Use online OCR services like OCR.space
4. Check if PDF is password-protected

Raw sample (first 200 chars of non-text content):
${pdfString.substring(0, 200).replace(/[^\x20-\x7E]/g, '.')}`
      }
      
    } catch (error) {
      extractedText = `Error extracting text: ${error.message}

This PDF may be:
- Corrupted or invalid
- Using unsupported encoding
- Password protected
- Image-based (scanned document)

File size: ${Math.round(buffer.byteLength / 1024)} KB
Please try manually converting this PDF to text using other tools.`
    }

    // Store the result
    const { error: insertError } = await supabase
      .from('book_text_extractions')
      .insert({
        book_id: bookId,
        extracted_text: extractedText,
        page_count: pageCount,
        extraction_method: 'simple-pattern-matching',
        extracted_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error storing extracted text:', insertError)
    }

    return new Response(
      JSON.stringify({ 
        text: extractedText,
        pageCount: pageCount,
        cached: false,
        method: 'simple-pattern-matching',
        textLength: extractedText.length,
        fileSize: buffer.byteLength
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing PDF:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: 'extraction_error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})