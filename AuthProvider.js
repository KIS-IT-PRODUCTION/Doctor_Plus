// AuthProvider.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabaseClient"; // Переконайтеся, що шлях правильний
import { useAuth as useClerkAuth } from "@clerk/clerk-expo"; // Для отримання сесії Clerk

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const {
    session: clerkSession,
    isSignedIn,
    isLoaded,
    getToken,
  } = useClerkAuth();
  const [session, setSession] = useState(null); // Сесія Supabase
  const [loading, setLoading] = useState(true); // Стан завантаження сесії Supabase

  useEffect(() => {
    const syncClerkAndSupabase = async () => {
      if (!isLoaded) return; // Чекаємо, поки Clerk завантажиться

      try {
        if (isSignedIn && clerkSession) {
          // Отримати JWT від Clerk з шаблоном "supabase"
          const clerkToken = await getToken({ template: "supabase" }); // Використовуємо ваш налаштований шаблон Clerk JWT
          if (clerkToken) {
            // Встановити сесію Supabase
            const {
              data: { session: supabaseSession },
              error: supabaseError,
            } = await supabase.auth.setSession({ access_token: clerkToken });

            if (supabaseError) {
              console.error(
                "Supabase setSession error:",
                supabaseError.message
              );
              setSession(null);
            } else {
              setSession(supabaseSession);
              console.log("Supabase session updated with Clerk token.");
            }
          } else {
            console.warn("Clerk token not available for Supabase sync.");
            setSession(null);
          }
        } else {
          // Користувач не увійшов у Clerk, тому очистіть сесію Supabase
          if (session) {
            // Якщо сесія Supabase є, але Clerk її немає
            await supabase.auth.signOut();
            console.log("Supabase session signed out due to Clerk signOut.");
          }
          setSession(null);
        }
      } catch (error) {
        console.error(
          "Error syncing Clerk and Supabase session in AuthProvider:",
          error
        );
        setSession(null);
      } finally {
        setLoading(false); // Після спроби синхронізації встановлюємо loading в false
      }
    };

    syncClerkAndSupabase();
  }, [isLoaded, isSignedIn, clerkSession, getToken]);

  return (
    <AuthContext.Provider value={{ session, loading }}>
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
