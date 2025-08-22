import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { linkanh, linkapi } from '../../navigation/config';


export default function AdminProfileScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [restaurantAddress, setRestaurantAddress] = useState(null); // THÊM MỚI: State để lưu địa chỉ nhà hàng
    const [showGenderModal, setShowGenderModal] = useState(false);
    const [loadingImageUpload, setLoadingImageUpload] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);

    const route = useRoute();

    // SỬA ĐỔI: Hàm fetchUserFromStorage thành fetchUserAndAddress để lấy cả user và địa chỉ
    const fetchUserAndAddress = useCallback(async () => {
        setLoadingProfile(true);
        try {
            const userString = await AsyncStorage.getItem('user');
            if (userString) {
                const parsedUser = JSON.parse(userString);
                setUser(parsedUser);

                // THÊM MỚI: Lấy địa chỉ của nhà hàng (Admin)
                if (parsedUser._id) {
                    const res = await fetch(`${linkapi}address/${parsedUser._id}`);
                    if (res.ok) {
                        const data = await res.json();
                        // Tìm địa chỉ mặc định hoặc địa chỉ đầu tiên nếu không có mặc định
                        const defaultAddress = data.find(addr => addr.is_default) || (data.length > 0 ? data[0] : null);
                        setRestaurantAddress(defaultAddress);
                    } else {
                        console.warn("Không tìm thấy địa chỉ cho nhà hàng này hoặc lỗi API địa chỉ.");
                        setRestaurantAddress(null);
                    }
                }
            } else {
                setUser(null);
                setRestaurantAddress(null); // Đảm bảo địa chỉ cũng reset nếu không có user
            }
        } catch (error) {
            console.error("Lỗi khi tải thông tin người dùng hoặc địa chỉ:", error);
            Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể tải thông tin người dùng hoặc địa chỉ.' });
        } finally {
            setLoadingProfile(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            console.log('AdminProfileScreen được focus, đang tải lại dữ liệu người dùng và địa chỉ...');
            fetchUserAndAddress(); // SỬA ĐỔI: Gọi hàm mới

            // SỬA ĐỔI: Thêm shouldRefreshAddress vào điều kiện refresh
            if (route.params?.shouldRefreshProfile) {
                console.log('Phát hiện tham số refresh, đang tải lại...');
                fetchUserAndAddress();
                // Reset params để tránh tải lại không cần thiết
                navigation.setParams({ shouldRefreshProfile: false });
            } else {
                console.log('Không có tham số refresh, chỉ tải dữ liệu ban đầu.');
                fetchUserAndAddress();
            }
            
            return () => {
                // Cleanup function
            };
        }, [fetchUserAndAddress, navigation, route.params?.shouldRefreshProfile, route.params?.shouldRefreshAddress]) // SỬA ĐỔI: Thêm shouldRefreshAddress vào dependencies
    );


    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Quyền truy cập bị từ chối', 'Vui lòng cấp quyền truy cập thư viện ảnh để thay đổi ảnh đại diện.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const selectedImageUri = result.assets[0].uri;
            console.log('Đường dẫn ảnh đã chọn:', selectedImageUri);
            await uploadImageAndSaveProfile(selectedImageUri);
        }
    };

    const uploadImageAndSaveProfile = async (imageUri) => {
        setLoadingImageUpload(true);
        try {
            const formData = new FormData();
            formData.append('image', {
                uri: imageUri,
                name: 'avatar.jpg',
                type: 'image/jpeg',
            });

            const uploadRes = await fetch(`${linkapi}upload`, {
                method: 'POST',
                body: formData,
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (!uploadRes.ok) {
                const errorText = await uploadRes.text();
                console.error("Lỗi upload ảnh:", uploadRes.status, errorText);
                Toast.show({ type: 'error', text1: 'Tải ảnh thất bại', text2: 'Có lỗi khi tải ảnh lên server.' });
                setLoadingImageUpload(false);
                return;
            }

            const uploadData = await uploadRes.json();
            console.log('Dữ liệu upload trả về:', uploadData);

            let relativeAvatarUrl = '';
            if (uploadData.url) {
                relativeAvatarUrl = uploadData.url;
            } else if (uploadData.filename) {
                relativeAvatarUrl = `uploads/${uploadData.filename}`;
            } else {
                Toast.show({ type: 'error', text1: 'Lỗi đường dẫn ảnh', text2: 'Server không trả về URL ảnh hợp lệ.' });
                setLoadingImageUpload(false);
                return;
            }

            const res = await fetch(`${linkapi}update/${user._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatar_url: relativeAvatarUrl }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error("Lỗi cập nhật avatar:", res.status, errorData);
                Toast.show({ type: 'error', text1: 'Cập nhật avatar thất bại', text2: errorData.message || 'Lỗi không xác định.' });
                setLoadingImageUpload(false);
                return;
            }

            const updatedUser = await res.json();
            console.log("Người dùng đã cập nhật (từ API sau avatar upload):", updatedUser);
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            Toast.show({ type: 'success', text1: 'Ảnh đại diện đã được cập nhật!' });
            // navigation.navigate('HomeAdmin', { shouldRefresh: true });
            // navigation.setParams({ shouldRefreshProfile: true });
            navigation.setParams({ userUpdated: Date.now() });

        } catch (error) {
            console.error("Lỗi trong quá trình upload hoặc cập nhật profile:", error);
            Toast.show({ type: 'error', text1: 'Lỗi hệ thống', text2: 'Không thể cập nhật ảnh đại diện. Vui lòng thử lại.' });
        } finally {
            setLoadingImageUpload(false);
        }
    };

    // SỬA ĐỔI: Hàm handleEditAddress để truyền địa chỉ hiện tại
    const handleEditAddress = () => {
        if (user && user._id) {
            navigation.navigate('EditAddressAdmin', {
                userId: user._id,
                address: restaurantAddress, // TRUYỀN ĐỊA CHỈ HIỆN TẠI (có thể là null nếu chưa có)
                userName: user.name,
                userPhone: user.phone
            });
        } else {
            Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể quản lý địa chỉ: Người dùng không hợp lệ.' });
        }
    };


    const updateGender = async (selectedGender) => {
        if (!user || !user._id) {
            Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Thông tin người dùng không hợp lệ.' });
            return;
        }
        try {
            const res = await fetch(`${linkapi}update/${user._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gender: selectedGender })
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error("Lỗi cập nhật giới tính:", res.status, errorData);
                Toast.show({ type: 'error', text1: 'Cập nhật giới tính thất bại', text2: errorData.message || 'Lỗi không xác định từ server.' });
                return;
            }

            const updatedUser = await res.json();
            console.log("Người dùng đã cập nhật (từ API sau gender update):", updatedUser);
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setShowGenderModal(false);
            Toast.show({ type: 'success', text1: 'Giới tính đã được cập nhật!' });
        } catch (error) {
            console.error("Lỗi khi cập nhật giới tính:", error);
            Toast.show({ type: 'error', text1: 'Lỗi hệ thống', text2: 'Cập nhật giới tính thất bại. Vui lòng thử lại.' });
        }
    };

    const handleViewReviews = () => {
        navigation.navigate('AdminReviewsList', {
            entityId: user._id,
            entityName: user.name,
            averageRating: user.rating || 0,
            totalReviews: user.num_reviews || 0,
        });
    };


    if (loadingProfile) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#f55" />
                <Text style={{ marginTop: 10, color: '#555' }}>Đang tải thông tin cá nhân...</Text>
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.noUserContainer}>
                <Text style={styles.noUserText}>Bạn chưa đăng nhập hoặc có lỗi xảy ra.</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginButtonText}>Đăng nhập ngay</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={
                            user?.avatar_url
                                ? { uri: user.avatar_url.startsWith('http') ? user.avatar_url : linkanh + user.avatar_url }
                                : require('../../../assets/images/AVT.jpg')
                        }
                        style={styles.avatar}
                    />
                    <TouchableOpacity style={styles.changeAvatarBtn} onPress={handlePickImage} disabled={loadingImageUpload}>
                        {loadingImageUpload ? (
                            <ActivityIndicator size="small" color="#000" />
                        ) : (
                            <Feather name="edit" size={18} color="#000" />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Các mục thông tin cá nhân */}
                <TouchableOpacity style={styles.infoBox} onPress={() => navigation.navigate('EditNameAdmin', { shouldRefreshProfile: true })}>
                    <View style={styles.rowBetween}>
                        <View>
                            <Text style={styles.label}>Tên</Text>
                            <Text style={styles.value}>{user?.name || 'Chưa cập nhật'}</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color="#888" />
                    </View>
                </TouchableOpacity>

                <View style={styles.infoBox}>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.value}>{user?.email || 'Chưa cập nhật'}</Text>
                </View>

                <TouchableOpacity style={styles.infoBox} onPress={() => setShowGenderModal(true)}>
                    <View style={styles.rowBetween}>
                        <View>
                            <Text style={styles.label}>Giới tính</Text>
                            <Text style={styles.value}>{user?.gender || 'Chưa cập nhật'}</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color="#888" />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.infoBox} onPress={() => navigation.navigate('EditNameAdmin', { shouldRefreshProfile: true })}>
                    <View style={styles.rowBetween}>
                        <View>
                            <Text style={styles.label}>Số điện thoại</Text>
                            <Text style={styles.value}>{user?.phone || 'Chưa cập nhật'}</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color="#888" />
                    </View>
                </TouchableOpacity>

                {/* HIỂN THỊ VÀ CHỈNH SỬA ĐỊA CHỈ NHÀ HÀNG TRỰC TIẾP */}
                <TouchableOpacity style={styles.infoBox} onPress={handleEditAddress}>
                    <View style={styles.rowBetween}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Địa chỉ nhà hàng</Text>
                            {restaurantAddress ? (
                                <>  
                                    <Text style={styles.value} numberOfLines={1}>
                                        {`${restaurantAddress.street}, ${restaurantAddress.ward}, ${restaurantAddress.city}`}
                                    </Text>
                                </>
                            ) : (
                                <Text style={styles.valuePlaceholder}>Chưa có địa chỉ. Bấm để thêm.</Text>
                            )}
                        </View>
                        <Feather name="chevron-right" size={20} color="#888" />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.infoBox} onPress={() => navigation.navigate('EditPasswordAdmin')}>
                    <View style={styles.rowBetween}>
                        <View>
                            <Text style={styles.label}>Mật khẩu</Text>
                            <Text style={styles.value}>********</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color="#888" />
                    </View>
                </TouchableOpacity>

                {/* PHẦN ĐÁNH GIÁ */}
                <TouchableOpacity style={styles.infoBox} onPress={handleViewReviews}>
                    <View style={styles.rowBetween}>
                        <View>
                            <Text style={styles.label}>Đánh giá</Text>
                            <View style={styles.ratingDisplay}>
                                <Feather name="star" size={18} color="#FFD700" style={styles.starIcon} />
                                <Text style={styles.ratingValue}>
                                    {(user?.rating || 0).toFixed(1)} <Text style={styles.totalReviewsText}>({user?.num_reviews || 0} đánh giá)</Text>
                                </Text>
                            </View>
                        </View>
                        <Feather name="chevron-right" size={20} color="#888" />
                    </View>
                </TouchableOpacity>
                {/* HẾT PHẦN ĐÁNH GIÁ */}

            </ScrollView>

            {/* Modal chọn giới tính */}
            <Modal
                visible={showGenderModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowGenderModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Chọn giới tính</Text>

                        {['Nam', 'Nữ', 'Khác'].map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={styles.genderOption}
                                onPress={() => updateGender(option)}
                            >
                                <Text style={{ fontSize: 16 }}>{option}</Text>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowGenderModal(false)}>
                            <Text style={{ color: '#f55', fontWeight: 'bold' }}>Hủy</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            {/* <Toast /> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#333' },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f2f5',
    },
    noUserContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f2f5',
        padding: 20,
    },
    noUserText: {
        fontSize: 16,
        color: '#555',
        marginBottom: 10,
        textAlign: 'center',
    },
    loginButtonText: {
        fontSize: 16,
        color: '#f55',
        fontWeight: 'bold',
        marginTop: 5,
    },

    avatarContainer: {
        alignItems: 'center',
        marginBottom: 25,
        marginTop: 20,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#eee',
        borderWidth: 3,
        borderColor: '#f55',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    changeAvatarBtn: {
        position: 'absolute',
        bottom: 0,
        right: '33%',
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 25,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoBox: {
        backgroundColor: '#fff',
        padding: 18,
        borderRadius: 12,
        marginBottom: 12,
        marginHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    label: {
        fontSize: 15,
        color: '#777',
        marginBottom: 4,
    },
    value: {
        fontSize: 16, // Đổi từ 17
        fontWeight: 'bold', // Đổi từ 600
        color: '#333', // Đổi từ #333
        lineHeight: 22, // THÊM MỚI: Để các dòng địa chỉ không bị dính vào nhau
    },
    // THÊM MỚI: Style riêng cho dòng tên địa chỉ để nó nổi bật hơn
    valueBold: {
        fontSize: 17,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2, // THÊM MỚI: Khoảng cách giữa tên và sđt
    },
    // THÊM MỚI: Style cho placeholder khi chưa có địa chỉ
    valuePlaceholder: {
        fontSize: 16,
        fontStyle: 'italic',
        color: '#aaa',
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ratingDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    starIcon: {
        marginRight: 5,
    },
    ratingValue: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    totalReviewsText: {
        fontSize: 15,
        color: '#888',
        fontWeight: 'normal',
        marginLeft: 5,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 25,
        borderRadius: 15,
        width: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    genderOption: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderColor: '#eee',
        alignItems: 'center',
    },
    cancelBtn: {
        marginTop: 20,
        alignItems: 'center',
        paddingVertical: 10,
    },
});