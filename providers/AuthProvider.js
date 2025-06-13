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
  const [authError, setAuthError] = useState(null); // Додаємо стан для помилок автентифікації

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
        setUserRole("patient"); // У випадку непередбаченої помилки
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
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("AuthProvider: Error getting initial session:", sessionError.message);
          setAuthError(sessionError);
        }

        setSession(initialSession);
        await fetchUserRole(initialSession);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
          console.log(`AuthProvider: Auth state changed. Event: ${_event}, Session: ${currentSession ? 'present' : 'absent'}`);
          setSession(currentSession);
          await fetchUserRole(currentSession);
          setAuthError(null); // Очищаємо помилку при зміні стану
        });
        authSubscription = subscription;

      } catch (error) {
        console.error("AuthProvider: Error during auth initialization:", error.message);
        setAuthError(error);
      } finally {
        // <<<<<<<< ЗМІНЕНО: setLoading(false) викликається тут безумовно,
        //           щоб гарантувати, що початковий екран завантаження зникне.
        setLoading(false);
        console.log("AuthProvider: Authentication initialization finished. Loading set to false.");
      }
    };

    initializeAuth();

    return () => {
      console.log("AuthProvider: Cleaning up auth subscription.");
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [fetchUserRole]); // Залишаємо fetchUserRole у залежностях

  // Функція для входу
  const signIn = useCallback(async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthError(error);
        return { success: false, error };
      }
      return { success: true, data };
    } catch (error) {
      setAuthError(error);
      return { success: false, error };
    } finally {
      // setLoading(false) тут не потрібен, бо onAuthStateChange викличе fetchUserRole
      // і тоді (якщо вищенаведений код AuthProvider у initializeAuth) setLoading(false) буде викликано.
      // Якщо onAuthStateChange не спрацьовує (наприклад, через помилку),
      // то Loading буде false завдяки `finally` в InitializeAuth.
      // Якщо ви не переробили InitializeAuth, як я запропонував вище,
      // то `setLoading(false)` тут мав би сенс.
      // Давайте зробимо його тут для безпеки, якщо `onAuthStateChange` не спрацює
      // або спрацює пізніше, ніж потрібно.
      setLoading(false); // Залишаємо для гарантії
    }
  }, []);

  // Функція для реєстрації
  const signUp = useCallback(async (email, password, isDoctor) => {
    setLoading(true);
    setAuthError(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

      if (authError) {
        console.error("AuthProvider signUp error:", authError.message);
        setAuthError(authError);
        return { success: false, error: authError };
      }

      const user = authData.user;
      if (!user) {
        const noUserError = new Error("User not created after sign up.");
        setAuthError(noUserError);
        return { success: false, error: noUserError };
      }

      if (isDoctor) {
        console.log("AuthProvider: Creating doctor profile for user:", user.id);
        const { error: doctorProfileError } = await supabase
          .from('profile_doctor')
          .insert([
            { user_id: user.id }
          ]);

        if (doctorProfileError) {
          console.error("AuthProvider: Error creating doctor profile:", doctorProfileError.message);
          setAuthError(doctorProfileError);
          throw doctorProfileError;
        }
        console.log("AuthProvider: Doctor profile created successfully.");
      }
      return { success: true, data: authData };
    } catch (error) {
      console.error("AuthProvider: Full sign-up process error:", error.message);
      setAuthError(error);
      return { success: false, error };
    } finally {
      setLoading(false); // Залишаємо для гарантії
    }
  }, []);

  // Функція для виходу
  const signOut = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setAuthError(error);
        return { success: false, error };
      }
      // <<<<<<<< ЗМІНЕНО: При виході сесія стає null, тому role теж очищається
      setSession(null);
      setUserRole(null);
      return { success: true };
    } catch (error) {
      setAuthError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    session,
    loading,
    userRole,
    authError,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthProvider;