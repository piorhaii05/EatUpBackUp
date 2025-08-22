import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { linkapi } from '../navigation/config';

export default function EditNamePhoneScreen({ navigation }) {
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
                text1: 'Lỗi',
                text2: 'Vui lòng nhập họ và tên.',
            });
            return;
        }
        if (!phone.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Vui lòng nhập số điện thoại.',
            });
            return;
        }

        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone)) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi định dạng',
                text2: 'Số điện thoại không hợp lệ. Vui lòng nhập đủ 10 chữ số.',
            });
            return;
        }

        try {
            const res = await fetch(linkapi + 'update/' + user._id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone }),
            });

            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const updatedUser = await res.json();
                if (res.ok) {
                    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                    Toast.show({
                        type: 'success',
                        text1: 'Cập nhật thành công!',
                    });
                    
                    // <-- THAY ĐỔI TẠI ĐÂY -->
                    // Thay vì chỉ goBack(), truyền tham số `shouldRefresh` về màn hình trước
                    // Điều này sẽ kích hoạt useEffect của ProfileScreen nếu nó lắng nghe params
                    navigation.navigate('Home', { shouldRefresh: true }); 
                    // Hoặc đơn giản là navigation.goBack() nếu ProfileScreen vẫn dùng useFocusEffect
                    // Nếu bạn chỉ muốn cập nhật khi có thay đổi từ màn hình này,
                    // thì ProfileScreen nên dùng useFocusEffect, và EditNamePhoneScreen chỉ cần goBack().
                    // Nhưng nếu bạn muốn kích hoạt cụ thể, dùng navigate kèm params.
                } else {
                    throw new Error(updatedUser.message || `Server responded with status ${res.status}`);
                }
            } else {
                const textResponse = await res.text();
                if (!res.ok) {
                    throw new Error(`Server error: ${res.status} - ${textResponse}`);
                }
                console.warn("Server response was not JSON but status OK:", textResponse);
                Toast.show({
                    type: 'success',
                    text1: 'Cập nhật thành công (có thể có lỗi phản hồi dữ liệu).',
                });
                navigation.navigate('Profile', { shouldRefresh: true }); // Vẫn truyền tham số refresh
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật thông tin:", error);
            Toast.show({
                type: 'error',
                text1: 'Cập nhật thất bại',
                text2: error.message || 'Có lỗi xảy ra, vui lòng thử lại.',
            });
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.title}>Thông tin cá nhân</Text>
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
                    onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    maxLength={10}
                />
                <Text style={styles.counter}>{phone.length}/10</Text>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>LƯU</Text>
            </TouchableOpacity>
            {/* <Toast /> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15, backgroundColor: '#fff' },
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