import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { linkanh, linkapi } from '../../navigation/config';

const ManageReviewsScreen = ({ navigation }) => {
    const [allProductReviews, setAllProductReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [overallAverageRating, setOverallAverageRating] = useState(0);
    const [overallTotalReviews, setOverallTotalReviews] = useState(0);

    // Hàm để fetch tất cả đánh giá sản phẩm
    const fetchAllProductReviews = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Lấy restaurant_id từ AsyncStorage
            const restaurantId = await AsyncStorage.getItem('restaurant_id');
            
            if (!restaurantId) {
                // Xử lý trường hợp không có restaurant_id (ví dụ: chưa đăng nhập hoặc lỗi)
                setError('Không tìm thấy ID nhà hàng. Vui lòng đăng nhập lại.');
                setLoading(false);
                return;
            }

            // Gửi restaurantId trong query parameter đến backend
            const response = await fetch(`${linkapi}reviews/product?restaurantId=${restaurantId}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Lỗi khi tải tất cả đánh giá sản phẩm.');
            }
            const data = await response.json();

            setAllProductReviews(data);

            // Tính toán rating trung bình và tổng số đánh giá từ dữ liệu fetched
            if (data.length > 0) {
                const totalRatingSum = data.reduce((sum, review) => sum + review.rating, 0);
                setOverallAverageRating(totalRatingSum / data.length);
                setOverallTotalReviews(data.length);
            } else {
                setOverallAverageRating(0);
                setOverallTotalReviews(0);
            }

        } catch (err) {
            console.error("Lỗi khi tải đánh giá sản phẩm:", err);
            setError(err.message || 'Không thể tải đánh giá sản phẩm. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, []); 

    useEffect(() => {
        fetchAllProductReviews();
    }, [fetchAllProductReviews]);

    // Hàm render số sao (tái sử dụng) - GIỮ NGUYÊN
    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        const starsToRender = [];
        for (let i = 0; i < fullStars; i++) {
            starsToRender.push(<Feather key={`full-${i}`} name="star" size={14} color="#FFD700" />);
        }
        if (hasHalfStar) {
            starsToRender.push(<Feather key="half" name="star-half" size={14} color="#FFD700" />);
        }
        for (let i = 0; i < emptyStars; i++) {
            starsToRender.push(<Feather key={`empty-${i}`} name="star" size={14} color="#ccc" />);
        }

        return (
            <View style={{ flexDirection: 'row' }}>
                {starsToRender}
            </View>
        );
    };

      const renderReviewItem = ({ item: review }) => (
        <View style={styles.reviewCard}>
            <View style={styles.productInfoContainer}>
                {/* SỬA ĐỔI LỚN TẠI ĐÂY: Dùng review.entity_id để truy cập thông tin sản phẩm */}
                <Image
                    source={review.entity_id?.image_url
                        ? { uri: review.entity_id.image_url.startsWith('http') ? review.entity_id.image_url : linkanh + review.entity_id.image_url }
                        : require('../../../assets/images/Banner.png')
                    }
                    style={styles.productImage}
                />
                <View style={styles.productDetails}>
                    <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail" >{review.entity_id?.name || 'Sản phẩm không rõ'}</Text>
                    <Text style={styles.productDescription} numberOfLines={2} ellipsizeMode="tail">
                        {review.entity_id?.description || 'Mô tả sản phẩm...'}
                    </Text>
                </View>
            </View>

            <View style={styles.reviewerAndRating}>
                <View style={styles.reviewerInfo}>
                    {/* Phần này có vẻ đã đúng với user_id */}
                    <Image
                        source={review.user_id?.avatar_url
                            ? { uri: review.user_id.avatar_url.startsWith('http') ? review.user_id.avatar_url : linkanh + review.user_id.avatar_url }
                            : require('../../../assets/images/AVT.jpg')
                        }
                        style={styles.reviewerAvatar}
                    />
                    <Text style={styles.reviewerName}>{review.user_id?.name || 'Người dùng ẩn danh'}</Text>
                </View>
                <View style={styles.ratingAndDate}>
                    {renderStars(review.rating)}
                    <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</Text>
                </View>
            </View>
            {review.comment ? (
                 <Text style={styles.reviewComment}>{review.comment}</Text>
            ) : (
                <Text style={styles.noCommentText}>Không có bình luận.</Text>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#f55" />
                <Text style={{ marginTop: 10, color: '#555' }}>Đang tải đánh giá sản phẩm...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Lỗi: {error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchAllProductReviews}>
                    <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>

            {/* Overall Summary Box */}
            <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Tổng quan đánh giá sản phẩm</Text>
                <View style={styles.overallRatingDisplay}>
                    <Text style={styles.overallRatingValue}>{overallAverageRating.toFixed(1)}</Text>
                    <View style={{marginLeft: 10}}>
                        {renderStars(overallAverageRating)}
                        <Text style={styles.overallTotalReviews}>({overallTotalReviews} đánh giá)</Text>
                    </View>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Danh sách Đánh giá</Text>

            {allProductReviews.length === 0 ? (
                <View style={styles.noReviewsContainer}>
                    <Feather name="info" size={30} color="#888" />
                    <Text style={styles.noReviewsText}>Chưa có đánh giá sản phẩm nào.</Text>
                </View>
            ) : (
                <FlatList
                    data={allProductReviews}
                    renderItem={renderReviewItem}
                    keyExtractor={item => item._id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.flatListContent}
                />
            )}
        </View>
    );
};

export default ManageReviewsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f2f5',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 4,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f2f5',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f0f2f5',
    },
    errorText: {
        fontSize: 18,
        color: 'red',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#f55',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    flatListContent: {
        paddingHorizontal: 15,
        paddingBottom: 20,
        paddingTop: 10, // Khoảng cách với summary box
    },
    summaryBox: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginHorizontal: 15,
        marginTop: 15,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    overallRatingDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    overallRatingValue: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    overallTotalReviews: {
        fontSize: 16,
        color: '#777',
        marginTop: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        marginLeft: 20,
    },
    reviewCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        marginHorizontal: 5, // Đẩy vào chút cho shadow đẹp
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    productInfoContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Căn chỉnh ảnh và text ở đầu
        marginBottom: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    productImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 10,
        backgroundColor: '#eee',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    productDetails: {
        flex: 1,
    },
    productName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 3,
    },
    productDescription: {
        fontSize: 14,
        color: '#666',
    },
    reviewerAndRating: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    reviewerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1, // Để chiếm không gian và push rating sang phải
    },
    reviewerAvatar: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        marginRight: 8,
        backgroundColor: '#eee',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    reviewerName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#555',
    },
    ratingAndDate: {
        alignItems: 'flex-end', // Căn phải cho sao và ngày
    },
    reviewDate: {
        fontSize: 13,
        color: '#999',
        marginTop: 3,
    },
    reviewComment: {
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
        marginTop: 5,
    },
    noCommentText: {
        fontSize: 14,
        color: '#888',
        fontStyle: 'italic',
        marginTop: 5,
    },
    noReviewsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    noReviewsText: {
        fontSize: 16,
        color: '#777',
        marginTop: 10,
        textAlign: 'center',
    },
});