import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../providers/supabaseClient';
import NetInfo from "@react-native-community/netinfo";
import { useTranslation } from "react-i18next";
import { useAuth } from "../providers/AuthProvider";

const DoctorProfileContext = createContext(null);

export const DoctorProfileProvider = ({ children }) => {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [doctorData, setDoctorData] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Починаємо з true, оскільки ми будемо завантажувати при старті
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(true);

  // Використовуємо useRef для відстеження, чи був здійснений запит для конкретного userId
  // Це запобігає повторним запитам, якщо дані вже завантажені або відомо, що профілю немає.
  const fetchedUserIds = useRef(new Set());

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const fetchDoctorProfile = useCallback(async (userId, forceRefresh = false) => {
    if (!userId) {
      console.warn("DoctorProfileProvider: No user ID provided for fetching profile. Resetting state.");
      setDoctorData(null);
      setIsLoading(false);
      setError(null);
      // Важливо: не додаємо null userId до fetchedUserIds
      return;
    }

    // Якщо це не примусове оновлення і ми вже завантажували дані для цього користувача,
    // і немає активної помилки, яка б вимагала повторної спроби,
    // тоді просто повертаємося.
    if (!forceRefresh && fetchedUserIds.current.has(userId)) {
      console.log(`DoctorProfileProvider: Data for doctor ${userId} already fetched. Skipping fetch.`);
      setIsLoading(false); // Переконаємось, що індикатор завантаження вимкнений
      setError(null); // Переконаємось, що помилка очищена, якщо дані вже є.
      return;
    }

    setIsLoading(true);
    setError(null);

    console.log(`DoctorProfileProvider: Fetching profile for ${userId} (forceRefresh: ${forceRefresh})...`);

    try {
      const { data, error: fetchError } = await supabase
        .from("anketa_doctor")
        .select(
          "*, diploma_url, certificate_photo_url, consultation_cost, experience_years, profile_doctor(doctor_points)"
        )
        .eq("user_id", userId)
        .single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          console.log(`DoctorProfileProvider: Profile not found for user ${userId}.`);
          setDoctorData(null);
          setError(t("profile_not_found"));
        } else {
          console.error("DoctorProfileProvider: Error fetching doctor data:", fetchError);
          setDoctorData(null);
          setError(`${t("error_fetching_doctor_data")}: ${fetchError.message}`);
        }
      } else {
        setDoctorData(data);
        setError(null);
        console.log("DoctorProfileProvider: Profile data fetched successfully.");
      }
      // Після будь-якої спроби (успішної чи ні), позначаємо, що ми намагалися завантажити дані для цього userId
      fetchedUserIds.current.add(userId);
    } catch (err) {
      console.error("DoctorProfileProvider: Unexpected error during data fetch:", err);
      setDoctorData(null);
      setError(`${t("unexpected_error")}: ${err.message || String(err)}`);
      // Якщо виникла несподівана помилка, можливо, варто очистити fetchedUserIds для цього користувача
      // щоб дозволити повторну спробу пізніше, якщо це не проблема з даними.
      fetchedUserIds.current.delete(userId);
    } finally {
      setIsLoading(false);
    }
  }, [t]); // Залежність тільки від `t`

  // Цей useEffect буде запускатися лише при зміні сесії або `fetchDoctorProfile`
  useEffect(() => {
    const userId = session?.user?.id;
    if (userId) {
      // При першому завантаженні або зміні користувача, завжди викликаємо fetchDoctorProfile
      // forceRefresh = true, щоб переконатися, що дані оновляться при зміні користувача
      // Або коли ми просто хочемо, щоб провайдер сам завантажив дані
      fetchDoctorProfile(userId, false); // Змінив на false, оскільки `fetchedUserIds` вже керує кешуванням
    } else {
      setDoctorData(null);
      setIsLoading(false);
      setError(null);
      fetchedUserIds.current.clear(); // Очищаємо кеш при виході користувача
      console.log("DoctorProfileProvider: No user session, clearing profile data.");
    }
  }, [session, fetchDoctorProfile]); // Залежності: session та useCallback-ований fetchDoctorProfile

  const value = {
    doctorData,
    isLoading,
    error,
    isConnected,
    fetchDoctorProfile,
  };

  return (
    <DoctorProfileContext.Provider value={value}>
      {children}
    </DoctorProfileContext.Provider>
  );
};

export const useDoctorProfile = () => {
  const context = useContext(DoctorProfileContext);
  if (context === undefined) {
    throw new Error('useDoctorProfile must be used within a DoctorProfileProvider');
  }
  return context;
};