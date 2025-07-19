
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
    const { bookId, text, voice = 'en-US-Neural2-D' } = await req.json();
    
    if (!bookId) {
      throw new Error('Book ID is required');
    }

    if (!text) {
      throw new Error('Text is required');
    }

    console.log(`Generating TTS for book ${bookId} with ${text.length} characters`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate speech from text using Google Cloud Text-to-Speech
    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${Deno.env.get('GOOGLE_API_KEY')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { text: text },
        voice: {
          languageCode: 'en-US',
          name: voice,
          ssmlGender: 'NEUTRAL',
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0.0,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate speech with Google TTS');
    }

    // Get the response and extract base64 audio content
    const data = await response.json();
    const audioContent = data.audioContent; // This is already base64 encoded
    const audioBuffer = Uint8Array.from(atob(audioContent), c => c.charCodeAt(0)).buffer;
    
    // Upload audio to Supabase Storage
    const fileName = `tts/${bookId}_${Date.now()}.mp3`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('podcasts')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload audio: ${uploadError.message}`);
    }

    // Get public URL for the uploaded audio
    const { data: urlData } = await supabase.storage
      .from('podcasts')
      .getPublicUrl(fileName);

    console.log('Successfully generated TTS audio:', urlData.publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true,
        audioUrl: urlData.publicUrl,
        fileName: fileName,
        textLength: text.length
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
