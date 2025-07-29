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
    const { text, language = 'en' } = await req.json()
    
    if (!text) {
      throw new Error('Text is required')
    }

    const googleApiKey = Deno.env.get('GOOGLE_API_KEY')
    if (!googleApiKey) {
      throw new Error('Google API key not configured')
    }

    console.log('Processing extracted text for language:', language)
    console.log('Text length:', text.length)
    console.log('Original extracted text (first 500 chars):', text.substring(0, 500))

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

    // Split text into chunks for processing
    const chunkSize = 3000
    const chunks = []
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize))
    }

    console.log(`Processing ${chunks.length} text chunks`)

    let processedText = ''
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      console.log(`Processing chunk ${i + 1}/${chunks.length}`)
      
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
            maxOutputTokens: 4000,
          }
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Google Gemini API error: ${error}`)
      }

      const data = await response.json()
      const cleanedChunk = data.candidates[0].content.parts[0].text

      processedText += cleanedChunk + '\n\n'
    }

    console.log('Text processing completed')
    console.log('Original length:', text.length)
    console.log('Processed length:', processedText.length)
    console.log('Processed text (first 1000 chars):', processedText.substring(0, 1000))
    console.log('Processed text (last 500 chars):', processedText.substring(-500))

    return new Response(
      JSON.stringify({ 
        processedText: processedText.trim(),
        originalLength: text.length,
        processedLength: processedText.trim().length,
        chunksProcessed: chunks.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing text:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: 'text_processing_error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})