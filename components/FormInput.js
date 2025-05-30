// components/FormInput.js
import React from 'react';
import { View, Text, TextInput, StyleSheet, Dimensions, Platform } from 'react-native';

const FormInput = ({
  label, // Лейбл, що передається з батьківського компонента
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  containerStyle, // Стиль для обгортки TextInput
  inputStyle,     // Стиль для самого TextInput
}) => {
  const { width } = Dimensions.get('window');

  return (
    <View style={styles.outerContainer}> {/* Обгортка для центрування та уніфікації */}
      {/* Лейбл відображається, тільки якщо він переданий */}
      {label && <Text style={styles.labelStyle}>{label}</Text>}

      <View style={[styles.inputContainer(width), containerStyle]}>
        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
            inputStyle
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          multiline={multiline}
          keyboardType={keyboardType}
          placeholderTextColor="#999"
          // Якщо multiline, дозволяємо тексту прокручуватися вертикально
          scrollEnabled={multiline}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    alignItems: 'center', // Центруємо елементи всередині цієї обгортки
  },
  labelStyle: { // Новий стиль для лейбла, який буде керуватися цим компонентом
    fontSize: 14,
    alignSelf: "flex-start", // Вирівнюємо лейбл по лівому краю
    color: "#2A2A2A",
    // fontFamily: "Mont-Medium", // Розкоментуйте, якщо шрифти завантажені
    paddingHorizontal: Dimensions.get('window').width * 0.05 + 20, // Відступ відповідає paddingHorizontal container, плюс 20 для тексту
    marginTop: 10,
    marginBottom: 5,
  },
  inputContainer: (width) => ({
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 179, 235, 0.2)",
    borderRadius: 555, // Дуже великий borderRadius для заокруглення
    paddingHorizontal: 15,
    marginBottom: 14,
    width: width * 0.9,
    minHeight: 52,
  }),
  input: {
    flex: 1,
    fontSize: 16,
    // fontFamily: "Mont-Regular", // Розкоментуйте, якщо шрифти завантажені
    paddingVertical: Platform.OS === "ios" ? 10 : 0, // Невеликий вертикальний відступ для iOS
    color: '#333', // Колір тексту в полі вводу
  },
  multilineInput: {
    minHeight: 100, // Мінімальна висота для багаторядкового поля
    textAlignVertical: 'top', // Важливо для Android, щоб текст починався зверху
    borderRadius: 15, // Менший borderRadius для багаторядкових полів
    paddingVertical: 15, // Більший padding для багаторядкових полів
  },
});

export default FormInput;