import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StarRating from 'react-native-star-rating-widget';
import Toast from 'react-native-toast-message';
import { linkanh, linkapi } from '../navigation/config';

export default function RateProductsScreen({ navigation, route }) {
    // orderId, items, và restaurantId được truyền từ màn hình trước đó thông qua route.params
    // Đảm bảo restaurantId được truyền đúng từ màn hình chi tiết đơn hàng
    const { orderId, items, restaurantId } = route.params;

    // State để lưu trữ đánh giá của từng sản phẩm
    const [productRatings, setProductRatings] = useState(() => {
        // Khởi tạo mỗi sản phẩm với rating mặc định là 0 và comment rỗng
        return items.map(item => ({
            productId: item.product_id,
            productName: item.product_name,
            productImage: item.product_image,
            rating: 0,
            comment: ''
        }));
    });

    // State cho đánh giá tổng thể của nhà hàng
    const [overallRestaurantRating, setOverallRestaurantRating] = useState(0);
    const [overallRestaurantComment, setOverallRestaurantComment] = useState('');

    // State để quản lý trạng thái khi đang gửi đánh giá
    const [submitting, setSubmitting] = useState(false);

    // State mới để lưu tên nhà hàng và trạng thái loading của tên nhà hàng
    const [restaurantName, setRestaurantName] = useState('Đang tải...');
    const [restaurantLoading, setRestaurantLoading] = useState(true);

    /**
     * Hàm fetchRestaurantName: Lấy tên nhà hàng từ backend dựa trên restaurantId.
     * Đây là hàm được thêm vào để giải quyết vấn đề "JSON Parse error" trước đó.
     */
    const fetchRestaurantName = async () => {
        if (!restaurantId) {
            setRestaurantName('Không rõ nhà hàng');
            setRestaurantLoading(false);
            return;
        }
        try {
            // Gọi API backend để lấy thông tin nhà hàng
            const res = await fetch(`${linkapi}restaurant/${restaurantId}`);

            // Kiểm tra nếu response không OK (ví dụ: 404, 500)
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Lỗi khi tải thông tin nhà hàng! Trạng thái: ${res.status}`);
            }

            const data = await res.json();
            // Cập nhật tên nhà hàng từ dữ liệu nhận được. Giả định trường tên là 'name'.
            setRestaurantName(data.name || 'Không rõ tên');
        } catch (error) {
            console.error("Lỗi khi tải tên nhà hàng:", error.message);
            Toast.show({
                type: 'error',
                text1: 'Lỗi tải tên nhà hàng',
                text2: error.message || 'Không thể tải tên nhà hàng.'
            });
            setRestaurantName('Không thể tải tên');
        } finally {
            setRestaurantLoading(false);
        }
    };

    /**
     * useEffect hook: Chạy hàm fetchRestaurantName khi component được mount
     * hoặc khi restaurantId thay đổi (thường là một lần duy nhất).
     */
    useEffect(() => {
        fetchRestaurantName();
    }, [restaurantId]);

    // Xử lý thay đổi rating của sản phẩm cụ thể
    const handleProductRatingChange = (productId, rating) => {
        setProductRatings(prevRatings =>
            prevRatings.map(item =>
                item.productId === productId ? { ...item, rating } : item
            )
        );
    };

    // Xử lý thay đổi bình luận của sản phẩm cụ thể
    const handleProductCommentChange = (productId, comment) => {
        setProductRatings(prevRatings =>
            prevRatings.map(item =>
                item.productId === productId ? { ...item, comment } : item
            )
        );
    };

    // Xử lý gửi tất cả đánh giá lên backend
    const handleSubmitReviews = async () => {
        // Kiểm tra xem tất cả sản phẩm đã được đánh giá sao chưa
        const allProductsRated = productRatings.every(item => item.rating > 0);
        if (!allProductsRated) {
            Toast.show({
                type: 'error',
                text1: 'Chưa hoàn tất đánh giá',
                text2: 'Vui lòng đánh giá số sao cho tất cả sản phẩm.'
            });
            return;
        }

        // Kiểm tra xem nhà hàng đã được đánh giá sao chưa
        if (overallRestaurantRating === 0) {
            Toast.show({
                type: 'error',
                text1: 'Chưa đánh giá nhà hàng',
                text2: 'Vui lòng đánh giá số sao cho nhà hàng.'
            });
            return;
        }

        setSubmitting(true);
        try {
            // Lấy thông tin người dùng từ AsyncStorage
            const userString = await AsyncStorage.getItem('user');
            const user = userString ? JSON.parse(userString) : null;

            if (!user?._id) {
                Toast.show({ type: 'error', text1: 'Lỗi xác thực', text2: 'Vui lòng đăng nhập lại.' });
                setSubmitting(false);
                return;
            }

            // Chuẩn bị dữ liệu để gửi lên backend
            const reviewsData = {
                orderId: orderId,
                userId: user._id,
                restaurantId: restaurantId,
                productReviews: productRatings.map(p => ({
                    productId: p.productId,
                    rating: p.rating,
                    comment: p.comment,
                })),
                restaurantReview: {
                    rating: overallRestaurantRating,
                    comment: overallRestaurantComment,
                }
            };

            // Gửi dữ liệu đánh giá lên API
            const res = await fetch(`${linkapi}reviews/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Nếu có token xác thực, thêm vào đây:
                    // 'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify(reviewsData),
            });

            // Kiểm tra phản hồi từ API
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Lỗi khi gửi đánh giá');
            }

            // Hiển thị thông báo thành công và quay lại màn hình trước
            Toast.show({
                type: 'success',
                text1: 'Đánh giá thành công',
                text2: 'Cảm ơn bạn đã gửi đánh giá!'
            });
            navigation.navigate('HistoryOrders');

        } catch (error) {
            console.error("Lỗi khi gửi đánh giá:", error);
            Toast.show({
                type: 'error',
                text1: 'Đánh giá thất bại',
                text2: error.message || 'Không thể gửi đánh giá. Vui lòng thử lại.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Render từng sản phẩm để đánh giá
    const renderProductReviewItem = ({ item }) => (
        <View style={styles.productReviewCard}>
            <Image
                source={{ uri: `${linkanh}${item.productImage}` }}
                style={styles.reviewProductImage}
            />
            <View style={styles.reviewProductInfo}>
                <Text style={styles.reviewProductName}>{item.productName}</Text>
                <View style={styles.ratingContainer}>
                    {/* Component đánh giá sao cho sản phẩm */}
                    <StarRating
                        rating={item.rating}
                        onChange={(rating) => handleProductRatingChange(item.productId, rating)}
                        maxStars={5}
                        starSize={25}
                        color="#FFD700"
                        emptyColor="#ccc"
                    />
                </View>
                <TextInput
                    style={styles.commentInput}
                    placeholder="Bình luận về sản phẩm này (tùy chọn)..."
                    value={item.comment}
                    onChangeText={(text) => handleProductCommentChange(item.productId, text)}
                    multiline
                    numberOfLines={3}
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* KeyboardAvoidingView để tránh bàn phím che mất input */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {/* Header của màn hình */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Đánh giá sản phẩm</Text>
                </View>

                {/* Phần cuộn được của nội dung */}
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                    {/* Phần đánh giá nhà hàng */}
                    <Text style={styles.sectionTitle}>Đánh giá nhà hàng</Text>
                    <View style={styles.restaurantReviewContainer}>
                        {/* Hiển thị tên nhà hàng hoặc ActivityIndicator khi đang tải */}
                        {restaurantLoading ? (
                            <ActivityIndicator size="small" color="#f55" />
                        ) : (
                            <Text style={styles.restaurantName}>Nhà hàng: {restaurantName}</Text>
                        )}
                        {/* Component đánh giá sao cho nhà hàng */}
                        <StarRating
                            rating={overallRestaurantRating}
                            onChange={setOverallRestaurantRating}
                            maxStars={5}
                            starSize={30}
                            color="#FFD700"
                            emptyColor="#ccc"
                        />
                        <TextInput
                            style={styles.commentInput}
                            placeholder="Bình luận về nhà hàng (tùy chọn)..."
                            value={overallRestaurantComment}
                            onChangeText={setOverallRestaurantComment}
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    {/* Phần đánh giá từng sản phẩm */}
                    <Text style={styles.sectionTitle}>Đánh giá từng sản phẩm</Text>
                    <FlatList
                        data={productRatings}
                        renderItem={renderProductReviewItem}
                        keyExtractor={item => item.productId}
                        scrollEnabled={false}
                        ListEmptyComponent={<Text style={styles.emptyProductsText}>Không có sản phẩm nào để đánh giá.</Text>}
                    />
                </ScrollView>

                {/* Nút gửi đánh giá */}
                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmitReviews}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Gửi Đánh Giá</Text>
                    )}
                </TouchableOpacity>
            </KeyboardAvoidingView>
            {/* <Toast /> */}
        </SafeAreaView>
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
        paddingTop: Platform.OS === 'android' ? 20 : 0,
    },
    backButton: {
        marginRight: 10,
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
        marginRight: 34, // Để căn giữa tiêu đề khi có nút back
    },
    scrollViewContent: {
        padding: 15,
        paddingBottom: 80, // Để chừa chỗ cho nút submit
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        marginTop: 20,
    },
    restaurantReviewContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        alignItems: 'center', // Căn giữa nội dung trong card nhà hàng
    },
    restaurantName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        color: '#555',
    },
    productReviewCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        alignItems: 'flex-start',
    },
    reviewProductImage: {
        width: 70,
        height: 70,
        borderRadius: 8,
        marginRight: 15,
        resizeMode: 'cover',
        backgroundColor: '#eee',
    },
    reviewProductInfo: {
        flex: 1,
    },
    reviewProductName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    ratingContainer: {
        marginBottom: 10,
        alignSelf: 'flex-start', // Căn trái sao đánh giá
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        color: '#333',
        marginTop: 5,
        textAlignVertical: 'top', // Để placeholder và text bắt đầu từ trên cùng
    },
    submitButton: {
        backgroundColor: '#f55',
        paddingVertical: 15,
        borderRadius: 10,
        marginHorizontal: 15,
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute', // Đặt nút ở dưới cùng
        bottom: 0,
        left: 0,
        right: 0,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptyProductsText: {
        textAlign: 'center',
        color: '#888',
        marginTop: 20,
        fontSize: 16,
    },
});