import { Entypo } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { linkapi } from '../navigation/config'; // Đảm bảo đường dẫn đúng

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRequestReset = async () => {
        if (!email) {
            Toast.show({
                type: 'info',
                text1: 'Vui lòng nhập địa chỉ email của bạn.',
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(linkapi + 'request-password-reset-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email }),
            });

            const data = await response.json();

            if (response.ok) {
                Toast.show({
                    type: 'success',
                    text1: 'Yêu cầu thành công!',
                    text2: data.message || 'Mã đặt lại mật khẩu đã được gửi đến email của bạn.',
                });
                // Chuyển hướng đến màn hình xác nhận OTP nếu bạn có
                // Hoặc đơn giản là quay lại màn hình đăng nhập và thông báo người dùng kiểm tra email
                navigation.navigate('Login'); // Quay lại màn hình đăng nhập
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Yêu cầu thất bại!',
                    text2: data.message || 'Không thể gửi mã đặt lại mật khẩu. Vui lòng thử lại.',
                });
            }
        } catch (error) {
            console.error('Lỗi khi yêu cầu đặt lại mật khẩu:', error);
            Toast.show({
                type: 'error',
                text1: 'Lỗi kết nối!',
                text2: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.container}>
                <Image source={require('../../assets/images/Logo.png')} style={styles.logo} />

                <Text style={styles.title}>QUÊN MẬT KHẨU</Text>
                <Text style={styles.description}>
                    Vui lòng nhập địa chỉ email bạn đã đăng ký tài khoản. Chúng tôi sẽ gửi cho bạn một mã để đặt lại mật khẩu.
                </Text>

                <View style={styles.inputBox}>
                    <Entypo name="email" size={22} color="#f55" style={styles.icon} />
                    <TextInput
                        placeholder="Địa chỉ Email"
                        value={email}
                        onChangeText={setEmail}
                        style={styles.input}
                        placeholderTextColor="#999"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={handleRequestReset}
                    disabled={loading}
                >
                    <Text style={styles.actionText}>{loading ? 'Đang gửi...' : 'Gửi mã đặt lại'}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>Quay lại Đăng nhập</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        paddingHorizontal: 35,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
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
        marginBottom: 15,
        color: '#000',
    },
    description: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
        lineHeight: 22,
    },
    inputBox: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#f55',
        borderRadius: 30,
        paddingHorizontal: 18,
        marginBottom: 25,
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
    actionBtn: {
        backgroundColor: '#f55',
        width: '100%',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: 20,
    },
    actionText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    backButton: {
        marginTop: 10,
    },
    backText: {
        color: '#f55',
        fontWeight: '500',
        fontSize: 16,
    },
});