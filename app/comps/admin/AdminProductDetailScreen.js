import { Feather, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { linkanh, linkapi } from '../../navigation/config';
import { formatPriceVND } from '../../navigation/currency';


export default function AdminProductDetailScreen({ navigation, route }) {
    // Lấy ID sản phẩm từ route params
    const { productId } = route.params;

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProductDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${linkapi}admin/product/${productId}`); // Giả sử có endpoint lấy sản phẩm theo ID
            const data = await res.json();
            if (res.ok) {
                setProduct(data);
            } else {
                Toast.show({ type: 'error', text1: 'Lỗi tải chi tiết', text2: data.message || 'Không thể lấy chi tiết sản phẩm.' });
                setError(data.message || 'Không thể lấy chi tiết sản phẩm.');
            }
        } catch (err) {
            console.error('Lỗi khi tải chi tiết sản phẩm:', err);
            Toast.show({ type: 'error', text1: 'Lỗi mạng', text2: 'Không thể kết nối để lấy chi tiết sản phẩm.' });
            setError('Không thể kết nối để lấy chi tiết sản phẩm.');
        } finally {
            setLoading(false);
        }
    }, [productId]); // Dependency array: fetch lại khi productId thay đổi

    // Sử dụng useFocusEffect để tải lại dữ liệu mỗi khi màn hình được focus
    useFocusEffect(
        useCallback(() => {
            fetchProductDetails();
        }, [fetchProductDetails])
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#f55" />
                <Text style={styles.loadingText}>Đang tải chi tiết sản phẩm...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchProductDetails}>
                    <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!product) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Không tìm thấy sản phẩm này.</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header với nút quay lại */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButtonTop} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                {/* Có thể thêm tiêu đề ở đây nếu muốn */}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Ảnh sản phẩm */}
                <Image
                    source={{ uri: `${linkanh}${product.image_url}` }}
                    style={styles.productImage}
                    resizeMode="cover"
                />

                {/* Phần thông tin chi tiết */}
                <View style={styles.detailsContainer}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productPrice}>{formatPriceVND(product.price)}</Text>

                    <View style={styles.statusRow}>
                        <Text style={styles.label}>Trạng thái: </Text>
                        <Text style={[styles.statusText, { color: product.status ? '#4CAF50' : '#F44336' }]}>
                            {product.status ? 'Đang bán' : 'Ngừng bán'}
                        </Text>
                    </View>

                    <Text style={styles.label}>Mô tả:</Text>
                    <Text style={styles.productDescription}>{product.description || 'Chưa có mô tả.'}</Text>

                    <Text style={styles.label}>Rating:</Text>
                    <Text style={styles.productRating}>{product.rating} ⭐</Text>

                    <Text style={styles.label}>Loại món ăn:</Text>
                    <Text style={styles.productCategory}>{product.category}</Text>

                    <Text style={styles.label}>Số lượng bán ra:</Text>
                    <Text style={styles.productCategory}>{product.purchases}</Text>

                    {/* Nút chỉnh sửa sản phẩm */}
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => navigation.navigate('EditFood', { food: product, reload: fetchProductDetails })}
                    >
                        <Feather name="edit" size={20} color="#fff" style={{ marginRight: 5 }} />
                        <Text style={styles.editButtonText}>Chỉnh sửa món ăn</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            {/* <Toast /> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 50, // Điều chỉnh cho notch
        paddingHorizontal: 20,
        zIndex: 10, // Đảm bảo header nằm trên ảnh
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        // Background color để che phần dưới của header khi cuộn
        // Hoặc sử dụng gradient nếu muốn hiệu ứng mượt mà
        backgroundColor: 'transparent', // Ban đầu trong suốt
    },
    backButtonTop: {
        backgroundColor: 'rgba(0,0,0,0.5)', // Nền mờ cho nút back
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productImage: {
        width: '100%',
        height: 300, // Chiều cao lớn hơn để hiển thị rõ ảnh
        resizeMode: 'cover',
        // marginBottom: 20, // Không cần margin bottom nếu detailsContainer bao phủ
    },
    detailsContainer: {
        padding: 20,
        backgroundColor: '#fff',
        // Để container này nằm trên ảnh, có thể dùng marginTop âm hoặc position
        marginTop: -30, // Kéo lên trên ảnh một chút
        borderTopLeftRadius: 30, // Bo tròn góc trên
        borderTopRightRadius: 30, // Bo tròn góc trên
        paddingBottom: 50, // Đảm bảo có đủ khoảng trống ở cuối
    },
    productName: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    productPrice: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#f55',
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 5,
        color: '#555',
    },
    productDescription: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
    },
    productRating: {
        fontSize: 16,
        color: '#666',
    },
    productCategory: {
        fontSize: 16,
        color: '#666',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 5,
    },
    statusText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    editButton: {
        flexDirection: 'row',
        backgroundColor: '#f55',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    editButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: 'red',
        textAlign: 'center',
        marginBottom: 15,
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        color: '#888',
        textAlign: 'center',
        marginBottom: 20,
    },
    backButton: {
        backgroundColor: '#ccc',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: 'bold',
    },
});