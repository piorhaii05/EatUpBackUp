import { Entypo, Feather, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Text, View } from 'react-native';
import AdminChatScreen from '../comps/admin/AdminChatScreen';
import AdminDashboardScreen from '../comps/admin/AdminDashboardScreen';
import AdminProfileScreen from '../comps/admin/AdminProfileScreen';
import ManageFoodsScreen from '../comps/admin/ManageFoodsScreen';
import ManageOrdersScreen from '../comps/admin/ManageOrdersScreen';
import ManageReviewsScreen from '../comps/admin/ManageReviewsScreen';
import ManageVoucherScreen from '../comps/admin/ManageVoucherScreen';
import RevenueScreen from '../comps/admin/RevenueScreen';
import { linkanh } from '../navigation/config';

const Drawer = createDrawerNavigator();

export default function AdminAppNavigator() {
    const [user, setUser] = useState(null);
    const route = useRoute();
    const params = route.params || {};

    useFocusEffect(
        useCallback(() => {
            const fetchUser = async () => {
                const storedUser = await AsyncStorage.getItem('user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            };
            fetchUser();

            // Dọn dẹp nếu cần (không cần thiết trong trường hợp này)
            return () => { };
        }, [params.userUpdated])
    );

    if (!user) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#f55" />
            </View>
        );
    }

    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} user={user} />}
            screenOptions={{
                drawerActiveTintColor: '#f55',
                drawerLabelStyle: { marginLeft: -15, fontSize: 16 },
            }}
        >
            <Drawer.Screen name="Trang chủ" component={AdminDashboardScreen} />
            <Drawer.Screen name="Chat hỗ trợ" component={AdminChatScreen} />
            <Drawer.Screen name="Tài khoản cá nhân" component={AdminProfileScreen} />
            <Drawer.Screen name="Quản lý đơn hàng" component={ManageOrdersScreen} />
            <Drawer.Screen name="Quản lý Voucher" component={ManageVoucherScreen} />
            <Drawer.Screen name="Quản lý món ăn" component={ManageFoodsScreen} />
            <Drawer.Screen name="Quản lý đánh giá" component={ManageReviewsScreen} />
            <Drawer.Screen name="Thống kê doanh thu" component={RevenueScreen} />
        </Drawer.Navigator>
    );
}

function CustomDrawerContent(props) {
    const { navigation } = props;
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const route = useRoute();
    const params = route.params || {};

    useFocusEffect(
        useCallback(() => {
            const fetchUser = async () => {
                setLoading(true);
                try {
                    const storedUser = await AsyncStorage.getItem('user');
                    if (storedUser) {
                        setUser(JSON.parse(storedUser));
                    } else {
                        setUser(null);
                    }
                } catch (error) {
                    console.error("Lỗi khi tải người dùng trong drawer:", error);
                    setUser(null);
                } finally {
                    setLoading(false);
                }
            };
            fetchUser();
        }, [params.userUpdated])
    );

    // Nếu đang tải, hiển thị loading
    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#f55" />
            </View>
        );
    }

    // Nếu không có user, hiển thị thông báo
    if (!user) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Text style={{ textAlign: 'center' }}>Không thể tải thông tin người dùng.</Text>
            </View>
        );
    }

    const confirmLogout = () => {
        Alert.alert(
            'Xác nhận',
            'Bạn có chắc chắn muốn đăng xuất?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đăng xuất', style: 'destructive', onPress: async () => {
                        await AsyncStorage.removeItem('user');
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }]
                        });
                    }
                }
            ]
        );
    };

    return (
        <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
            {/* Header */}
            <View style={{
                backgroundColor: '#f55',
                paddingVertical: 30,
                alignItems: 'center',
                margin: 10,
                borderRadius: 15,
            }}>
                <Image
                    source={{ uri: linkanh + user.avatar_url }}
                    style={{ width: 70, height: 70, borderRadius: 35, marginBottom: 10, backgroundColor: '#fff' }}
                />
                <Text style={{ color: '#fff', fontSize: 16 }}>{user.email}</Text>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 3 }}>{user.name}</Text>
            </View>

            {/* Nhóm 1 */}
            <DrawerItem
                label="Trang chủ"
                icon={({ color }) => <Entypo name="home" size={20} color={color} />}
                onPress={() => navigation.navigate('Trang chủ')}
            />
            <DrawerItem
                label="Chat hỗ trợ"
                icon={({ color }) => <Feather name="message-circle" size={20} color={color} />}
                onPress={() => navigation.navigate('Chat hỗ trợ')}
            />
            <DrawerItem
                label="Tài khoản cá nhân"
                icon={({ color }) => <Feather name="user" size={20} color={color} />}
                onPress={() => navigation.navigate('Tài khoản cá nhân')}
            />

            <View style={{ borderBottomWidth: 1, borderBottomColor: '#ccc', marginVertical: 10 }} />

            {/* Nhóm 2 */}
            <DrawerItem
                label="Quản lý đơn hàng"
                icon={({ color }) => <Feather name="file-text" size={20} color={color} />}
                onPress={() => navigation.navigate('Quản lý đơn hàng')}
            />
            <DrawerItem
                label="Quản lý voucher" // Đổi label thành "Quản lý voucher"
                icon={({ color }) => <Feather name="tag" size={20} color={color} />} // Thay đổi icon thành "tag"
                onPress={() => navigation.navigate('Quản lý Voucher')} // Đổi tên route thành 'QuanLyVoucher' (hoặc tên route tương ứng của bạn)
            />
            <DrawerItem
                label="Quản lý món ăn"
                icon={({ color }) => <FontAwesome5 name="utensils" size={20} color={color} />}
                onPress={() => navigation.navigate('Quản lý món ăn')}
            />
            <DrawerItem
                label="Quản lý đánh giá"
                icon={({ color }) => <Feather name="star" size={20} color={color} />}
                onPress={() => navigation.navigate('Quản lý đánh giá')}
            />

            <View style={{ borderBottomWidth: 1, borderBottomColor: '#ccc', marginVertical: 10 }} />

            {/* Thống kê doanh thu */}
            <DrawerItem
                label="Thống kê doanh thu"
                icon={({ color }) => <Entypo name="bar-graph" size={20} color={color} />}
                onPress={() => navigation.navigate('Thống kê doanh thu')}
            />

            <View style={{ borderBottomWidth: 1, borderBottomColor: '#ccc', marginVertical: 10 }} />

            {/* Logout */}
            <DrawerItem
                label="Đăng xuất"
                icon={({ color }) => <MaterialIcons name="logout" size={20} color={color} />}
                onPress={confirmLogout}
            />
        </DrawerContentScrollView>
    );
}
