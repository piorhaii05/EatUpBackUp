import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { linkapi } from '../../navigation/config';

const AddVoucherScreen = ({ navigation }) => {
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [discountType, setDiscountType] = useState('');
    const [discountValue, setDiscountValue] = useState('');
    const [minOrderAmount, setMinOrderAmount] = useState('');
    const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [usageLimit, setUsageLimit] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAddVoucher = async () => {
        // Validation cơ bản (có thể mở rộng thêm)
        if (!code.trim() || !description.trim() || !discountType.trim() ||
            !discountValue.trim() || !startDate.trim() || !endDate.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Thiếu thông tin!',
                text2: 'Vui lòng điền đầy đủ các trường bắt buộc.'
            });
            return;
        }

        const numDiscountValue = Number(discountValue);
        const numMinOrderAmount = Number(minOrderAmount);
        const numMaxDiscountAmount = Number(maxDiscountAmount);
        const numUsageLimit = Number(usageLimit);

        if (discountType === 'percentage') {
            if (isNaN(numDiscountValue) || numDiscountValue <= 0 || numDiscountValue > 100) {
                Toast.show({
                    type: 'error',
                    text1: 'Giá trị giảm giá không hợp lệ!',
                    text2: 'Với loại phần trăm, giá trị phải từ 1 đến 100.'
                });
                return;
            }
        } else if (discountType === 'fixed') {
            if (isNaN(numDiscountValue) || numDiscountValue <= 0) {
                Toast.show({
                    type: 'error',
                    text1: 'Giá trị giảm giá không hợp lệ!',
                    text2: 'Với loại cố định, giá trị phải là số dương.'
                });
                return;
            }
        }
        if (minOrderAmount && (isNaN(numMinOrderAmount) || numMinOrderAmount < 0)) {
            Toast.show({
                type: 'error',
                text1: 'Giá trị đơn hàng tối thiểu không hợp lệ!',
                text2: 'Vui lòng nhập một số dương.'
            });
            return;
        }
        if (maxDiscountAmount && (isNaN(numMaxDiscountAmount) || numMaxDiscountAmount < 0)) {
            Toast.show({
                type: 'error',
                text1: 'Giá trị giảm tối đa không hợp lệ!',
                text2: 'Vui lòng nhập một số dương.'
            });
            return;
        }

        if (discountType === 'percentage' && maxDiscountAmount && numMaxDiscountAmount < (numMinOrderAmount * numDiscountValue / 100)) {
            Toast.show({
                type: 'error',
                text1: 'Giá trị giảm tối đa quá thấp!',
                text2: 'Giảm tối đa phải lớn hơn hoặc bằng giá trị giảm thực tế ở đơn hàng tối thiểu.'
            });
            return;
        }

        // Kiểm tra logic: minOrderAmount phải lớn hơn giá trị giảm giá (đối với fixed)
        if (discountType === 'fixed' && minOrderAmount && numMinOrderAmount < numDiscountValue) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi giá trị!',
                text2: 'Đơn hàng tối thiểu không thể nhỏ hơn giá trị giảm giá.'
            });
            return;
        }

        // Validate số lượt sử dụng
        if (usageLimit && (isNaN(numUsageLimit) || numUsageLimit < 1)) {
            Toast.show({
                type: 'error',
                text1: 'Số lượt sử dụng không hợp lệ!',
                text2: 'Vui lòng nhập một số nguyên dương.'
            });
            return;
        }
        if (discountType !== 'percentage' && discountType !== 'fixed') {
            Toast.show({
                type: 'error',
                text1: 'Lỗi loại giảm giá',
                text2: "Loại giảm giá phải là 'percentage' hoặc 'fixed'."
            });
            return;
        }

        // --- Thêm kiểm tra ngày ở đây ---
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi định dạng ngày!',
                text2: 'Vui lòng nhập ngày theo định dạng YYYY-MM-DD.'
            });
            return;
        }

        if (end < start) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi ngày tháng!',
                text2: 'Ngày kết thúc phải sau ngày bắt đầu.'
            });
            return;
        }
        // --- Kết thúc kiểm tra ngày ---

        setLoading(true);
        const restaurant_id = await AsyncStorage.getItem('restaurant_id');
        if (!restaurant_id) {
            setLoading(false);
            Toast.show({
                type: 'error',
                text1: 'Lỗi xác thực',
                text2: 'Không tìm thấy ID nhà hàng. Vui lòng thử lại đăng nhập.'
            });
            return;
        }

        try {
            const response = await fetch(linkapi + 'vouchers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    description,
                    discount_type: discountType,
                    discount_value: Number(discountValue),
                    min_order_amount: minOrderAmount ? Number(minOrderAmount) : null,
                    max_discount_amount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
                    start_date: startDate,
                    end_date: endDate,
                    usage_limit: usageLimit ? Number(usageLimit) : null,
                    restaurant_id
                })
            });

            const data = await response.json();
            if (response.ok) {
                Toast.show({
                    type: 'success',
                    text1: 'Thành công!',
                    text2: 'Đã thêm voucher mới.',
                    onHide: () => { navigation.navigate('HomeAdmin', { shouldRefresh: true }); }
                });


            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Thêm voucher thất bại!',
                    text2: 'Thông tin voucher không hợp lệ.'
                });
            }
        } catch (error) {
            console.error('Add voucher error:', error);
            Toast.show({
                type: 'error',
                text1: 'Lỗi hệ thống!',
                text2: 'Không thể thêm voucher. Vui lòng kiểm tra kết nối mạng.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.fullScreenContainer}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={26} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Thêm Voucher Mới</Text>
                <View style={{ width: 26 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <Text style={styles.inputLabel}>Mã voucher <Text style={styles.requiredIndicator}>*</Text></Text>
                <TextInput style={styles.input} placeholder="VD: SUMMER2025" value={code} onChangeText={setCode} />

                <Text style={styles.inputLabel}>Mô tả <Text style={styles.requiredIndicator}>*</Text></Text>
                <TextInput
                    style={styles.inputMultiline}
                    placeholder="VD: Giảm 25% cho tất cả các đơn hàng trong mùa hè"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                />

                <Text style={styles.inputLabel}>Loại giảm giá <Text style={styles.requiredIndicator}>*</Text></Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={discountType}
                        onValueChange={(itemValue) => setDiscountType(itemValue)}
                        style={{ color: '#333' }}
                    >
                        <Picker.Item label="Chọn loại..." value="" />
                        <Picker.Item label="Phần trăm (%)" value="percentage" />
                        <Picker.Item label="Giá trị cố định (₫)" value="fixed" />
                    </Picker>
                </View>

                <Text style={styles.inputLabel}>Giá trị giảm <Text style={styles.requiredIndicator}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    placeholder="VD: 25 (cho %) hoặc 50000 (cho VND)"
                    keyboardType="numeric"
                    value={discountValue}
                    onChangeText={setDiscountValue}
                />

                <Text style={styles.inputLabel}>Giá trị đơn hàng tối thiểu</Text>
                <TextInput
                    style={styles.input}
                    placeholder="VD: 20000"
                    keyboardType="numeric"
                    value={minOrderAmount}
                    onChangeText={setMinOrderAmount}
                />

                <Text style={styles.inputLabel}>Giá trị giảm tối đa</Text>
                <TextInput
                    style={styles.input}
                    placeholder="VD: 20000"
                    keyboardType="numeric"
                    value={maxDiscountAmount}
                    onChangeText={setMaxDiscountAmount}
                />

                <Text style={styles.inputLabel}>Ngày bắt đầu (YYYY-MM-DD) <Text style={styles.requiredIndicator}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    placeholder="VD: 2025-06-01"
                    value={startDate}
                    onChangeText={setStartDate}
                />

                <Text style={styles.inputLabel}>Ngày hết hạn (YYYY-MM-DD) <Text style={styles.requiredIndicator}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    placeholder="VD: 2025-07-31"
                    value={endDate}
                    onChangeText={setEndDate}
                />

                <Text style={styles.inputLabel}>Số lượt sử dụng tối đa</Text>
                <TextInput
                    style={styles.input}
                    placeholder="VD: 100"
                    keyboardType="numeric"
                    value={usageLimit}
                    onChangeText={setUsageLimit}
                />

                <TouchableOpacity style={styles.addButton} onPress={handleAddVoucher} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.addButtonText}>Thêm Voucher</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        backgroundColor: '#F7F9FC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 4,
    },
    backButton: {
        padding: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    scrollViewContent: {
        padding: 20,
        paddingBottom: 40,
        flexGrow: 1,
    },
    inputLabel: {
        fontSize: 14,
        color: '#555',
        marginBottom: 8,
        fontWeight: '500',
    },
    requiredIndicator: {
        color: 'red',
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D9E6',
        borderRadius: 12,
        padding: 14,
        marginBottom: 20,
        backgroundColor: '#FFFFFF',
        fontSize: 16,
        color: '#333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    inputMultiline: {
        borderWidth: 1,
        borderColor: '#D1D9E6',
        borderRadius: 12,
        padding: 14,
        marginBottom: 20,
        backgroundColor: '#FFFFFF',
        fontSize: 16,
        color: '#333',
        minHeight: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#D1D9E6',
        borderRadius: 12,
        marginBottom: 20,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    addButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});

export default AddVoucherScreen;