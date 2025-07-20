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
          cached: true,
          method: existingExtraction.extraction_method,
          needsOCR: existingExtraction.extraction_method === 'needs_ocr'
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

    const buffer = await fileData.arrayBuffer()
    
    // Attempt text extraction
    const result = await intelligentTextExtraction(buffer)

    // Store the result in the database
    const { error: insertError } = await supabase
      .from('book_text_extractions')
      .insert({
        book_id: bookId,
        extracted_text: result.text,
        page_count: result.pageCount,
        extraction_method: result.method,
        extracted_at: new Date().toISOString(),
        needs_ocr: result.needsOCR || false
      })

    if (insertError) {
      console.error('Error storing extracted text:', insertError)
    }

    return new Response(
      JSON.stringify({ 
        text: result.text,
        pageCount: result.pageCount,
        cached: false,
        method: result.method,
        needsOCR: result.needsOCR,
        textLength: result.text.length,
        suggestion: result.needsOCR ? 'This PDF appears to contain images/scans. Consider using an OCR service for better text extraction.' : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error extracting PDF text:', error)
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

async function intelligentTextExtraction(buffer: ArrayBuffer) {
  let extractedText = ''
  let pageCount = 0
  let method = 'unknown'
  let needsOCR = false

  // First attempt: pdf-parse
  try {
    console.log('Attempting text extraction with pdf-parse...')
    const pdfParse = await import('https://esm.sh/pdf-parse@1.1.1')
    const data = await pdfParse.default(new Uint8Array(buffer))
    
    extractedText = data.text
    pageCount = data.numpages
    method = 'pdf-parse'
    
    console.log(`pdf-parse extracted ${extractedText.length} characters from ${pageCount} pages`)
    
  } catch (pdfParseError) {
    console.log('pdf-parse failed:', pdfParseError.message)
    
    // Second attempt: pdf.js
    try {
      console.log('Attempting text extraction with pdf.js...')
      const pdfjsLib = await import('https://esm.sh/pdfjs-dist@3.11.174/legacy/build/pdf.js')
      
      if (pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = null
      }
      
      const pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
        verbosity: 0,
        isEvalSupported: false,
        disableWorker: true
      }).promise
      
      pageCount = pdf.numPages
      console.log(`PDF has ${pageCount} pages`)
      
      for (let i = 1; i <= pageCount; i++) {
        try {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          
          // Get text items and check for meaningful content
          const textItems = textContent.items.filter((item: any) => 
            item.str && item.str.trim().length > 0
          )
          
          const pageText = textItems.map((item: any) => item.str).join(' ')
          extractedText += pageText + '\n\n'
          
          // Check if page has images (might indicate scanned content)
          const operators = await page.getOperatorList()
          const hasImages = operators.fnArray.includes(pdfjsLib.OPS.paintImageXObject)
          
          if (hasImages && pageText.length < 100) {
            console.log(`Page ${i} appears to contain images with little text`)
            needsOCR = true
          }
          
        } catch (pageError) {
          console.error(`Error processing page ${i}:`, pageError)
          extractedText += `[Error processing page ${i}]\n\n`
        }
      }
      
      method = 'pdf.js'
      console.log(`pdf.js extracted ${extractedText.length} characters`)
      
    } catch (pdfjsError) {
      console.error('pdf.js also failed:', pdfjsError.message)
      throw new Error('All text extraction methods failed')
    }
  }

  // Analyze the extracted text quality
  const textAnalysis = analyzeExtractedText(extractedText)
  
  if (textAnalysis.isLowQuality) {
    needsOCR = true
    method += '_low_quality'
    
    // Provide a more helpful message for image-based PDFs
    if (textAnalysis.hasOnlySymbols) {
      extractedText = `[This PDF appears to contain scanned images or is image-based]

Original extracted content (may be garbled):
${extractedText.substring(0, 500)}...

This PDF requires OCR (Optical Character Recognition) to extract readable text. 
Consider using:
1. Adobe Acrobat Pro with OCR
2. Google Drive (upload PDF, it will OCR automatically)
3. Online OCR services like OCR.space or ILovePDF
4. AWS Textract, Google Document AI, or Azure Form Recognizer APIs

Page count: ${pageCount}
Extraction method: ${method}`
    }
  }

  // Clean up the text if it's not marked for OCR
  if (!needsOCR) {
    extractedText = cleanupText(extractedText)
  }

  return {
    text: extractedText,
    pageCount,
    method,
    needsOCR
  }
}

function analyzeExtractedText(text: string) {
  const trimmedText = text.trim()
  
  if (trimmedText.length < 50) {
    return { isLowQuality: true, hasOnlySymbols: true, reason: 'too_short' }
  }
  
  // Check for meaningful words
  const words = trimmedText.split(/\s+/)
  const meaningfulWords = words.filter(word => {
    // Remove common symbols and check for alphabetic characters
    const clean = word.replace(/[^\w]/g, '')
    return clean.length > 2 && /[a-zA-Z]/.test(clean)
  })
  
  const meaningfulWordRatio = meaningfulWords.length / words.length
  
  // Check for excessive symbols/special characters
  const symbolRatio = (trimmedText.match(/[^\w\s]/g) || []).length / trimmedText.length
  
  // Check for repeated meaningless patterns
  const hasRepeatedPatterns = /(.{1,10})\1{5,}/.test(trimmedText)
  
  const isLowQuality = meaningfulWordRatio < 0.3 || symbolRatio > 0.5 || hasRepeatedPatterns
  const hasOnlySymbols = meaningfulWordRatio < 0.1
  
  return {
    isLowQuality,
    hasOnlySymbols,
    meaningfulWordRatio,
    symbolRatio,
    reason: isLowQuality ? 'low_quality_text' : 'good_quality'
  }
}

function cleanupText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    .trim()
}