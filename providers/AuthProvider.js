// providers/AuthProvider.js
import React, { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session) {
          console.log("Auth State Changed: User ID -", session.user.id); // <--- ДОДАТИ ЦЕЙ ЛОГ
          const { data: doctorData, error: doctorError } = await supabase
            .from("profile_doctor")
            .select("id")
            .eq("user_id", session.user.id)
            .single();

          if (doctorError && doctorError.code !== "PGRST116") {
            console.error("Error fetching doctor role:", doctorError.message);
            setUserRole("patient");
          } else if (doctorData) {
            console.log("Doctor profile FOUND. Setting role to 'doctor'."); // <--- ДОДАТИ ЦЕЙ ЛОГ
            setUserRole("doctor");
          } else {
            console.log("Doctor profile NOT found. Setting role to 'patient'."); // <--- ДОДАТИ ЦЕЙ ЛОГ
            setUserRole("patient");
          }
        } else {
          console.log("Auth State Changed: No session. Clearing role."); // <--- ДОДАТИ ЦЕЙ ЛОГ
          setUserRole(null);
        }
        setLoading(false);
      }
    );

    // Initial check for session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        console.log("Initial Session: User ID -", session.user.id); // <--- ДОДАТИ ЦЕЙ ЛОГ
        supabase
          .from("profile_doctor")
          .select("id")
          .eq("user_id", session.user.id)
          .single()
          .then(({ data: doctorData, error: doctorError }) => {
            if (doctorError && doctorError.code !== "PGRST116") {
              console.error(
                "Error fetching doctor role on initial load:",
                doctorError.message
              );
              setUserRole("patient");
            } else if (doctorData) {
              console.log(
                "Initial load: Doctor profile FOUND. Setting role to 'doctor'."
              ); // <--- ДОДАТИ ЦЕЙ ЛОГ
              setUserRole("doctor");
            } else {
              console.log(
                "Initial load: Doctor profile NOT found. Setting role to 'patient'."
              ); // <--- ДОДАТИ ЦЕЙ ЛОГ
              setUserRole("patient");
            }
            setLoading(false);
          });
      } else {
        console.log("Initial load: No session. Clearing role."); // <--- ДОДАТИ ЦЕЙ ЛОГ
        setLoading(false);
      }
    });

    return () => authListener.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, userRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
export default AuthProvider;
