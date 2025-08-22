import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { linkanh, linkapi } from '../../navigation/config'; // Điều chỉnh đường dẫn nếu cần

const DEFAULT_AVATAR = 'https://cdn2.fptshop.com.vn/small/avatar_trang_1_cd729c335b.jpg';

// ChatListItem Component (giữ nguyên)
const ChatListItem = ({ conversation, onPress, currentUserId }) => {
    const otherParticipant = conversation?.otherParticipant;

    const lastMessage = conversation.lastMessage;
    const lastMessageText = lastMessage ? lastMessage.message_text : 'Bắt đầu cuộc trò chuyện...';
    const lastMessageTime = lastMessage ?
        new Date(lastMessage.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';

    const otherParticipantAvatar = otherParticipant?.avatar_url;
    const avatarSource = otherParticipantAvatar ? { uri: `${linkanh}${otherParticipantAvatar}` } : { uri: DEFAULT_AVATAR };

    const isSentByCurrentUser = lastMessage && lastMessage.sender_id === currentUserId;
    const messagePrefix = isSentByCurrentUser ? 'Bạn: ' : '';

    return (
        <TouchableOpacity
            style={stylesChatListItem.container}
            onPress={() => onPress(conversation._id, otherParticipant)}
        >
            <Image
                source={avatarSource}
                style={stylesChatListItem.avatar}
            />
            <View style={stylesChatListItem.content}>
                <View style={stylesChatListItem.header}>
                    <Text style={stylesChatListItem.name} numberOfLines={1} ellipsizeMode="tail">
                        {otherParticipant?.name || 'Người dùng ẩn danh'}
                    </Text>
                    {lastMessageTime && <Text style={stylesChatListItem.time}>{lastMessageTime}</Text>}
                </View>
                <Text
                    style={stylesChatListItem.lastMessage}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {messagePrefix}{lastMessageText}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const stylesChatListItem = StyleSheet.create({
    container: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, backgroundColor: '#FFFFFF',
        marginBottom: 8, borderRadius: 12, marginHorizontal: 15,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
    },
    avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 18, backgroundColor: '#E0E0E0', borderWidth: 1, borderColor: '#F0F0F0' },
    content: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    name: { fontSize: 18, fontWeight: '700', color: '#333333', flexShrink: 1, marginRight: 10 },
    time: { fontSize: 13, color: '#999999', fontWeight: '500' },
    lastMessage: { fontSize: 15, color: '#666666', fontStyle: 'italic' },
});


export default function AdminChatScreen() {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentEntityId, setCurrentEntityId] = useState(null); // Sử dụng tên chung hơn: ID của entity hiện tại (có thể là Admin, Restaurant, User)

    const navigation = useNavigation();

    // Hàm để lấy ID của entity hiện tại từ AsyncStorage (đọc từ key 'user')
    const getCurrentEntityId = async () => {
        try {
            const storedUserObject = await AsyncStorage.getItem('user'); // Lấy user object
            // const storedRestaurantIdFromKey = await AsyncStorage.getItem('restaurant_id'); // Cái này không cần thiết nếu bạn chỉ dùng key 'user' để lấy role và _id

            let entityIdToUse = null;

            if (storedUserObject) {
                const userData = JSON.parse(storedUserObject);
                // Debug logs
                console.log("Debug AdminChatScreen: userData from 'user' key:", userData);
                // console.log("Debug AdminChatScreen: storedRestaurantIdFromKey:", storedRestaurantIdFromKey); // Không cần nếu không sử dụng

                // === SỬA ĐIỀU KIỆN TẠI ĐÂY ===
                // Cho phép cả 'Admin' và 'Restaurant' truy cập màn hình này
                if (userData.role === 'Admin' || userData.role === 'Restaurant') {
                    entityIdToUse = userData._id; // Lấy _id của Admin hoặc Restaurant làm ID để fetch tin nhắn

                    // Nếu là Admin, bạn có thể muốn một logic khác để xác định restaurantId
                    // Ví dụ: Admin có trường 'managingRestaurantId' hoặc có thể chọn một nhà hàng từ danh sách.
                    // Hiện tại, chúng ta sẽ sử dụng _id của chính Admin để gọi API.
                    // LƯU Ý: Điều này chỉ hoạt động nếu backend của bạn xử lý _id của Admin
                    // như một restaurantId hợp lệ hoặc có endpoint chung cho Admin.
                    if (userData.role === 'Admin') {
                        console.warn('Admin đang truy cập màn hình chat nhà hàng. _id của Admin sẽ được dùng làm ID entity.');
                        // Bạn có thể thêm logic ở đây nếu Admin cần xem tin nhắn của MỘT nhà hàng cụ thể
                        // (ví dụ: lấy ID nhà hàng từ một tham số khác hoặc từ cài đặt Admin)
                        // Hiện tại, nó sẽ cố gắng fetch các cuộc hội thoại mà Admin._id là một participant.
                    }

                } else {
                    console.warn('Người dùng hiện tại không phải là Admin hoặc Nhà hàng. Vai trò:', userData.role);
                    setError("Tài khoản của bạn không có quyền truy cập màn hình tin nhắn này.");
                    return null;
                }
            } else {
                console.warn('Không tìm thấy thông tin người dùng trong AsyncStorage (key "user").');
                setError("Vui lòng đăng nhập lại.");
                return null;
            }

            // Nếu đã tìm thấy entityIdToUse và nó hợp lệ
            if (entityIdToUse) {
                setCurrentEntityId(entityIdToUse);
                return entityIdToUse;
            } else {
                console.warn('Không tìm thấy ID entity hợp lệ sau khi kiểm tra.');
                setError("Không tìm thấy ID người dùng/nhà hàng. Vui lòng đăng nhập lại.");
                return null;
            }

        } catch (e) {
            console.error('Lỗi khi đọc thông tin người dùng từ AsyncStorage:', e);
            setError('Không thể lấy thông tin đăng nhập.');
            return null;
        }
    };

    // Hàm fetch cuộc hội thoại (sửa tên biến đầu vào cho phù hợp)
    const fetchConversationsForEntity = useCallback(async (entityId) => {
        if (!entityId) {
            setLoading(false);
            // Error already set by getCurrentEntityId if entityId is null
            return;
        }
        setLoading(true);
        setError(null); // Clear previous errors
        try {
            // Gọi endpoint `/chat/conversations/restaurant/:restaurantId`
            // Vẫn dùng restaurantId vì API backend của bạn định nghĩa như vậy.
            // entityId ở đây sẽ là _id của Admin hoặc Restaurant.
            const response = await fetch(`${linkapi}chat/conversations/user/${entityId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Không thể tải cuộc hội thoại.');
            }
            const data = await response.json();
            setConversations(data);
        } catch (err) {
            console.error("Lỗi khi tải danh sách cuộc hội thoại:", err);
            setError(err.message || "Lỗi khi tải danh sách cuộc hội thoại.");
        } finally {
            setLoading(false);
        }
    }, [linkapi]);

    useFocusEffect(
        useCallback(() => {
            let mounted = true;
            const loadData = async () => {
                setLoading(true); // Ensure loading state is true before async operations
                const entityId = await getCurrentEntityId(); // Lấy ID entity
                if (mounted && entityId) {
                    await fetchConversationsForEntity(entityId);
                } else if (mounted && !entityId) {
                    setLoading(false); // If no entityId, stop loading
                    // Error message is already set by getCurrentEntityId
                }
            };
            loadData();

            return () => {
                mounted = false;
            };
        }, [fetchConversationsForEntity])
    );

    const handleSelectConversation = (conversationId, otherParticipant) => {
        navigation.navigate('AdminChatDetail', {
            conversationId,
            otherParticipant,
            currentUserId: currentEntityId // Pass the ID of the logged-in entity (Admin/Restaurant)
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F8F8" />

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#FF6347" />
                    <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
                </View>
            ) : error ? (
                <View style={styles.centered}>
                    <Text style={styles.errorText}>Lỗi: {error}</Text>
                    {/* Chỉ hiển thị nút "Quay lại" nếu lỗi liên quan đến quyền truy cập hoặc không tìm thấy ID */}
                    {error.includes("quyền truy cập") || error.includes("đăng nhập lại") || error.includes("ID") ? (
                         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.actionButton}>
                            <Text style={styles.actionButtonText}>Quay lại</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={() => fetchConversationsForEntity(currentEntityId)} style={styles.actionButton}>
                            <Text style={styles.actionButtonText}>Thử lại</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : conversations.length === 0 ? (
                <View style={styles.centered}>
                    {/* <Image
                        source={require('../assets/empty_chat.png')}
                        style={styles.emptyImage}
                    /> */}
                    <Text style={styles.noConversationText}>Chưa có cuộc trò chuyện nào với khách hàng.</Text>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <ChatListItem
                            conversation={item}
                            currentUserId={currentEntityId}
                            onPress={handleSelectConversation}
                        />
                    )}
                    contentContainerStyle={styles.flatListContent}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F8F8' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: Platform.OS === 'ios' ? 15 : 25,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
    },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333333' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F8F8', padding: 20 },
    loadingText: { marginTop: 15, fontSize: 16, color: '#555555', fontWeight: '500' },
    errorText: { fontSize: 17, color: '#D32F2F', textAlign: 'center', marginBottom: 15, fontWeight: '600' },
    actionButton: {
        backgroundColor: '#FF6347', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8, marginTop: 20,
        shadowColor: '#FF6347', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5,
    },
    actionButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    noConversationText: { fontSize: 17, color: '#777777', textAlign: 'center', marginTop: 15 },
    emptyImage: { width: 150, height: 150, resizeMode: 'contain', marginBottom: 20, opacity: 0.7 },
    flatListContent: { paddingTop: 10, paddingBottom: 20 },
});