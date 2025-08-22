import { Entypo, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text, TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Swiper from 'react-native-swiper';
import Toast from 'react-native-toast-message';
import { linkanh, linkapi } from '../navigation/config';
import { formatPriceVND } from '../navigation/currency';

export default function HomeScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [newestItems, setNewestItems] = useState([]);
    const [search, setSearch] = useState('');
    const [categories, setCategories] = useState([]);
    const [highestRated, setHighestRated] = useState([]);
    const [popularItems, setPopularItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [city, setCity] = useState('');

    useFocusEffect(
        React.useCallback(() => {
            const fetchUser = async () => {
                const userString = await AsyncStorage.getItem('user');
                if (userString) {
                    setUser(JSON.parse(userString));
                }
            };
            fetchUser();
        }, [])
    );

    useEffect(() => {
        fetchCategories();
        fetchHighestRated();
        fetchPopularItems();
        fetchNewestItems();
    }, [city]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await fetch(linkapi + 'category');
            const data = await res.json();
            setCategories(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const fetchNewestItems = async () => {
        try {
            const res = await fetch(`${linkapi}product/newest?city=${city}`);
            const data = await res.json();
            const filtered = data.filter(item => item.status === true);
            setNewestItems(filtered);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchHighestRated = async () => {
        try {
            const res = await fetch(`${linkapi}product/highest-rated?city=${city}`);
            const data = await res.json();
            const filtered = data.filter(item => item.status === true && item.rating > 4.5);
            setHighestRated(filtered);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchPopularItems = async () => {
        try {
            const res = await fetch(`${linkapi}product/popular?city=${city}`);
            const data = await res.json();
            const filtered = data.filter(item => item.status === true);
            setPopularItems(filtered);
        } catch (error) {
            console.error(error);
        }
    };

    const addToCart = async (product) => {
        if (!user?._id) {
            Toast.show({
                type: 'info',
                text1: 'Bạn cần đăng nhập',
                text2: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.',
            });
            return;
        }

        try {
            const response = await fetch(linkapi + 'cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user._id,
                    product_id: product._id,
                    quantity: 1
                })
            });

            // Backend bây giờ sẽ trả về 200 hoặc 201 khi thành công,
            // không còn trả về 400 khi giỏ hàng khác nhà hàng nữa.
            if (response.ok) {
                Toast.show({
                    type: 'success',
                    text1: 'Đã thêm vào giỏ hàng!',
                });
            } else {
                // Xử lý các lỗi khác (ví dụ: sản phẩm không tồn tại, lỗi server)
                const responseData = await response.json();
                const errorMessage = responseData.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng.';
                Toast.show({
                    type: 'error',
                    text1: 'Lỗi!',
                    text2: errorMessage,
                });
            }

        } catch (error) {
            // Khối này sẽ bắt các lỗi mạng (network)
            console.error('Lỗi kết nối mạng:', error);
            Toast.show({
                type: 'error',
                text1: 'Lỗi!',
                text2: 'Không thể kết nối đến máy chủ. Vui lòng thử lại.',
            });
        }
    };

    const renderProduct = (item) => (
        <TouchableOpacity onPress={() => navigation.navigate('ProductDetail', { product: item })}>
            <View style={styles.foodCard}>
                <Image source={{ uri: linkanh + item.image_url }} style={styles.foodImage} />
                <View style={styles.infoContainer}>
                    <View style={styles.rowBetween}>
                        <Text style={styles.foodName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                        <Text style={styles.foodPrice}>{formatPriceVND(item.price)}</Text>
                    </View>
                    <View style={styles.rowBetween}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoText}>{item.rating}/5</Text>
                            <Entypo name="star" size={14} color="#FFD700" style={{ marginLeft: 4 }} />
                        </View>
                        <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                            <Feather name="plus" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    // Xử lý tìm kiếm
    const handleSearch = () => {
        if (search.trim()) {
            navigation.navigate('SearchResults', { searchTerm: search.trim() });
            setSearch('');
        } else {
            Toast.show({
                type: 'info',
                text1: 'Vui lòng nhập từ khóa tìm kiếm!',
            });
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>

                <Text style={styles.labelText}>Khu vực</Text>
                <View style={styles.headerRow}>
                    <View style={styles.locationRow}>
                        <Entypo name="location-pin" size={25} color="#f55" />
                        <Picker
                            selectedValue={city}
                            style={{ height: 50, width: 160 }}
                            onValueChange={(itemValue) => setCity(itemValue)}
                        >
                            <Picker.Item label="Tất cả" value="" />
                            <Picker.Item label="Hà Nội" value="Ha Noi" />
                            <Picker.Item label="Hồ Chí Minh" value="Ho Chi Minh" />
                            <Picker.Item label="Đà Nẵng" value="Da Nang" />
                            <Picker.Item label="Hải Phòng" value="Hai Phong" />
                            <Picker.Item label="Cần Thơ" value="Can Tho" />
                            <Picker.Item label="Huế" value="Hue" />
                            <Picker.Item label="Nha Trang" value="Nha Trang" />
                            <Picker.Item label="Đà Lạt" value="Da Lat" />
                            <Picker.Item label="Vũng Tàu" value="Vung Tau" />
                            <Picker.Item label="Biên Hòa" value="Bien Hoa" />
                            <Picker.Item label="Buôn Ma Thuột" value="Buon Ma Thuot" />
                            <Picker.Item label="Quy Nhơn" value="Quy Nhon" />
                            <Picker.Item label="Long Xuyên" value="Long Xuyen" />
                            <Picker.Item label="Nam Định" value="Nam Dinh" />
                            <Picker.Item label="Thái Nguyên" value="Thai Nguyen" />
                        </Picker>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
                        <Feather name="shopping-cart" size={24} color="#000" />
                    </TouchableOpacity>
                </View>

                {/* Phần tìm kiếm đã thay đổi */}
                <View style={styles.searchBox}>
                    <TextInput
                        placeholder="Tìm kiếm món ăn"
                        value={search}
                        onChangeText={setSearch}
                        style={styles.searchInput}
                        placeholderTextColor="#999"
                        onSubmitEditing={handleSearch}
                    />
                    <TouchableOpacity onPress={handleSearch}>
                        <Feather name="search" size={22} color="#f55" />
                    </TouchableOpacity>
                </View>

                <View style={{ height: 150, marginBottom: 15 }}>
                    <Swiper autoplay showsPagination>
                        <Image source={require('../../assets/images/BannerMain.png')} style={styles.banner} />
                        <Image source={require('../../assets/images/BannerMain1.jpg')} style={styles.banner} />
                        <Image source={require('../../assets/images/BannerMain2.jpg')} style={styles.banner} />
                    </Swiper>
                </View>

                <View style={styles.sectionRow}>
                    {loading ? <ActivityIndicator color="#f55" /> : (
                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            data={categories}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('CategoryProduct', {
                                        // categoryId: item._id,
                                        categoryName: item.name
                                    })}
                                >
                                    <View style={{ alignItems: 'center', marginRight: 10 }}>
                                        <View style={[styles.categoryBox, { backgroundColor: item.color ? `#${item.color}` : '#FFCCCC' }]}>
                                            <Image source={{ uri: linkanh + item.image_url }} style={styles.categoryImage} />
                                        </View>
                                        <Text style={styles.categoryText}>{item.name}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>

                <View style={styles.popularRow}>
                    <Text style={styles.sectionTitle}>Đánh giá cao</Text>
                </View>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={highestRated}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => renderProduct(item)}
                />

                <View style={styles.popularRow}>
                    <Text style={styles.sectionTitle}>Phổ biến</Text>
                </View>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={popularItems}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => renderProduct(item)}
                />

                <View style={styles.popularRow}>
                    <Text style={styles.sectionTitle}>Món ăn mới nhất</Text>
                </View>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={newestItems}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => renderProduct(item)}
                />
            </ScrollView>
            {/* <Toast /> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 15 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    locationRow: { flexDirection: 'row', alignItems: 'center' },
    searchBox: { flexDirection: 'row', borderWidth: 1, borderColor: '#f55', borderRadius: 25, paddingHorizontal: 15, alignItems: 'center', marginBottom: 15 },
    searchInput: { flex: 1, height: 40, color: '#000' },
    banner: { width: '100%', height: 150, borderRadius: 10, marginBottom: 15 },
    sectionRow: { marginBottom: 15 },
    categoryBox: { padding: 10, borderRadius: 15, alignItems: 'center', justifyContent: 'center', width: 70, height: 70 },
    categoryImage: { width: 40, height: 40 },
    categoryText: { color: '#000', fontWeight: '500', textAlign: 'center', marginTop: 5 },
    popularRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, marginTop: 10 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold' },
    foodCard: { width: 170, borderRadius: 12, backgroundColor: '#eee', marginRight: 15, overflow: 'hidden', position: 'relative' },
    foodImage: { width: '100%', height: 100 },
    infoContainer: { padding: 10, backgroundColor: '#eee' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    foodName: { fontSize: 15, fontWeight: 'bold', color: '#000', flex: 1, marginRight: 5 },
    foodPrice: { color: '#f55', fontWeight: 'bold', fontSize: 14 },
    infoRow: { flexDirection: 'row', alignItems: 'center' },
    infoText: { fontSize: 12, color: '#555' },
    addBtn: { backgroundColor: '#f55', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    labelText: { fontSize: 18, fontWeight: 'bold' },
});