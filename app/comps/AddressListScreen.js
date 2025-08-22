import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { linkapi } from '../navigation/config';

export default function AddressListScreen({ navigation }) {
    const [addresses, setAddresses] = useState([]);
    const [defaultAddressId, setDefaultAddressId] = useState(null);

    useFocusEffect(
        React.useCallback(() => {
            fetchAddresses();
        }, [])
    );

    const fetchAddresses = async () => {
        try {
            const userString = await AsyncStorage.getItem('user');
            const user = JSON.parse(userString);
            const res = await fetch(linkapi + 'address/' + user._id);
            const data = await res.json();
            setAddresses(data);
            const defaultAddr = data.find(item => item.is_default);
            setDefaultAddressId(defaultAddr ? defaultAddr._id : null);
        } catch (error) {
            console.error(error);
        }
    };

    const setDefaultAddress = async (address_id) => {
        try {
            const userString = await AsyncStorage.getItem('user');
            const user = JSON.parse(userString);
            await fetch(linkapi + 'address/set-default', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user._id, address_id })
            });
            fetchAddresses();
        } catch (error) {
            console.error(error);
        }
    };

    const removeAddress = async (address_id) => {
        Alert.alert('Xóa địa chỉ', 'Bạn có chắc chắn muốn xóa địa chỉ này?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await fetch(linkapi + 'address/remove/' + address_id, { method: 'DELETE' });
                        fetchAddresses();

                        Toast.show({
                            type: 'success',
                            text1: 'Xóa địa chỉ thành công!',
                        });
                    } catch (error) {
                        console.error(error);
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item }) => (
        <View style={styles.itemBox}>
            <TouchableOpacity
                style={styles.defaultRow}
                onPress={() => setDefaultAddress(item._id)}
            >
                <Feather
                    name={item._id === defaultAddressId ? 'check-square' : 'square'}
                    size={22}
                    color="#f55"
                />
                <Text style={styles.defaultText}>Đặt làm địa chỉ mặc định</Text>
            </TouchableOpacity>

            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.phone}>{item.phone}</Text>
            <Text style={styles.address}>
                {`${item.street}, ${item.ward}, ${item.city}`}
            </Text>

            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => navigation.navigate('EditAddress', { address: item })}
                >
                    <Feather name="edit-2" size={20} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => removeAddress(item._id)}>
                    <Feather name="trash-2" size={20} color="#f55" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.title}>Địa chỉ nhận hàng</Text>
            </View>

            <FlatList
                data={addresses}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 100 }}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>Bạn chưa có địa chỉ nào.</Text>
                }
            />

            <TouchableOpacity
                style={styles.addBtn}
                onPress={() => navigation.navigate('AddAddress')}
            >
                <Feather name="plus" size={22} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15, backgroundColor: '#fff',},
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backBtn: { padding: 5, marginRight: 10 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#000' },
    itemBox: {
        backgroundColor: '#f9f9f9',
        padding: 20,
        borderRadius: 12,
        marginBottom: 18,
    },
    defaultRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    defaultText: { marginLeft: 10, color: '#000', fontSize: 16 },
    name: { fontWeight: 'bold', fontSize: 18, marginBottom: 5 },
    phone: { color: '#333', fontSize: 16, marginBottom: 5 },
    address: { color: '#555', fontSize: 16, marginBottom: 12 },
    actionRow: { flexDirection: 'row', justifyContent: 'flex-end' },
    iconBtn: { marginLeft: 20 },
    addBtn: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        backgroundColor: '#f55',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
    },
    emptyText: {
        textAlign: 'center',
        color: '#777',
        marginTop: 50,
        fontSize: 16,
    },
});
