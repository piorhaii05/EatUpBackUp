// screens/MyRatingsScreen.js
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StarRating from 'react-native-star-rating-widget';
import Toast from 'react-native-toast-message';
import { linkanh, linkapi } from '../navigation/config'; // Link API và ảnh của bạn
import { formatPriceVND } from '../navigation/currency';


const MyRatingsScreen = ({ navigation }) => {
    const [allReviews, setAllReviews] = useState([]); // Chứa tất cả đánh giá từ API
    const [restaurantReviews, setRestaurantReviews] = useState([]); // Đánh giá nhà hàng
    const [productReviews, setProductReviews] = useState([]); // Đánh giá sản phẩm
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const getUserId = async () => {
            try {
                const userString = await AsyncStorage.getItem('user');
                const user = userString ? JSON.parse(userString) : null;
                if (user?._id) {
                    setUserId(user._id);
                } else {
                    setError('Bạn chưa đăng nhập.');
                    setLoading(false);
                }
            } catch (e) {
                console.error("Lỗi khi lấy user ID từ AsyncStorage:", e);
                setError('Lỗi xác thực. Vui lòng đăng nhập lại.');
                setLoading(false);
            }
        };
        getUserId();
    }, []);

    const fetchMyReviews = useCallback(async () => {
        if (!userId) {
            setRefreshing(false);
            return;
        }

        setRefreshing(true);
        setError(null);
        try {
            const url = `${linkapi}reviews/user/${userId}`;
            const res = await fetch(url);

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Lỗi khi tải đánh giá của bạn! Trạng thái: ${res.status}`);
            }

            const data = await res.json();
            setAllReviews(data);

            const resReviews = data.filter(review => review.entity_type === 'Restaurant');
            const prodReviews = data.filter(review => review.entity_type === 'Product');
            setRestaurantReviews(resReviews);
            setProductReviews(prodReviews);

        } catch (err) {
            console.error("Lỗi khi tải đánh giá của tôi:", err);
            setError(err.message || 'Không thể tải đánh giá của bạn. Vui lòng thử lại.');
            Toast.show({
                type: 'error',
                text1: 'Lỗi tải đánh giá',
                text2: err.message || 'Không thể tải đánh giá của bạn.'
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userId]);

    useEffect(() => {
        if (userId) {
            fetchMyReviews();
        }
    }, [userId, fetchMyReviews]);

    const renderReviewItem = ({ item }) => {
        const fullEntityImageUrl = item.entityImage ? `${linkanh}${item.entityImage}` : null;

        return (
            <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                    {fullEntityImageUrl ? (
                        <Image source={{ uri: fullEntityImageUrl }} style={styles.entityImage} />
                    ) : (
                        <Feather
                            name={item.entity_type === 'Product' ? "box" : "home"}
                            size={40}
                            color="#888"
                            style={styles.entityImagePlaceholder}
                        />
                    )}

                    <View style={styles.reviewInfo}>
                        <Text style={styles.entityName}>{item.entityName}</Text>
                        <StarRating
                            rating={item.rating}
                            maxStars={5}
                            starSize={18}
                            color="#FFD700"
                            emptyColor="#ccc"
                            onChange={() => {}}
                            readOnly={true}
                        />
                        {/* THÔNG TIN BỔ SUNG CHO NHÀ HÀNG - Hiển thị số điện thoại*/}
                        {item.entity_type === 'Restaurant' && (
                            <>
                                {item.phoneNumber ? ( // Kiểm tra trường 'phoneNumber' từ backend
                                    <Text style={styles.additionalInfoText}>
                                        <Feather name="phone" size={12} color="#666" /> Sđt: {item.phoneNumber}
                                    </Text>
                                ) : (
                                    <Text style={styles.additionalInfoText}>
                                        <Feather name="phone" size={12} color="#999" /> Số điện thoại: Chưa cập nhật
                                    </Text>
                                )}
                                {/* Đã loại bỏ phần hiển thị categories cho nhà hàng */}
                            </>
                        )}
                        {/* THÔNG TIN BỔ SUNG CHO SẢN PHẨM - Đã sửa lỗi hiển thị cửa hàng*/}
                        {item.entity_type === 'Product' && (
                            <>
                                {item.price !== undefined && item.price !== null ? (
                                    <Text style={[styles.additionalInfoText, styles.priceText]}>
                                        <Feather name="dollar-sign" size={12} color="#D32F2F" /> Giá: {formatPriceVND(item.price)}
                                    </Text>
                                ) : (
                                    <Text style={styles.additionalInfoText}>
                                        <Feather name="dollar-sign" size={12} color="#999" /> Giá: Chưa cập nhật
                                    </Text>
                                )}
        
                            </>
                        )}
                    </View>
                </View>

                {item.order_code && (
                    <View style={styles.orderInfoContainer}>
                        <Feather name="shopping-cart" size={14} color="#666" />
                        <Text style={styles.orderCodeText}>Mã đơn hàng: {item.order_code}</Text>
                    </View>
                )}

                <Text style={styles.comment}>{item.comment || "Không có bình luận."}</Text>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color="#FF5722" />
                <Text style={styles.loadingText}>Đang tải đánh giá của bạn...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Đánh giá của tôi</Text>
                </View>
                <View style={styles.centeredContent}>
                    <Feather name="alert-triangle" size={50} color="#D32F2F" style={{ marginBottom: 10 }} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchMyReviews}>
                        <Text style={styles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const hasReviews = restaurantReviews.length > 0 || productReviews.length > 0;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đánh giá của tôi</Text>
            </View>

            {hasReviews ? (
                <ScrollView
                    style={styles.scrollView}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={fetchMyReviews} colors={['#f55']} />
                    }
                >
                    {restaurantReviews.length > 0 && (
                        <>
                            <View style={styles.sectionTitleContainer}>
                                <Feather name="home" size={20} color="#333" style={styles.sectionIcon} />
                                <Text style={styles.sectionTitle}>Đánh giá nhà hàng</Text>
                            </View>
                            <FlatList
                                data={restaurantReviews}
                                keyExtractor={(item) => item._id}
                                renderItem={renderReviewItem}
                                scrollEnabled={false}
                                contentContainerStyle={styles.flatListContent}
                                ListFooterComponent={productReviews.length > 0 ? <View style={styles.listSectionSeparator} /> : null}
                            />
                        </>
                    )}

                    {productReviews.length > 0 && (
                        <>
                            <View style={styles.sectionTitleContainer}>
                                <Feather name="box" size={20} color="#333" style={styles.sectionIcon} />
                                <Text style={styles.sectionTitle}>Đánh giá sản phẩm</Text>
                            </View>
                            <FlatList
                                data={productReviews}
                                keyExtractor={(item) => item._id}
                                renderItem={renderReviewItem}
                                scrollEnabled={false}
                                contentContainerStyle={styles.flatListContent}
                            />
                        </>
                    )}
                </ScrollView>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={fetchMyReviews} colors={['#f55']} />
                    }
                    contentContainerStyle={styles.centeredContent}
                >
                    <Feather name="star" size={60} color="#ccc" style={{ marginBottom: 15 }} />
                    <Text style={styles.noReviewsText}>Bạn chưa có đánh giá nào.</Text>
                </ScrollView>
            )}

            {/* <Toast /> */}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 18,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ebebeb',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    backButton: {
        marginRight: 10,
        padding: 5,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
        marginRight: 34,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    centeredContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    loadingText: {
        marginTop: 15,
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
    },
    errorText: {
        color: '#D32F2F',
        fontSize: 17,
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#FF5722',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    noReviewsText: {
        textAlign: 'center',
        color: '#888',
        marginTop: 20,
        fontSize: 16,
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    flatListContent: {
        paddingHorizontal: 15,
        paddingBottom: 10,
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        marginTop: 15,
        marginBottom: 5,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        overflow: 'hidden',
    },
    sectionIcon: {
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    reviewCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 18,
        marginVertical: 7,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
        overflow: 'hidden',
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 10,
    },
    entityImage: {
        width: 65,
        height: 65,
        borderRadius: 10,
        marginRight: 15,
        resizeMode: 'cover',
        backgroundColor: '#f0f0f0',
        borderWidth: 0.5,
        borderColor: '#e0e0e0',
    },
    entityImagePlaceholder: {
        width: 65,
        height: 65,
        borderRadius: 10,
        marginRight: 15,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: '#e0e0e0',
    },
    reviewInfo: {
        flex: 1,
    },
    entityName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 3,
    },
    additionalInfoText: {
        fontSize: 13,
        color: '#666',
        marginTop: 3,
        flexDirection: 'row',
        alignItems: 'center',
    },
    priceText: {
        color: '#D32F2F', // Màu đỏ
        fontWeight: 'bold',
    },
    orderInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    orderCodeText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 8,
        fontWeight: '500',
    },
    comment: {
        fontSize: 15,
        color: '#444',
        lineHeight: 22,
        marginTop: 8,
    },
    date: {
        fontSize: 12,
        color: '#888',
        textAlign: 'right',
        marginTop: 10,
        fontStyle: 'italic',
    },
    listSectionSeparator: {
        height: 20,
        backgroundColor: '#f5f5f5',
    },
});

export default MyRatingsScreen;