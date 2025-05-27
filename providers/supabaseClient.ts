// supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage'; // <--- ДОДАЙТЕ ЦЕЙ РЯДОК!

const SUPABASE_URL = 'https://yslchkbmupuyxgidnzrb.supabase.co'; // Наприклад: 'https://abcdefghijk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzbGNoa2JtdXB1eXhnaWRuenJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MDM4MDAsImV4cCI6MjA2MzQ3OTgwMH0.fQnzfcEo3tgm6prq9tdwZyQ_fXGrNvJ_abnjs0woR1Y'; // Наприклад: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage, // <--- ДОДАЙТЕ ЦЕЙ ОБ'ЄКТ З ЦИМ ПАРАМЕТРОМ!
    autoRefreshToken: true, // Рекомендовано для автоматичного оновлення токенів
    persistSession: true, // Рекомендовано для збереження сесії
    detectSessionInUrl: false, // Важливо для React Native, щоб не шукати сесію в URL
  },
});


