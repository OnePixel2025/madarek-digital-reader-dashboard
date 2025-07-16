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
    const { bookId } = await req.json();
    
    if (!bookId) {
      throw new Error('Book ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch book details including language
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('title, author, description, language')
      .eq('id', bookId)
      .single();

    if (bookError) {
      console.error('Error fetching book:', bookError);
      throw new Error('Failed to fetch book details');
    }

    if (!book) {
      throw new Error('Book not found');
    }

    // Get the book language, default to Arabic if not specified
    const bookLanguage = book.language || 'Arabic';
    
    // Prepare language-specific prompt
    const languageInstruction = bookLanguage === 'Arabic' 
      ? 'Please write the summary in Arabic language.' 
      : `Please write the summary in ${bookLanguage} language.`;

    // Prepare prompt for OpenAI
    const prompt = `${languageInstruction}

Please generate a comprehensive summary of the book "${book.title}"${book.author ? ` by ${book.author}` : ''}. ${book.description ? `Here's the book description: ${book.description}` : ''}

Please provide:
1. A brief overview of the main themes and topics
2. Key points and insights from the book
3. Main takeaways for readers

Keep the summary informative but concise (around 300-500 words).`;

    // Call OpenAI API
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Generating summary for book:', book.title, 'in language:', bookLanguage);

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that creates insightful book summaries. Focus on the key themes, main ideas, and practical takeaways that would be valuable for readers. Always respond in the language requested by the user.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.text();
      console.error('OpenAI API error:', errorData);
      throw new Error('Failed to generate summary');
    }

    const openAIData = await openAIResponse.json();
    const summary = openAIData.choices[0].message.content;

    console.log('Summary generated successfully');

    return new Response(
      JSON.stringify({ 
        summary,
        bookTitle: book.title,
        bookAuthor: book.author 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in generate-book-summary function:', error);
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