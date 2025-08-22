import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import {
    Pressable, StyleSheet, Text, TextInput,
    TouchableOpacity, View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { linkapi } from '../navigation/config';

export default function ChangePasswordScreen({ navigation }) {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleChangePassword = async () => {
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;

        if (!oldPassword || !newPassword || !confirmPassword) {
            Toast.show({ type: 'error', text1: 'Vui lòng nhập đầy đủ thông tin!' });
            return;
        }

        if (newPassword !== confirmPassword) {
            Toast.show({ type: 'error', text1: 'Mật khẩu mới không khớp!' });
            return;
        }

        if (!passwordRegex.test(newPassword)) {
            Toast.show({
                type: 'error',
                text1: 'Mật khẩu phải ít nhất 6 ký tự, chứa chữ, số và ký tự đặc biệt!'
            });
            return;
        }

        try {
            const userString = await AsyncStorage.getItem('user');
            const user = JSON.parse(userString);

            const response = await fetch(linkapi + 'change-password/' + user._id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                Toast.show({ type: 'success', text1: 'Đổi mật khẩu thành công!' });
                navigation.goBack();
            } else {
                Toast.show({ type: 'error', text1: data.message });
            }
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Có lỗi xảy ra, vui lòng thử lại!' });
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.title}>Đổi mật khẩu</Text>
            </View>

            {/* Mật khẩu cũ */}
            <Text style={styles.label}>Mật khẩu cũ</Text>
            <View style={styles.inputBox}>
                <TextInput
                    placeholder="Nhập mật khẩu cũ của bạn"
                    style={styles.input}
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    secureTextEntry={!showOld}
                />
                <Pressable onPress={() => setShowOld(!showOld)}>
                    <Feather name={showOld ? 'eye-off' : 'eye'} size={20} color="#222" />
                </Pressable>
            </View>

            {/* Mật khẩu mới */}
            <Text style={styles.label}>Mật khẩu mới</Text>
            <View style={styles.inputBox}>
                <TextInput
                    placeholder="Nhập mật khẩu mới"
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNew}
                />
                <Pressable onPress={() => setShowNew(!showNew)}>
                    <Feather name={showNew ? 'eye-off' : 'eye'} size={20} color="#222" />
                </Pressable>
            </View>

            {/* Xác nhận mật khẩu mới */}
            <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
            <View style={styles.inputBox}>
                <TextInput
                    placeholder="Nhập lại mật khẩu mới"
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                />
                <Pressable onPress={() => setShowConfirm(!showConfirm)}>
                    <Feather name={showConfirm ? 'eye-off' : 'eye'} size={20} color="#222" />
                </Pressable>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword}>
                <Text style={styles.saveText}>LƯU</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff',},
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backBtn: { padding: 5, marginRight: 10 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#000' },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#555',
        marginBottom: 8,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#ccc',
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 20,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: '#000',
    },
    saveBtn: {
        backgroundColor: '#f55',
        padding: 18,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: 10,
    },
    saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});