import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { linkapi } from '../../navigation/config';

export default function EditNameAdminScreen({ navigation }) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            const userString = await AsyncStorage.getItem('user');
            const parsedUser = JSON.parse(userString);
            setUser(parsedUser);
            setName(parsedUser?.name || '');
            setPhone(parsedUser?.phone || '');
        };
        fetchUser();
    }, []);

    const handleSave = async () => {
        if (!name.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi nhập liệu',
                text2: 'Vui lòng nhập họ và tên.',
            });
            return;
        }

        // Validate số điện thoại
        if (!phone.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi nhập liệu',
                text2: 'Vui lòng nhập số điện thoại.',
            });
            return;
        }
        if (!/^\d+$/.test(phone)) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi nhập liệu',
                text2: 'Số điện thoại chỉ được chứa ký tự số.',
            });
            return;
        }
        if (phone.length !== 10) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi nhập liệu',
                text2: 'Số điện thoại phải có đúng 10 chữ số.',
            });
            return;
        }

        try {
            const res = await fetch(linkapi + 'update/' + user._id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone }),
            });

            const updatedUser = await res.json();
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

            Toast.show({
                type: 'success',
                text1: 'Cập nhật thành công!',
                text2: 'Thông tin của bạn đã được lưu.',
            });

            // Đặt timeout ngắn để Toast có thể hiển thị trước khi chuyển màn hình
            setTimeout(() => {
                navigation.navigate('HomeAdmin', { shouldRefresh: true });
            }, 500);
        } catch (error) {
            console.error(error);
            Toast.show({
                type: 'error',
                text1: 'Cập nhật thất bại!',
                text2: 'Đã có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.',
            });
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.title}>Thông tin Admin</Text>
            </View>

            <View style={{ flex: 1 }}>
                <TextInput
                    placeholder="Họ và tên"
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    maxLength={30}
                />
                <Text style={styles.counter}>{name.length}/30</Text>

                <TextInput
                    placeholder="Số điện thoại"
                    style={styles.input}
                    value={phone}
                    onChangeText={(text) => {
                        // Cho phép nhập chỉ số
                        if (/^\d*$/.test(text)) {
                            setPhone(text);
                        }
                    }}
                    keyboardType="numeric"
                    maxLength={10}
                />
                <Text style={styles.counter}>{phone.length}/10</Text>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>LƯU</Text>
            </TouchableOpacity>

            {/* Component Toast cần được render để hiển thị thông báo */}
            {/* <Toast /> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15, backgroundColor: '#fff'},
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backBtn: { padding: 5, marginRight: 10 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#000' },
    input: {
        borderWidth: 1.5,
        borderColor: '#ccc',
        borderRadius: 10,
        padding: 18,
        marginBottom: 10,
        fontSize: 16,
    },
    counter: { textAlign: 'right', color: '#555', marginBottom: 15 },
    saveBtn: {
        backgroundColor: '#f55',
        padding: 18,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: 20,
    },
    saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});