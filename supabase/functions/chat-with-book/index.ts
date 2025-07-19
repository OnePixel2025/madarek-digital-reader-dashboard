import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const googleApiKey = Deno.env.get('GOOGLE_API_KEY');

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
    const { message, bookContext, conversationHistory = [] } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    // Build conversation context
    const systemMessage = bookContext 
      ? `You are an AI reading assistant helping users understand and discuss books. 

Current book context:
- Title: ${bookContext.title}
- Author: ${bookContext.author || 'Unknown'}
- Content excerpt: ${bookContext.excerpt || 'No content provided'}

Please help the user with questions, discussions, and insights about this book. Be knowledgeable, helpful, and engaging in your responses.`
      : `You are an AI reading assistant. Help users with their reading-related questions and discussions. Since no specific book is currently selected, provide general reading assistance and encourage them to select a book for more specific help.`;

    // Build messages array with conversation history
    const messages = [
      { role: 'system', content: systemMessage },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Format messages for Gemini API
    const contents = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

    // Add system instruction to the first user message if it exists
    if (contents.length > 0 && messages[0].role === 'system') {
      contents[0].parts[0].text = `${systemMessage}\n\n${contents[0].parts[0].text}`;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Google Gemini API request failed');
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat-with-book function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});