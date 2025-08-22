import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { linkanh, linkapi } from '../navigation/config';
import { formatPriceVND } from '../navigation/currency';

export default function CategoryProductsScreen({ route, navigation }) {
    const { categoryName } = route.params;
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useFocusEffect(
        React.useCallback(() => {
            const fetchUser = async () => {
                const userString = await AsyncStorage.getItem('user');
                if (userString) {
                    setUser(JSON.parse(userString));
                }
            };
            fetchUser();
        }, [])
    );

    useEffect(() => {
        if (categoryName) {
            fetchProductsByCategory(categoryName);
        }
    }, [categoryName]);

    const fetchProductsByCategory = async (name) => {
        try {
            setLoading(true);
            const res = await fetch(`${linkapi}product/by-category-name?name=${encodeURIComponent(name)}`);
            const data = await res.json();
            // console.log("Dữ liệu sản phẩm nhận được:", data);

            if (Array.isArray(data)) {
                setProducts(data);
            } else {
                setProducts([]);
            }
        } catch (err) {
            console.error("Lỗi khi tải sản phẩm:", err);
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Không thể tải sản phẩm. Vui lòng thử lại sau.'
            });
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async (product) => {
        if (!user?._id) {
            Toast.show({
                type: 'info',
                text1: 'Bạn cần đăng nhập',
                text2: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.',
            });
            return;
        }

        try {
            const response = await fetch(linkapi + 'cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user._id,
                    product_id: product._id,
                    quantity: 1
                })
            });

            if (response.ok) {
                Toast.show({
                    type: 'success',
                    text1: 'Đã thêm vào giỏ hàng!',
                });
            } else {
                const responseData = await response.json();
                const errorMessage = responseData.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng.';
                Toast.show({
                    type: 'error',
                    text1: 'Lỗi!',
                    text2: errorMessage,
                });
            }
        } catch (error) {
            console.error('Lỗi kết nối mạng:', error);
            Toast.show({
                type: 'error',
                text1: 'Lỗi!',
                text2: 'Không thể kết nối đến máy chủ. Vui lòng thử lại.',
            });
        }
    };

    const renderProduct = ({ item }) => (
        <TouchableOpacity
            style={styles.foodCard}
            onPress={() => navigation.navigate('ProductDetail', { product: item })}
        >
            <Image source={{ uri: linkanh + item.image_url }} style={styles.foodImage} />
            <View style={styles.infoContainer}>
                <Text style={styles.foodName} numberOfLines={1} ellipsizeMode="tail">
                    {item.name}
                </Text>
                <View style={styles.rowBetween}>
                    <Text style={styles.foodPrice}>{formatPriceVND(item.price)}</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                        <Feather name="plus" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#f55" />
            </View>
        );
    }

    if (products.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{categoryName}</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Không có món ăn nào trong danh mục này.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{categoryName}</Text>
            </View>
            <FlatList
                data={products}
                keyExtractor={(item) => item._id}
                renderItem={renderProduct}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        marginBottom: 10,
        position: 'relative',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    backButton: {
        position: 'absolute',
        left: 0,
        padding: 5,
        zIndex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    foodCard: {
        width: '48%',
        borderRadius: 12,
        backgroundColor: '#eee',
        overflow: 'hidden',
        marginBottom: 10,
    },
    foodImage: {
        width: '100%',
        height: 120,
    },
    infoContainer: {
        padding: 10,
    },
    foodName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 5,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    foodPrice: {
        color: '#f55',
        fontWeight: 'bold',
        fontSize: 14,
    },
    addBtn: {
        backgroundColor: '#f55',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#777',
    },
});