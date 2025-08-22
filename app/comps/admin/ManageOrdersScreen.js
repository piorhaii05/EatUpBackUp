import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { linkapi } from '../../navigation/config'; // Đảm bảo đường dẫn này đúng
import { formatPriceVND } from '../../navigation/currency';

// === ĐỊNH NGHĨA TẤT CẢ HẰNG SỐ TRỰC TIẾP TRONG FILE NÀY ===
const BASE_URL = linkapi;

const ORDER_STATUSES = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    RATED: 'Rated', // Giữ nguyên để hiển thị trạng thái này nếu có
};

const STATUS_DISPLAY_NAMES = {
    [ORDER_STATUSES.PENDING]: 'Đang chờ xử lý',
    [ORDER_STATUSES.PROCESSING]: 'Đang xử lý',
    [ORDER_STATUSES.DELIVERED]: 'Đã giao hàng',
    [ORDER_STATUSES.CANCELLED]: 'Đã hủy',
    [ORDER_STATUSES.RATED]: 'Đã đánh giá',
};
// ================================================================

// --- Component phụ trợ OrderItem cho danh sách ---
const OrderItem = ({ order, onUpdateStatus, onDeleteOrder, onViewDetail }) => {
    const isPending = order.status === ORDER_STATUSES.PENDING;
    const isProcessing = order.status === ORDER_STATUSES.PROCESSING;
    const isCancelled = order.status === ORDER_STATUSES.CANCELLED;
    // const isDelivered = order.status === ORDER_STATUSES.DELIVERED; // Không cần nữa cho logic này
    // const isRated = order.status === ORDER_STATUSES.RATED; // Không cần nữa cho logic này

    const customerName = order.user_id?.name || 'Khách hàng ẩn danh';
    const orderDate = new Date(order.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
    const orderTime = new Date(order.createdAt).toLocaleTimeString('vi-VN', {
        hour: '2-digit', minute: '2-digit'
    });

    const handleConfirmProcess = () => {
        Alert.alert(
            "Xác nhận xử lý đơn hàng",
            `Bạn có chắc muốn chuyển đơn hàng #${order._id.substring(order._id.length - 4)} sang trạng thái "Đang xử lý"?`,
            [
                { text: "Hủy", style: "cancel" },
                { text: "Xác nhận", onPress: () => onUpdateStatus(order._id, ORDER_STATUSES.PROCESSING) },
            ],
            { cancelable: false }
        );
    };

    const handleConfirmDelivered = () => {
        Alert.alert(
            "Xác nhận đã giao hàng",
            `Bạn có chắc đơn hàng #${order._id.substring(order._id.length - 4)} đã được giao thành công?`,
            [
                { text: "Hủy", style: "cancel" },
                { text: "Xác nhận", onPress: () => onUpdateStatus(order._id, ORDER_STATUSES.DELIVERED) },
            ],
            { cancelable: false }
        );
    };

    const handleCancelOrder = () => {
        Alert.alert(
            "Hủy đơn hàng",
            `Bạn có chắc muốn hủy đơn hàng #${order._id.substring(order._id.length - 4)} không?`,
            [
                { text: "Không", style: "cancel" },
                { text: "Có", onPress: () => onUpdateStatus(order._id, ORDER_STATUSES.CANCELLED) },
            ],
            { cancelable: false }
        );
    };

    const handleDeleteOrderFromDB = () => {
        Alert.alert(
            "Xác nhận xóa đơn hàng",
            `Bạn có chắc muốn XÓA VĨNH VIỄN đơn hàng #${order._id.substring(order._id.length - 4)} khỏi hệ thống? Thao tác này không thể hoàn tác.`,
            [
                { text: "Hủy", style: "cancel" },
                { text: "Xóa", onPress: () => onDeleteOrder(order._id), style: 'destructive' },
            ],
            { cancelable: false }
        );
    };

    return (
        <TouchableOpacity activeOpacity={0.8} onPress={() => onViewDetail(order)} style={itemStyles.card}>
            <View style={itemStyles.header}>
                <Image
                    source={require('../../../assets/images/AVT.jpg')} // Đảm bảo đường dẫn này đúng
                    style={itemStyles.avatar}
                />
                <View style={itemStyles.headerInfo}>
                    <Text style={itemStyles.customerName}>{customerName}</Text>
                    <Text style={itemStyles.orderId}>Mã đơn: #{order._id.slice(-6).toUpperCase()}</Text>
                    <Text style={itemStyles.orderDateTime}>{orderDate} lúc {orderTime}</Text>
                </View>
                <Text style={itemStyles.totalAmount}>
                    {formatPriceVND(order.total_amount)}
                </Text>
            </View>

            <View style={itemStyles.itemsContainer}>
                {order.items.slice(0, 2).map((item, index) => (
                    <View key={index} style={itemStyles.itemRow}>
                        <Text style={itemStyles.itemName} numberOfLines={1} ellipsizeMode='tail'>{item.product_name}</Text>
                        <Text style={itemStyles.itemQuantity}>SL: {item.quantity}</Text>
                        <Text style={itemStyles.itemPrice}>
                            {formatPriceVND(item.price * item.quantity)}
                        </Text>
                    </View>
                ))}
                {order.items.length > 2 && (
                    <Text style={itemStyles.moreItemsText}>Và {order.items.length - 2} sản phẩm khác...</Text>
                )}
            </View>

            <View style={itemStyles.footer}>
                <View style={itemStyles.statusBadge}>
                    <Text style={[
                        itemStyles.statusText,
                        order.status === ORDER_STATUSES.PENDING && itemStyles.statusPending,
                        order.status === ORDER_STATUSES.PROCESSING && itemStyles.statusProcessing,
                        order.status === ORDER_STATUSES.DELIVERED && itemStyles.statusDelivered,
                        order.status === ORDER_STATUSES.CANCELLED && itemStyles.statusCancelled,
                        order.status === ORDER_STATUSES.RATED && itemStyles.statusRated,
                    ]}>
                        {STATUS_DISPLAY_NAMES[order.status] || order.status}
                    </Text>
                </View>

                <View style={itemStyles.actionButtons}>
                    {isPending && (
                        <>
                            <TouchableOpacity style={[itemStyles.actionButton, itemStyles.cancelBtn]} onPress={handleCancelOrder}>
                                <Text style={itemStyles.buttonText}>Hủy đơn</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[itemStyles.actionButton, itemStyles.confirmBtn]} onPress={handleConfirmProcess}>
                                <Text style={itemStyles.buttonText}>Xác nhận</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {isProcessing && (
                        <TouchableOpacity style={[itemStyles.actionButton, itemStyles.confirmDeliveredBtn]} onPress={handleConfirmDelivered}>
                            <Text style={itemStyles.buttonText}>Đã giao</Text>
                        </TouchableOpacity>
                    )}

                    {isCancelled && (
                        <TouchableOpacity style={[itemStyles.actionButton, itemStyles.deleteBtn]} onPress={handleDeleteOrderFromDB}>
                            <Text style={itemStyles.buttonText}>Xóa đơn hàng</Text>
                        </TouchableOpacity>
                    )}

                    {/* ĐÃ XÓA LOGIC HIỂN THỊ NÚT "Đã đánh giá" CHO ADMIN */}
                    {/* {isDelivered && !isRated && (
                        <TouchableOpacity style={[itemStyles.actionButton, itemStyles.ratedBtn]} onPress={() => {
                            Alert.alert(
                                "Xác nhận đã đánh giá",
                                `Bạn có chắc muốn đánh dấu đơn hàng #${order._id.substring(order._id.length - 4)} là "Đã đánh giá"?`,
                                [
                                    { text: "Hủy", style: "cancel" },
                                    { text: "Xác nhận", onPress: () => onUpdateStatus(order._id, ORDER_STATUSES.RATED) },
                                ],
                                { cancelable: false }
                            );
                        }}>
                            <Text style={itemStyles.buttonText}>Đã đánh giá</Text>
                        </TouchableOpacity>
                    )} */}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const itemStyles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 18,
        marginHorizontal: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 10,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
        backgroundColor: '#e0e0e0',
        borderWidth: 1,
        borderColor: '#f5f5f5',
    },
    headerInfo: {
        flex: 1,
    },
    customerName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    orderId: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
        marginBottom: 2,
    },
    orderDateTime: {
        fontSize: 12,
        color: '#888',
    },
    totalAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#e74c3c',
        marginLeft: 10,
    },
    itemsContainer: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        marginBottom: 15,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    itemName: {
        flex: 3,
        fontSize: 14,
        color: '#555',
        fontWeight: '500',
    },
    itemQuantity: {
        flex: 1,
        fontSize: 14,
        color: '#777',
        textAlign: 'center',
    },
    itemPrice: {
        flex: 1.5,
        fontSize: 14,
        color: '#555',
        textAlign: 'right',
        fontWeight: '600',
    },
    moreItemsText: {
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic',
        marginTop: 8,
        textAlign: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
    },
    statusBadge: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#666',
    },
    statusPending: {
        color: '#e67e22',
    },
    statusProcessing: {
        color: '#3498db',
    },
    statusDelivered: {
        color: '#27ae60',
    },
    statusCancelled: {
        color: '#c0392b',
    },
    statusRated: {
        color: '#8e44ad',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        paddingVertical: 9,
        paddingHorizontal: 15,
        borderRadius: 8,
        marginLeft: 10,
        minWidth: 90,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    cancelBtn: {
        backgroundColor: '#ffc107',
    },
    confirmBtn: {
        backgroundColor: '#28a745',
    },
    confirmDeliveredBtn: {
        backgroundColor: '#007bff',
    },
    deleteBtn: {
        backgroundColor: '#dc3545',
    },
    // ratedBtn: { // Xóa style này nếu không còn nút
    //     backgroundColor: '#8e44ad',
    // },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

// --- Component OrderList cho FlatList (Giữ nguyên) ---
const OrderList = ({ orders, loading, error, onUpdateStatus, onDeleteOrder, onRefresh, onViewDetail }) => {
    if (loading) {
        return (
            <View style={listStyles.loadingContainer}>
                <ActivityIndicator size="large" color="#f55" />
                <Text style={listStyles.loadingText}>Đang tải đơn hàng...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={listStyles.errorContainer}>
                <Text style={listStyles.errorText}>Lỗi: {error}</Text>
                <TouchableOpacity style={listStyles.retryButton} onPress={onRefresh}>
                    <Text style={listStyles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!orders || orders.length === 0) {
        return (
            <View style={listStyles.emptyContainer}>
                <Text style={listStyles.emptyText}>Không có đơn hàng nào.</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={orders}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
                <OrderItem
                    order={item}
                    onUpdateStatus={onUpdateStatus}
                    onDeleteOrder={onDeleteOrder}
                    onViewDetail={onViewDetail} // Truyền prop onViewDetail
                />
            )}
            contentContainerStyle={listStyles.listContainer}
            onRefresh={onRefresh}
            refreshing={loading}
        />
    );
};

const listStyles = StyleSheet.create({
    listContainer: {
        paddingVertical: 10,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
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
});


// --- Màn hình chính ManageOrdersScreen ---
export default function ManageOrdersScreen({ navigation }) {
    const [allOrders, setAllOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [restaurantId, setRestaurantId] = useState(null);

    const API_BASE_URL = BASE_URL;

    const fetchAllOrdersData = useCallback(async () => {
        setLoading(true);
        setError(null);
        let currentRestaurantId = restaurantId;

        if (!currentRestaurantId) {
            const storedUser = await AsyncStorage.getItem('user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                currentRestaurantId = user._id;
                setRestaurantId(currentRestaurantId);
            } else {
                setError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
                setLoading(false);
                return;
            }
        }

        if (!currentRestaurantId) {
            setError("Không tìm thấy ID nhà hàng để tải đơn hàng.");
            setLoading(false);
            return;
        }

        try {
            const url = `${API_BASE_URL}admin/orders/by-restaurant/${currentRestaurantId}`;
            const response = await fetch(url, {
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Lỗi khi tải đơn hàng.');
            }
            const data = await response.json();
            setAllOrders(data);
        } catch (err) {
            setError(err.message);
            Toast.show({ type: 'error', text1: 'Lỗi tải đơn hàng', text2: err.message });
            console.error("Lỗi khi tải tất cả đơn hàng:", err);
        } finally {
            setLoading(false);
        }
    }, [restaurantId, API_BASE_URL]);

    useFocusEffect(
        useCallback(() => {
            fetchAllOrdersData();
        }, [fetchAllOrdersData])
    );

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        if (!restaurantId) {
            Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không tìm thấy ID nhà hàng để cập nhật đơn hàng.' });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}admin/order/update-status/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ new_status: newStatus, restaurant_id: restaurantId }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Lỗi khi cập nhật trạng thái đơn hàng.');
            }
            Toast.show({
                type: 'success',
                text1: 'Cập nhật thành công!',
                text2: `Đơn hàng đã chuyển sang trạng thái "${STATUS_DISPLAY_NAMES[newStatus]}".`
            });
            fetchAllOrdersData();
        } catch (err) {
            setError(err.message);
            Toast.show({ type: 'error', text1: 'Lỗi cập nhật', text2: err.message });
            console.error("Lỗi khi cập nhật trạng thái:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (!restaurantId) {
            Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không tìm thấy ID nhà hàng để xóa đơn hàng.' });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}admin/order/delete/${orderId}/${restaurantId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Lỗi khi xóa đơn hàng.');
            }
            Toast.show({ type: 'success', text1: 'Đã xóa đơn hàng', text2: 'Đơn hàng đã được xóa khỏi hệ thống.' });
            fetchAllOrdersData();
        } catch (err) {
            setError(err.message);
            Toast.show({ type: 'error', text1: 'Lỗi xóa đơn hàng', text2: err.message });
            console.error("Lỗi khi xóa đơn hàng:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = (order) => {
        navigation.navigate('AdminOrderDetail', { order: order });
    };

    return (
        <View style={styles.container}>
            {loading && (
                <View style={styles.overlayLoading}>
                    <ActivityIndicator size="large" color="#f55" />
                    <Text style={styles.overlayLoadingText}>Đang tải...</Text>
                </View>
            )}

            {error && !loading && <Text style={styles.mainErrorText}>{error}</Text>}

            {!error && (
                <OrderList
                    orders={allOrders}
                    loading={loading}
                    error={error}
                    onUpdateStatus={handleUpdateOrderStatus}
                    onDeleteOrder={handleDeleteOrder}
                    onRefresh={fetchAllOrdersData}
                    onViewDetail={handleViewDetail}
                />
            )}
            {/* <Toast /> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    overlayLoading: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    overlayLoadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    mainErrorText: {
        textAlign: 'center',
        color: 'red',
        fontSize: 16,
        marginTop: 20,
    },
});