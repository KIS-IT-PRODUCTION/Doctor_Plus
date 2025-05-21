// LoginScreen.js
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator, // Додано для індикатора завантаження
} from 'react-native';
import { supabase } from '../supabaseClient'; // Шлях до вашого Supabase клієнта
import { useAuth } from '../AuthProvider'; // Шлях до вашого AuthProvider

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { session } = useAuth(); // Отримуємо сесію для перевірки, чи вже авторизований користувач

  // Якщо користувач вже авторизований, перенаправляємо його на головну сторінку
  React.useEffect(() => {
    if (session) {
      navigation.replace('Patsient_Home');
    }
  }, [session, navigation]);

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert('Помилка входу', error.message);
    } else {
      // Навігація відбудеться через useEffect, коли сесія оновиться
    }
    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      Alert.alert('Помилка реєстрації', error.message);
    } else {
      Alert.alert('Успішна реєстрація', 'Перевірте свою електронну пошту для підтвердження.');
      // Навігація відбудеться через useEffect, якщо користувач автоматично увійде після реєстрації
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Вхід / Реєстрація</Text>
      <TextInput
        style={styles.input}
        placeholder="Електронна пошта"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Пароль"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Увійти</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.signUpButton]}
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Зареєструватися</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5FCFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#212121',
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    width: '100%',
    padding: 15,
    backgroundColor: '#42A5F5',
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  signUpButton: {
    backgroundColor: '#28A745',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LoginScreen;

