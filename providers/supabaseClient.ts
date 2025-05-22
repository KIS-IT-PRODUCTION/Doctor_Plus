// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// ЗАМІНІТЬ ЦІ ЗНАЧЕННЯ НА ВАШІ ВЛАСНІ ЗНАЧЕННЯ SUPABASE!
// Ви можете знайти їх у вашому проекті Supabase: Settings -> API
const SUPABASE_URL = 'https://yslchkbmupuyxgidnzrb.supabase.co'; // Наприклад: 'https://abcdefghijk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzbGNoa2JtdXB1eXhnaWRuenJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MDM4MDAsImV4cCI6MjA2MzQ3OTgwMH0.fQnzfcEo3tgm6prq9tdwZyQ_fXGrNvJ_abnjs0woR1Y'; // Наприклад: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

