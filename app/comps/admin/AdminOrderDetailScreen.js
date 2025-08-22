import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { linkanh, linkapi } from '../../navigation/config'; // Đảm bảo đường dẫn này đúng
import { formatPriceVND } from '../../navigation/currency';


const BASE_URL = linkapi;

const STATUS_DISPLAY_NAMES = {
    'Pending': 'Đang chờ xử lý',
    'Processing': 'Đang xử lý',
    'Delivered': 'Đã giao hàng',
    'Cancelled': 'Đã hủy',
    'Rated': 'Đã đánh giá', // THÊM TRẠNG THÁI MỚI 'Rated'
};

const getStatusColor = (status) => {
    switch (status) {
        case 'Pending': return '#e67e22'; // Vàng cam
        case 'Processing': return '#3498db'; // Xanh dương
        case 'Delivered': return '#27ae60'; // Xanh lá
        case 'Cancelled': return '#c0392b'; // Đỏ
        case 'Rated': return '#8e44ad'; // Tím (màu đã dùng cho trạng thái Rated ở màn hình ManageOrdersScreen)
        default: return '#666';
    }
};

export default function AdminOrderDetailScreen({ route, navigation }) {
    // Ưu tiên lấy 'order' object nếu được truyền, nếu không thì dùng orderId và restaurantId
    const { order: initialOrder, orderId: routeOrderId, restaurantId: routeRestaurantId } = route.params;

    const [orderDetail, setOrderDetail] = useState(initialOrder || null); // Sử dụng initialOrder nếu có
    const [loading, setLoading] = useState(!initialOrder); // Nếu có initialOrder thì không cần loading ban đầu
    const [error, setError] = useState(null);

    const fetchOrderDetail = useCallback(async () => {
        // Nếu đã có initialOrder, không cần fetch lại ngay lập tức trừ khi refresh thủ công
        // Nhưng nếu orderDetail bị null (ví dụ: truy cập trực tiếp bằng orderId, không qua ManageOrdersScreen)
        // hoặc khi cần refresh, thì vẫn fetch.
        if (orderDetail && initialOrder) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const currentOrderId = initialOrder?._id || routeOrderId;
            const currentRestaurantId = initialOrder?.restaurant_id || routeRestaurantId; // Lấy restaurant_id từ order nếu có

            if (!currentOrderId || !currentRestaurantId) {
                throw new Error("Thiếu ID đơn hàng hoặc ID nhà hàng để tải chi tiết.");
            }

            const response = await fetch(`${BASE_URL}admin/order/detail/${currentOrderId}/${currentRestaurantId}`, {
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Lỗi khi tải chi tiết đơn hàng.');
            }

            const data = await response.json();
            setOrderDetail(data);
        } catch (err) {
            setError(err.message);
            Toast.show({ type: 'error', text1: 'Lỗi tải chi tiết', text2: err.message });
            console.error("Lỗi khi tải chi tiết đơn hàng:", err);
        } finally {
            setLoading(false);
        }
    }, [initialOrder, routeOrderId, routeRestaurantId, orderDetail]); // Thêm orderDetail vào dependency array để re-fetch nếu nó trở thành null

    useFocusEffect(
        useCallback(() => {
            fetchOrderDetail();
        }, [fetchOrderDetail])
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#f55" />
                <Text style={styles.loadingText}>Đang tải chi tiết đơn hàng...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Lỗi: {error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchOrderDetail}>
                    <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!orderDetail) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Không tìm thấy chi tiết đơn hàng này.</Text>
                <TouchableOpacity style={styles.backButtonEmpty} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonEmptyText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Đảm bảo user_id và address_id được populated từ backend
    const customerName = orderDetail.user_id?.name || 'Khách hàng ẩn danh';
    const customerPhone = orderDetail.user_id?.phone || 'Không có';
    const customerAddress = orderDetail.address_id
        ? `${orderDetail.address_id.street}, ${orderDetail.address_id.ward}, ${orderDetail.address_id.city}`
        : 'Chưa cập nhật';
    const orderDate = new Date(orderDetail.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
    const orderTime = new Date(orderDetail.createdAt).toLocaleTimeString('vi-VN', {
        hour: '2-digit', minute: '2-digit'
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                {/* Thông tin chung của đơn hàng */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thông tin đơn hàng</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Mã đơn hàng:</Text>
                        <Text style={styles.infoValue}>#{orderDetail._id.slice(-6).toUpperCase()}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Ngày đặt:</Text>
                        <Text style={styles.infoValue}>{orderDate} lúc {orderTime}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Tổng tiền:</Text>
                        <Text style={[styles.infoValue, styles.totalAmountDetail]}>
                            {formatPriceVND(orderDetail.total_amount)}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Trạng thái:</Text>
                        <Text style={[styles.infoValue, { color: getStatusColor(orderDetail.status), fontWeight: 'bold' }]}>
                            {STATUS_DISPLAY_NAMES[orderDetail.status] || orderDetail.status}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Phương thức TT:</Text>
                        <Text style={styles.infoValue}>{orderDetail.payment_method}</Text>
                    </View>
                </View>

                {/* Thông tin khách hàng */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Tên khách hàng:</Text>
                        <Text style={styles.infoValue}>{customerName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Số điện thoại:</Text>
                        <Text style={styles.infoValue}>{customerPhone}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Địa chỉ giao hàng:</Text>
                        <Text style={styles.infoValue}>{customerAddress}</Text>
                    </View>
                    {orderDetail.notes && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Ghi chú:</Text>
                            <Text style={styles.infoValue}>{orderDetail.notes}</Text>
                        </View>
                    )}
                </View>

                {/* Danh sách sản phẩm */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sản phẩm đã đặt ({orderDetail.items.length})</Text>
                    {orderDetail.items.map((item, index) => (
                        <View key={index} style={styles.productItem}>
                            {item.product_image && (
                                <Image source={{ uri: linkanh + item.product_image }} style={styles.productImage} />
                            )}
                            <View style={styles.productInfo}>
                                <Text style={styles.productName}>{item.product_name}</Text>
                                <Text style={styles.productDetails}>
                                        {formatPriceVND(item.price)} x {item.quantity}
                                </Text>
                            </View>
                            <Text style={styles.productTotalPrice}>
                                {formatPriceVND(item.price * item.quantity)}
                            </Text>
                        </View>
                    ))}
                </View>

            </ScrollView>
            {/* <Toast /> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    backButton: {
        padding: 5,
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
        marginRight: 40, // Để cân đối với nút back
    },
    scrollViewContent: {
        padding: 15,
        paddingBottom: 30, // Đảm bảo có khoảng trống cuối cùng
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
        paddingBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 15,
        color: '#666',
        flex: 1,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        flex: 2,
        textAlign: 'right',
    },
    totalAmountDetail: {
        color: '#e74c3c',
        fontSize: 16,
        fontWeight: 'bold',
    },
    productItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f9f9f9',
        justifyContent: 'space-between',
    },
    productImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 10,
        backgroundColor: '#e0e0e0',
    },
    productInfo: {
        flex: 1,
        marginRight: 10,
    },
    productName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    productDetails: {
        fontSize: 13,
        color: '#777',
    },
    productTotalPrice: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#e74c3c',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F7F7F7',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#ffe6e6',
        borderRadius: 8,
        margin: 10,
    },
    errorText: {
        fontSize: 16,
        color: '#cc0000',
        textAlign: 'center',
        marginBottom: 15,
    },
    retryButton: {
        backgroundColor: '#007bff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F7F7F7',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    backButtonEmpty: {
        backgroundColor: '#007bff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    backButtonEmptyText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});