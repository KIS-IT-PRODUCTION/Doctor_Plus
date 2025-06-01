// providers/AuthProvider.js
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  // Функція для визначення ролі користувача
  const fetchUserRole = useCallback(async (userSession) => {
    if (!userSession || !userSession.user) {
      console.log("No session or user. Clearing role.");
      setUserRole(null);
      return;
    }

    console.log("Checking user role for User ID -", userSession.user.id);
    try {
      const { data: doctorData, error: doctorError } = await supabase
        .from("profile_doctor")
        .select("id")
        .eq("user_id", userSession.user.id)
        .single();

      if (doctorError && doctorError.code !== "PGRST116") {
        // PGRST116 означає "не знайдено"
        console.error("Error fetching doctor role:", doctorError.message);
        setUserRole("patient"); // Якщо є інша помилка, за замовчуванням пацієнт
      } else if (doctorData) {
        console.log("Doctor profile FOUND. Setting role to 'doctor'.");
        setUserRole("doctor");
      } else {
        console.log("Doctor profile NOT found. Setting role to 'patient'.");
        setUserRole("patient");
      }
    } catch (error) {
      console.error("Unexpected error fetching user role:", error.message);
      setUserRole("patient"); // У випадку непередбаченої помилки
    }
  }, []); // Пустий масив залежностей, оскільки функція не залежить від стейтів, що змінюються

  useEffect(() => {
    // 1. Встановлення слухача зміни стану автентифікації
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      // Викликаємо функцію визначення ролі
      await fetchUserRole(currentSession);
      setLoading(false);
    });

    // 2. Початкова перевірка сесії при завантаженні компонента
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      // Викликаємо функцію визначення ролі
      await fetchUserRole(session);
      setLoading(false);
    });

    // Функція очищення: відписуємося від слухача при демонтажі компонента
    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe(); // ВИПРАВЛЕНО: викликаємо unsubscribe на об'єкті subscription
      }
    };
  }, [fetchUserRole]); // Залежність від fetchUserRole, оскільки вона викликається всередині

  const value = {
    session,
    loading,
    userRole,
    // Додайте інші методи автентифікації, якщо вони потрібні
    // наприклад, signIn, signOut, signUp
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthProvider; // Рекомендується використовувати export default для основного компонента
