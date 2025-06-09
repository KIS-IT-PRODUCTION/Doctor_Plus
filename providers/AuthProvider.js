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
          setAuthError(sessionError); // Зберігаємо помилку автентифікації
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
          setAuthError(null); // Очищаємо помилку при зміні стану
          // Після будь-якої зміни стану автентифікації, знімаємо індикатор завантаження,
          // оскільки роль вже визначена або скинута.
          setLoading(false);
        });
        authSubscription = subscription; // Зберігаємо підписку

      } catch (error) {
        console.error("AuthProvider: Error during auth initialization:", error.message);
        setAuthError(error); // Зберігаємо помилку автентифікації
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
  }, [fetchUserRole]); // Видалив `loading` з залежностей `useEffect`, оскільки це може спричинити нескінченний цикл, якщо `loading` змінюється всередині `finally` блоку. `fetchUserRole` і так залежить від `userSession`.


  // Функція для входу
  const signIn = useCallback(async (email, password) => {
    setLoading(true); // Встановлюємо loading в true на початку
    setAuthError(null); // Очищаємо попередні помилки
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthError(error);
        return { success: false, error };
      }
      // fetchUserRole буде викликаний через onAuthStateChange
      return { success: true, data };
    } catch (error) {
      setAuthError(error);
      return { success: false, error };
    } finally {
      // !!! ВАЖЛИВО: setLoading(false) має бути тут,
      // щоб скинути індикатор завантаження, навіть якщо вхід не вдався
      // і onAuthStateChange не спрацював.
      setLoading(false);
    }
  }, []);

  // Функція для реєстрації
  const signUp = useCallback(async (email, password, isDoctor) => {
    setLoading(true);
    setAuthError(null); // Очищаємо попередні помилки
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

      // Якщо користувач є лікарем, створюємо запис у таблиці profile_doctor
      if (isDoctor) {
        console.log("AuthProvider: Creating doctor profile for user:", user.id);
        const { error: doctorProfileError } = await supabase
          .from('profile_doctor') // Назва вашої таблиці для лікарів
          .insert([
            { user_id: user.id } // Вставляємо user_id
          ]);

        if (doctorProfileError) {
          console.error("AuthProvider: Error creating doctor profile:", doctorProfileError.message);
          setAuthError(doctorProfileError);
          // Важливо: якщо створення профілю лікаря не вдалося,
          // можливо, варто скасувати реєстрацію або позначити користувача як пацієнта
          // Або можна просто кинути помилку і дати UI вирішити
          throw doctorProfileError; // Кидаємо помилку, щоб вона була спіймана у зовнішньому catch
        }
        console.log("AuthProvider: Doctor profile created successfully.");
      }

      // onAuthStateChange буде викликаний після signUp, тому session та userRole оновляться там.
      // Не потрібно вручну setSession, setUserRole тут.
      return { success: true, data: authData };

    } catch (error) {
      console.error("AuthProvider: Full sign-up process error:", error.message);
      setAuthError(error);
      return { success: false, error };
    } finally {
      // !!! ВАЖЛИВО: setLoading(false) має бути тут,
      // щоб скинути індикатор завантаження, навіть якщо реєстрація не вдався
      // і onAuthStateChange не спрацював.
      setLoading(false);
    }
  }, []); // Пусті залежності, оскільки supabase стабільний

  // Функція для виходу
  const signOut = useCallback(async () => {
    setLoading(true);
    setAuthError(null); // Очищаємо попередні помилки
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setAuthError(error);
        return { success: false, error };
      }
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
    authError, // Додаємо authError до контексту
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
