import React, { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "./supabaseClient"; // !!! ПЕРЕВІРТЕ ЦЕЙ ШЛЯХ !!!

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Отримуємо поточну сесію при старті додатка
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Підписуємося на зміни стану автентифікації (вхід/вихід)
    const {
      data: { subscription }, // Перейменовано authListener на subscription для ясності
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Важливо: встановлюємо loading в false після першого отримання стану
      // або якщо loading ще true. Це дозволяє уникнути багаторазового скидання.
      if (loading) {
        setLoading(false);
      }
    });

    // 3. Відписка від слухача при розмонтуванні компонента
    return () => subscription.unsubscribe();
  }, []); // Пустий масив залежностей означає, що ефект запускається один раз при монтуванні

  // Функції для взаємодії з Supabase Auth
  const signIn = async (email, password) => {
    setLoading(true); // Починаємо завантаження
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false); // Завершуємо завантаження
    if (error) throw error; // Викидаємо помилку для обробки у компоненті, що викликає
    setSession(data.session); // Оновлюємо сесію після успішного входу
    return data;
  };

  const signOut = async () => {
    setLoading(true); // Починаємо завантаження
    const { error } = await supabase.auth.signOut();
    setLoading(false); // Завершуємо завантаження
    if (error) throw error; // Викидаємо помилку
    setSession(null); // Очищаємо сесію після виходу
  };

  // Значення, які надаємо через контекст
  const value = {
    session,
    loading,
    signIn, // Додаємо функцію signIn до контексту
    signOut, // Додаємо функцію signOut до контексту
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};