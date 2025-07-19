
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
    const { bookId, text, voice = 'Aria' } = await req.json();
    
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

    // Map voice names to ElevenLabs voice IDs
    const voiceMap: Record<string, string> = {
      'Aria': '9BWtsMINqrJLrRacOk9x',
      'Roger': 'CwhRBWXzGAHq8TQ4Fs17',
      'Sarah': 'EXAVITQu4vr4xnSDxMaL',
      'Laura': 'FGY2WhTYpPnrIDTdsKH5',
      'Charlie': 'IKne3meq5aSn9XLyUdCD',
      'George': 'JBFqnCBsd6RMkjVDRZzb',
      'Callum': 'N2lVS1w4EtoT3dr4eOWO',
      'River': 'SAz9YHcvj6GT2YYXdXww',
      'Liam': 'TX3LPaxmHKxFdv7VOQHJ',
      'Charlotte': 'XB0fDUnXU5powFXDhCwa',
      'Alice': 'Xb7hH8MSUJpSbSDYk0k2',
      'Matilda': 'XrExE9yKIg1WjnnlVkGX',
      'Will': 'bIHbv24MWmeRgasZH58o',
      'Jessica': 'cgSgspJ2msm6clMCkdW9',
      'Eric': 'cjVigY5qzO86Huf0OWal',
      'Chris': 'iP95p4xoKVk53GoZ742B',
      'Brian': 'nPczCjzI2devNBz1zQrb',
      'Daniel': 'onwK4e9ZLuTAKqWW03F9',
      'Lily': 'pFZP5JQG7iQjIQuC4Bku',
      'Bill': 'pqHfZKP75CvOlQylNhV4'
    };

    const voiceId = voiceMap[voice] || voiceMap['Aria']; // Default to Aria

    // Generate speech from text using ElevenLabs TTS
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to generate speech with ElevenLabs TTS: ${error}`);
    }

    // Get the response and convert to buffer
    const audioBuffer = await response.arrayBuffer();
    
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
