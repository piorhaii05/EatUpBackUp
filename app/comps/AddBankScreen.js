import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { linkapi } from '../navigation/config';

export default function AddBankScreen({ navigation }) {
    const [cardHolder, setCardHolder] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');

    const handleAddBank = async () => {
        // Validate các trường nhập liệu
        if (!cardHolder || !cardNumber || !expiryDate || !cvv) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Vui lòng nhập đầy đủ thông tin.'
            });
            return;
        }

        // Validate số tài khoản (16 chữ số và chỉ là số)
        const cardNumberRegex = /^\d{16}$/;
        if (!cardNumberRegex.test(cardNumber)) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Số tài khoản không hợp lệ. Vui lòng nhập đủ 16 chữ số.'
            });
            return;
        }

        // Validate CVV (3 hoặc 4 chữ số)
        const cvvRegex = /^\d{3,4}$/;
        if (!cvvRegex.test(cvv)) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Mã CVV không hợp lệ. Vui lòng nhập 3 hoặc 4 chữ số.'
            });
            return;
        }

        // Validate ngày hết hạn (MM/YY)
        const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
        if (!expiryRegex.test(expiryDate)) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Ngày hết hạn không hợp lệ. Định dạng phải là MM/YY.'
            });
            return;
        }
        
        const [month, year] = expiryDate.split('/').map(Number);
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;

        // Cập nhật logic: Năm không được nhỏ hơn năm hiện tại. Nếu bằng năm hiện tại thì tháng không được nhỏ hơn tháng hiện tại.
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Ngày hết hạn không được nhỏ hơn tháng/năm hiện tại.'
            });
            return;
        }


        try {
            const userString = await AsyncStorage.getItem('user');
            const user = JSON.parse(userString);

            const response = await fetch(linkapi + 'bank/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user._id,
                    card_number: cardNumber,
                    card_holder: cardHolder,
                    expiry_date: expiryDate
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Thêm tài khoản thất bại.');
            }

            Toast.show({
                type: 'success',
                text1: 'Thêm tài khoản thành công!',
            });

            navigation.goBack();
        } catch (error) {
            console.error(error);
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: error.message || 'Đã xảy ra lỗi khi thêm tài khoản.'
            });
        }
    };

    const formatCardNumber = (number) => {
        return number.replace(/\d{4}(?=.)/g, '$& ');
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.title}>Thêm tài khoản ngân hàng</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Visual Card */}
                <View style={styles.card}>
                    <View style={styles.cardTop}>
                        <Image
                            source={require('../../assets/images/mastercard.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.expiry}>{expiryDate || 'MM/YY'}</Text>
                    </View>

                    <Text style={styles.cardNumber}>
                        {cardNumber ? formatCardNumber(cardNumber) : '**** **** **** ****'}
                    </Text>

                    <View style={styles.cardBottom}>
                        <View>
                            <Text style={styles.label}>Card Holder</Text>
                            <Text style={styles.value}>{cardHolder || 'Chưa cập nhật'}</Text>
                        </View>
                    </View>
                </View>

                {/* Input Fields */}
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Họ và Tên</Text>
                    <TextInput
                        placeholder="Nguyễn Văn A"
                        style={styles.input}
                        value={cardHolder}
                        onChangeText={setCardHolder}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Số tài khoản</Text>
                    <TextInput
                        placeholder="0000 0000 0000 0000"
                        style={styles.input}
                        value={cardNumber}
                        onChangeText={setCardNumber}
                        keyboardType="numeric"
                        maxLength={16}
                    />
                </View>

                <View style={styles.row}>
                    <View style={styles.inputGroupCol}>
                        <Text style={styles.inputLabel}>CVV</Text>
                        <TextInput
                            placeholder="123"
                            style={styles.input}
                            value={cvv}
                            onChangeText={setCvv}
                            keyboardType="numeric"
                            maxLength={4}
                        />
                    </View>
                    <View style={styles.inputGroupCol}>
                        <Text style={styles.inputLabel}>Ngày hết hạn</Text>
                        <TextInput
                            placeholder="MM/YY"
                            style={styles.input}
                            value={expiryDate}
                            onChangeText={setExpiryDate}
                            maxLength={5}
                        />
                    </View>
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleAddBank}>
                    <Text style={styles.saveText}>HOÀN THÀNH</Text>
                </TouchableOpacity>
            </ScrollView>
            <Toast />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15, backgroundColor: '#fff',},
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backBtn: { padding: 5, marginRight: 10 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#000' },

    card: {
        backgroundColor: '#222',
        borderRadius: 15,
        padding: 20,
        marginBottom: 25,
        elevation: 3,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logo: { width: 50, height: 30 },
    expiry: { color: '#fff', fontSize: 16 },
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

    // New styles for labels and input groups
    inputGroup: { marginBottom: 15 },
    inputGroupCol: { flex: 1, marginRight: 10 },
    inputLabel: {
        fontSize: 14,
        color: '#555',
        marginBottom: 5,
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#ccc',
        borderRadius: 10,
        padding: 18,
        fontSize: 16,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    saveBtn: {
        backgroundColor: '#f55',
        padding: 18,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: 10,
    },
    saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});