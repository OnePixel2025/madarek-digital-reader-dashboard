import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    
    // For demo purposes, we'll use a placeholder text extraction
    // In a real implementation, you'd use pdf-parse or similar library
    const extractedText = `This is the beginning of "${book.title}"${book.author ? ` by ${book.author}` : ''}. The full text extraction from PDF would be implemented here using a proper PDF parsing library. This is a demonstration of the text-to-speech functionality.`;

    // Limit text length for TTS (OpenAI has limits)
    const maxLength = 4000; // Adjust based on your needs
    const textToConvert = extractedText.length > maxLength 
      ? extractedText.substring(0, maxLength) + "..."
      : extractedText;

    // Call OpenAI TTS API
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Converting text to speech...');

    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: textToConvert,
        voice: 'alloy', // You can make this configurable
        response_format: 'mp3',
      }),
    });

    if (!ttsResponse.ok) {
      const errorData = await ttsResponse.text();
      console.error('OpenAI TTS API error:', errorData);
      throw new Error('Failed to generate speech');
    }

    // Convert audio to base64
    const audioArrayBuffer = await ttsResponse.arrayBuffer();
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(audioArrayBuffer))
    );

    console.log('TTS audio generated successfully');

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        bookTitle: book.title,
        bookAuthor: book.author,
        textConverted: textToConvert
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