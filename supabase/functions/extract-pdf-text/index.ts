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
    const arrayBuffer = await fileData.arrayBuffer()

    // Use pdf-parse to extract text (we'll need to import this)
    // For now, we'll use a simple approach with pdf.js
    const pdfData = new Uint8Array(arrayBuffer)
    
    // Import pdf.js for server-side PDF processing
    const pdfjsLib = await import('https://esm.sh/pdfjs-dist@3.11.174')
    
    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise
    const pageCount = pdf.numPages
    
    let extractedText = ''
    
    // Extract text from each page
    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .filter((item: any) => item.str)
        .map((item: any) => item.str)
        .join(' ')
      
      extractedText += pageText + '\n\n'
    }

    // Clean up the extracted text
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim()

    // Store the extracted text in the database
    const { error: insertError } = await supabase
      .from('book_text_extractions')
      .insert({
        book_id: bookId,
        extracted_text: extractedText,
        page_count: pageCount,
        extraction_method: 'server-side'
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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})