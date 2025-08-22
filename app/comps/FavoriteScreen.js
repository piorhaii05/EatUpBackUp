import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'; // thêm Alert
import { linkanh, linkapi } from '../navigation/config';
import { formatPriceVND } from '../navigation/currency';

export default function FavoriteScreen() {
  const [userId, setUserId] = useState(null);
  const [favorites, setFavorites] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchUserId = async () => {
        const userString = await AsyncStorage.getItem('user');
        const user = JSON.parse(userString);
        setUserId(user?._id);
        if (user?._id) {
          fetchFavorites(user._id);
        }
      };
      fetchUserId();
    }, [])
  );

  const fetchFavorites = async (user_id) => {
    try {
      const res = await fetch(linkapi + 'favorite/' + user_id);
      const data = await res.json();
      setFavorites(data);
    } catch (error) {
      console.error(error);
    }
  };

  const confirmRemoveFavorite = (product_id) => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc muốn xóa sản phẩm này khỏi danh sách yêu thích?",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa", style: "destructive", onPress: () => removeFavorite(product_id) }
      ]
    );
  };

  const removeFavorite = async (product_id) => {
    try {
      await fetch(linkapi + 'favorite/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, product_id })
      });
      fetchFavorites(userId);
    } catch (error) {
      console.error(error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <Image source={{ uri: linkanh + item.product_image }} style={styles.itemImage} />
      <View style={{ flex: 1, marginLeft: 15 }}>
        <Text style={styles.itemName}>{item.product_name}</Text>
        <Text style={styles.itemPrice}>{formatPriceVND(item.product_price)}</Text>
      </View>
      <TouchableOpacity onPress={() => confirmRemoveFavorite(item.product_id)}>
        <Feather name="x-circle" size={26} color="#f55" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Danh sách yêu thích</Text>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.product_id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
        ListEmptyComponent={<Text style={styles.emptyText}>Bạn chưa có sản phẩm yêu thích nào.</Text>}
        contentContainerStyle={{ paddingTop: 15 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    elevation: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#000',
  },
  itemPrice: {
    color: '#f55',
    fontWeight: '500',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 50,
    fontSize: 16,
  },
});
