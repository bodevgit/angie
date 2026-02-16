import { createClient } from '@supabase/supabase-js';

// Access environment variables using Vite's import.meta.env
// Fallback to hardcoded values for GitHub Pages deployment if env vars are missing
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hspbnpmukqmldlzgsxit.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzcGJucG11a3FtbGRsemdzeGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNzc5NzUsImV4cCI6MjA4Njc1Mzk3NX0.q0SvBgbcR4ppgnObC3FperFUl73WSiYCKrab4pGvZXc';

// Throw an error if variables are missing to help debugging
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing.');
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
