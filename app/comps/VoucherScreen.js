import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
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
import { linkapi } from '../navigation/config';
import { formatPriceVND } from '../navigation/currency';

const { width } = Dimensions.get('window');

export default function VoucherScreen() {
    const navigation = useNavigation();
    const route = useRoute();

    const [activeTab, setActiveTab] = useState('available');
    const [allVouchers, setAllVouchers] = useState([]);
    const [availableVouchers, setAvailableVouchers] = useState([]);
    const [unavailableVouchers, setUnavailableVouchers] = useState([]);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userId, setUserId] = useState(null);

    const orderTotal = route.params?.orderTotal || 0;
    const selectedItems = route.params?.selectedItems || [];
    const restaurantId = selectedItems[0]?.restaurant_id;

    useEffect(() => {
        const fetchUserDataAndVouchers = async () => {
            try {
                const userString = await AsyncStorage.getItem('user');
                const user = userString ? JSON.parse(userString) : null;
                if (user?._id) {
                    setUserId(user._id);
                    await fetchVouchers(user._id, orderTotal, restaurantId);
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
    }, [orderTotal, restaurantId]);

    const fetchVouchers = useCallback(async (currentUserId, currentTotalAmount, currentRestaurantId) => {
        setLoading(true);
        setRefreshing(true);
        try {
            const res = await fetch(`${linkapi}vouchers`);
            if (!res.ok) {
                throw new Error(`Lỗi HTTP! trạng thái: ${res.status}`);
            }
            const data = await res.json();
            setAllVouchers(data);

            const now = new Date();
            const available = [];
            const unavailable = [];

            for (const voucher of data) {
                const startDate = new Date(voucher.start_date);
                const endDate = new Date(voucher.end_date);

                let isAvailable = true;
                let reasonUnavailable = '';
                const systemRestaurantId = "687cc05d14b65a03d366454f";

                // Điều kiện lọc voucher theo restaurant_id
                // Voucher có restaurant_id == null là voucher toàn hệ thống
                if (voucher.restaurant_id && voucher.restaurant_id !== currentRestaurantId && voucher.restaurant_id !== systemRestaurantId) {
                    isAvailable = false;
                    reasonUnavailable = 'Không áp dụng cho cửa hàng này';
                } else if (!voucher.active) {
                    isAvailable = false;
                    reasonUnavailable = 'Không hoạt động';
                } else if (now < startDate) {
                    isAvailable = false;
                    reasonUnavailable = 'Chưa đến thời gian áp dụng';
                } else if (now > endDate) {
                    isAvailable = false;
                    reasonUnavailable = 'Đã hết hạn';
                } else if (voucher.usage_limit !== null && voucher.used_count >= voucher.usage_limit) {
                    isAvailable = false;
                    reasonUnavailable = 'Đã hết lượt sử dụng';
                } else if (currentTotalAmount < voucher.min_order_amount) {
                    isAvailable = false;
                    reasonUnavailable = `Đơn tối thiểu ${formatPriceVND(voucher.min_order_amount)}`;
                }

                if (isAvailable) {
                    available.push(voucher);
                } else {
                    unavailable.push({ ...voucher, reason: reasonUnavailable });
                }
            }

            setAvailableVouchers(available);
            setUnavailableVouchers(unavailable);

        } catch (error) {
            console.error("Lỗi khi tải voucher:", error);
            Toast.show({ type: 'error', text1: 'Lỗi tải voucher', text2: error.message || 'Không thể tải danh sách voucher.' });
            setAvailableVouchers([]);
            setUnavailableVouchers([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const onRefresh = useCallback(() => {
        if (userId) {
            fetchVouchers(userId, orderTotal, restaurantId);
        }
    }, [userId, orderTotal, restaurantId, fetchVouchers]);

    const calculateDiscountAmount = (voucher) => {
        if (!voucher) return 0;

        let discountAmount = 0;
        if (voucher.discount_type === 'percentage') {
            discountAmount = orderTotal * (voucher.discount_value / 100);
            if (voucher.max_discount_amount !== null && discountAmount > voucher.max_discount_amount) {
                discountAmount = voucher.max_discount_amount;
            }
        } else if (voucher.discount_type === 'fixed') {
            discountAmount = voucher.discount_value;
        }
        return Math.min(discountAmount, orderTotal);
    };

    const handleSelectVoucher = (voucher) => {
        setSelectedVoucher(prev => (prev && prev._id === voucher._id ? null : voucher));
    };

    const handleApplyVoucher = async () => {
        if (!selectedVoucher) {
            Toast.show({ type: 'info', text1: 'Chưa chọn voucher', text2: 'Vui lòng chọn một voucher để áp dụng.' });
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`${linkapi}vouchers/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: selectedVoucher.code,
                    userId: userId,
                    totalAmount: orderTotal,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                Toast.show({ type: 'error', text1: 'Áp dụng thất bại', text2: data.message || 'Voucher không hợp lệ.' });
                setSelectedVoucher(null);
                return;
            }

            Toast.show({ type: 'success', text1: 'Áp dụng voucher thành công!', text2: `Giảm giá: ${data.discount_amount.toFixed(2)}$` });

            const voucherData = {
                appliedVoucher: selectedVoucher,
                discountAmount: data.discount_amount,
                voucherCode: selectedVoucher.code,
            };

            try {
                await AsyncStorage.setItem('appliedVoucherData', JSON.stringify(voucherData));
                console.log('Voucher data saved successfully!');
            } catch (error) {
                console.error('Error saving voucher data:', error);
            }

            // Sau khi lưu xong, gọi goBack để quay lại màn hình trước đó
            navigation.goBack();
            // navigation.navigate({
            //     name: 'Checkout',
            //     params: {
            //         appliedVoucher: selectedVoucher,
            //         discountAmount: data.discount_amount,
            //         voucherCode: selectedVoucher.code,
            //         selectedItems: selectedItems,
            //     },
            //     merge: true,
            // });

        } catch (error) {
            console.error("Lỗi khi áp dụng voucher:", error);
            Toast.show({ type: 'error', text1: 'Lỗi', text2: error.message || 'Có lỗi xảy ra khi áp dụng voucher.' });
        } finally {
            setLoading(false);
        }
    };



    const renderVoucherItem = ({ item }) => {
        const isSelected = selectedVoucher && selectedVoucher._id === item._id;
        const discountText = item.discount_type === 'percentage'
            ? `${item.discount_value}%`
            : formatPriceVND(item.discount_value);

        const minOrderText = item.min_order_amount > 0
            ? `, đơn tối thiểu ${formatPriceVND(item.min_order_amount)}`
            : '';

        const maxDiscountText = item.discount_type === 'percentage' && item.max_discount_amount !== null
            ? `, tối đa ${formatPriceVND(item.max_discount_amount)}`
            : '';

        const systemRestaurantId = "687cc05d14b65a03d366454f";
        const voucherConditionsText = item.restaurant_id === systemRestaurantId
            ? "Cho toàn bộ sản phẩm"
            : `Cho nhà hàng: ${item.name || 'Không xác định'}`;

        return (
            <TouchableOpacity
                style={[styles.voucherCard, isSelected && styles.selectedVoucherCard]}
                onPress={() => handleSelectVoucher(item)}
                disabled={activeTab === 'unavailable'}
            >
                <View style={styles.voucherIconContainer}>
                    <Feather name="gift" size={30} color="#fff" />
                </View>
                <View style={styles.voucherDetails}>
                    <Text style={styles.voucherTitle}>Deal Hot!</Text>
                    <Text style={styles.voucherDescription}>Giảm {discountText}{minOrderText}{maxDiscountText}</Text>
                    <Text style={styles.voucherCode}>Mã: {item.code}</Text>
                    <Text style={styles.voucherDates}>
                        {new Date(item.start_date).toLocaleDateString('vi-VN')} - {new Date(item.end_date).toLocaleDateString('vi-VN')}
                    </Text>
                    <Text style={styles.voucherConditions}>{voucherConditionsText}</Text>
                    {activeTab === 'unavailable' && item.reason && (
                        <Text style={styles.unavailableReason}>Lý do: {item.reason}</Text>
                    )}
                </View>
                {activeTab === 'available' && (
                    <View style={styles.checkboxContainer}>
                        {isSelected ? (
                            <Feather name="check-square" size={24} color="#f55" />
                        ) : (
                            <Feather name="square" size={24} color="#ccc" />
                        )}
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const totalSaved = selectedVoucher ? calculateDiscountAmount(selectedVoucher) : 0;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Voucher</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.tabContainer}>
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
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#f55" />
                    <Text style={{ marginTop: 10, fontSize: 16, color: '#555' }}>Đang tải voucher...</Text>
                </View>
            ) : (
                <FlatList
                    data={activeTab === 'available' ? availableVouchers : unavailableVouchers}
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
                                {activeTab === 'available' ? 'Bạn chưa có voucher nào khả dụng.' : 'Không có voucher không khả dụng.'}
                            </Text>
                        </View>
                    )}
                />
            )}

            <View style={styles.bottomBar}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                        {selectedVoucher ? '1 Phiếu giảm giá đã chọn' : '0 Phiếu giảm giá đã chọn'}
                    </Text>
                    <View style={styles.savedAmountContainer}>
                        <Text style={styles.summaryLabel}>Tiết kiệm:</Text>
                        <Text style={styles.savedAmount}>{formatPriceVND(totalSaved)}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={[styles.applyButton, (!selectedVoucher || loading) && styles.applyButtonDisabled]}
                    onPress={handleApplyVoucher}
                    disabled={!selectedVoucher || loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.applyButtonText}>ĐỒNG Ý</Text>
                    )}
                </TouchableOpacity>
            </View>
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
    flatListContent: {
        paddingHorizontal: 15,
        paddingTop: 15,
        paddingBottom: 100,
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
    selectedVoucherCard: {
        borderColor: '#f55',
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
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    voucherDescription: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    voucherCode: {
        fontSize: 13,
        color: '#888',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    voucherDates: {
        fontSize: 12,
        color: '#888',
        marginBottom: 2,
    },
    voucherConditions: {
        fontSize: 12,
        color: '#666',
    },
    unavailableReason: {
        fontSize: 12,
        color: '#d9534f',
        marginTop: 5,
        fontWeight: 'bold',
    },
    checkboxContainer: {
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
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
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    summaryLabel: {
        fontSize: 15,
        color: '#555',
    },
    savedAmountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    savedAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#f55',
        marginLeft: 5,
    },
    applyButton: {
        backgroundColor: '#f55',
        paddingVertical: 14,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyButtonDisabled: {
        backgroundColor: '#ccc',
    },
    applyButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});