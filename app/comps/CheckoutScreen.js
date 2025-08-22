import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { linkanh, linkapi } from '../navigation/config';
import { formatPriceVND } from '../navigation/currency';

export default function CheckoutScreen({ navigation, route }) {
    const [userId, setUserId] = useState(null);
    const [defaultAddress, setDefaultAddress] = useState(null);
    const [defaultBank, setDefaultBank] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [shippingMethod, setShippingMethod] = useState('standard');
    const [paymentMethod, setPaymentMethod] = useState('COD');

    const [discount, setDiscount] = useState(0);
    const [appliedVoucherCode, setAppliedVoucherCode] = useState(null);
    const [appliedVoucherId, setAppliedVoucherId] = useState(null);

    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const [isLoading, setIsLoading] = useState(false);

    const handleZaloPayRedirect = async (event) => {
        // 1. Lấy apptransid từ URL
        if (!event.url) return;
        const storedOrderDataString = await AsyncStorage.getItem('pendingOrderData');
        if (!storedOrderDataString) {
            console.log('Không tìm thấy dữ liệu đơn hàng đang chờ xử lý.');
            return;
        }
        const storedOrderData = JSON.parse(storedOrderDataString);

        const url = new URL(event.url);
        const params = Object.fromEntries(url.searchParams.entries());

        if (params.apptransid) {
            setIsLoading(true);
            try {
                // 2. Gọi API backend để kiểm tra trạng thái ZaloPay
                const checkStatusResponse = await fetch(`${linkapi}zalopay/check-status`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ apptransid: params.apptransid }),
                });
                const checkStatusData = await checkStatusResponse.json();

                // 3. Nếu ZaloPay báo thành công (return_code === 1), thực hiện các việc còn lại
                if (checkStatusResponse.ok && checkStatusData.return_code === 1) {
                    // TẠO ĐƠN HÀNG
                    console.log('Thanh toán thành công từ ZaloPay. Bắt đầu tạo đơn hàng...');

                    const orderCreationResponse = await fetch(`${linkapi}order/create`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...storedOrderData, payment_method: 'ZALOPAY', status: 'Paid' }),
                    });

                    if (orderCreationResponse.ok) {
                        // XÓA SẢN PHẨM KHỎI GIỎ HÀNG
                        const selectedProductIds = storedOrderData.items.map(item => item.product_id);
                        await fetch(`${linkapi}cart/remove-multiple`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ user_id: storedOrderData.user_id, product_ids: selectedProductIds }),
                        });

                        // CẬP NHẬT VOUCHER (nếu có)
                        if (storedOrderData.voucher_id) {
                            await fetch(`${linkapi}vouchers/increase-used-count/${storedOrderData.voucher_id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                            });
                        }

                        // HIỂN THỊ MODAL THÔNG BÁO THÀNH CÔNG
                        setShowSuccessModal(true);
                        await AsyncStorage.removeItem('pendingOrderData');
                        console.log('Đã xóa dữ liệu tạm thời khỏi AsyncStorage.');
                    } else {
                        Toast.show({ type: 'error', text1: 'Đặt hàng thất bại', text2: 'Có lỗi xảy ra khi tạo đơn hàng.' });
                    }
                } else {
                    Toast.show({ type: 'error', text1: 'Thanh toán không thành công', text2: 'Vui lòng thử lại.' });
                }
            } catch (error) {
                Toast.show({ type: 'error', text1: 'Lỗi hệ thống', text2: 'Không thể xử lý đơn hàng.' });
            } finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        // Lắng nghe sự kiện URL khi ứng dụng đang chạy
        const listener = Linking.addEventListener('url', handleZaloPayRedirect);
        // Clean-up: Xóa listener khi component unmount
        return () => {
            listener.remove();
        };
    }, []);

    useFocusEffect(
        useCallback(() => {
            const fetchInitialData = async () => {
                setLoading(true);
                try {
                    const userString = await AsyncStorage.getItem('user');
                    const user = JSON.parse(userString);
                    if (user?._id) {
                        setUserId(user._id);
                        await Promise.all([
                            fetchDefaultAddress(user._id),
                            fetchDefaultBank(user._id)
                        ]);
                    } else {
                        setUserId(null);
                        setDefaultAddress(null);
                        setDefaultBank(null);
                        Toast.show({ type: 'error', text1: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.' });
                    }
                } catch (error) {
                    console.error("Lỗi khi tải dữ liệu ban đầu:", error);
                    Toast.show({ type: 'error', text1: 'Không thể tải dữ liệu ban đầu. Vui lòng thử lại.' });
                } finally {
                    setLoading(false);
                }
            };

            // Cập nhật state sản phẩm chỉ khi có dữ liệu mới từ màn hình trước đó
            if (route.params?.selectedItems) {
                setSelectedItems(route.params.selectedItems);
            }

            fetchInitialData();

            // Xử lý dữ liệu voucher
            // if (route.params?.appliedVoucher && route.params?.discountAmount) {
            //     const { appliedVoucher, discountAmount, voucherCode } = route.params;
            //     setDiscount(discountAmount);
            //     setAppliedVoucherCode(voucherCode);
            //     setAppliedVoucherId(appliedVoucher._id);
            //     navigation.setParams({ appliedVoucher: undefined, discountAmount: undefined, voucherCode: undefined });
            // } else if (route.params?.appliedVoucher === null) {
            //     setDiscount(0);
            //     setAppliedVoucherCode(null);
            //     setAppliedVoucherId(null);
            //     navigation.setParams({ appliedVoucher: undefined, discountAmount: undefined, voucherCode: undefined });
            // }

            const fetchVoucherData = async () => {
                try {
                    const storedDataString = await AsyncStorage.getItem('appliedVoucherData');
                    if (storedDataString !== null) {
                        const storedData = JSON.parse(storedDataString);

                        // Cập nhật state với dữ liệu từ AsyncStorage
                        setDiscount(storedData.discountAmount);
                        setAppliedVoucherCode(storedData.voucherCode);
                        setAppliedVoucherId(storedData.appliedVoucher._id);

                        // Quan trọng: Xóa dữ liệu sau khi đã sử dụng
                        await AsyncStorage.removeItem('appliedVoucherData');
                    }
                } catch (error) {
                    console.error('Failed to retrieve or remove voucher data:', error);
                }
            };

            fetchVoucherData();
        }, [route.params])
    );

    const fetchDefaultAddress = async (id) => {
        try {
            const res = await fetch(`${linkapi}address/default/${id}`);
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`HTTP error! status: ${res.status}, body: ${errorText}`);
            }
            const data = await res.json();
            if (data && Object.keys(data).length > 0) {
                setDefaultAddress(data);
            } else {
                setDefaultAddress(null);
            }
        } catch (error) {
            console.error("Lỗi khi lấy địa chỉ mặc định:", error);
            setDefaultAddress(null);
        }
    };

    const fetchDefaultBank = async (id) => {
        try {
            const res = await fetch(`${linkapi}bank/default/${id}`);
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`HTTP error! status: ${res.status}, body: ${errorText}`);
            }
            const data = await res.json();
            if (data && Object.keys(data).length > 0) {
                setDefaultBank(data);
            } else {
                setDefaultBank(null);
            }
        } catch (error) {
            console.error("Lỗi khi lấy thẻ ngân hàng mặc định:", error);
            setDefaultBank(null);
        }
    };

    const calculateSubtotal = () => {
        return selectedItems.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
    };

    // Giá trị phí vận chuyển được thay đổi từ 5.00 USD sang 30000 VND
    const shippingFee = 10000;
    const subtotal = calculateSubtotal();
    const totalAmount = Math.max(0, subtotal + shippingFee - discount);


    const handleCheckout = async () => {
        if (!userId) {
            Toast.show({ type: 'error', text1: 'Không tìm thấy ID người dùng.', text2: 'Vui lòng đăng nhập lại để tiếp tục.' });
            return;
        }
        if (selectedItems.length === 0) {
            Toast.show({ type: 'error', text1: 'Giỏ hàng của bạn đang trống.', text2: 'Vui lòng thêm sản phẩm vào giỏ hàng.' });
            return;
        }
        if (!defaultAddress) {
            Toast.show({ type: 'error', text1: 'Vui lòng chọn địa chỉ nhận hàng.', text2: 'Bạn cần một địa chỉ mặc định để tiếp tục.' });
            return;
        }
        if (paymentMethod === 'bank' && !defaultBank) {
            Toast.show({ type: 'error', text1: 'Vui lòng chọn thẻ ngân hàng.', text2: 'Hoặc đổi sang phương thức thanh toán COD.' });
            return;
        }
        const restaurantId = selectedItems.length > 0 ? selectedItems[0].restaurant_id : null;

        const orderData = {
            user_id: userId,
            restaurant_id: restaurantId,
            address_id: defaultAddress._id,
            payment_method: paymentMethod,
            bank_id: paymentMethod === 'bank' ? defaultBank?._id : null,
            items: selectedItems.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                price_at_order: item.product_price
            })),
            total_amount: totalAmount,
            shipping_fee: shippingFee,
            discount_amount: discount,
            voucher_id: appliedVoucherId,
            status: paymentMethod === 'ZALOPAY' ? 'Processing' : 'Pending'
        };

        // setOrderData(orderData);

        Alert.alert(
            'Xác nhận thanh toán',
            `Tổng thanh toán: ${formatPriceVND(totalAmount)}\nBạn có chắc chắn muốn đặt hàng?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xác nhận',
                    onPress: async () => {
                        setIsLoading(true);

                        try {
                            if (paymentMethod === 'ZALOPAY') {
                                // === Giai đoạn 1: Gửi yêu cầu đến server backend ===
                                console.log('--- BƯỚC 1: Bắt đầu quy trình ZaloPay ---');
                                console.log('Đang tạo đơn hàng ZaloPay trên backend...');
                                console.log('URL backend:', `${linkapi}zalopay/create`);
                                console.log('Payload:', JSON.stringify({ amount: totalAmount }));

                                await AsyncStorage.setItem('pendingOrderData', JSON.stringify(orderData));
                                console.log('Đã lưu orderData vào AsyncStorage.');

                                try {
                                    const paymentResponse = await fetch(`${linkapi}zalopay/create`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            amount: totalAmount,
                                            orderData: { ...orderData, payment_method: 'ZALOPAY', status: 'Processing' }
                                        }),
                                    });

                                    // === Giai đoạn 2: Nhận phản hồi từ server ===
                                    console.log('--- BƯỚC 2: Đã nhận phản hồi từ backend ---');
                                    console.log('Phản hồi có OK không:', paymentResponse.ok);

                                    const paymentResponseData = await paymentResponse.json();
                                    console.log('Dữ liệu phản hồi:', paymentResponseData);

                                    if (!paymentResponse.ok) {
                                        console.error('Phản hồi từ backend không OK.');
                                        Toast.show({ type: 'error', text1: 'Lỗi tạo URL ZaloPay', text2: paymentResponseData.message || 'Có lỗi xảy ra khi tạo URL.' });
                                        return;
                                    }

                                    // === Giai đoạn 3: Kiểm tra và mở URL thanh toán ===
                                    console.log('--- BƯỚC 3: Kiểm tra URL và mở ZaloPay ---');
                                    if (paymentResponseData.order_url) {
                                        console.log('Đã tìm thấy order_url:', paymentResponseData.order_url);

                                        try {
                                            const canOpen = await Linking.canOpenURL(paymentResponseData.order_url);
                                            console.log('Thiết bị có thể mở URL không:', canOpen);

                                            if (canOpen) {
                                                await Linking.openURL(paymentResponseData.order_url);
                                                console.log('Đã mở ứng dụng ZaloPay.');
                                            } else {
                                                // Fallback to web browser, which should always work on an emulator
                                                await Linking.openURL(paymentResponseData.order_url);
                                                console.log('Không thể mở ứng dụng. Đã chuyển hướng sang trình duyệt.');
                                            }

                                        } catch (linkingError) {
                                            console.error("Lỗi khi mở URL:", linkingError);
                                            Toast.show({
                                                type: 'error',
                                                text1: 'Không thể mở trình duyệt',
                                                text2: 'Vui lòng kiểm tra lại thiết bị hoặc cài đặt trình duyệt.'
                                            });
                                        }
                                    } else {
                                        console.error('Không tìm thấy order_url trong phản hồi.');
                                        Toast.show({ type: 'error', text1: 'Không có URL thanh toán', text2: 'Vui lòng thử lại.' });
                                    }
                                } catch (networkError) {
                                    // === Giai đoạn lỗi: Mất kết nối hoặc lỗi mạng ===
                                    console.error('--- LỖI ---');
                                    console.error("Lỗi mạng khi gọi API backend:", networkError);
                                    Toast.show({ type: 'error', text1: 'Lỗi kết nối', text2: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.' });
                                }

                            } else {
                                const res = await fetch(`${linkapi}order/create`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(orderData),
                                });

                                if (!res.ok) {
                                    const errorData = await res.json();
                                    Toast.show({ type: 'error', text1: 'Đặt hàng thất bại', text2: errorData.message || 'Có lỗi xảy ra khi tạo đơn hàng.' });
                                    return;
                                }


                                const selectedProductIds = selectedItems.map(item => item.product_id);
                                console.log("Dữ liệu gửi đến API xóa:", { user_id: userId, product_ids: selectedProductIds });

                                const deleteResponse = await fetch(`${linkapi}cart/remove-multiple`, {
                                    method: 'DELETE',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ user_id: userId, product_ids: selectedProductIds }),
                                });

                                if (!deleteResponse.ok) {
                                    console.error("Lỗi khi xóa sản phẩm khỏi giỏ hàng:", await deleteResponse.text());
                                    // Thêm Toast hoặc Alert để thông báo cho người dùng
                                    Toast.show({ type: 'error', text1: 'Lỗi giỏ hàng', text2: 'Có lỗi xảy ra khi xóa sản phẩm khỏi giỏ hàng. Vui lòng kiểm tra lại.' });
                                }

                                if (appliedVoucherId) {
                                    try {
                                        const updateVoucherResponse = await fetch(`${linkapi}vouchers/increase-used-count/${appliedVoucherId}`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                        });

                                        if (updateVoucherResponse.ok) {
                                            console.log('Cập nhật used_count của voucher thành công!');
                                        } else {
                                            const errorData = await updateVoucherResponse.json();
                                            console.error('Lỗi khi cập nhật used_count:', errorData.message);
                                        }
                                    } catch (error) {
                                        console.error('Lỗi mạng khi cập nhật used_count:', error);
                                    }
                                }

                                setShowSuccessModal(true);
                            }
                        } catch (error) {
                            console.error("Lỗi khi xử lý thanh toán:", error);
                            Toast.show({ type: 'error', text1: 'Lỗi hệ thống', text2: 'Không thể xử lý đơn hàng. Vui lòng thử lại.' });
                        } finally {
                            setIsLoading(false);
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#f55" />
                <Text style={{ marginTop: 10 }}>Đang tải thông tin...</Text>
            </View>
        );
    }


    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thanh toán</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <TouchableOpacity
                    style={styles.sectionContainer}
                    onPress={() => navigation.navigate('AddressList', { fromCheckout: true, selectedAddressId: defaultAddress?._id })}
                >
                    <View style={styles.sectionHeader}>
                        <Feather name="map-pin" size={20} color="#f55" /><Text style={styles.sectionTitle}> Địa chỉ nhận hàng</Text>
                        <Feather name="chevron-right" size={20} color="#888" style={{ marginLeft: 'auto' }} />
                    </View>
                    {defaultAddress ? (
                        <View style={styles.addressDetails}>
                            <Text style={styles.addressName}>{defaultAddress.name} (+{defaultAddress.phone})</Text>
                            <Text style={styles.addressText}>
                                {defaultAddress.street}, {defaultAddress.ward}, {defaultAddress.city}
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.noDataText}>Chưa có địa chỉ mặc định. Vui lòng thêm!</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Phương pháp vận chuyển</Text>
                    <TouchableOpacity
                        style={styles.shippingOption}
                        onPress={() => setShippingMethod('standard')}
                    >
                        <View style={styles.radio}>
                            <View style={shippingMethod === 'standard' ? styles.radioSelected : styles.radioUnselected} />
                        </View>
                        <View style={styles.shippingMethodInfo}>
                            <Text style={styles.shippingMethodText}>Giao hàng tiêu chuẩn</Text>
                            <Text style={styles.shippingTime}>15 - 45 phút</Text>
                        </View>
                        <Text style={styles.shippingPrice}>{formatPriceVND(shippingFee)}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
                    <TouchableOpacity style={styles.paymentMethodRow} onPress={() => setPaymentMethod('COD')}>
                        <View style={styles.radio}>
                            <View style={paymentMethod === 'COD' ? styles.radioSelected : styles.radioUnselected} />
                        </View>
                        <Text style={styles.paymentMethodText}>Thanh toán khi nhận hàng</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.paymentMethodRow}
                        onPress={() => setPaymentMethod('ZALOPAY')}
                    >
                        <View style={styles.radio}>
                            <View style={paymentMethod === 'ZALOPAY' ? styles.radioSelected : styles.radioUnselected} />
                        </View>
                        <Text style={styles.paymentMethodText}>Thanh toán qua ZALOPAY</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.sectionContainer}
                    onPress={() => navigation.navigate('Voucher', {
                        orderTotal: subtotal,
                        selectedItems: selectedItems,
                    })}
                >
                    <View style={styles.sectionHeader}>
                        <Feather name="tag" size={20} color="#f55" />
                        <Text style={styles.sectionTitle}> Áp dụng phiếu giảm giá</Text>
                        {appliedVoucherCode ? (
                            <Text style={styles.discountCount}>{appliedVoucherCode}</Text>
                        ) : (
                            <Text style={styles.discountCount}>Chọn Voucher</Text>
                        )}
                        <Feather name="chevron-right" size={20} color="#888" style={{ marginLeft: 5 }} />
                    </View>
                </TouchableOpacity>

                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Feather name="shopping-bag" size={20} color="#f55" />
                        <Text style={styles.sectionTitle}> Các mặt hàng đã đặt</Text>
                        <Text style={styles.itemCount}>{selectedItems.length} mục</Text>
                    </View>
                    {selectedItems.map((item, index) => (
                        <View key={index} style={styles.orderedItem}>
                            <Image
                                source={{ uri: item.product_image && item.product_image[0] ? `${linkanh}${item.product_image[0]}` : null }}
                                style={styles.productImage}
                            />
                            <View style={styles.itemDetails}>
                                <Text style={styles.itemName}>{item.product_title}</Text>
                                <Text style={styles.itemPrice}>{formatPriceVND(item.product_price)}</Text>
                            </View>
                            <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.summaryContainer}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tổng phụ ({selectedItems.length} mục):</Text>
                        <Text style={styles.summaryValue}>{formatPriceVND(subtotal)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Phí vận chuyển:</Text>
                        <Text style={styles.summaryValue}>{formatPriceVND(shippingFee)}</Text>
                    </View>
                    {discount > 0 && (
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Giảm giá Voucher:</Text>
                            <Text style={[styles.summaryValue, { color: '#f55' }]}>-{formatPriceVND(discount)}</Text>
                        </View>
                    )}
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
                        <Text style={styles.finalTotalPrice}>{formatPriceVND(totalAmount)}</Text>
                    </View>
                </View>

            </ScrollView>

            <TouchableOpacity
                style={styles.checkoutButton}
                onPress={handleCheckout}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.checkoutButtonText}>THANH TOÁN</Text>
                )}
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={showSuccessModal}
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View style={modalStyles.centeredView}>
                    <View style={modalStyles.successModalView}>
                        <Image
                            source={require('../../assets/images/tick.png')}
                            style={modalStyles.successIcon}
                        />
                        <Text style={modalStyles.successTitle}>Đặt hàng thành công</Text>
                        <TouchableOpacity
                            style={modalStyles.successButtonPrimary}
                            onPress={() => {
                                setShowSuccessModal(false);
                                navigation.replace('HistoryOrders');
                            }}
                        >
                            <Text style={modalStyles.successButtonTextPrimary}>XEM CHI TIẾT ĐƠN HÀNG</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={modalStyles.successButtonSecondary}
                            onPress={() => {
                                setShowSuccessModal(false);
                                navigation.replace('Home');
                            }}
                        >
                            <Text style={modalStyles.successButtonTextSecondary}>VỀ TRANG CHỦ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            {/* <Toast /> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 5, backgroundColor: '#fff', },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    backBtn: { padding: 5, marginRight: 10, paddingLeft: 15 },
    backButton: {
        marginRight: 15,
    },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#000' },
    scrollViewContent: {
        padding: 15,
        paddingBottom: 100,
    },
    sectionContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    addressDetails: {
        marginTop: 5,
        paddingLeft: 25,
    },
    addressName: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 3,
    },
    addressText: {
        fontSize: 14,
        color: '#555',
    },
    noDataText: {
        fontSize: 14,
        color: '#888',
        fontStyle: 'italic',
        marginTop: 5,
        paddingLeft: 25,
    },
    shippingOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        marginTop: 5,
        width: '100%',
    },
    shippingMethodInfo: {
        flex: 1,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#f55',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    radioSelected: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#f55',
    },
    radioUnselected: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#fff',
    },
    shippingMethodText: {
        fontSize: 15,
        fontWeight: '500',
    },
    shippingTime: {
        fontSize: 13,
        color: '#888',
    },
    shippingPrice: {
        marginLeft: 'auto',
        fontSize: 15,
        fontWeight: 'bold',
        color: '#f55',
    },
    paymentMethodRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        marginTop: 5,
    },
    paymentMethodText: {
        fontSize: 15,
        fontWeight: '500',
        marginRight: 10,
    },
    bankCardDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginLeft: 'auto',
        marginTop: 10,
        maxWidth: '60%',
    },
    bankCardIcon: {
        width: 25,
        height: 25,
        resizeMode: 'contain',
        marginRight: 8,
    },
    bankCardNumber: {
        fontSize: 15,
        color: '#fff',
        fontWeight: 'bold',
    },
    editBankBtnContainer: {
        marginLeft: 5,
    },
    noDataTextBank: {
        fontSize: 14,
        color: '#888',
        fontStyle: 'italic',
        marginLeft: 35,
        marginTop: 5,
    },
    discountCount: {
        marginLeft: 'auto',
        fontSize: 14,
        color: '#555',
        fontWeight: 'bold',
    },
    itemCount: {
        marginLeft: 'auto',
        fontSize: 14,
        color: '#555',
    },
    summaryContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 15,
        color: '#555',
    },
    summaryValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        marginTop: 10,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    finalTotalPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#f55',
    },
    checkoutButton: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#f55',
        paddingVertical: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 0,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    checkoutButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
    },
    orderedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    productImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 10,
    },
    itemDetails: {
        flex: 1,
    },
    itemName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
    },
    itemPrice: {
        fontSize: 14,
        color: '#555',
        marginTop: 2,
    },
    itemQuantity: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#f55',
    },
});

const modalStyles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    qrCodeImage: {
        width: 200,
        height: 200,
        marginBottom: 20,
        resizeMode: 'contain',
    },
    qrInstructions: {
        textAlign: 'center',
        marginBottom: 20,
        fontSize: 14,
        color: '#555',
    },
    buttonConfirmPayment: {
        backgroundColor: '#f55',
        borderRadius: 10,
        padding: 15,
        elevation: 2,
        width: '100%',
        marginBottom: 10,
    },
    buttonCancel: {
        backgroundColor: '#ccc',
        borderRadius: 10,
        padding: 15,
        elevation: 2,
        width: '100%',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
    buttonTextCancel: {
        color: '#333',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
    successModalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '80%',
    },
    successIcon: {
        width: 80,
        height: 80,
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    successButtonPrimary: {
        backgroundColor: '#f55',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 20,
        elevation: 2,
        width: '100%',
        marginBottom: 10,
    },
    successButtonTextPrimary: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
    successButtonSecondary: {
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 20,
        elevation: 2,
        width: '100%',
    },
    successButtonTextSecondary: {
        color: '#333',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
});