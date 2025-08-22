// screens/RestaurantDetailScreen.js
import { Entypo, Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { linkanh, linkapi } from '../navigation/config';
import { formatPriceVND } from '../navigation/currency';


const { width } = Dimensions.get('window');

export default function RestaurantDetailScreen({ navigation }) {
    const route = useRoute();
    const { restaurantId, restaurantName } = route.params || {};

    const [restaurant, setRestaurant] = useState(null);
    const [products, setProducts] = useState([]);
    const [address, setAddress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null); // State to store the fetched userId

    useEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });

        const fetchUserId = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('user');
                if (storedUser) {
                    const userData = JSON.parse(storedUser);
                    setCurrentUserId(userData._id);
                } else {
                    console.warn('No user data found in AsyncStorage.');
                }
            } catch (e) {
                console.error('Failed to load user ID from AsyncStorage:', e);
            }
        };

        const fetchRestaurantDetailsAndProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                const restaurantRes = await fetch(`${linkapi}restaurants/${restaurantId}`);
                if (!restaurantRes.ok) {
                    throw new Error('Không thể tải thông tin nhà hàng.');
                }
                const restaurantData = await restaurantRes.json();
                setRestaurant(restaurantData);

                const productsRes = await fetch(`${linkapi}restaurants/${restaurantId}/menu_items`);
                if (!productsRes.ok) {
                    console.warn("Không tìm thấy món ăn cho nhà hàng này hoặc lỗi khi fetch sản phẩm.");
                    setProducts([]);
                } else {
                    const productsData = await productsRes.json();
                    setProducts(productsData);
                }

                const addressRes = await fetch(`${linkapi}addresses/user/${restaurantId}`);
                if (!addressRes.ok) {
                    console.warn("Không tìm thấy địa chỉ cho nhà hàng này hoặc lỗi khi fetch địa chỉ.");
                    setAddress(null);
                } else {
                    const addressData = await addressRes.json();
                    setAddress(addressData);
                }

            } catch (err) {
                console.error("Lỗi khi tải chi tiết nhà hàng, món ăn hoặc địa chỉ:", err);
                setError(err.message || 'Có lỗi xảy ra khi tải thông tin nhà hàng.');
                Toast.show({
                    type: 'error',
                    text1: 'Lỗi',
                    text2: err.message || 'Không thể tải thông tin nhà hàng.',
                });
                setProducts([]);
                setAddress(null);
            } finally {
                setLoading(false);
            }
        };

        if (restaurantId) {
            fetchUserId(); // Fetch user ID first
            fetchRestaurantDetailsAndProducts();
        } else {
            setError('Không có ID nhà hàng để hiển thị.');
            setLoading(false);
        }
    }, [restaurantId, navigation]);

    // Hàm render item cho sản phẩm (giữ nguyên)
    const renderProductItem = ({ item }) => (
        <TouchableOpacity
            style={styles.foodCard}
            onPress={() => navigation.navigate('ProductDetail', { product: item })}
        >
            <Image
                source={{ uri: item.image_url ? linkanh + item.image_url : 'https://via.placeholder.com/150' }}
                style={styles.foodImage}
            />
            <View style={styles.cardInfoContainer}>
                <Text style={styles.foodName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                <Text style={styles.foodPrice}>{formatPriceVND(item.price)}</Text>
                <View style={styles.cardBottomRow}>
                    <View style={styles.ratingRow}>
                        <Text style={styles.foodRatingText}>{item.rating ? item.rating.toFixed(1) : '0.0'}/5</Text>
                        <Entypo name="star" size={14} color="#FFD700" style={{ marginLeft: 4 }} />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    // Hàm xử lý khi nhấn nút chat
    const handleChatPress = async () => {
        if (!currentUserId || !restaurantId || !restaurant?.name) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi trò chuyện',
                text2: 'Không thể bắt đầu trò chuyện. Thiếu thông tin người dùng hoặc nhà hàng.',
            });
            return;
        }

        try {
            // Gửi request đến backend để tạo/lấy conversation
            const response = await fetch(`${linkapi}chat/conversation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    participant1Id: currentUserId,
                    participant2Id: restaurantId, // restaurantId chính là ID của nhà hàng
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Không thể tạo/lấy cuộc hội thoại.');
            }

            const data = await response.json();
            const actualConversationId = data.conversationId; // Đây là ID thật từ MongoDB

            console.log("Conversation ID từ backend:", actualConversationId);

            // Điều hướng đến ChatDetailScreen với conversationId thật
            navigation.navigate('ChatDetail', {
                conversationId: actualConversationId,
                currentUserId: currentUserId,
                otherParticipant: { // Đảm bảo truyền đúng cấu trúc otherParticipant
                    _id: restaurantId,
                    name: restaurant.name,
                    avatar_url: restaurant.avatar_url,
                    role: 'Restaurant' // Thêm role để ChatDetailScreen có thể phân biệt
                }
            });

        } catch (err) {
            console.error('Lỗi khi bắt đầu trò chuyện:', err);
            Toast.show({
                type: 'error',
                text1: 'Lỗi trò chuyện',
                text2: err.message || 'Có lỗi xảy ra khi bắt đầu cuộc hội thoại.',
            });
        }
    };


    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6347" />
                <Text style={{ marginTop: 10, color: '#555' }}>Đang tải thông tin nhà hàng và thực đơn...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={50} color="red" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonError}>
                    <Text style={styles.backButtonTextError}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!restaurant) {
        return (
            <View style={styles.noDataContainer}>
                <Feather name="info" size={50} color="#777" />
                <Text style={styles.noDataText}>Không tìm thấy thông tin nhà hàng này.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonError}>
                    <Text style={styles.backButtonTextError}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.fullScreenContainer}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
            <ScrollView style={styles.container}>
                <View style={styles.imageBackgroundContainer}>
                    <Image
                        source={{ uri: restaurant.avatar_url ? linkanh + restaurant.avatar_url : 'https://via.placeholder.com/600x400.png?text=No+Image' }}
                        style={styles.restaurantHeaderImage}
                    />
                    <View style={styles.overlay} />

                    {/* Custom Header với nút back */}
                    <View style={styles.customHeader}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.imageTextOverlay}>
                        <Text style={styles.restaurantNameImageOverlay} numberOfLines={1} ellipsizeMode="tail">
                            {restaurant.name}
                        </Text>
                        {restaurant.rating !== undefined && (
                            <View style={styles.ratingContainerImageOverlay}>
                                <Entypo name="star" size={18} color="#FFD700" />
                                <Text style={styles.ratingTextImageOverlay}>
                                    {restaurant.rating ? restaurant.rating.toFixed(1) : 'Chưa có'}/5 ({restaurant.num_reviews || 0} đánh giá)
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.content}>
                    <View style={styles.infoSection}>
                        <Text style={styles.infoSectionTitle}>Thông tin liên hệ</Text>
                        {restaurant.phone && (
                            <View style={styles.infoRow}>
                                <Entypo name="phone" size={18} color="#FF6347" />
                                <Text style={styles.infoText}>{restaurant.phone}</Text>
                            </View>
                        )}
                        {restaurant.email && (
                            <View style={styles.infoRow}>
                                <Entypo name="mail" size={18} color="#FF6347" />
                                <Text style={styles.infoText}>{restaurant.email}</Text>
                            </View>
                        )}
                        {address && address.street && address.ward && address.city && (
                            <View style={styles.infoRow}>
                                <Entypo name="location-pin" size={18} color="#FF6347" />
                                <Text style={styles.infoText}>
                                    {`${address.street}, ${address.ward}, ${address.city}`}
                                </Text>
                            </View>
                        )}
                        {(!address && restaurant.address?.street && restaurant.address?.ward && restaurant.address?.city) && (
                            <View style={styles.infoRow}>
                                <Entypo name="location-pin" size={18} color="#FF6347" />
                                <Text style={styles.infoText}>
                                    {`${restaurant.address.street}, ${restaurant.address.ward}, ${restaurant.address.city}`}
                                </Text>
                            </View>
                        )}
                    </View>

                    {restaurant.description && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Mô tả</Text>
                            <Text style={styles.descriptionText}>{restaurant.description}</Text>
                        </View>
                    )}

                    {products.length > 0 ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Thực đơn của {restaurant.name}</Text>
                            <FlatList
                                data={products}
                                keyExtractor={(item) => item._id}
                                renderItem={renderProductItem}
                                numColumns={2}
                                columnWrapperStyle={styles.productColumnWrapper}
                                contentContainerStyle={styles.productListContainer}
                                scrollEnabled={false}
                            />
                        </View>
                    ) : (
                        <View style={styles.noProductsContainer}>
                            <Feather name="coffee" size={40} color="#ccc" />
                            <Text style={styles.noProductsText}>Nhà hàng này chưa có món ăn nào.</Text>
                        </View>
                    )}
                </View>
                {/* <Toast /> */}
            </ScrollView>

            {/* Nút trò chuyện nổi */}
            <TouchableOpacity style={styles.chatButton} onPress={handleChatPress}>
                <Ionicons name="chatbubbles" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        backgroundColor: '#F8F8F8',
    },
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F8F8F8',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
        marginBottom: 15,
        marginTop: 10,
    },
    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F8F8F8',
    },
    noDataText: {
        fontSize: 16,
        color: '#777',
        textAlign: 'center',
        marginBottom: 15,
        marginTop: 10,
    },
    backButtonError: {
        backgroundColor: '#FF6347',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    backButtonTextError: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },

    imageBackgroundContainer: {
        width: '100%',
        height: 250,
        position: 'relative',
    },
    restaurantHeaderImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },

    // Custom Header cho nút back
    customHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: StatusBar.currentHeight + 10,
        zIndex: 10,
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
    },

    imageTextOverlay: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    restaurantNameImageOverlay: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
        paddingRight: 5,
    },
    ratingContainerImageOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        paddingRight: 10,
        paddingBottom: 20
    },
    ratingTextImageOverlay: {
        fontSize: 18,
        color: '#FFD700',
        fontWeight: 'bold',
        marginLeft: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 5,
        paddingHorizontal: 5,
        paddingVertical: 2,
    },

    content: {
        flex: 1,
        backgroundColor: '#F8F8F8',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        marginTop: -30,
        paddingTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 8,
    },
    infoSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        marginHorizontal: 15,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 3,
    },
    infoSectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    infoText: {
        fontSize: 16,
        color: '#555',
        marginLeft: 15,
        flexShrink: 1,
    },

    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        marginHorizontal: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#FF6347',
        paddingLeft: 10,
        paddingTop: 10,
    },
    descriptionText: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
    },

    // Product Grid Styles
    productListContainer: {
        paddingHorizontal: 0,
    },
    productColumnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 15,
        paddingHorizontal: 0,
    },
    foodCard: {
        width: (width / 2) - 25,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
        marginHorizontal: 5,
    },
    foodImage: {
        width: '100%',
        height: 120,
        resizeMode: 'cover',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    cardInfoContainer: {
        padding: 10,
    },
    foodName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    foodPrice: {
        color: '#FF6347',
        fontWeight: 'bold',
        fontSize: 15,
        marginBottom: 8,
    },
    cardBottomRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginTop: 5,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 5,
        paddingHorizontal: 6,
        paddingVertical: 3,
    },
    foodRatingText: {
        fontSize: 13,
        color: '#555',
        fontWeight: '600',
    },
    noProductsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        marginHorizontal: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 3,
    },
    noProductsText: {
        fontSize: 16,
        color: '#777',
        marginTop: 10,
        textAlign: 'center',
    },

    // Nút trò chuyện FAB
    chatButton: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        backgroundColor: '#FF6347',
        borderRadius: 30,
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
        zIndex: 100, // Đảm bảo nút nằm trên cùng
    },
});