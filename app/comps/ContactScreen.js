import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// Nếu bạn có icon, có thể import ở đây, ví dụ:
// import Icon from 'react-native-vector-icons/Ionicons'; 

import { linkanh, linkapi } from '../navigation/config';

// Giả định một placeholder cho avatar nếu không có
const DEFAULT_AVATAR = 'https://cdn2.fptshop.com.vn/small/avatar_trang_1_cd729c335b.jpg';

// --- ChatListItem Component (Được cải tiến giao diện) ---
const ChatListItem = ({ conversation, onPress, currentUserId }) => {
    const otherParticipant = conversation?.otherParticipant;

    // console.log("Conversation Data:", conversation);
    // console.log("Current User ID:", currentUserId);
    // console.log("Other Participant:", otherParticipant);

    const lastMessage = conversation.lastMessage;
    const lastMessageText = lastMessage ? lastMessage.message_text : 'Bắt đầu cuộc trò chuyện...';
    const lastMessageTime = lastMessage ?
        new Date(lastMessage.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';

    const otherParticipantAvatar = otherParticipant?.avatar_url;
    const avatarSource = otherParticipantAvatar ? { uri: `${linkanh}${otherParticipantAvatar}` } : { uri: DEFAULT_AVATAR };

    // Kiểm tra xem tin nhắn cuối cùng có phải của người dùng hiện tại gửi hay không
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15, // Tăng padding
        paddingHorizontal: 20, // Tăng padding
        backgroundColor: '#FFFFFF', // Nền trắng
        marginBottom: 8, // Khoảng cách giữa các item
        borderRadius: 12, // Bo góc mềm mại
        marginHorizontal: 15, // Margin hai bên
        // Shadows cho iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        // Elevation cho Android
        elevation: 3,
    },
    avatar: {
        width: 60, // Kích thước avatar lớn hơn
        height: 60,
        borderRadius: 30, // Bo tròn hoàn hảo
        marginRight: 18,
        backgroundColor: '#E0E0E0',
        borderWidth: 1, // Thêm border nhẹ
        borderColor: '#F0F0F0',
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: 18, // Font lớn hơn
        fontWeight: '700', // Đậm hơn
        color: '#333333',
        flexShrink: 1,
        marginRight: 10,
    },
    time: {
        fontSize: 13,
        color: '#999999',
        fontWeight: '500',
    },
    lastMessage: {
        fontSize: 15,
        color: '#666666',
        // italic font style
        fontStyle: 'italic'
    },
});
// --- Kết thúc component ChatListItem được cải tiến ---

export default function ContactScreen() {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);

    const navigation = useNavigation();

    const getUserId = async () => {
        try {
            const storedRestaurantId = await AsyncStorage.getItem('restaurant_id');
            if (storedRestaurantId) {
                setCurrentUserId(storedRestaurantId);
                return storedRestaurantId;
            }

            const storedUser = await AsyncStorage.getItem('user');
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                setCurrentUserId(userData._id);
                return userData._id;
            }

            console.warn('Không tìm thấy userId trong AsyncStorage.');
            return null;

        } catch (e) {
            console.error('Lỗi khi đọc userId từ AsyncStorage:', e);
            setError('Không thể lấy thông tin người dùng.');
            return null;
        }
    };

    const fetchConversations = useCallback(async (userId) => {
        if (!userId) {
            setLoading(false);
            setError("Lỗi: Không tìm thấy ID người dùng đăng nhập.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${linkapi}chat/conversations/user/${userId}`);
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
                setLoading(true);
                const userId = await getUserId();
                if (mounted && userId) {
                    await fetchConversations(userId);
                } else if (mounted) {
                    setLoading(false);
                    setError("Không tìm thấy ID người dùng. Vui lòng đăng nhập lại.");
                }
            };
            loadData();

            return () => {
                mounted = false;
            };
        }, [fetchConversations])
    );

    const handleSelectConversation = (conversationId, otherParticipant) => {
        navigation.navigate('ChatDetail', {
            conversationId,
            otherParticipant,
            currentUserId: currentUserId
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F8F8" />
            <View style={styles.header}>
                {/* Bạn có thể thêm một nút back hoặc icon ở đây nếu cần */}
                {/* <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity> */}
                <Text style={styles.headerTitle}>Tin nhắn của bạn</Text>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#FF6347" />
                    <Text style={styles.loadingText}>Đang tải cuộc hội thoại...</Text>
                </View>
            ) : error ? (
                <View style={styles.centered}>
                    <Text style={styles.errorText}>Lỗi: {error}</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>Quay lại</Text>
                    </TouchableOpacity>
                </View>
            ) : conversations.length === 0 ? (
                <View style={styles.centered}>
                    
                    <Text style={styles.noConversationText}>Bạn chưa có cuộc trò chuyện nào.</Text>
                    <TouchableOpacity onPress={() => { }} style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>Bắt đầu trò chuyện mới</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <ChatListItem
                            conversation={item}
                            currentUserId={currentUserId}
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
    safeArea: {
        flex: 1,
        backgroundColor: '#F8F8F8', // Nền tổng thể
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Canh giữa tiêu đề
        paddingVertical: Platform.OS === 'ios' ? 15 : 25, // Tùy chỉnh padding cho iOS/Android
        backgroundColor: '#FFFFFF',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E0E0E0',
        // Shadows cho iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2, // Elevation cho Android
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333333',
    },
    // backButton: { // Style cho nút back nếu bạn thêm vào
    //     position: 'absolute',
    //     left: 15,
    //     padding: 5,
    // },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
        padding: 20,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#555555',
        fontWeight: '500',
    },
    errorText: {
        fontSize: 17,
        color: '#D32F2F', // Màu đỏ đậm hơn
        textAlign: 'center',
        marginBottom: 15,
        fontWeight: '600',
    },
    actionButton: {
        backgroundColor: '#FF6347', // Màu cam cháy
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        marginTop: 20,
        shadowColor: '#FF6347',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    noConversationText: {
        fontSize: 17,
        color: '#777777',
        textAlign: 'center',
        marginTop: 15,
    },
    emptyImage: { // Style cho ảnh khi không có cuộc trò chuyện
        width: 150,
        height: 150,
        resizeMode: 'contain',
        marginBottom: 20,
        opacity: 0.7,
    },
    flatListContent: {
        paddingTop: 10, // Padding đầu danh sách
        paddingBottom: 20,
    },
});