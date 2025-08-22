import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { linkanh, linkapi } from '../../navigation/config'; // Đảm bảo đường dẫn đúng

export default function AdminReviewsListScreen({ navigation, route }) {
    const { entityId, entityName, averageRating, totalReviews } = route.params; // Nhận từ AdminProfileScreen
    const [detailedReviews, setDetailedReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(true);
    const [error, setError] = useState(null);

    const fetchDetailedReviews = useCallback(async () => {
        if (!entityId) {
            setError('Không có ID đối tượng để tải đánh giá.');
            setLoadingReviews(false);
            return;
        }
        setLoadingReviews(true);
        setError(null);
        try {
            // Giả định entityType là 'Restaurant' vì màn hình này dùng cho AdminProfileScreen
            // Nếu bạn có thể xem đánh giá sản phẩm từ màn hình khác, bạn cần truyền entityType
            const entityType = 'Restaurant'; // Hoặc 'Product' tùy thuộc vào ngữ cảnh
            const response = await fetch(`${linkapi}reviews/${entityType}/${entityId}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Lỗi khi tải đánh giá chi tiết.');
            }
            const data = await response.json();
            setDetailedReviews(data);
        } catch (err) {
            console.error("Lỗi khi tải đánh giá chi tiết:", err);
            setError(err.message || 'Không thể tải đánh giá chi tiết. Vui lòng thử lại.');
        } finally {
            setLoadingReviews(false);
        }
    }, [entityId]);

    useEffect(() => {
        fetchDetailedReviews();
    }, [fetchDetailedReviews]);

    // Hàm render số sao
    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        // Đảm bảo không render quá 5 sao
        const starsToRender = [];
        for (let i = 0; i < fullStars; i++) {
            starsToRender.push(<Feather key={`full-${i}`} name="star" size={16} color="#FFD700" />);
        }
        if (halfStar) {
            starsToRender.push(<Feather key="half" name="star-half" size={16} color="#FFD700" />);
        }
        for (let i = 0; i < emptyStars; i++) {
            starsToRender.push(<Feather key={`empty-${i}`} name="star" size={16} color="#ccc" />);
        }
        
        return (
            <View style={{ flexDirection: 'row' }}>
                {starsToRender}
            </View>
        );
    };

    if (loadingReviews) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#f55" />
                <Text style={{ marginTop: 10, color: '#555' }}>Đang tải đánh giá...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Lỗi: {error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchDetailedReviews}>
                    <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">Đánh giá về {entityName}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <View style={styles.summaryBox}>
                    <Text style={styles.summaryTitle}>Tổng quan đánh giá</Text>
                    <View style={styles.overallRating}>
                        <Text style={styles.overallRatingValue}>{averageRating.toFixed(1)}</Text>
                        <View style={{marginLeft: 10}}>
                            {renderStars(averageRating)}
                            <Text style={styles.overallTotalReviews}>({totalReviews} đánh giá)</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.reviewsListTitle}>Tất cả đánh giá</Text>
                {detailedReviews.length > 0 ? (
                    detailedReviews.map((review) => (
                        <View key={review._id} style={styles.reviewItem}>
                            <View style={styles.reviewHeader}>
                                <Image
                                    source={review.user_id?.avatar_url
                                        ? { uri: review.user_id.avatar_url.startsWith('http') ? review.user_id.avatar_url : linkanh + review.user_id.avatar_url }
                                        : require('../../../assets/images/AVT.jpg') // Ảnh mặc định nếu không có avatar
                                    }
                                    style={styles.reviewerAvatar}
                                />
                                <View style={styles.reviewerInfo}>
                                    <Text style={styles.reviewerName}>{review.user_id?.name || 'Người dùng ẩn danh'}</Text>
                                    <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</Text>
                                </View>
                            </View>
                            {renderStars(review.rating)}
                            <Text style={styles.reviewComment}>{review.comment}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.noReviewsText}>Chưa có đánh giá nào cho {entityName}.</Text>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f2f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        marginBottom: 10,
        backgroundColor: '#fff',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    backBtn: {
        padding: 5,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
        flex: 1,
        textAlign: 'center',
        marginRight: 34,
    },
    scrollViewContent: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    summaryBox: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
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
    overallRating: {
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
    reviewsListTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        marginLeft: 5,
    },
    reviewItem: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center', // Căn giữa theo chiều dọc
        marginBottom: 8,
    },
    reviewerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: '#eee',
    },
    reviewerInfo: {
        flex: 1,
    },
    reviewerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    reviewDate: {
        fontSize: 13,
        color: '#999',
    },
    reviewComment: {
        fontSize: 15,
        color: '#555',
        marginTop: 5,
        lineHeight: 22,
    },
    noReviewsText: {
        fontSize: 16,
        color: '#777',
        textAlign: 'center',
        marginTop: 20,
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
});