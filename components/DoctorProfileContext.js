import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../providers/supabaseClient'; // Переконайтеся, що шлях правильний
import NetInfo from "@react-native-community/netinfo";
import { useTranslation } from "react-i18next";
import { useAuth } from "../providers/AuthProvider"; // Припускаємо, що у вас є AuthProvider

const DoctorProfileContext = createContext(null);

export const DoctorProfileProvider = ({ children }) => {
  const { t } = useTranslation();
  const { session } = useAuth(); // Отримуємо сесію для currentLoggedInDoctorId
  const [doctorData, setDoctorData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const hasLoadedInitially = useRef({}); // Кеш для відстеження, чи завантажувались дані для конкретного ID

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const fetchDoctorProfile = useCallback(async (userId, forceRefresh = false) => {
    if (!userId) {
      console.warn("DoctorProfileProvider: No user ID provided for fetching profile.");
      setIsLoading(false);
      setError(t("doctor_id_missing"));
      return;
    }

    // Якщо дані вже завантажені і не потрібне примусове оновлення
    if (!forceRefresh && doctorData && doctorData.user_id === userId && hasLoadedInitially.current[userId]) {
      console.log(`DoctorProfileProvider: Data for doctor ${userId} already cached. Skipping fetch.`);
      setIsLoading(false);
      setError(null);
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
        console.error("DoctorProfileProvider: Error fetching doctor data:", fetchError);
        if (fetchError.code === "PGRST116") {
          setDoctorData({ // Ініціалізуємо порожнім об'єктом, щоб уникнути "loading stuck"
            full_name: null, avatar_url: null, communication_languages: [], specialization: [],
            experience_years: null, work_location: null, consultation_cost: null, about_me: null,
            achievements: null, certificate_photo_url: null, diploma_url: null,
            profile_doctor: { doctor_points: null }, user_id: userId
          });
          setError(t("profile_not_found"));
        } else {
          setError(`${t("error_fetching_doctor_data")}: ${fetchError.message}`);
          setDoctorData(null);
        }
        hasLoadedInitially.current[userId] = false;
      } else {
        setDoctorData(data);
        setError(null);
        hasLoadedInitially.current[userId] = true;
        console.log("DoctorProfileProvider: Profile data fetched successfully.");
      }
    } catch (err) {
      console.error("DoctorProfileProvider: Unexpected error during data fetch:", err);
      setError(`${t("unexpected_error")}: ${err.message || String(err)}`);
      setDoctorData(null);
      hasLoadedInitially.current[userId] = false;
    } finally {
      setIsLoading(false);
    }
  }, [t, doctorData]); // Додаємо doctorData в залежності, якщо використовуєте його всередині для логіки

  // Завантажуємо профіль при зміні сесії або налаштувань мови
  useEffect(() => {
    const userId = session?.user?.id;
    if (userId) {
      fetchDoctorProfile(userId, false); // Намагаємося завантажити, якщо ще не завантажено
    } else {
      setDoctorData(null);
      setIsLoading(false);
      setError(null); // Скинути помилки, якщо користувач вийшов
      console.log("DoctorProfileProvider: No user session, clearing profile data.");
    }
  }, [session, fetchDoctorProfile]);

  const value = {
    doctorData,
    isLoading,
    error,
    isConnected,
    fetchDoctorProfile, // Функція для примусового оновлення
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