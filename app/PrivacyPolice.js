import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  Linking
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get("window");

const getResponsiveFontSize = (baseSize) => {
  const scale = width / 400;
  const newSize = baseSize * scale;
  return Math.round(newSize);
};

const getResponsiveHeight = (percent) => {
  return height * (percent / 100);
};

// --- DATA STRUCTURE FOR POLICY (UK & EN) ---
const POLICY_DATA = {
  uk: [
    { type: 'h1', text: 'ПОЛІТИКА КОНФІДЕНЦІЙНОСТІ' },
    { type: 'h2', text: 'Повідомлення про обробку персональних даних' },
    { type: 'p', text: 'Відповідно до пунктів 1 і 2 частини другої статті 8, частини другої статті 12 Закону України «Про захист персональних даних» Товариство з обмеженою відповідальністю ТОВ «Медичний центр “Довіра”» повідомляє про деталі обробки даних у системі Doctor Plus.' },
    
    { type: 'h3', text: '1. Інформація про Володільця' },
    { type: 'table', rows: [
      ['Назва організації', 'ТОВ «Медичний центр “Довіра”»'],
      ['Код ЄДРПОУ', '37195461'],
      ['Адреса', 'м. Київ, проспект Героїв Сталінграду 44'],
      ['Система обробки', 'Інформаційно-комунікаційна система, зокрема мобільний додаток Doctor Plus.'],
    ]},

    { type: 'h3', text: '2. Джерела та склад персональних даних' },
    { type: 'table', headers: ['Категорія даних', 'Детальний опис'], rows: [
      ['Реєстраційні дані', '• Прізвище, ім’я, по батькові, стать, дата народження.\n• Паспортні дані, РНОКПП (код).\n• Адреса проживання/реєстрації.\n• Контакти: E-mail, номер телефону.\n• Фотографія (за бажанням).'],
      ['Медичні та технічні дані', '• Дані з центральної бази даних (декларації, направлення, рецепти).\n• Дані про повʼязаних осіб.\n• Інформація про страхові поліси.\n• IP адреси, ідентифікатори пристрою.'],
      ['Дані від Третіх сторін (Apple HealthKit, Google Fit)', 'За вашим дозволом:\n• Вага, зріст, пульс, тиск.\n• Рівень глюкози, сатурація.\n• Активність (кроки, сон).\n(Використовується для довідки).'],
    ]},

    { type: 'h3', text: '3. Дозволи на пристрої' },
    { type: 'table', rows: [
      ['Геолокація', 'Для відображення найближчих аптек.'],
      ['Камера та Мікрофон', 'Для проведення відеоконсультацій з лікарем.'],
      ['Bluetooth', 'Для використання бездротової гарнітури.'],
      ['Сховище/Галерея', 'Для завантаження файлів/фото у мед. картку.'],
      ['Календар', 'Для нагадувань про запис до лікаря.'],
    ]},

    { type: 'h3', text: '4. Передача даних третім особам' },
    { type: 'table', headers: ['Отримувач', 'Мета передачі'], rows: [
      ['Заклади охорони здоров’я та лікарі', 'Виключно для надання медичної допомоги.'],
      ['Державні реєстри (eHealth)', 'Передача до Реєстрів (НСЗУ) відповідно до законодавства.'],
      ['Портал «Дія»', 'Тільки за вашої окремої згоди через «Дію».'],
      ['Оператори зв\'язку', 'Для SMS розсилок та авторизації.'],
    ]},

    { type: 'h3', text: '5. Ваші права (згідно ст. 8 ЗУ)' },
    { type: 'table', rows: [
      ['Знати', 'Про джерела, місцезнаходження та мету обробки.'],
      ['Доступ', 'Отримувати інформацію про склад даних (відповідь за 30 днів).'],
      ['Зміна/Видалення', 'Вимагати зміни/видалення недостовірних даних.'],
      ['Відкликати згоду', 'Можна відкликати згоду (крім даних вже в eHealth).'],
    ]},

    { type: 'h3', text: '6. Взаємодія та видалення' },
    { type: 'table', rows: [
      ['Як зв\'язатися', '1. Форма зворотнього зв’язку.\n2. E-mail: doctor.plus.dodatok@gmail.com'],
      ['Видалення акаунту', 'Ми не можемо видалити дані, що вже внесені в eHealth (направлення, рецепти).'],
      ['Блокування', 'За порушення Угоди або недостовірні дані акаунт блокується.'],
    ]},
    { type: 'footer', text: 'Зміни до цього повідомлення набувають чинності з моменту їх оприлюднення у Doctor Plus.' }
  ],

  en: [
    { type: 'h1', text: 'PRIVACY POLICY' },
    { type: 'h2', text: 'Notification on Personal Data Processing' },
    { type: 'p', text: 'In accordance with Paragraphs 1 and 2 of Part 2 of Article 8, Part 2 of Article 12 of the Law of Ukraine "On Protection of Personal Data", LLC "Medical Center \'Dovira\'" hereby provides information regarding data processing in the Doctor Plus system.' },
    
    { type: 'h3', text: '1. Data Controller Information' },
    { type: 'table', rows: [
      ['Organization Name', 'LLC "Medical Center \'Dovira\'"'],
      ['EDRPOU Code', '37195461'],
      ['Address', 'Kyiv, 44 Heroiv Stalinhradu Avenue'],
      ['Processing System', 'Information system, including the mobile application Doctor Plus.'],
    ]},

    { type: 'h3', text: '2. Data Sources and Composition' },
    { type: 'table', headers: ['Category', 'Description'], rows: [
      ['Registration Data', '• Full name, gender, DOB.\n• Passport data, Tax ID.\n• Address.\n• Contacts: E-mail, phone.\n• Photo (optional).'],
      ['Medical & Technical', '• Data from Central Database (declarations, referrals).\n• Related persons.\n• Insurance info.\n• IP addresses, device IDs.'],
      ['Third Party Data (HealthKit, Google Fit)', 'With permission:\n• Weight, height, pulse, BP.\n• Glucose, saturation.\n• Activity (steps, sleep).\n(Used for reference only).'],
    ]},

    { type: 'h3', text: '3. Device Permissions' },
    { type: 'table', rows: [
      ['Geolocation', 'To display nearest pharmacies.'],
      ['Camera & Mic', 'For video consultations.'],
      ['Bluetooth', 'For wireless headsets.'],
      ['Storage/Gallery', 'To upload files to medical records.'],
      ['Calendar', 'For appointment reminders.'],
    ]},

    { type: 'h3', text: '4. Data Transfer' },
    { type: 'table', headers: ['Recipient', 'Purpose'], rows: [
      ['Healthcare Facilities', 'Exclusively for medical care.'],
      ['State Registries (eHealth)', 'Transfer to NHSU per legal requirements.'],
      ['"Diia" Portal', 'Only with explicit consent via "Diia".'],
      ['Telecom Operators', 'For SMS and authorization.'],
    ]},

    { type: 'h3', text: '5. Your Rights' },
    { type: 'table', rows: [
      ['Know', 'Sources, location, and purpose of processing.'],
      ['Access', 'Content of data processed (reply within 30 days).'],
      ['Correction/Deletion', 'Request to fix inaccurate or illegal data.'],
      ['Withdraw Consent', 'At any time (except eHealth registry data).'],
    ]},

    { type: 'h3', text: '6. Interaction and Deletion' },
    { type: 'table', rows: [
      ['Contact Us', '1. Feedback form.\n2. E-mail: doctor.plus.dodatok@gmail.com'],
      ['Deletion', 'We cannot delete data already in Central eHealth DB.'],
      ['Blocking', 'Accounts may be blocked for violations.'],
    ]},
    { type: 'footer', text: 'Changes to this notice become effective from the moment they are published in Doctor Plus.' }
  ]
};

const PrivacyPolicyScreen = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  
  // Визначаємо поточну мову, за замовчуванням 'uk'
  const currentLang = (i18n.language && POLICY_DATA[i18n.language]) ? i18n.language : 'uk';
  const data = POLICY_DATA[currentLang];

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleLinkPress = (url) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  // Helper function to render different content types
  const renderContentItem = (item, index) => {
    switch (item.type) {
      case 'h1':
        return <Text key={index} style={styles.h1}>{item.text}</Text>;
      case 'h2':
        return <Text key={index} style={styles.h2}>{item.text}</Text>;
      case 'h3':
        return <Text key={index} style={styles.h3}>{item.text}</Text>;
      case 'p':
        return <Text key={index} style={styles.paragraph}>{item.text}</Text>;
      case 'footer':
        return <Text key={index} style={styles.footer}>{item.text}</Text>;
      case 'table':
        return (
          <View key={index} style={styles.tableContainer}>
            {/* Render Table Header if exists */}
            {item.headers && (
              <View style={[styles.tableRow, styles.tableHeaderRow]}>
                <View style={[styles.tableCell, { flex: 0.4 }]}>
                  <Text style={styles.tableHeaderText}>{item.headers[0]}</Text>
                </View>
                <View style={[styles.tableCell, { flex: 0.6, borderRightWidth: 0 }]}>
                  <Text style={styles.tableHeaderText}>{item.headers[1]}</Text>
                </View>
              </View>
            )}
            {/* Render Rows */}
            {item.rows.map((row, rIndex) => (
              <View key={rIndex} style={[styles.tableRow, rIndex === item.rows.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[styles.tableCell, { flex: 0.4 }]}>
                  <Text style={styles.tableLabelText}>{row[0]}</Text>
                </View>
                <View style={[styles.tableCell, { flex: 0.6, borderRightWidth: 0 }]}>
                  <Text style={styles.tableValueText}>{row[1]}</Text>
                </View>
              </View>
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={getResponsiveFontSize(24)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('privacyPolicyHeader') || (currentLang === 'uk' ? 'Політика' : 'Policy')}</Text>
        <View style={{ width: getResponsiveFontSize(24) }} />
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {data.map((item, index) => renderContentItem(item, index))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: getResponsiveHeight(1.5),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: getResponsiveFontSize(5),
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'Mont-SemiBold',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  scrollView: {
    paddingHorizontal: 15,
  },
  scrollContent: {
    paddingTop: getResponsiveHeight(2),
    paddingBottom: getResponsiveHeight(5),
  },
  
  // Typography Styles
  h1: {
    fontSize: getResponsiveFontSize(20),
    fontFamily: 'Mont-SemiBold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 10,
  },
  h2: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Mont-Regular',
    color: '#666',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 20,
    letterSpacing: 1,
  },
  h3: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Mont-SemiBold',
    color: '#007aff', // Primary Color
    marginTop: 25,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  paragraph: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Mont-Regular',
    color: '#333',
    lineHeight: getResponsiveFontSize(22),
    marginBottom: 15,
  },
  footer: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Mont-Regular',
    color: '#888',
    textAlign: 'center',
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 15,
  },

  // Table Styles
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 20,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tableHeaderRow: {
    backgroundColor: '#eef4fb',
  },
  tableCell: {
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  tableHeaderText: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Mont-SemiBold',
    color: '#0056b3',
  },
  tableLabelText: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Mont-SemiBold',
    color: '#444',
  },
  tableValueText: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Mont-Regular',
    color: '#333',
  },
});

export default PrivacyPolicyScreen;