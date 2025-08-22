import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { linkapi } from '../navigation/config';

export default function AddAddressScreen({ navigation }) {
    const [city, setCity] = useState('');
    const [ward, setWard] = useState('');
    const [street, setStreet] = useState('');
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            const userString = await AsyncStorage.getItem('user');
            const parsedUser = JSON.parse(userString);
            setUser(parsedUser);
        };
        fetchUser();
    }, []);

    const handleAddAddress = async () => {
        if (!city || !ward || !street) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
            return;
        }

        try {
            await fetch(linkapi + 'address/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user._id,
                    name: user.name,
                    phone: user.phone,
                    city,
                    ward,
                    street
                })
            });

            Toast.show({
                type: 'success',
                text1: 'Thêm địa chỉ thành công!',
            });

            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert('Lỗi', 'Thêm địa chỉ thất bại');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.title}>Thêm địa chỉ nhận hàng</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Trường Tỉnh/Thành phố */}
                <Text style={styles.label}>Tỉnh/Thành phố</Text>
                <TextInput
                    placeholder="VD: Hồ Chí Minh"
                    style={styles.input}
                    value={city}
                    onChangeText={setCity}
                />
                
                {/* Trường Phường/Xã */}
                <Text style={styles.label}>Phường/Xã</Text>
                <TextInput
                    placeholder="VD: Phường 1"
                    style={styles.input}
                    value={ward}
                    onChangeText={setWard}
                />
                
                {/* Trường Đường, Tòa nhà, Số nhà */}
                <Text style={styles.label}>Đường, Tòa nhà, Số nhà</Text>
                <TextInput
                    placeholder="VD: 123 Đường ABC, Tòa nhà XYZ"
                    style={styles.input}
                    value={street}
                    onChangeText={setStreet}
                />

                <TouchableOpacity style={styles.saveBtn} onPress={handleAddAddress}>
                    <Text style={styles.saveText}>Lưu</Text>
                </TouchableOpacity>
            </ScrollView>
            {/* <Toast /> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15, backgroundColor: '#fff',},
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backBtn: { padding: 5, marginRight: 10 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#000' },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#555',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#ccc',
        borderRadius: 10,
        padding: 18,
        marginBottom: 20,
        fontSize: 16,
    },
    inputDisabled: {
        borderWidth: 1.5,
        borderColor: '#ccc',
        borderRadius: 10,
        padding: 18,
        marginBottom: 20,
        fontSize: 16,
        backgroundColor: '#f0f0f0',
        color: '#888',
    },
    saveBtn: {
        backgroundColor: '#f55',
        padding: 18,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: 10,
    },
    saveText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});