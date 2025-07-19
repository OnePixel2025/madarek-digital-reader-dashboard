import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuration
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_PAGES = 1000
const BATCH_SIZE = 10 // Process pages in batches

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
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('file_path, title')
      .eq('id', bookId)
      .single()

    if (bookError || !book?.file_path) {
      throw new Error('Book file not found')
    }

    // Get file info first to check size
    const { data: fileInfo } = await supabase.storage
      .from('books')
      .list('', { search: book.file_path })

    const fileSize = fileInfo?.[0]?.metadata?.size
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      throw new Error(`File too large: ${Math.round(fileSize / 1024 / 1024)}MB. Maximum allowed: ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    // Get the PDF file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('books')
      .download(book.file_path)

    if (downloadError || !fileData) {
      throw new Error('Failed to download PDF file: ' + downloadError?.message)
    }

    // Convert blob to array buffer
    const arrayBuffer = await fileData.arrayBuffer()
    const pdfData = new Uint8Array(arrayBuffer)
    
    // Import pdf.js with better error handling
    let pdfjsLib
    try {
      pdfjsLib = await import('https://esm.sh/pdfjs-dist@3.11.174')
    } catch (importError) {
      throw new Error('Failed to load PDF processing library')
    }
    
    // Load the PDF document with timeout
    const loadingTask = pdfjsLib.getDocument({ 
      data: pdfData,
      verbosity: 0 // Reduce console noise
    })
    
    const pdf = await Promise.race([
      loadingTask.promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PDF loading timeout')), 30000)
      )
    ]) as any

    const pageCount = pdf.numPages
    
    if (pageCount > MAX_PAGES) {
      throw new Error(`PDF has too many pages: ${pageCount}. Maximum allowed: ${MAX_PAGES}`)
    }
    
    let extractedText = ''
    let processedPages = 0
    
    // Process pages in batches to manage memory
    for (let batchStart = 1; batchStart <= pageCount; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, pageCount)
      
      const batchPromises = []
      for (let i = batchStart; i <= batchEnd; i++) {
        batchPromises.push(extractPageText(pdf, i))
      }
      
      try {
        const batchTexts = await Promise.all(batchPromises)
        extractedText += batchTexts.join('\n\n') + '\n\n'
        processedPages += batchTexts.length
        
        // Optional: Report progress for long documents
        if (pageCount > 50) {
          console.log(`Processed ${processedPages}/${pageCount} pages`)
        }
      } catch (batchError) {
        console.error(`Error processing batch ${batchStart}-${batchEnd}:`, batchError)
        // Continue with next batch instead of failing completely
        extractedText += `[Error extracting pages ${batchStart}-${batchEnd}]\n\n`
      }
    }
    
    // Clean up the extracted text more thoroughly
    extractedText = cleanupText(extractedText)
    
    if (extractedText.length < 100) {
      console.warn('Extracted text is suspiciously short, PDF might be image-based or corrupted')
    }
    
    // Store the extracted text in the database
    const { error: insertError } = await supabase
      .from('book_text_extractions')
      .insert({
        book_id: bookId,
        extracted_text: extractedText,
        page_count: pageCount,
        extraction_method: 'server-side-improved',
        extracted_at: new Date().toISOString()
      })
    
    if (insertError) {
      console.error('Error storing extracted text:', insertError)
      // Continue anyway, we can still return the text
    }
    
    return new Response(
      JSON.stringify({ 
        text: extractedText,
        pageCount,
        processedPages,
        cached: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error extracting PDF text:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        type: 'extraction_error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function extractPageText(pdf: any, pageNum: number): Promise<string> {
  try {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()
    
    // Better text extraction with position awareness
    const textItems = textContent.items
      .filter((item: any) => item.str && item.str.trim())
      .sort((a: any, b: any) => {
        // Sort by Y position first (top to bottom), then X position (left to right)
        if (Math.abs(a.transform[5] - b.transform[5]) > 5) {
          return b.transform[5] - a.transform[5] // Higher Y comes first
        }
        return a.transform[4] - b.transform[4] // Lower X comes first
      })
    
    let pageText = ''
    let lastY = null
    
    for (const item of textItems) {
      const currentY = Math.round(item.transform[5])
      
      // Add line break if we're on a new line
      if (lastY !== null && Math.abs(currentY - lastY) > 5) {
        pageText += '\n'
      }
      
      pageText += item.str + ' '
      lastY = currentY
    }
    
    return pageText.trim()
  } catch (pageError) {
    console.error(`Error extracting text from page ${pageNum}:`, pageError)
    return `[Error extracting page ${pageNum}]`
  }
}

function cleanupText(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/[ \t]+/g, ' ')
    // Normalize line breaks
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove excessive line breaks but preserve paragraph structure
    .replace(/\n{3,}/g, '\n\n')
    // Remove leading/trailing whitespace from lines
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Final cleanup
    .trim()
}