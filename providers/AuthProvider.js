// AuthProvider.js - НЕ МІНЯЙТЕ ЦЕЙ КОД, ВІН ПРАВИЛЬНИЙ. Просто ще раз перевірте:
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
  const [authError, setAuthError] = useState(null);

  const fetchUserRole = useCallback(async (userSession) => {
    console.log("AuthProvider: fetchUserRole called. Session present:", !!userSession);

    if (!userSession || !userSession.user) {
      console.log("AuthProvider: fetchUserRole - No user session. Setting role to null.");
      setUserRole(null);
      return;
    }

    console.log(`AuthProvider: fetchUserRole - Checking user role for User ID: ${userSession.user.id}, Email: ${userSession.user.email}`);
    try {
      const { data: doctorData, error: doctorError } = await supabase
        .from("profile_doctor")
        .select("id")
        .eq("user_id", userSession.user.id)
        .single();

      if (doctorError && doctorError.code === "PGRST116") {
        console.log("AuthProvider: fetchUserRole - Doctor profile NOT found (PGRST116). Setting role to 'patient'.");
        setUserRole("patient");
      } else if (doctorError) {
        console.error("AuthProvider: fetchUserRole - Error fetching doctor profile:", doctorError.message);
        setAuthError(doctorError);
        setUserRole(null);
      } else if (doctorData) {
        console.log("AuthProvider: fetchUserRole - Doctor profile FOUND. Setting role to 'doctor'.");
        setUserRole("doctor");
      } else {
        console.log("AuthProvider: fetchUserRole - Doctor profile data is null but no specific error. Setting role to 'patient'.");
        setUserRole("patient");
      }
    } catch (error) {
      console.error("AuthProvider: fetchUserRole - Unexpected error during role fetch:", error.message);
      setAuthError(error);
      setUserRole(null);
    }
  }, []);

  useEffect(() => {
    let authSubscription = null;

    const initializeAuth = async () => {
      console.log("AuthProvider: Initializing authentication process...");
      setLoading(true);
      setAuthError(null);

      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        console.log("AuthProvider: Initial session check completed. Session found:", initialSession ? "yes" : "no", "Error:", sessionError ? sessionError.message : "none");

        if (sessionError) {
          console.error("AuthProvider: Error getting initial session:", sessionError.message);
          setAuthError(sessionError);
        }

        setSession(initialSession);
        // Запускаємо визначення ролі для початкової сесії
        await fetchUserRole(initialSession);

        // Підписуємося на зміни стану авторизації
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
          console.log(`\n--- AuthProvider: Auth state changed! Event: ${_event} ---`);
          console.log("AuthProvider: New Session details:", currentSession ? {
            user_id: currentSession.user?.id,
            email: currentSession.user?.email,
            expires_at: currentSession.expires_at,
          } : "null");

          setSession(currentSession);
          await fetchUserRole(currentSession); // <-- Це найважливіше для оновлення ролі!
          setAuthError(null);
          console.log("--- AuthProvider: Auth state change processed. ---\n");
        });
        authSubscription = subscription;

      } catch (error) {
        console.error("AuthProvider: Critical error during auth initialization:", error.message);
        setAuthError(error);
      } finally {
        setLoading(false);
        console.log("AuthProvider: Authentication initialization finished. Loading set to false.");
      }
    };

    initializeAuth();

    return () => {
      console.log("AuthProvider: Cleaning up auth subscription on unmount.");
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [fetchUserRole]); // Залежність від fetchUserRole

  const signIn = useCallback(async (email, password) => {
    console.log("AuthProvider: Attempting to sign in user:", email);
    setLoading(true);
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthError(error);
        console.error("AuthProvider: signIn error:", error.message);
        return { success: false, error };
      }
      console.log("AuthProvider: signIn successful. Data:", data ? "present" : "absent");
      // Роль буде визначена через onAuthStateChange
      return { success: true, data };
    } catch (error) {
      setAuthError(error);
      console.error("AuthProvider: signIn unexpected error:", error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email, password, isDoctor) => {
    console.log("AuthProvider: Attempting to sign up user:", email, "Is Doctor:", isDoctor);
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
        console.error("AuthProvider: No user object after sign up.");
        setAuthError(noUserError);
        return { success: false, error: noUserError };
      }

      console.log("AuthProvider: User signed up successfully. User ID:", user.id);

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
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    console.log("AuthProvider: Attempting to sign out user.");
    setLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setAuthError(error);
        console.error("AuthProvider: signOut error:", error.message);
        return { success: false, error };
      }
      console.log("AuthProvider: signOut successful.");
      setSession(null); // Явно обнуляємо сесію
      setUserRole(null); // Явно обнуляємо роль
      return { success: true };
    } catch (error) {
      setAuthError(error);
      console.error("AuthProvider: signOut unexpected error:", error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    session,
    loading, // Передаємо 'loading'
    userRole,
    authError,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;