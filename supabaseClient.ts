// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// ЗАМІНІТЬ ЦІ ЗНАЧЕННЯ НА ВАШІ ВЛАСНІ ЗНАЧЕННЯ SUPABASE!
// Ви можете знайти їх у вашому проекті Supabase: Settings -> API
const SUPABASE_URL = 'https://cznwzsrpgookgxhfgysd.supabase.co'; // Наприклад: 'https://abcdefghijk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6bnd6c3JwZ29va2d4aGZneXNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MDI1MjIsImV4cCI6MjA2MzA3ODUyMn0.b-tQQWpOe4EeoUHa1dAO23iDy5QjdUihrYEGqVey5vY'; // Наприклад: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

