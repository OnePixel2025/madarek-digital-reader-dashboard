import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const googleApiKey = Deno.env.get('GOOGLE_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    console.log('Generating exam for book:', bookId);

    // Get book details
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('title, author, description')
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      throw new Error('Book not found');
    }

    // Get extracted text from the book
    const { data: textExtraction, error: textError } = await supabase
      .from('book_text_extractions')
      .select('extracted_text')
      .eq('book_id', bookId)
      .single();

    if (textError || !textExtraction) {
      throw new Error('Book text not available. Please ensure the book has been processed.');
    }

    // Truncate text to reasonable length for exam generation
    const contentForExam = textExtraction.extracted_text.substring(0, 8000);

    console.log('Generating exam with Gemini AI...');

    const examPrompt = `Based on the following book content, create a comprehensive exam with 10 multiple choice questions and 5 essay questions.

Book Details:
- Title: ${book.title}
- Author: ${book.author || 'Unknown'}
- Description: ${book.description || 'No description available'}

Book Content (excerpt):
${contentForExam}

Please create an exam that tests:
1. Comprehension of main themes and concepts
2. Understanding of key details and facts
3. Analysis and critical thinking
4. Application of knowledge

Format your response as a JSON object with the following structure:
{
  "title": "Exam: [Book Title]",
  "instructions": "Answer all questions to the best of your ability...",
  "multipleChoice": [
    {
      "question": "Question text",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": "A"
    }
  ],
  "essayQuestions": [
    {
      "question": "Essay question text",
      "points": 10,
      "suggestedLength": "2-3 paragraphs"
    }
  ]
}

Make sure the questions are relevant to the actual content provided and test different levels of understanding.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: examPrompt }]
        }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 2000,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Google Gemini API request failed');
    }

    const data = await response.json();
    const examContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!examContent) {
      throw new Error('No exam content generated');
    }

    // Try to parse the JSON response
    let examData;
    try {
      // Clean the response in case it has markdown formatting
      const cleanContent = examContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      examData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse exam JSON:', parseError);
      // Fallback: return raw content
      examData = {
        title: `Exam: ${book.title}`,
        instructions: "The AI generated an exam but the format needs adjustment. Please review the content below.",
        rawContent: examContent,
        multipleChoice: [],
        essayQuestions: []
      };
    }

    console.log('Exam generated successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      exam: examData,
      bookTitle: book.title,
      bookAuthor: book.author 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating exam:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});