
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { linkanh, linkapi } from '../../navigation/config';

const DEFAULT_AVATAR = 'https://cdn2.fptshop.com.vn/small/avatar_trang_1_cd729c335b.jpg';

export default function AdminChatDetailScreen({ navigation }) {
    const route = useRoute();
    const {
        conversationId,
        otherParticipant,
        currentUserId
    } = route.params;

    const otherPartyId = otherParticipant?._id;
    const otherPartyName = otherParticipant?.name;
    const otherPartyAvatar = otherParticipant?.avatar_url;

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const flatListRef = useRef(null);

    useEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${linkapi}chat/messages/conversation/${conversationId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Không thể tải tin nhắn.');
            }
            const data = await response.json();

            const processedMessages = data.map(msg => ({
                ...msg,
                sender_id: typeof msg.sender_id === 'string'
                    ? { _id: msg.sender_id, name: "Người dùng" }
                    : msg.sender_id
            }));

            // Sắp xếp tăng dần theo thời gian tạo (cũ nhất trước)
            const sortedMessages = processedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            setMessages(sortedMessages);

            const unreadMessagesFromOther = sortedMessages.filter(msg =>
                msg.status !== 'read' && msg.sender_id?._id?.toString() !== currentUserId?.toString()
            );

            for (const msg of unreadMessagesFromOther) {
                await updateMessageStatus(msg._id, 'read');
            }

        } catch (err) {
            console.error('Lỗi khi fetch tin nhắn:', err);
            setError(err.message || 'Lỗi khi tải tin nhắn.');
            Toast.show({
                type: 'error',
                text1: 'Lỗi tải tin nhắn',
                text2: err.message || 'Không thể tải lịch sử trò chuyện.',
            });
        } finally {
            setLoading(false);
        }
    }, [conversationId, currentUserId, linkapi]);

    useEffect(() => {
        if (conversationId && currentUserId) {
            fetchMessages();
            // TODO: Triển khai Socket.IO để nhận tin nhắn real-time
        } else {
            setLoading(false);
            setError("Thiếu thông tin cuộc hội thoại hoặc người dùng.");
            Toast.show({
                type: 'error',
                text1: 'Thiếu thông tin',
                text2: 'Không thể bắt đầu trò chuyện do thiếu ID.',
            });
        }
    }, [fetchMessages, conversationId, currentUserId]);

    const scrollToBottom = useCallback(() => {
        if (flatListRef.current && messages.length > 0) {
            setTimeout(() => {
                flatListRef.current.scrollToEnd({ animated: true });
            }, 50);
        }
    }, [messages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);


    const updateMessageStatus = async (messageId, status) => {
        try {
            const response = await fetch(`${linkapi}chat/message/status/${messageId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`Failed to update message status for ${messageId}:`, errorData.message);
            }
        } catch (err) {
            console.error(`Error updating message status for ${messageId}:`, err);
        }
    };


    const handleSendMessage = async () => {
        if (inputText.trim() === '' || !currentUserId || !conversationId) {
            return;
        }

        const messageToSend = inputText.trim();

        const tempMessage = {
            _id: `temp-${Date.now()}`,
            sender_id: { _id: currentUserId, name: "Bạn" },
            message_text: messageToSend,
            createdAt: new Date().toISOString(),
        };

        // Thêm tin nhắn mới vào CUỐI mảng
        setMessages((prevMessages) => [...prevMessages, tempMessage]);
        setInputText('');
        scrollToBottom(); // Cuộn xuống để thấy tin nhắn mới

        try {
            const response = await fetch(`${linkapi}chat/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conversationId: conversationId,
                    senderId: currentUserId,
                    messageText: messageToSend,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Lỗi khi gửi tin nhắn:', errorData.message);
                setMessages((prevMessages) => prevMessages.filter(msg => msg._id !== tempMessage._id));
                Toast.show({
                    type: 'error',
                    text1: 'Gửi lỗi',
                    text2: errorData.message || 'Không thể gửi tin nhắn.',
                });
            } else {
                const responseData = await response.json();
                const actualSavedMessage = responseData.message;

                if (actualSavedMessage) {
                    const processedActualSavedMessage = {
                        ...actualSavedMessage,
                        sender_id: typeof actualSavedMessage.sender_id === 'string'
                            ? { _id: actualSavedMessage.sender_id, name: actualSavedMessage.sender_id === currentUserId ? "Bạn" : (otherPartyName || "Người dùng") }
                            : actualSavedMessage.sender_id
                    };

                    setMessages((prevMessages) =>
                        prevMessages.map(msg =>
                            msg._id === tempMessage._id ? processedActualSavedMessage : msg
                        ).filter(Boolean)
                    );
                } else {
                    console.warn('Backend không trả về tin nhắn đã lưu hoàn chỉnh.');
                    Toast.show({
                        type: 'warn',
                        text1: 'Cảnh báo',
                        text2: 'Tin nhắn đã gửi nhưng không nhận được xác nhận đầy đủ.',
                    });
                }
            }
        } catch (err) {
            console.error('Lỗi mạng khi gửi tin nhắn:', err);
            setMessages((prevMessages) => prevMessages.filter(msg => msg._id !== tempMessage._id));
            Toast.show({
                type: 'error',
                text1: 'Lỗi mạng',
                text2: err.message || 'Không thể kết nối server để gửi tin nhắn.',
            });
        }
    };

    const renderMessage = ({ item }) => {
        const senderIdToCheck = item.sender_id?._id || item.sender_id;
        const isMyMessage = senderIdToCheck === currentUserId;

        const messageTime = new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

        return (
            <View style={[
                styles.messageBubble,
                isMyMessage ? styles.myMessage : styles.otherMessage,
                isMyMessage ? styles.myMessageShadow : styles.otherMessageShadow,
            ]}>
                {!isMyMessage && item.sender_id && typeof item.sender_id === 'object' && item.sender_id.name && (
                    <Text style={styles.senderName}>{item.sender_id.name}</Text>
                )}
                <Text style={styles.messageText}>
                    {item.message_text}
                </Text>
                <Text style={styles.messageTime}>
                    {messageTime}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Image
                    source={{ uri: otherPartyAvatar ? `${linkanh}${otherPartyAvatar}` : DEFAULT_AVATAR }}
                    style={styles.headerAvatar}
                />
                <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
                    {otherPartyName || 'Đang tải...'}
                </Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF6347" />
                    <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={60} color="red" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={fetchMessages} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item._id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messagesContainer}
                // KHÔNG sử dụng `inverted`
                />
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                style={styles.inputContainer}
            >
                <TextInput
                    style={styles.textInput}
                    placeholder="Nhập tin nhắn..."
                    placeholderTextColor="#999"
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    onFocus={scrollToBottom} // Cuộn xuống khi focus (nếu cần)
                />
                <TouchableOpacity
                    style={[styles.sendButton, inputText.trim() === '' ? styles.sendButtonDisabled : {}]}
                    onPress={handleSendMessage}
                    disabled={inputText.trim() === ''}
                >
                    <Ionicons name="send" size={24} color="#fff" />
                </TouchableOpacity>
            </KeyboardAvoidingView>
            {/* <Toast /> */}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 3,
    },
    backButton: {
        padding: 5,
        marginRight: 10,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: '#e0e0e0',
        borderWidth: 0.5,
        borderColor: '#ddd',
    },
    headerTitle: {
        fontSize: 19,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    messagesContainer: {
        paddingVertical: 10,
        paddingHorizontal: 10,
        flexGrow: 1,
        // BỎ justifyContent: 'flex-end'
    },
    messageBubble: {
        maxWidth: '78%',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 20,
        marginBottom: 8,
        flexDirection: 'column',
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#dcf8c6',
        borderBottomRightRadius: 6,
        borderTopRightRadius: 20,
        borderBottomLeftRadius: 20,
        borderTopLeftRadius: 20,
    },
    otherMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#ffffff',
        borderBottomLeftRadius: 6,
        borderTopLeftRadius: 20,
        borderBottomRightRadius: 20,
        borderTopRightRadius: 20,
    },
    myMessageShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 1,
        elevation: 2,
    },
    otherMessageShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 1,
        elevation: 1,
    },
    messageText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 4,
        lineHeight: 22,
    },
    messageTime: {
        fontSize: 11,
        color: '#888',
        alignSelf: 'flex-end',
    },
    senderName: {
        fontSize: 12,
        color: '#555',
        marginBottom: 3,
        fontWeight: 'bold',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#e0e0e0',
        paddingVertical: 10,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    },
    textInput: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 25,
        paddingHorizontal: 18,
        paddingVertical: Platform.OS === 'ios' ? 12 : 10,
        marginRight: 10,
        fontSize: 16,
        lineHeight: 22,
        maxHeight: 120,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#ddd',
    },
    sendButton: {
        backgroundColor: '#FF6347',
        borderRadius: 25,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF6347',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
        shadowColor: 'transparent',
        elevation: 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
    },
    loadingText: {
        marginTop: 10,
        color: '#555',
        fontSize: 16,
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
    retryButton: {
        backgroundColor: '#FF6347',
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