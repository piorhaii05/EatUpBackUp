import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { linkapi } from '../navigation/config'; // Đảm bảo đường dẫn này đúng
import { formatPriceVND } from '../navigation/currency';

const { width } = Dimensions.get('window');

export default function VoucherListScreen() {
    const navigation = useNavigation();

    const [allVouchers, setAllVouchers] = useState([]); // Sẽ chỉ dùng biến này để lưu và hiển thị
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userId, setUserId] = useState(null); // Giữ lại để có thể dùng cho các logic sau này nếu cần

    useEffect(() => {
        const fetchUserDataAndVouchers = async () => {
            try {
                const userString = await AsyncStorage.getItem('user');
                const user = userString ? JSON.parse(userString) : null;
                if (user?._id) {
                    setUserId(user._id);
                    await fetchVouchers(); // Không cần truyền orderTotal hay userId vào đây nữa
                } else {
                    Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không tìm thấy thông tin người dùng.' });
                    setLoading(false);
                }
            } catch (error) {
                console.error("Lỗi khi lấy user ID hoặc voucher:", error);
                Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể tải dữ liệu.' });
                setLoading(false);
            }
        };
        fetchUserDataAndVouchers();
    }, []);

    const fetchVouchers = useCallback(async () => { // Bỏ các tham số currentUserId, currentTotalAmount
        setLoading(true);
        setRefreshing(true);
        try {
            const res = await fetch(`${linkapi}vouchers`);
            if (!res.ok) {
                throw new Error(`Lỗi HTTP! trạng thái: ${res.status}`);
            }
            const data = await res.json();
            setAllVouchers(data); // Lưu tất cả voucher vào biến allVouchers

        } catch (error) {
            console.error("Lỗi khi tải voucher:", error);
            Toast.show({ type: 'error', text1: 'Lỗi tải voucher', text2: error.message || 'Không thể tải danh sách voucher.' });
            setAllVouchers([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const onRefresh = useCallback(() => {
        fetchVouchers(); // Chỉ gọi fetchVouchers
    }, [fetchVouchers]);

    // Hàm render item voucher, không có checkbox hay chức năng chọn, và không hiển thị lý do
    const renderVoucherItem = ({ item }) => {
        const discountText = item.discount_type === 'percentage'
            ? `${item.discount_value}%`
            : formatPriceVND(item.discount_value);

        const minOrderText = item.min_order_amount > 0
            ? `, đơn tối thiểu ${formatPriceVND(item.min_order_amount)}`
            : '';

        const maxDiscountText = item.discount_type === 'percentage' && item.max_discount_amount !== null
            ? `, tối đa ${formatPriceVND(item.max_discount_amount)}`
            : '';

        return (
            <View style={styles.voucherCard}>
                <View style={styles.voucherIconContainer}>
                    <Feather name="gift" size={30} color="#fff" />
                </View>
                <View style={styles.voucherDetails}>
                    <Text style={styles.voucherTitle}>Deal Hot!</Text>
                    <Text style={styles.voucherDescription}>Giảm {discountText}{minOrderText}{maxDiscountText}</Text>
                    <Text style={styles.voucherCode}>Mã: {item.code}</Text>
                    <Text style={styles.voucherDates}>
                        {new Date(item.start_date).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })} - {new Date(item.end_date).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tất cả Voucher</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Loại bỏ phần tabContainer */}
            {/* <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'available' && styles.activeTabButton]}
                    onPress={() => setActiveTab('available')}
                >
                    <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>Có sẵn</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'unavailable' && styles.activeTabButton]}
                    onPress={() => setActiveTab('unavailable')}
                >
                    <Text style={[styles.tabText, activeTab === 'unavailable' && styles.activeTabText]}>Không khả dụng</Text>
                </TouchableOpacity>
            </View> */}

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#f55" />
                    <Text style={{ marginTop: 10, fontSize: 16, color: '#555' }}>Đang tải voucher...</Text>
                </View>
            ) : (
                <FlatList
                    data={allVouchers} // Luôn hiển thị allVouchers
                    renderItem={renderVoucherItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.flatListContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f55']} />
                    }
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Feather name="box" size={80} color="#ccc" />
                            <Text style={styles.emptyText}>
                                Hiện tại không có voucher nào.
                            </Text>
                        </View>
                    )}
                />
            )}
            {/* <Toast /> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    // Loại bỏ các style liên quan đến tabContainer, tabButton, tabText, activeTabButton, activeTabText
    /*
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 15,
        borderRadius: 8,
        marginTop: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eee',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    activeTabButton: {
        backgroundColor: '#f55',
    },
    tabText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#555',
    },
    activeTabText: {
        color: '#fff',
    },
    */
    flatListContent: {
        paddingHorizontal: 15,
        paddingTop: 15,
        paddingBottom: 20,
    },
    voucherCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    voucherIconContainer: {
        width: 70,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f55',
        paddingVertical: 15,
    },
    voucherDetails: {
        flex: 1,
        padding: 12,
    },
    voucherTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    voucherDescription: {
        fontSize: 16,
        color: '#333',
        marginBottom: 4,
    },
    voucherCode: {
        fontSize: 15,
        color: '#888',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    voucherDates: {
        fontSize: 14,
        color: '#888',
        marginBottom: 2,
    },
    voucherConditions: {
        fontSize: 14,
        color: '#666',
    },
    // Loại bỏ unavailableReason vì không còn hiển thị lý do
    /*
    unavailableReason: {
        fontSize: 12,
        color: '#d9534f',
        marginTop: 5,
        fontWeight: 'bold',
    },
    */
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
        marginTop: 10,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});