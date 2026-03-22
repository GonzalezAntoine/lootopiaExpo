import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      if (!token) throw new Error("Token manquant");

      const response = await axios.get(
        'https://lootopia-test.ordwen-dev.com/api/me',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setUser(response.data);

    } catch (error) {
      console.log(error.response?.data || error.message);
      Alert.alert("Erreur", "Impossible de charger le profil");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Aucun utilisateur trouvé</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>

      <Text style={styles.title}>Profil</Text>

      <Text style={styles.label}>Username</Text>
      <Text style={styles.text}>{user.username}</Text>

      <Text style={styles.label}>Nom</Text>
      <Text style={styles.text}>{user.firstname} {user.lastname}</Text>

      <Text style={styles.label}>Email</Text>
      <Text style={styles.text}>{user.mailAddress}</Text>

      <Text style={styles.label}>Couronnes</Text>
      <Text style={styles.text}>{user.crowns}</Text>

      <Text style={styles.label}>Chasses complétées</Text>
      <Text style={styles.text}>{user.completedHuntsCount}</Text>

      <Text style={styles.label}>Badges</Text>
      {user.participantBadges?.length > 0 ? (
        user.participantBadges.map((pb, index) => (
          <View key={index} style={styles.badge}>
            <Text style={styles.badgeTitle}>{pb.badge.name}</Text>
            <Text style={styles.text}>{pb.badge.description}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.text}>Aucun badge</Text>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#222"
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    color: "#aaa",
    marginTop: 10
  },
  text: {
    color: "white",
    marginTop: 5
  },
  badge: {
    backgroundColor: "#333",
    padding: 10,
    marginTop: 10,
    borderRadius: 8
  },
  badgeTitle: {
    color: "white",
    fontWeight: "bold"
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  }
});
