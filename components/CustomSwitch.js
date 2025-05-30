// components/CustomSwitch.js
import React from 'react';
import { View, Text, Switch, StyleSheet, Dimensions } from 'react-native'; // Додано Dimensions
import { useTranslation } from 'react-i18next';

const CustomSwitch = ({ label, value, onValueChange }) => {
  const { t } = useTranslation();
  const { width } = Dimensions.get('window'); // Отримуємо ширину екрану

  return (
    <View style={styles.outerContainer}> {/* Нова зовнішня обгортка для центрування */}
      <View style={styles.container(width)}> {/* Передаємо ширину в стилі */}
        {label && <Text style={styles.label}>{label}</Text>}
        <Switch
          trackColor={{ false: "#767577", true: "#0EB3EB" }} // Ваш синій колір
          thumbColor={value ? "#0EB3EB" : "#f4f3f4"} // Змінено thumbColor для true на синій
          ios_backgroundColor="#E0E0E0" // Більш нейтральний фон для iOS
          onValueChange={onValueChange}
          value={value}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    alignItems: 'center', // Центруємо внутрішній контейнер
    marginBottom: 20, // Відступ знизу для всього компонента
  },
  container: (width) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: width * 0.9, // Використовуємо 90% від ширини екрану для контейнера
   
    borderRadius: 555, // Округлення, як у інших полях
    minHeight: 52, // Мінімальна висота для консистентності з іншими полями
  }),
  label: {
    fontSize: 16,
    color: '#2A2A2A', // Темніший колір тексту
    // fontFamily: 'Mont-Medium', // Розкоментуйте, якщо шрифти завантажені
    flex: 1, // Дозволяє тексту займати доступне місце і переноситися
    marginRight: 10,
  },
});

export default CustomSwitch;