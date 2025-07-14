// Custom Supabase client with Clerk authentication
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ripsrvyzgvyvfisvcnwk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpcHNydnl6Z3Z5dmZpc3ZjbndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjA2OTAsImV4cCI6MjA2NjYzNjY5MH0.5IE0zDWl5Fn-njtXi4tDckL7Uw-vvKwoeZUDMoJfPDg";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  global: {
    headers: {
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    },
  },
});

// Function to create authenticated client with Clerk token
export const createAuthenticatedClient = (token: string) => {
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};