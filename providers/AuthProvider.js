// AuthProvider.js
import React, { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "./supabaseClient"; // <- Перевірте цей шлях!

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  // Ось тут, ймовірно, знаходиться помилка 'return' outside of function
  // Якщо код вище, можливо, не обгорнутий у функцію, це може призвести до цієї помилки.
  // Переконайтесь, що всередині 'AuthProvider' компонента, 'return' є частиною тіла функції.
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
