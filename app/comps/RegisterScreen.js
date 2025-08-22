import { Entypo, Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Image, Pressable,
    StyleSheet,
    Text, TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { linkapi } from '../navigation/config';

export default function RegisterScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [role, setRole] = useState('User');

    const handleRegister = async () => {

        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;

        if (!email || !password || !confirmPassword) {
            Toast.show({
                type: 'error',
                text1: 'Vui lòng nhập đầy đủ thông tin!',
            });
            return;
        }

        if (!gmailRegex.test(email)) {
            Toast.show({
                type: 'error',
                text1: 'Email phải có định dạng @gmail.com hợp lệ!',
            });
            return;
        }

        if (password !== confirmPassword) {
            Toast.show({
                type: 'error',
                text1: 'Mật khẩu không khớp!',
            });
            return;
        }

        if (!passwordRegex.test(password)) {
            Toast.show({
                type: 'error',
                text1: 'Mật khẩu phải ít nhất 6 ký tự, chứa ít nhất 1 chữ cái, 1 số và 1 ký tự đặc biệt!',
            });
            return;
        }

        try {
            const response = await fetch(linkapi + 'add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: email.split('@')[0],
                    email: email,
                    phone: '0123456789',
                    password_hash: password,
                    role: role,
                })
            });

            const data = await response.json();

            if (response.ok) {
                Toast.show({
                    type: 'error',
                    text1: "Đăng ký thành công!",
                });
                navigation.navigate('Login');
            } else {
                console.log(data);
                Toast.show({
                    type: 'error',
                    text1: 'Đăng ký thất bại! Email có thể đã tồn tại!',
                });
            }
        } catch (error) {
            console.error(error);
            Toast.show({
                type: 'error',
                text1: 'Có lỗi xảy ra, vui lòng thử lại!',
            });
        }
    };


    return (
        <View style={styles.container}>
            <Image source={require('../../assets/images/Logo.png')} style={styles.logo} />

            <Text style={styles.title}>ĐĂNG KÝ</Text>

            <View style={styles.inputBox}>
                <Entypo name="email" size={22} color="#f55" style={styles.icon} />
                <TextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                    placeholderTextColor="#999"
                />
            </View>

            <View style={styles.inputBox}>
                <Entypo name="lock" size={22} color="#f55" style={styles.icon} />
                <TextInput
                    placeholder="Password"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    style={styles.input}
                    placeholderTextColor="#999"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={22} color="#222" />
                </Pressable>
            </View>

            <View style={styles.inputBox}>
                <Entypo name="lock" size={22} color="#f55" style={styles.icon} />
                <TextInput
                    placeholder="Confirm Password"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    style={styles.input}
                    placeholderTextColor="#999"
                />
                <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Feather name={showConfirmPassword ? 'eye-off' : 'eye'} size={22} color="#222" />
                </Pressable>
            </View>

            <View style={styles.roleRow}>
                <TouchableOpacity style={styles.radioGroup} onPress={() => setRole('Admin')}>
                    <View style={styles.radioOuter}>
                        {role === 'Admin' && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.roleText}>Admin</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.radioGroup} onPress={() => setRole('User')}>
                    <View style={styles.radioOuter}>
                        {role === 'User' && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.roleText}>User</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.registerBtn} onPress={handleRegister}>
                <Text style={styles.registerText}>Đăng Ký</Text>
            </TouchableOpacity>

            <Text style={styles.footerText}>
                Bạn đã có tài khoản?
                <Text style={styles.loginText} onPress={() => navigation.navigate('Login')}> Đăng nhập</Text>
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 35,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center'
    },
    logo: {
        width: 130,
        height: 130,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 26,
        marginBottom: 30,
        color: '#000',
    },
    inputBox: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#f55',
        borderRadius: 30,
        paddingHorizontal: 18,
        marginBottom: 18,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 17,
        color: '#000',
    },
    roleRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 25,
    },
    radioGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        borderColor: '#444',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#f55',
    },
    roleText: {
        fontSize: 18,
        color: '#444',
    },
    registerBtn: {
        backgroundColor: '#f55',
        width: '100%',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: 18,
    },
    registerText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    footerText: {
        marginTop: 10,
        textAlign: 'center',
        color: '#444',
        fontSize: 16,
    },
    loginText: {
        color: '#f55',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
