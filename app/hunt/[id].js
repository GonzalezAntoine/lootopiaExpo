import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';

export default function HuntDetailScreen() {

  const { id } = useLocalSearchParams(); // 🔥 récupère l'id depuis l'URL

  const [hunt, setHunt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchHuntDetail();
    }
  }, [id]);

  const fetchHuntDetail = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      if (!token || !id) throw new Error("Token ou Hunt ID manquant");

      const response = await axios.get(
        `https://lootopia-test.ordwen-dev.com/api/hunts/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setHunt(response.data);

    } catch (error) {
      console.log(error.response?.data || error.message);
      Alert.alert("Erreur", "Impossible de charger la chasse");
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

  if (!hunt) {
    return (
      <View style={styles.center}>
        <Text>Aucune chasse trouvée</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{hunt.title}</Text>

      <Text style={styles.section}>Description</Text>
      <Text style={styles.text}>{hunt.description}</Text>

      <Text style={styles.section}>Organisateur</Text>
      <Text style={styles.text}>
        {hunt.organizer?.username}
      </Text>

      <Text style={styles.section}>Participants</Text>
      {hunt.participants?.map((p) => (
        <Text key={p.id} style={styles.text}>
          {p.username}
        </Text>
      ))}

      <Text style={styles.section}>Récompenses</Text>
      {hunt.rewards?.map((r) => (
        <Text key={r.id} style={styles.text}>
          Couronnes : {r.crownAmount}
        </Text>
      ))}

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
  section: {
    fontSize: 18,
    color: "#aaa",
    marginTop: 15
  },
  text: {
    color: "white",
    marginTop: 5
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  }
});
