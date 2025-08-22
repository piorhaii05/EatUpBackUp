import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { linkapi } from '../navigation/config';

export default function BankListScreen({ navigation }) {
    const [banks, setBanks] = useState([]);
    const [defaultBankId, setDefaultBankId] = useState(null);

    useFocusEffect(
        React.useCallback(() => {
            fetchBanks();
        }, [])
    );

    const fetchBanks = async () => {
        try {
            const userString = await AsyncStorage.getItem('user');
            const user = JSON.parse(userString);
            const res = await fetch(linkapi + 'bank/' + user._id);
            const data = await res.json();
            setBanks(data);
            const defaultBank = data.find(item => item.is_default);
            setDefaultBankId(defaultBank ? defaultBank._id : null);
        } catch (error) {
            console.error(error);
        }
    };

    const setDefaultBank = async (bank_id) => {
        try {
            const userString = await AsyncStorage.getItem('user');
            const user = JSON.parse(userString);
            await fetch(linkapi + 'bank/set-default', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user._id, bank_id })
            });
            fetchBanks();
        } catch (error) {
            console.error(error);
        }
    };

    const removeBank = async (bank_id) => {
        Alert.alert('Xóa thẻ', 'Bạn có chắc chắn muốn xóa thẻ này?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await fetch(linkapi + 'bank/remove/' + bank_id, { method: 'DELETE' });
                        Toast.show({
                            type: 'success',
                            text1: 'Đã xóa tài khoản ngân hàng!',
                        });
                        fetchBanks();
                    } catch (error) {
                        console.error(error);
                        Toast.show({
                            type: 'error',
                            text1: 'Lỗi xóa tài khoản!',
                        });
                    }
                }
            }
        ]);
    };


    const renderItem = ({ item }) => (
        <View style={styles.cardBox}>
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    <Image source={require('../../assets/images/mastercard.png')} style={styles.logo} />
                    <Text style={styles.expiry}>{item.expiry_date}</Text>
                </View>
                <Text style={styles.cardNumber}>
                    **** **** **** {item.card_number.slice(-4)}
                </Text>
                <View style={styles.cardBottom}>
                    <View>
                        <Text style={styles.label}>Card Holder</Text>
                        <Text style={styles.value}>{item.card_holder}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeBank(item._id)}>
                        <Feather name="trash-2" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity
                style={styles.defaultRow}
                onPress={() => setDefaultBank(item._id)}
            >
                <Feather
                    name={item._id === defaultBankId ? 'check-square' : 'square'}
                    size={20}
                    color="#f55"
                />
                <Text style={styles.defaultText}>Sử dụng làm phương thức thanh toán mặc định</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.title}>Tài khoản ngân hàng</Text>
            </View>

            <FlatList
                data={banks}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 100 }}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>Bạn chưa có tài khoản ngân hàng nào.</Text>
                }
            />

            <TouchableOpacity
                style={styles.addBtn}
                onPress={() => navigation.navigate('AddBank')}
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

    cardBox: { marginBottom: 20 },
    card: {
        backgroundColor: '#222',
        borderRadius: 15,
        padding: 20,
        marginBottom: 10,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logo: { width: 40, height: 25 },
    expiry: { color: '#fff', fontSize: 14 },
    cardNumber: {
        color: '#fff',
        fontSize: 20,
        letterSpacing: 2,
        marginVertical: 15,
    },
    cardBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: { color: '#aaa', fontSize: 12 },
    value: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    defaultRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    defaultText: { marginLeft: 8, color: '#000' },

    addBtn: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        backgroundColor: '#f55',
        width: 55,
        height: 55,
        borderRadius: 28,
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
