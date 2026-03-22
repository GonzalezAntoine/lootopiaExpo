import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        'https://lootopia-test.ordwen-dev.com/api/login_check',
        {
          username,
          password
        }
      );

      const token = response.data.token;
      await AsyncStorage.setItem('token', token);

      Alert.alert('Succès', 'Connexion réussie !');

      // 🔥 Navigation Expo Router
      router.replace('/hunts');

    } catch (error) {
      console.log(error.response?.data || error.message);
      Alert.alert('Erreur', 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion Lootopia</Text>
      <TextInput
        style={styles.input}
        placeholder="Nom d'utilisateur"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title={loading ? 'Connexion...' : 'Se connecter'}
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', padding:20, backgroundColor:'#222' },
  title: { fontSize:24, color:'#fff', marginBottom:20, textAlign:'center' },
  input: { backgroundColor:'#fff', padding:10, marginBottom:15, borderRadius:5 }
});
