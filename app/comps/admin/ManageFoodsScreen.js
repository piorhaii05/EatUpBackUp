import { Entypo, Feather, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { linkanh, linkapi } from '../../navigation/config';
import { formatPriceVND } from '../../navigation/currency';


export default function ManageFoodsScreen({ navigation }) {
    const [foods, setFoods] = useState([]);
    const [loading, setLoading] = useState(false);
    const [restaurantId, setRestaurantId] = useState(null);
    const [search, setSearch] = useState('');

    const fetchFoods = useCallback(async () => {
        setLoading(true);
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setRestaurantId(user._id);
            try {
                const res = await fetch(`${linkapi}product/by-restaurant/${user._id}`);
                const data = await res.json();
                setFoods(data);
            } catch (err) {
                console.error("Lỗi khi tải món ăn:", err);
                Toast.show({ type: 'error', text1: 'Lỗi tải danh sách món ăn', text2: 'Vui lòng kiểm tra kết nối mạng.' });
            }
        }
        setLoading(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchFoods();
        }, [fetchFoods])
    );

    const handleDelete = (id) => {
        Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa món ăn này?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa', style: 'destructive', onPress: async () => {
                    try {
                        const res = await fetch(`${linkapi}product/${id}`, { method: 'DELETE' });
                        if (res.ok) {
                            setFoods(foods.filter(item => item._id !== id));
                            Toast.show({ type: 'success', text1: 'Đã xóa món ăn' });
                        } else {
                            const errorData = await res.json();
                            Toast.show({ type: 'error', text1: 'Lỗi xóa món ăn', text2: errorData.message || 'Không thể xóa món ăn.' });
                        }
                    } catch (err) {
                        console.error("Lỗi khi xóa món ăn:", err);
                        Toast.show({ type: 'error', text1: 'Lỗi kết nối', text2: 'Không thể xóa món ăn do lỗi mạng.' });
                    }
                }
            }
        ]);
    };

    // Hàm mới để chuyển đổi trạng thái (status)
    const toggleProductStatus = async (productId, currentStatus) => {
        const newStatus = !currentStatus;
        const confirmMessage = newStatus 
            ? 'Bạn có chắc muốn mở bán món ăn này?' 
            : 'Bạn có chắc muốn ngừng bán món ăn này?';
        
        Alert.alert('Xác nhận', confirmMessage, [
            { text: 'Hủy', style: 'cancel' },
            {
                text: newStatus ? 'Mở bán' : 'Ngừng bán',
                style: newStatus ? 'default' : 'destructive',
                onPress: async () => {
                    setLoading(true);
                    try {
                        const res = await fetch(`${linkapi}product/${productId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: newStatus }),
                        });

                        if (res.ok) {
                            setFoods(prevFoods =>
                                prevFoods.map(food =>
                                    food._id === productId ? { ...food, status: newStatus } : food
                                )
                            );
                            Toast.show({
                                type: 'success',
                                text1: 'Cập nhật trạng thái thành công!',
                                text2: newStatus ? 'Món ăn đã được mở bán.' : 'Món ăn đã được ngừng bán.'
                            });
                        } else {
                            const errorData = await res.json();
                            Toast.show({
                                type: 'error',
                                text1: 'Cập nhật trạng thái thất bại',
                                text2: errorData.message || 'Không thể cập nhật trạng thái món ăn.'
                            });
                        }
                    } catch (err) {
                        console.error("Lỗi khi cập nhật trạng thái:", err);
                        Toast.show({ type: 'error', text1: 'Lỗi kết nối', text2: 'Không thể cập nhật trạng thái món ăn do lỗi mạng.' });
                    } finally {
                        setLoading(false);
                    }
                }
            }
        ]);
    };

    const filteredFoods = foods.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.itemContainer} onPress={() => navigation.navigate('AdminProductDetail', { productId: item._id })}>
            <View style={[styles.statusIndicator, { backgroundColor: item.status ? '#4CAF50' : '#F44336' }]}>
                <Text style={styles.statusText}>{item.status ? 'Đang bán' : 'Ngừng bán'}</Text>
            </View>

            <Image
                source={{ uri: linkanh + item.image_url }}
                style={styles.itemImage}
                resizeMode='cover'
            />
            <Text
                style={styles.itemName}
                numberOfLines={1}
                ellipsizeMode='tail'
            >
                {item.name}
            </Text>
            <Text style={styles.itemPrice}>{formatPriceVND(item.price)}</Text>
            <Text style={styles.itemRating}>{item.rating} ⭐</Text>
            <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => navigation.navigate('EditFood', { food: item})}>
                    <Feather name="edit" size={20} color="#444" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item._id)}>
                    <Feather name="trash" size={20} color="#444" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleProductStatus(item._id, item.status)}>
                    {item.status ? (
                        <MaterialIcons name="toggle-on" size={28} color="#4CAF50" />
                    ) : (
                        <MaterialIcons name="toggle-off" size={28} color="#F44336" />
                    )}
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#f55" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.searchBox}>
                <Feather name="search" size={20} color="#f55" />
                <TextInput
                    placeholder="Tìm kiếm món ăn..."
                    style={styles.input}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            <FlatList
                data={filteredFoods}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                ListEmptyComponent={<Text style={styles.emptyText}>Không có món ăn nào</Text>}
            />

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AdminAddProduct', { restaurantId})}
            >
                <Entypo name="plus" size={28} color="#fff" />
            </TouchableOpacity>
            {/* <Toast /> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#f55',
        borderRadius: 30,
        paddingHorizontal: 15,
        marginBottom: 15,
        height: 50,
    },
    input: {
        flex: 1,
        paddingLeft: 10,
    },
    itemContainer: {
        backgroundColor: '#eee',
        marginVertical: 5,
        borderRadius: 10,
        padding: 10,
        width: '47%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
        position: 'relative',
    },
    statusIndicator: {
        position: 'absolute',
        top: 8,
        left: 8,
        borderRadius: 5,
        paddingHorizontal: 6,
        paddingVertical: 3,
        zIndex: 1,
    },
    statusText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    itemImage: {
        width: '100%',
        height: 100,
        borderRadius: 10,
    },
    itemName: {
        fontWeight: 'bold',
        marginTop: 5,
        width: '100%',
        textAlign: 'center',
    },
    itemPrice: {
        color: '#f55',
        marginTop: 2,
        fontSize: 15,
        fontWeight: '500',
    },
    itemRating: {
        color: '#444',
        marginTop: 2,
        fontSize: 14,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '95%',
        marginTop: 10,
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    addButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: '#f55',
        width: 55,
        height: 55,
        borderRadius: 27.5,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#888',
    }
});