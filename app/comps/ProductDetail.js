import { Entypo, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react'; // Import useCallback
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'; // Import FlatList và ActivityIndicator
import Toast from 'react-native-toast-message';
import { linkanh, linkapi } from '../navigation/config';
import { formatPriceVND } from '../navigation/currency';

export default function ProductDetail({ route, navigation }) {
    const { product } = route.params;
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [userId, setUserId] = useState(null);
    const [productReviews, setProductReviews] = useState([]); // State mới để lưu đánh giá sản phẩm
    const [reviewsLoading, setReviewsLoading] = useState(true); // State loading cho đánh giá

    useEffect(() => {
        const fetchUserData = async () => {
            const userString = await AsyncStorage.getItem('user');
            const user = JSON.parse(userString);
            setUserId(user?._id);
            if (user?._id) {
                checkFavorite(user._id);
            }
        };
        fetchUserData();
    }, []);

    // Function để lấy đánh giá sản phẩm (có debug logs)
    const fetchProductReviews = useCallback(async () => {
        setReviewsLoading(true);
        try {
            const url = `${linkapi}reviews/product/${product._id}`;
            console.log("DEBUG: Đang gọi API đánh giá từ URL:", url); // Log URL đầy đủ

            const res = await fetch(url);

            console.log("DEBUG: HTTP Status Code nhận được:", res.status); // Log trạng thái HTTP
            console.log("DEBUG: res.ok là:", res.ok); // Log giá trị boolean của res.ok

            // Đọc response dưới dạng text trước
            const responseText = await res.text();
            console.log("DEBUG: Response text thô từ API:", responseText); // Log toàn bộ text response

            if (!res.ok) {
                let errorMessage = 'Không thể tải đánh giá sản phẩm.';
                try {
                    // Cố gắng parse JSON nếu có thể, ngay cả khi là lỗi
                    const errorJson = JSON.parse(responseText);
                    if (errorJson.message) {
                        errorMessage = errorJson.message;
                    } else if (errorJson.error) {
                        errorMessage = errorJson.error;
                    }
                } catch (parseError) {
                    console.warn("DEBUG: Không thể parse response error thành JSON. Đây có thể là HTML lỗi hoặc text khác:", parseError);
                    // Nếu không parse được JSON, sử dụng responseText thô nếu nó không rỗng
                    if (responseText) {
                        errorMessage = `Lỗi server: ${responseText.substring(0, 100)}...`; // Lấy 100 ký tự đầu
                    }
                }
                throw new Error(errorMessage);
            }

            // Nếu res.ok là true, thì chắc chắn là JSON và parse nó
            const data = JSON.parse(responseText);
            console.log("DEBUG: Dữ liệu đánh giá đã parse thành công:", data); // Log dữ liệu đã parse

            setProductReviews(data);
        } catch (error) {
            console.error("Lỗi khi tải đánh giá sản phẩm (frontend bắt được):", error);
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: error.message || 'Không thể tải đánh giá sản phẩm.',
            });
        } finally {
            setReviewsLoading(false);
        }
    }, [product._id]); // Dependency array bao gồm product._id

    useEffect(() => {
        fetchProductReviews(); // Gọi khi component mount hoặc product._id thay đổi
    }, [fetchProductReviews]); // Dependency array bao gồm fetchProductReviews

    const checkFavorite = async (user_id) => {
        try {
            const res = await fetch(linkapi + 'favorite/' + user_id);
            const data = await res.json();
            const exists = data.find(item => item.product_id === product._id);
            setIsFavorite(!!exists);
        } catch (error) {
            console.error(error);
        }
    };

    const toggleFavorite = async () => {
        if (!userId) return;

        try {
            if (isFavorite) {
                await fetch(linkapi + 'favorite/remove', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId, product_id: product._id })
                });
            } else {
                await fetch(linkapi + 'favorite/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId, product_id: product._id })
                });
            }
            setIsFavorite(!isFavorite);
        } catch (error) {
            console.error(error);
        }
    };

    const addToCart = async () => {
        if (!userId) {
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
                    user_id: userId,
                    product_id: product._id,
                    quantity: quantity
                })
            });

            const responseData = await response.json();

            if (!response.ok) {
                const errorMessage = responseData.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng.';

                // Thay đổi ở đây: sử dụng console.warn thay vì console.error
                console.warn('Cảnh báo từ server:', errorMessage);

                Toast.show({
                    type: 'error',
                    text1: errorMessage
                });
                return;
            }

            Toast.show({
                type: 'success',
                text1: 'Đã thêm vào giỏ hàng!',
            });

        } catch (error) {
            console.error('Lỗi kết nối mạng:', error);
            Toast.show({
                type: 'error',
                text1: 'Lỗi!',
                text2: 'Không thể kết nối đến máy chủ. Vui lòng thử lại.',
            });
        }
    };

    const increaseQuantity = () => setQuantity(quantity + 1);
    const decreaseQuantity = () => quantity > 1 && setQuantity(quantity - 1);

    // Render từng item đánh giá
    const renderReviewItem = ({ item }) => (
        <View style={styles.reviewRow}>
            <Image
                source={{ uri: item.userAvatar ? `${linkanh}${item.userAvatar}` : 'https://cdn2.fptshop.com.vn/small/avatar_trang_1_cd729c335b.jpg' }} // Avatar mặc định
                style={styles.avatar}
            />
            <View style={styles.reviewContent}>
                <Text style={styles.reviewer}>{item.userName}</Text>
                <View style={styles.reviewRating}>
                    {[...Array(5)].map((_, index) => (
                        <Entypo
                            key={index}
                            name="star"
                            size={14}
                            color={index < item.rating ? "#FFD700" : "#ccc"}
                        />
                    ))}
                </View>
                <Text style={styles.reviewText}>{item.comment || 'Không có bình luận.'}</Text>
                <Text style={styles.reviewDate}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.headerRow}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Entypo name="chevron-left" size={24} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.favoriteBtn} onPress={toggleFavorite}>
                    <Entypo
                        name={isFavorite ? "heart" : "heart-outlined"}
                        size={24}
                        color={isFavorite ? "#f55" : "#000"}
                    />
                </TouchableOpacity>
            </View>

            <Image source={{ uri: linkanh + product.image_url }} style={styles.image} />

            <ScrollView>
                <View style={styles.infoContainer}>
                    <View style={styles.rowBetween}>
                        <Text style={styles.name}>{product.name}</Text>
                    </View>

                    <Text style={styles.price}>{formatPriceVND(product.price)}</Text>
                    <Text style={styles.sold}>Đã bán: {product.purchases || 0}</Text>

                    <View style={styles.ratingRow}>
                        <Text style={styles.ratingText}>{product.rating ? product.rating.toFixed(1) : '0.0'}/5</Text>
                        <Entypo name="star" size={16} color="#FFD700" style={{ marginLeft: 4 }} />
                        <Text style={styles.ratingSmall}>({productReviews.length} lượt đánh giá)</Text>
                    </View>

                    <Text style={styles.sectionTitle}>Chi tiết</Text>
                    <Text style={styles.description}>{product.description || 'Không có mô tả'}</Text>

                    <View style={styles.quantityRow}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={decreaseQuantity}>
                            <Text style={styles.qtyBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{quantity}</Text>
                        <TouchableOpacity style={styles.qtyBtn} onPress={increaseQuantity}>
                            <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>

                    {/* HIỂN THỊ ĐÁNH GIÁ SẢN PHẨM THỰC TẾ */}
                    <View style={styles.reviewSection}>
                        <Text style={styles.sectionTitle}>Đánh giá sản phẩm</Text>
                        {reviewsLoading ? (
                            <ActivityIndicator size="small" color="#f55" style={{ marginTop: 10 }} />
                        ) : productReviews.length > 0 ? (
                            <FlatList
                                data={productReviews}
                                keyExtractor={(item) => item._id}
                                renderItem={renderReviewItem}
                                scrollEnabled={false}
                                contentContainerStyle={styles.reviewsListContainer}
                            />
                        ) : (
                            <Text style={styles.noReviewsText}>Chưa có đánh giá nào cho sản phẩm này.</Text>
                        )}
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Text style={styles.total}>Tổng: {formatPriceVND(product.price * quantity)}</Text>
                <TouchableOpacity style={styles.addBtn} onPress={addToCart}>
                    <Feather name="shopping-cart" size={20} color="#fff" />
                    <Text style={styles.addText}> Thêm vào giỏ hàng</Text>
                </TouchableOpacity>
            </View>
            {/* <Toast /> */}
        </View>
    );
}

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        zIndex: 10,
        position: 'absolute',
        width: '100%',
        paddingTop: 40
    },
    backBtn: {
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    favoriteBtn: {
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    image: {
        width: '100%',
        height: 250,
        resizeMode: 'cover',
    },
    infoContainer: {
        padding: 15,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginTop: -20, // Kéo container lên trên ảnh
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    rowBetween: {
        paddingTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    name: {
        fontSize: 24, // Tăng kích thước font
        fontWeight: 'bold',
        flex: 1,
        color: '#333',
    },
    time: { // Có thể xóa nếu không dùng
        color: '#555',
    },
    price: {
        color: '#f55',
        fontSize: 22, // Tăng kích thước font
        marginVertical: 8, // Tăng margin
        fontWeight: 'bold',
    },
    sold: {
        color: '#666', // Màu sắc nhạt hơn
        marginBottom: 10,
        fontSize: 14,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    ratingText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    ratingSmall: {
        fontSize: 13,
        color: '#777',
        marginLeft: 5,
    },
    sectionTitle: {
        marginTop: 20,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 8,
        marginBottom: 10,
    },
    description: {
        color: '#555',
        marginTop: 5,
        lineHeight: 22,
        fontSize: 15,
    },
    quantityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        justifyContent: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 10,
        paddingVertical: 10,
    },
    qtyBtn: {
        backgroundColor: '#f55',
        width: 40, // Tăng kích thước nút
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
        elevation: 2,
    },
    qtyBtnText: {
        color: '#fff',
        fontSize: 20, // Kích thước chữ to hơn
        fontWeight: 'bold',
    },
    qtyText: {
        marginHorizontal: 15,
        fontSize: 18, // Kích thước chữ to hơn
        fontWeight: 'bold',
        color: '#333',
    },
    reviewSection: {
        marginTop: 30, // Tăng khoảng cách
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    reviewsListContainer: {
        // Có thể thêm padding nếu cần
    },
    reviewRow: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Quan trọng: căn đầu dòng
        marginTop: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    avatar: {
        width: 50, // Kích thước avatar lớn hơn
        height: 50,
        borderRadius: 25,
        marginRight: 12, // Khoảng cách giữa avatar và nội dung review
        backgroundColor: '#f0f0f0',
        borderWidth: 0.5,
        borderColor: '#e0e0e0',
    },
    reviewContent: { // Style mới để bọc nội dung review (tên, rating, comment, ngày)
        flex: 1, // Chiếm hết không gian còn lại
    },
    reviewer: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#333',
        marginBottom: 2,
    },
    reviewRating: {
        flexDirection: 'row',
        marginTop: 2,
        marginBottom: 5, // Thêm margin dưới rating
    },
    reviewText: {
        color: '#555',
        lineHeight: 20,
        fontSize: 14,
        flexShrink: 1, // Cho phép text co lại
    },
    reviewDate: {
        fontSize: 12,
        color: '#888',
        textAlign: 'right', // Căn phải ngày
        marginTop: 5,
        fontStyle: 'italic',
    },
    noReviewsText: {
        textAlign: 'center',
        color: '#888',
        marginTop: 15,
        fontSize: 15,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
        paddingBottom: 20, // Thêm padding dưới cùng cho nút
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    total: {
        fontWeight: 'bold',
        fontSize: 18, // To hơn
        color: '#333',
    },
    addBtn: {
        backgroundColor: '#f55',
        paddingVertical: 14, // Tăng padding
        paddingHorizontal: 25, // Tăng padding
        borderRadius: 30, // Bo tròn nhiều hơn
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    addText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16, // To hơn
        marginLeft: 5,
    },
});