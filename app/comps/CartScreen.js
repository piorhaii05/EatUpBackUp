import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'; // thêm Alert
import Toast from 'react-native-toast-message';
import { linkanh, linkapi } from '../navigation/config';
import { formatPriceVND } from '../navigation/currency';

export default function CartScreen({ navigation }) {
    const [userId, setUserId] = useState(null);
    const [cart, setCart] = useState(null);
    const [groupedCart, setGroupedCart] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);

    useFocusEffect(
        React.useCallback(() => {
            const fetchUserId = async () => {
                const userString = await AsyncStorage.getItem('user');
                const user = JSON.parse(userString);
                setUserId(user?._id);
                if (user?._id) {
                    fetchCart(user._id);
                }
            };
            fetchUserId();
        }, [])
    );

    const fetchCart = async (user_id) => {
        try {
            const res = await fetch(linkapi + 'cart/' + user_id);
            const data = await res.json();
            setCart(data);

            if (data?.items && data.items.length > 0) {
                const grouped = data.items.reduce((acc, item) => {
                    const restaurantId = item.restaurant_id;
                    if (!acc[restaurantId]) {
                        acc[restaurantId] = {
                            restaurant_name: item.restaurant_name,
                            items: []
                        };
                    }
                    acc[restaurantId].items.push(item);
                    return acc;
                }, {});
                setGroupedCart(Object.values(grouped));
            } else {
                setGroupedCart([]);
            }
        } catch (error) {
            console.error('Lỗi khi lấy giỏ hàng:', error);
            setGroupedCart([]);
        }
    };

    const increaseQty = async (item) => {
        await updateQuantity(item.product_id, item.quantity + 1);
    };

    const decreaseQty = async (item) => {
        if (item.quantity > 1) {
            await updateQuantity(item.product_id, item.quantity - 1);
        }
    };

    const updateQuantity = async (product_id, quantity) => {
        try {
            await fetch(linkapi + 'cart/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, product_id, quantity })
            });
            fetchCart(userId);
        } catch (error) {
            console.error(error);
        }
    };

    const confirmRemoveItem = (product_id) => {
        Alert.alert(
            "Xác nhận",
            "Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?",
            [
                { text: "Hủy", style: "cancel" },
                { text: "Xóa", style: "destructive", onPress: () => removeItem(product_id) }
            ]
        );
    };

    const removeItem = async (product_id) => {
        try {
            await fetch(linkapi + 'cart/remove', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, product_id })
            });
            setSelectedItems(prev => prev.filter(id => id !== product_id));
            fetchCart(userId);

            Toast.show({
                type: 'success',
                text1: 'Thành công',
                text2: 'Sản phẩm đã được xóa khỏi giỏ hàng.',
            });
        } catch (error) {
            console.error(error);
        }
    };

    const toggleSelectItem = (productId) => {
        const newSelectedItems = selectedItems.includes(productId)
            ? selectedItems.filter(id => id !== productId)
            : [...selectedItems, productId];
        setSelectedItems(newSelectedItems);
    };

    const isCheckoutEnabled = () => {
        if (selectedItems.length === 0) {
            return false;
        }

        const selectedRestaurantIds = new Set(
            cart?.items
                .filter(item => selectedItems.includes(item.product_id))
                .map(item => item.restaurant_id)
        );

        return selectedRestaurantIds.size <= 1;
    };

    const handleCheckout = () => {
        if (selectedItems.length === 0) {
            Toast.show({
                type: 'info',
                text1: 'Thông báo',
                text2: 'Vui lòng chọn ít nhất một sản phẩm để thanh toán.',
            });
            return;
        }

        const selectedRestaurantIds = new Set(
            cart?.items
                .filter(item => selectedItems.includes(item.product_id))
                .map(item => item.restaurant_id)
        );

        if (selectedRestaurantIds.size > 1) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Vui lòng chỉ chọn sản phẩm từ một nhà hàng để thanh toán.',
            });
            return;
        }

        const checkoutItems = cart.items
            .filter(item => selectedItems.includes(item.product_id))
            .map(item => ({
                // Đảm bảo tên trường khớp với những gì CheckoutScreen cần
                product_id: item.product_id,
                product_title: item.product_name, // Đổi tên trường từ product_name
                product_price: item.product_price,
                quantity: item.quantity,
                restaurant_id: item.restaurant_id,
                product_image: [item.product_image], // Bọc tên file ảnh vào một mảng
            }));

        navigation.navigate("Checkout", { selectedItems: checkoutItems });
    };

    const totalPrice = cart?.items
        .filter(item => selectedItems.includes(item.product_id))
        .reduce((sum, item) => sum + (item.product_price || 0) * item.quantity, 0) || 0;

    const renderItem = ({ item }) => (
        <View style={styles.itemRow}>
            <TouchableOpacity onPress={() => toggleSelectItem(item.product_id)} style={styles.checkbox}>
                {selectedItems.includes(item.product_id)
                    ? <Feather name="check-square" size={24} color="#f55" />
                    : <Feather name="square" size={24} color="#ccc" />
                }
            </TouchableOpacity>
            <Image source={{ uri: linkanh + item.product_image }} style={styles.itemImage} />
            <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                <Text style={styles.itemPrice}>{formatPriceVND(item.product_price)}</Text>
                <View style={styles.qtyRow}>
                    <TouchableOpacity onPress={() => decreaseQty(item)} style={styles.qtyBtn}>
                        <Feather name="minus" size={16} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => increaseQty(item)} style={styles.qtyBtn}>
                        <Feather name="plus" size={16} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
            <TouchableOpacity onPress={() => confirmRemoveItem(item.product_id)}>
                <Feather name="x-circle" size={26} color="#f55" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerWrapper}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Feather name="arrow-left" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Giỏ hàng</Text>
                </View>
            </View>

            {groupedCart.length === 0 ? (
                <View style={styles.emptyCartContainer}>
                    <Text style={styles.emptyCartText}>Giỏ hàng của bạn đang trống.</Text>
                </View>
            ) : (
                <FlatList
                    data={groupedCart}
                    keyExtractor={(item, index) => item.restaurant_name + index}
                    renderItem={({ item: restaurantGroup }) => (
                        <View style={styles.restaurantGroup}>
                            <Text style={styles.restaurantName}>{restaurantGroup.restaurant_name}</Text>
                            <FlatList
                                data={restaurantGroup.items}
                                keyExtractor={(item) => item.product_id}
                                renderItem={renderItem}
                                ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
                                scrollEnabled={false}
                            />
                        </View>
                    )}
                />
            )}

            <View style={styles.bottomRow}>
                <View>
                    <Text style={styles.totalText}>Tổng cộng:</Text>
                    <Text style={styles.totalPrice}>{formatPriceVND(totalPrice)}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.checkoutBtn, !isCheckoutEnabled() && styles.checkoutBtnDisabled]}
                    onPress={handleCheckout}
                    disabled={!isCheckoutEnabled()}
                >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>THANH TOÁN</Text>
                </TouchableOpacity>
            </View>
            {/* <Toast /> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15, backgroundColor: '#fff', },
    headerWrapper: {
        marginBottom: 20,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        padding: 8,
        marginRight: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
    },
    restaurantGroup: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
    },
    restaurantName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    checkbox: {
        marginRight: 10,
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 10
    },
    itemName: {
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 5
    },
    itemPrice: {
        color: '#f55',
        fontWeight: '500',
        marginBottom: 10
    },
    qtyRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    qtyBtn: {
        backgroundColor: '#f55',
        padding: 6,
        borderRadius: 6
    },
    qtyText: {
        marginHorizontal: 12,
        fontSize: 16,
        fontWeight: 'bold'
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingHorizontal: 5,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10
    },
    totalText: {
        fontSize: 18,
        color: '#555',
    },
    totalPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#f55'
    },
    checkoutBtn: {
        backgroundColor: '#f55',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8
    },
    checkoutBtnDisabled: {
        backgroundColor: '#ccc'
    },
    emptyCartContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyCartText: {
        fontSize: 18,
        color: '#888',
    }
});