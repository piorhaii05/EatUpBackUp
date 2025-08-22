import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { linkapi } from '../../navigation/config';

export default function EditAddressAdminScreen({ navigation, route }) {
    const { userId, address, userName, userPhone } = route.params;

    const [city, setCity] = useState(address?.city || '');
    const [ward, setWard] = useState(address?.ward || '');
    const [street, setStreet] = useState(address?.street || '');
    const [loading, setLoading] = useState(false);

    const isEditing = !!address?._id;

    useEffect(() => {
        setCity(address?.city || '');
        setWard(address?.ward || '');
        setStreet(address?.street || '');
    }, [address]);

    const handleSaveAddress = async () => {
        // Kiểm tra city không phải là giá trị mặc định (chuỗi rỗng)
        if (!city || !ward.trim() || !street.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin địa chỉ (Tỉnh/TP, Phường/Xã, Đường/Số nhà).');
            return;
        }

        setLoading(true);
        try {
            let res;
            let method;
            let url;
            let bodyData = {
                name: userName,
                phone: userPhone,
                city,
                ward,
                street
            };

            if (isEditing) {
                url = `${linkapi}address/update/${address._id}`;
                method = 'PUT';
            } else {
                url = `${linkapi}address/add`;
                method = 'POST';
                bodyData = { ...bodyData, user_id: userId, is_default: true };
            }

            res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error(`Lỗi ${isEditing ? 'cập nhật' : 'thêm'} địa chỉ:`, res.status, errorData);
                throw new Error(errorData.message || `Không thể ${isEditing ? 'cập nhật' : 'thêm'} địa chỉ.`);
            }

            Toast.show({
                type: 'success',
                text1: `${isEditing ? 'Cập nhật' : 'Thêm'} địa chỉ thành công!`,
            });

            navigation.navigate('HomeAdmin', { shouldRefreshAddress: true });

        } catch (error) {
            console.error(`Lỗi trong quá trình ${isEditing ? 'cập nhật' : 'thêm'} địa chỉ:`, error);
            Toast.show({ type: 'error', text1: 'Lỗi hệ thống', text2: error.message || `${isEditing ? 'Cập nhật' : 'Thêm'} địa chỉ thất bại. Vui lòng thử lại.` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.title}>{isEditing ? 'Chỉnh sửa Địa chỉ Nhà hàng' : 'Thêm Địa chỉ Nhà hàng'}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.label}>Tên người liên hệ:</Text>
                <TextInput
                    style={styles.inputDisabled}
                    value={userName || ''}
                    editable={false}
                />

                <Text style={styles.label}>Số điện thoại liên hệ:</Text>
                <TextInput
                    style={styles.inputDisabled}
                    value={userPhone || ''}
                    editable={false}
                    keyboardType="phone-pad"
                />

                {/* SỬ DỤNG PICKER VỚI 15 THÀNH PHỐ KHÔNG DẤU */}
                <Text style={styles.label}>Tỉnh/Thành phố:</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={city}
                        onValueChange={(itemValue) => setCity(itemValue)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Chọn Tỉnh/Thành phố" value="" />
                        <Picker.Item label="Ha Noi" value="Ha Noi" />
                        <Picker.Item label="Ho Chi Minh" value="Ho Chi Minh" />
                        <Picker.Item label="Da Nang" value="Da Nang" />
                        <Picker.Item label="Hai Phong" value="Hai Phong" />
                        <Picker.Item label="Can Tho" value="Can Tho" />
                        <Picker.Item label="Hue" value="Hue" />
                        <Picker.Item label="Nha Trang" value="Nha Trang" />
                        <Picker.Item label="Da Lat" value="Da Lat" />
                        <Picker.Item label="Vung Tau" value="Vung Tau" />
                        <Picker.Item label="Bien Hoa" value="Bien Hoa" />
                        <Picker.Item label="Buon Ma Thuot" value="Buon Ma Thuot" />
                        <Picker.Item label="Quy Nhon" value="Quy Nhon" />
                        <Picker.Item label="Long Xuyen" value="Long Xuyen" />
                        <Picker.Item label="Nam Dinh" value="Nam Dinh" />
                        <Picker.Item label="Thai Nguyen" value="Thai Nguyen" />
                    </Picker>
                </View>

                {/* Các trường còn lại giữ nguyên */}
                <Text style={styles.label}>Phường/Xã:</Text>
                <TextInput
                    placeholder="Phường/Xã*"
                    style={styles.input}
                    value={ward}
                    onChangeText={setWard}
                />
                <Text style={styles.label}>Tên đường, Tòa nhà, Số nhà:</Text>
                <TextInput
                    placeholder="Tên đường, Tòa nhà, Số nhà*"
                    style={styles.input}
                    value={street}
                    onChangeText={setStreet}
                    multiline={true}
                    numberOfLines={3}
                    textAlignVertical="top"
                />

                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAddress} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.saveText}>{isEditing ? 'Lưu Thay đổi' : 'Thêm Địa chỉ'}</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
            {/* <Toast /> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15, backgroundColor: '#ffffffff' },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backBtn: { padding: 5, marginRight: 10 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#000', flex: 1 },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
        marginTop: 10,
        marginLeft: 5,
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#ccc',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    inputDisabled: {
        borderWidth: 1.5,
        borderColor: '#e0e0e0',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        fontSize: 16,
        backgroundColor: '#f5f5f5',
        color: '#a0a0a0',
    },
    pickerContainer: {
        borderWidth: 1.5,
        borderColor: '#ccc',
        borderRadius: 10,
        marginBottom: 15,
        backgroundColor: '#fff',
        justifyContent: 'center',
    },
    picker: {
        height: 50,
        width: '100%',
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