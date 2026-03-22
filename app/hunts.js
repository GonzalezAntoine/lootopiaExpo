import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Button } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function HuntsScreen() {

  const router = useRouter();

  const [hunts, setHunts] = useState([]);
  const [mode, setMode] = useState("all"); // all ou me

  useEffect(() => {
    fetchHunts();
  }, [mode]);

  const fetchHunts = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      const endpoint =
        mode === "all"
          ? "https://lootopia-test.ordwen-dev.com/api/hunts"
          : "https://lootopia-test.ordwen-dev.com/api/me/hunts";

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setHunts(response.data.member || []);

    } catch (error) {
      console.log(error.response?.data || error.message);
      Alert.alert("Erreur API");
    }
  };

  // 🔥 Navigation vers détail
  const onSelectHunt = (huntId) => {
    router.push(`/hunt/${huntId}`);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => onSelectHunt(item.id)}
    >
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.desc}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>

      {/* 🔥 Boutons filtre */}
      <View style={styles.buttons}>
        <Button title="Toutes les chasses" onPress={() => setMode("all")} />
        <Button title="Mes chasses" onPress={() => setMode("me")} />
        <Button title="Mon profil" onPress={() => router.push('/profile')} />
      </View>

      <FlatList
        data={hunts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  buttons: { flexDirection: "row", justifyContent: "space-around", marginBottom: 15 },
  item: { padding: 15, backgroundColor: "#eee", marginBottom: 10, borderRadius: 8 },
  title: { fontWeight: "bold", fontSize: 18 },
  desc: { color: "#555" }
});
