// providers/AuthProvider.js
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { supabase } from "./supabaseClient"; // Переконайтеся, що шлях до supabaseClient коректний

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true); // Завантаження починається з true
  const [userRole, setUserRole] = useState(null);

  // Функція для визначення ролі користувача
  const fetchUserRole = useCallback(async (userSession) => {
    if (!userSession || !userSession.user) {
      console.log("fetchUserRole: No session or user. Clearing role.");
      setUserRole(null);
      return;
    }

    console.log("fetchUserRole: Checking user role for User ID -", userSession.user.id);
    try {
      // Перевіряємо, чи є користувач лікарем
      const { data: doctorData, error: doctorError } = await supabase
        .from("profile_doctor") // Назва вашої таблиці для лікарів
        .select("id")
        .eq("user_id", userSession.user.id)
        .single();

      if (doctorError && doctorError.code !== "PGRST116") {
        // PGRST116 означає "не знайдено", це не помилка
        console.error("fetchUserRole: Error fetching doctor profile (not PGRST116):", doctorError.message);
        // У випадку непередбаченої помилки, встановлюємо роль пацієнта за замовчуванням
        setUserRole("patient");
      } else if (doctorData) {
        // Якщо запис лікаря знайдено
        console.log("fetchUserRole: Doctor profile FOUND. Setting role to 'doctor'.");
        setUserRole("doctor");
      } else {
        // Якщо запис лікаря не знайдено (PGRST116)
        console.log("fetchUserRole: Doctor profile NOT found. Setting role to 'patient'.");
        setUserRole("patient");
      }
    } catch (error) {
      console.error("fetchUserRole: Unexpected error during role fetch:", error.message);
      setUserRole("patient"); // У випадку непередбаченої помилки
    }
  }, []); // Пустий масив залежностей, функція стабільна

  useEffect(() => {
    let authSubscription = null; // Змінна для зберігання підписки

    const initializeAuth = async () => {
      console.log("AuthProvider: Initializing authentication...");
      try {
        // Отримуємо початкову сесію
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("AuthProvider: Error getting initial session:", sessionError.message);
          // Можливо, тут варто обробити помилку і, наприклад, відправити користувача на екран входу
        }

        // Встановлюємо початкову сесію
        setSession(initialSession);
        // Визначаємо роль на основі початкової сесії
        await fetchUserRole(initialSession);

        // Встановлюємо слухача змін стану автентифікації
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
          console.log(`AuthProvider: Auth state changed. Event: ${_event}, Session: ${currentSession ? 'present' : 'absent'}`);
          setSession(currentSession);
          await fetchUserRole(currentSession);
          // Після будь-якої зміни стану автентифікації, знімаємо індикатор завантаження,
          // оскільки роль вже визначена або скинута.
          setLoading(false);
        });
        authSubscription = subscription; // Зберігаємо підписку

      } catch (error) {
        console.error("AuthProvider: Error during auth initialization:", error.message);
        // Якщо щось пішло не так при ініціалізації, все одно знімаємо loading
      } finally {
        // Навіть якщо сталася помилка, setLoading має стати false,
        // щоб UI міг перейти до наступного стану (наприклад, екран входу)
        if (loading) { // Перевіряємо, чи ще loading, щоб уникнути зайвих оновлень
            setLoading(false);
        }
        console.log("AuthProvider: Authentication initialization finished. Loading set to false.");
      }
    };

    initializeAuth();

    // Функція очищення: відписуємося від слухача при демонтажі компонента
    return () => {
      console.log("AuthProvider: Cleaning up auth subscription.");
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [fetchUserRole, loading]); // Додав `loading` як залежність, щоб `finally` блок міг перевірити його стан

  const value = {
    session,
    loading,
    userRole,
    // Додайте тут функції для входу/виходу, якщо вони є
    // наприклад, async signIn(email, password) { ... }, async signOut() { ... }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthProvider;