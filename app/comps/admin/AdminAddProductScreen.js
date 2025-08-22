import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { linkapi } from '../../navigation/config';

export default function AdminAddProduct({ navigation, route }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [rating, setRating] = useState('');
    const [category, setCategory] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);

    const { reload } = route.params || {};

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${linkapi}category`);
                const data = await res.json();
                if (res.ok) {
                    setCategories(data);
                } else {
                    Toast.show({ type: 'error', text1: 'Lỗi tải danh mục', text2: data.message || 'Không thể lấy danh mục.' });
                }
            } catch (err) {
                console.error('Lỗi khi tải danh mục:', err);
                Toast.show({ type: 'error', text1: 'Lỗi mạng', text2: 'Không thể kết nối để lấy danh mục.' });
            }
        };

        fetchCategories();
    }, []);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.cancelled) {
            setImage(result.assets[0]);
        }
    };

    const handleAddProduct = async () => {
        // 1. Reset trạng thái lỗi
        Toast.hide();

        // 2. Bắt đầu Validation
        if (!name.trim() || !price.trim() || !rating.trim() || !category) {
            Toast.show({ type: 'info', text1: 'Lỗi', text2: 'Vui lòng nhập đầy đủ thông tin bắt buộc (*)' });
            return;
        }

        if (!image) {
            Toast.show({ type: 'info', text1: 'Vui lòng chọn ảnh cho món ăn' });
            return;
        }

        const numericPrice = Number(price);
        if (isNaN(numericPrice) || numericPrice <= 0) {
            Toast.show({ type: 'error', text1: 'Giá không hợp lệ', text2: 'Vui lòng nhập một số dương cho giá.' });
            return;
        }

        const numericRating = Number(rating);
        if (isNaN(numericRating) || numericRating < 0 || numericRating > 5) {
            Toast.show({ type: 'error', text1: 'Rating không hợp lệ', text2: 'Vui lòng nhập rating từ 0 đến 5.' });
            return;
        }

        // 3. Lấy restaurantId
        const storedUser = await AsyncStorage.getItem('user');
        if (!storedUser) {
            Toast.show({ type: 'error', text1: 'Lỗi xác thực', text2: 'Không tìm thấy thông tin nhà hàng. Vui lòng đăng nhập lại.' });
            return;
        }
        const user = JSON.parse(storedUser);
        const restaurantId = user._id;

        setLoading(true);

        try {
            // 4. Tải ảnh lên
            const formData = new FormData();
            formData.append('image', {
                uri: image.uri,
                name: 'product.jpg',
                type: 'image/jpeg' // Sử dụng image/jpeg để tránh lỗi với một số định dạng
            });

            const resUpload = await fetch(`${linkapi}upload`, {
                method: 'POST',
                body: formData,
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (!resUpload.ok) {
                const uploadErrorData = await resUpload.json();
                throw new Error(uploadErrorData.message || 'Lỗi khi tải ảnh lên.');
            }

            const dataUpload = await resUpload.json();
            const imageUrl = dataUpload.url; // Lấy URL trực tiếp từ backend

            // 5. Tạo đối tượng sản phẩm
            const productData = {
                restaurant_id: restaurantId,
                name,
                description,
                price: numericPrice,
                rating: numericRating,
                image_url: imageUrl,
                category
            };

            // 6. Gọi API thêm sản phẩm
            const resAddProduct = await fetch(`${linkapi}product`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });

            if (resAddProduct.ok) {
                Toast.show({ type: 'success', text1: 'Đã thêm món ăn thành công!' });
                if (reload) {
                    reload();
                }
                navigation.goBack();
            } else {
                const errorData = await resAddProduct.json();
                throw new Error(errorData.message || 'Lỗi không xác định từ server.');
            }
        } catch (err) {
            console.error('Lỗi khi thêm sản phẩm:', err);
            Toast.show({ type: 'error', text1: 'Thêm món ăn thất bại', text2: err.message || 'Vui lòng thử lại sau.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.customBackButton}
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="arrow-back" size={28} color="#f55" />
                <Text style={styles.backButtonText}>Quay lại</Text>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
                {image ? (
                    <Image source={{ uri: image.uri }} style={styles.image} />
                ) : (
                    <View style={[styles.image, { backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' }]}>
                        <Text>Chưa chọn ảnh</Text>
                    </View>
                )}

                <TouchableOpacity onPress={pickImage}>
                    <Text style={{ color: '#f55', textAlign: 'center', marginVertical: 10 }}>Tải ảnh lên</Text>
                </TouchableOpacity>

                <Text style={styles.label}>Loại món ăn(*)</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={category}
                        onValueChange={(itemValue) => setCategory(itemValue)}
                    >
                        <Picker.Item label="Chọn loại..." value="" />
                        {categories.map((cat) => (
                            <Picker.Item key={cat._id} label={cat.name} value={cat.name} />
                        ))}
                    </Picker>
                </View>

                <Text style={styles.label}>Tên món ăn(*)</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} />

                <Text style={styles.label}>Mô tả</Text>
                <TextInput style={[styles.input, { height: 80 }]} value={description} onChangeText={setDescription} multiline />

                <Text style={styles.label}>Giá(*)</Text>
                <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric" // Đảm bảo bàn phím số
                    placeholder="Ví dụ: 25000"
                />

                <Text style={styles.label}>Rating(*)</Text>
                <TextInput
                    style={styles.input}
                    value={rating}
                    onChangeText={setRating}
                    keyboardType="numeric" // Đảm bảo bàn phím số
                    placeholder="Ví dụ: 5"
                />

                {loading ? (
                    <ActivityIndicator size="large" color="#f55" />
                ) : (
                    <TouchableOpacity style={styles.button} onPress={handleAddProduct}>
                        <Text style={styles.buttonText}>Hoàn thành</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    customBackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingVertical: 5,
        paddingRight: 10,
        alignSelf: 'flex-start',
    },
    backButtonText: {
        marginLeft: 5,
        fontSize: 18,
        color: '#f55',
        fontWeight: 'bold',
    },
    image: {
        width: '100%',
        height: 180,
        borderRadius: 10,
    },
    label: {
        marginTop: 10,
        marginBottom: 5,
        fontWeight: 'bold'
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        marginBottom: 10
    },
    button: {
        backgroundColor: '#f55',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    }
});