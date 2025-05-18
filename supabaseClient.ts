import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = 'https://cznwzsrpgookgxhfgysd.supabase.co'; // Замініть на URL вашого проєкту
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6bnd6c3JwZ29va2d4aGZneXNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MDI1MjIsImV4cCI6MjA2MzA3ODUyMn0.b-tQQWpOe4EeoUHa1dAO23iDy5QjdUihrYEGqVey5vY'; // Замініть на ваш анонімний ключ

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'ios' || Platform.OS === 'android' ? AsyncStorage : undefined,
  },
});