// LoadingScreen.js
import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const LoadingScreen = () => {
  // Використовуємо useRef для створення Animated.Value
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Запускаємо анімацію при монтуванні компонента
    Animated.loop(
      Animated.timing(
        rotateAnim,
        {
          toValue: 1,
          duration: 1500, // Тривалість однієї ітерації анімації в мілісекундах
          easing: Easing.linear,
          useNativeDriver: true,
        }
      )
    ).start();
  }, [rotateAnim]);

  // Інтерполяція значення анімації rotateAnim (від 0 до 1) до градусів обертання
  const spin = rotateAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '45deg', '0deg']
  });

  return (
    <View style={styles.container}>
      {/* Ваш логотип */}
      <Animated.Image
        source={require('../assets/icon.png')} // <-- ПЕРЕКОНАЙТЕСЯ, ЩО ЦЕ ПРАВИЛЬНИЙ ШЛЯХ
        style={[
          styles.logo,
          { transform: [{ rotate: spin }] }
        ]}
      />
      {/* Кастомний текст */}
      <Text style={styles.loadingText}>Doctor Plus</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // Білий фон, як на зображенні
  },
  logo: {
    width: width * 0.7, // Адаптивна ширина
    height: height * 0.4, // Адаптивна висота
    resizeMode: 'contain',
    marginBottom: 20, // Додамо відступ, щоб текст не був надто близько
  },
  loadingText: {
    fontSize: 28, // Збільшений розмір шрифту, як на скріншоті
    fontFamily: 'Mont-Bold', // Товщий шрифт, як на скріншоті
    color: '#333',
    marginTop: 10,
  },
});

export default LoadingScreen;