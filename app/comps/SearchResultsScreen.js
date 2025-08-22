import { Entypo, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { linkanh, linkapi } from '../navigation/config'; // Đảm bảo đường dẫn đúng
import { formatPriceVND } from '../navigation/currency';


const { width } = Dimensions.get('window');

export default function SearchResultsScreen({ navigation, route }) {
    const { searchTerm: initialSearchTerm } = route.params;
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '');
    const [productResults, setProductResults] = useState([]);
    const [restaurantResults, setRestaurantResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);

    // Fetch user info for add to cart (nếu cần cho chức năng thêm vào giỏ hàng)
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userString = await AsyncStorage.getItem('user');
                if (userString) {
                    setUser(JSON.parse(userString));
                }
            } catch (error) {
                console.error("Lỗi khi lấy dữ liệu người dùng từ AsyncStorage:", error);
            }
        };
        fetchUser();
    }, []);

    // Hàm tìm kiếm tổng hợp sản phẩm và nhà hàng
    const fetchAllSearchResults = useCallback(async (query) => {
        if (!query.trim()) {
            setProductResults([]);
            setRestaurantResults([]);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${linkapi}search?q=${encodeURIComponent(query)}`);
            const data = await res.json();

            setProductResults(data.products || []);
            setRestaurantResults(data.restaurants || []);

        } catch (error) {
            console.error("Lỗi khi tìm kiếm tổng hợp:", error);
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Không thể tải kết quả tìm kiếm.',
            });
            setProductResults([]);
            setRestaurantResults([]);
        } finally {
            setLoading(false);
        }
    }, [linkapi]);

    // Gọi hàm tìm kiếm khi màn hình được tải hoặc khi searchTerm thay đổi
    useEffect(() => {
        fetchAllSearchResults(searchTerm);
    }, [searchTerm, fetchAllSearchResults]);

    // Hàm thêm vào giỏ hàng (giữ nguyên logic bạn đã có)
    const addToCart = async (product) => {
        // 1. Kiểm tra đăng nhập
        if (!user?._id) {
            Toast.show({
                type: 'info',
                text1: 'Thông báo',
                text2: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.',
            });
            navigation.navigate('Login');
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

            // 2. Luôn đọc response dưới dạng JSON
            const responseData = await response.json();

            // 3. Kiểm tra response.ok để xác định thành công hay thất bại
            if (!response.ok) {
                // Nếu status code không phải 2xx
                const errorMessage = responseData.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng.';

                // Sử dụng console.warn thay vì console.error để tránh thông báo ERROR nổi bật
                console.warn('Cảnh báo từ server:', errorMessage);

                Toast.show({
                    type: 'error',
                    text1: errorMessage,
                });
                // Dừng hàm tại đây
                return;
            }

            // 4. Nếu thành công
            Toast.show({
                type: 'success',
                text1: 'Đã thêm vào giỏ hàng!',
            });

        } catch (error) {
            // Khối này chỉ bắt các lỗi mạng (ví dụ: mất kết nối)
            console.error('Lỗi kết nối mạng:', error);
            Toast.show({
                type: 'error',
                text1: 'Lỗi!',
                text2: 'Không thể kết nối đến máy chủ. Vui lòng thử lại.',
            });
        }
    };

    // Render item cho Sản phẩm (GIỮ NGUYÊN HIỂN THỊ 2 CỘT)
    const renderProductItem = ({ item }) => (
        <TouchableOpacity
            style={styles.foodCard} // <-- Sử dụng style cho 2 cột
            onPress={() => navigation.navigate('ProductDetail', { product: item })}
        >
            <Image source={{ uri: linkanh + item.image_url }} style={styles.foodImage} />
            <View style={styles.cardInfoContainer}>
                <Text style={styles.foodName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                <Text style={styles.foodPrice}>{formatPriceVND(item.price)}</Text>
                <View style={styles.cardBottomRow}>
                    <View style={styles.ratingRow}>
                        <Text style={styles.infoText}>{item.rating ? item.rating.toFixed(1) : '0.0'}/5</Text>
                        <Entypo name="star" size={14} color="#FFD700" style={{ marginLeft: 4 }} />
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                        <Feather name="plus" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    // Render item cho Nhà hàng (ĐÃ THIẾT KẾ LẠI ĐỂ HIỂN THỊ MỖI DÒNG 1 ITEM VÀ ĐẸP HƠN)
    const renderRestaurantItem = ({ item }) => (
        <TouchableOpacity
            style={styles.restaurantCardVertical} // <-- Dùng style mới cho danh sách dọc nhà hàng
            onPress={() => navigation.navigate('RestaurantDetail', {
                restaurantId: item._id, // Truyền _id dưới tên restaurantId
                restaurantName: item.name // Truyền name dưới tên restaurantName
            })}
        >
            {/* Ảnh của nhà hàng hoặc placeholder nếu không có ảnh */}
            {item.image_url ? ( // Giả sử dùng avatar_url cho ảnh đại diện nhà hàng từ UserModel
                <Image
                    source={{ uri: linkanh + item.image_url }} // <-- Sử dụng avatar_url
                    style={styles.restaurantImageVertical}
                />
            ) : (
                <View style={styles.restaurantImagePlaceholderVertical}>
                    <Feather name="image" size={50} color="#ccc" />
                    <Text style={styles.placeholderText}>No Image</Text>
                </View>
            )}

            <View style={styles.restaurantInfoVertical}>
                <Text style={styles.restaurantNameVertical} numberOfLines={1} ellipsizeMode="tail">
                    {item.name}
                </Text>

                {item.phone ? (
                    <View style={styles.restaurantDetailRowVertical}>
                        <Entypo name="phone" size={14} color="#666" />
                        <Text style={styles.restaurantAddressVertical} numberOfLines={1} ellipsizeMode="tail">
                            {item.phone}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.restaurantDetailRowVertical}>
                        <Entypo name="location-pin" size={14} color="#666" />
                        <Text style={styles.restaurantAddressVertical}>Địa chỉ: Chưa cập nhật</Text>
                    </View>
                )}

                {item.avgRating !== undefined && (
                    <View style={styles.restaurantRatingRowVertical}>
                        <Entypo name="star" size={14} color="#FFD700" />
                        <Text style={styles.restaurantRatingTextVertical}>
                            {item.avgRating ? item.avgRating.toFixed(1) : 'Chưa có'}/5
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm món ăn hoặc nhà hàng..."
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    onSubmitEditing={() => fetchAllSearchResults(searchTerm)}
                    placeholderTextColor="#999"
                />
                <TouchableOpacity onPress={() => fetchAllSearchResults(searchTerm)} style={styles.searchButton}>
                    <Feather name="search" size={24} color="#FF6347" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#FF6347" style={styles.loadingIndicator} />
            ) : (
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                    {/* Hiển thị kết quả Nhà hàng (MỖI DÒNG 1 ITEM) */}
                    {restaurantResults.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Nhà hàng</Text>
                            <FlatList
                                key="restaurant-list-vertical" // Key duy nhất cho FlatList dọc nhà hàng
                                data={restaurantResults}
                                keyExtractor={(item) => item._id}
                                renderItem={renderRestaurantItem}
                                horizontal={false} // Đảm bảo là hiển thị dọc
                                numColumns={1} // Đảm bảo mỗi item 1 dòng
                                contentContainerStyle={styles.restaurantListVerticalContainer}
                                scrollEnabled={false} // Để FlatList cuộn cùng ScrollView cha
                            />
                        </View>
                    )}

                    {/* Hiển thị kết quả Sản phẩm (GIỮ NGUYÊN 2 CỘT) */}
                    {productResults.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Sản phẩm</Text>
                            <FlatList
                                key="product-grid-list" // Key duy nhất cho FlatList 2 cột sản phẩm
                                data={productResults}
                                keyExtractor={(item) => item._id}
                                renderItem={renderProductItem}
                                numColumns={2} // Vẫn hiển thị 2 cột
                                columnWrapperStyle={styles.productColumnWrapper}
                                contentContainerStyle={styles.productListContainer}
                                scrollEnabled={false}
                            />
                        </View>
                    )}

                    {/* Nếu không có kết quả nào */}
                    {productResults.length === 0 && restaurantResults.length === 0 && (
                        <View style={styles.noResultsContainer}>
                            <Text style={styles.noResultsText}>Không tìm thấy kết quả nào phù hợp.</Text>
                        </View>
                    )}
                </ScrollView>
            )}
            {/* <Toast /> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EDEDED',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    backButton: {
        padding: 5,
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 45,
        borderWidth: 1,
        borderColor: '#FF6347',
        borderRadius: 25,
        paddingHorizontal: 18,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#F0F3F5',
    },
    searchButton: {
        marginLeft: 10,
        padding: 8,
    },
    loadingIndicator: {
        marginTop: 50,
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    noResultsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    noResultsText: {
        fontSize: 16,
        color: '#777',
        textAlign: 'center',
    },
    section: {
        marginTop: 20,
        paddingHorizontal: 15, // Padding chung cho section
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#FF6347',
        paddingLeft: 10,
    },

    // --- Product FlatList & Card Styles (GIỮ NGUYÊN CHO 2 CỘT) ---
    productListContainer: {
        // Có thể thêm padding nếu muốn, ví dụ: paddingHorizontal: 5,
    },
    productColumnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 10, // Khoảng cách giữa các hàng sản phẩm
        paddingHorizontal: 0, // Reset padding từ section nếu muốn
    },
    foodCard: {
        width: (width / 2) - 22, // width của thẻ (width màn hình / 2 - tổng padding/margin)
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        marginBottom: 15,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
        marginHorizontal: 5, // Margin để tạo khoảng cách giữa các cột
    },
    foodImage: {
        width: '100%',
        height: 140,
        resizeMode: 'cover',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    cardInfoContainer: {
        padding: 10,
    },
    foodName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    foodPrice: {
        color: '#FF6347',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 8,
    },
    cardBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        fontSize: 13,
        color: '#555',
    },
    addBtn: {
        backgroundColor: '#FF6347',
        width: 35,
        height: 35,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },

    // --- Restaurant FlatList & Card Styles (MỚI CHO MỖI DÒNG 1 ITEM VÀ ĐẸP HƠN) ---
    restaurantListVerticalContainer: {
        // Có thể thêm padding nếu muốn, nhưng marginHorizontal của card đã xử lý
    },
    restaurantCardVertical: {
        flexDirection: 'row', // Ảnh và thông tin nằm ngang
        backgroundColor: '#FFFFFF',
        borderRadius: 15, // Bo tròn đẹp hơn
        padding: 15, // Padding bên trong thẻ
        marginBottom: 12, // Khoảng cách giữa các thẻ nhà hàng
        marginHorizontal: 5, // Khoảng cách hai bên mép màn hình (trong section đã có padding 15)
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 8, // Elevation cao hơn cho hiệu ứng nổi bật
        alignItems: 'center', // Căn giữa theo chiều dọc
        width: width - 30, // Chiếm toàn bộ chiều rộng của section
    },
    restaurantImageVertical: {
        width: 90, // Kích thước ảnh đại diện
        height: 90,
        borderRadius: 45, // Bo tròn ảnh thành hình tròn
        marginRight: 15,
        borderWidth: 2, // Thêm border cho ảnh
        borderColor: '#FF6347', // Màu border
        resizeMode: 'cover',
    },
    restaurantImagePlaceholderVertical: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 2,
        borderColor: '#FF6347',
    },
    restaurantInfoVertical: {
        flex: 1, // Chiếm hết không gian còn lại
        justifyContent: 'space-between', // Đẩy các phần tử ra xa nhau
    },
    restaurantNameVertical: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    restaurantDetailRowVertical: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 3,
    },
    restaurantAddressVertical: {
        fontSize: 14,
        color: '#666',
        marginLeft: 5,
        flexShrink: 1,
    },
    restaurantRatingRowVertical: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    restaurantRatingTextVertical: {
        fontSize: 14,
        color: '#FFD700',
        fontWeight: 'bold',
        marginLeft: 5,
    },
    placeholderText: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
    },
});