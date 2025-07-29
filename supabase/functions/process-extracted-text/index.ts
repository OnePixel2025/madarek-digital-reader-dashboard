import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Request validation
    const requestBody = await req.json()
    const { text, bookId, language = 'en' } = requestBody
    
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ 
          error: 'Text is required and must be a string',
          type: 'validation_error'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!bookId) {
      return new Response(
        JSON.stringify({ 
          error: 'Book ID is required',
          type: 'validation_error'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const googleApiKey = Deno.env.get('GOOGLE_API_KEY')
    if (!googleApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Google API key not configured',
          type: 'configuration_error'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Text processing request received')
    console.log('Book ID:', bookId)
    console.log('Language:', language)
    console.log('Text length:', text.length)

    // Calculate chunks upfront
    const chunkSize = 2500 // Reduced chunk size for better API quota management
    const chunks = []
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize))
    }

    console.log(`Total chunks to process: ${chunks.length}`)

    // Create processing job record
    const { data: job, error: jobError } = await supabase
      .from('text_processing_jobs')
      .insert({
        book_id: bookId,
        status: 'processing',
        total_chunks: chunks.length,
        progress: 0,
        processed_chunks: 0
      })
      .select()
      .single()

    if (jobError) {
      console.error('Failed to create processing job:', jobError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create processing job',
          type: 'database_error'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Created processing job:', job.id)

    // Start background processing
    const backgroundTask = processTextInBackground(
      job.id,
      bookId,
      chunks,
      language,
      googleApiKey
    )

    // Use EdgeRuntime.waitUntil for background processing
    EdgeRuntime.waitUntil(backgroundTask)

    // Return immediate response with job tracking information
    return new Response(
      JSON.stringify({ 
        jobId: job.id,
        status: 'processing',
        totalChunks: chunks.length,
        message: 'Text processing started in background'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 202 // Accepted
      }
    )

  } catch (error) {
    console.error('Error in text processing request handler:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        type: 'internal_error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

// Background processing function
async function processTextInBackground(
  jobId: string,
  bookId: string,
  chunks: string[],
  language: string,
  googleApiKey: string
) {
  try {
    console.log(`Starting background processing for job ${jobId}`)
    
    // Create system prompt based on language
    const isArabic = language === 'Arabic' || language === 'ara'
    const systemPrompt = isArabic 
      ? `أنت مساعد ذكي متخصص في تنظيف وتنسيق النصوص المستخرجة من ملفات PDF. مهمتك هي:

1. إزالة الأخطاء في استخراج النص وإصلاح الكلمات المقطوعة
2. تصحيح تنسيق الفقرات وعلامات الترقيم
3. إزالة النصوص غير المفيدة مثل أرقام الصفحات وترقيم الفصول
4. ضمان تدفق النص بشكل طبيعي ومفهوم
5. الحفاظ على المعنى الأصلي والمحتوى المهم
6. إزالة التكرارات غير الضرورية

أعد النص منظماً ونظيفاً وجاهزاً للاستخدام في التلخيص وتحويل النص إلى صوت وإنشاء الامتحانات.`
      : `You are an AI assistant specialized in cleaning and formatting text extracted from PDF files. Your task is to:

1. Remove OCR errors and fix broken words
2. Correct paragraph formatting and punctuation
3. Remove irrelevant text like page numbers and chapter numbering
4. Ensure natural text flow and readability
5. Preserve original meaning and important content
6. Remove unnecessary repetitions

Return clean, well-formatted text that is ready for summarization, text-to-speech, and exam generation.`

    let processedText = ''
    let processedChunks = 0
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      console.log(`Processing chunk ${i + 1}/${chunks.length} for job ${jobId}`)
      
      try {
        // Add delay between requests to respect rate limits
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1500)) // 1.5 second delay
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${systemPrompt}\n\nPlease clean and format this extracted text:\n\n${chunk}`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 3500,
            }
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`API error for chunk ${i + 1}:`, errorText)
          
          // Check for quota exhaustion
          if (response.status === 429) {
            throw new Error(`Quota exhausted. Please try again later. API Response: ${errorText}`)
          }
          
          throw new Error(`Google Gemini API error (${response.status}): ${errorText}`)
        }

        const data = await response.json()
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
          console.warn(`No content returned for chunk ${i + 1}, skipping...`)
          continue
        }

        const cleanedChunk = data.candidates[0].content.parts[0].text
        processedText += cleanedChunk + '\n\n'
        processedChunks++

        // Update progress every 5 chunks or on last chunk
        if (processedChunks % 5 === 0 || processedChunks === chunks.length) {
          const progress = Math.round((processedChunks / chunks.length) * 100)
          await supabase
            .from('text_processing_jobs')
            .update({
              processed_chunks: processedChunks,
              progress: progress
            })
            .eq('id', jobId)
          
          console.log(`Updated progress: ${processedChunks}/${chunks.length} (${progress}%) for job ${jobId}`)
        }

      } catch (chunkError) {
        console.error(`Error processing chunk ${i + 1}:`, chunkError)
        // Continue with other chunks but log the error
        await supabase
          .from('text_processing_jobs')
          .update({
            error_message: `Error at chunk ${i + 1}: ${chunkError.message}`
          })
          .eq('id', jobId)
      }
    }

    // Final processing complete
    console.log(`Completed processing for job ${jobId}`)
    console.log('Original text length:', chunks.join('').length)
    console.log('Processed text length:', processedText.length)

    // Update job status and save processed text
    await supabase
      .from('text_processing_jobs')
      .update({
        status: 'completed',
        progress: 100,
        processed_chunks: processedChunks,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)

    // Update the book_text_extractions table with processed text
    await supabase
      .from('book_text_extractions')
      .upsert({
        book_id: bookId,
        extracted_text: processedText.trim(),
        ocr_status: 'completed',
        extraction_method: 'ai-processed'
      })

    console.log(`Successfully completed text processing for job ${jobId}`)

  } catch (error) {
    console.error(`Background processing failed for job ${jobId}:`, error)
    
    // Update job with error status
    await supabase
      .from('text_processing_jobs')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('id', jobId)
  }
}