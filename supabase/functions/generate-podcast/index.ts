import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookId, chunkText, chunkIndex, totalChunks, voice = 'alloy' } = await req.json();

    console.log(`Processing chunk ${chunkIndex + 1}/${totalChunks} for book ${bookId}`);

    // Generate speech from text using OpenAI
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: chunkText,
        voice: voice,
        response_format: 'mp3',
        speed: 1.0
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate speech');
    }

    // Get the audio buffer
    const audioBuffer = await response.arrayBuffer();
    
    // Upload audio chunk to Supabase Storage
    const fileName = `${bookId}/chunk_${chunkIndex.toString().padStart(4, '0')}.mp3`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('podcasts')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload audio chunk: ${uploadError.message}`);
    }

    console.log(`Successfully uploaded chunk ${chunkIndex + 1}/${totalChunks}`);

    // If this is the last chunk, update the podcast status
    if (chunkIndex === totalChunks - 1) {
      const { error: updateError } = await supabase
        .from('podcasts')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('book_id', bookId);

      if (updateError) {
        console.error('Error updating podcast status:', updateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        chunkIndex,
        fileName,
        isComplete: chunkIndex === totalChunks - 1
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-podcast function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});