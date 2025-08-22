import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { linkanh, linkapi } from '../../navigation/config'; // Import linkanh để hiển thị ảnh cũ

export default function EditProductScreen({ navigation, route }) {
    // Lấy dữ liệu món ăn được truyền từ ManageFoodsScreen
    const { food, restaurantId, reload } = route.params;

    // State để lưu trữ thông tin món ăn, khởi tạo bằng dữ liệu food truyền vào
    const [name, setName] = useState(food?.name || '');
    const [description, setDescription] = useState(food?.description || '');
    const [price, setPrice] = useState(food?.price ? String(food.price) : ''); // Giá là số, chuyển sang chuỗi
    const [rating, setRating] = useState(food?.rating ? String(food.rating) : ''); // Rating là số, chuyển sang chuỗi
    const [category, setCategory] = useState(food?.category || '');
    const [image, setImage] = useState(null); // Lưu trữ ảnh mới được chọn
    const [currentImageUrl, setCurrentImageUrl] = useState(food?.image_url || null); // Lưu trữ URL ảnh hiện tại
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);

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
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Toast.show({ type: 'error', text1: 'Quyền truy cập bị từ chối', text2: 'Vui lòng cấp quyền truy cập thư viện ảnh.' });
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.cancelled && result.assets && result.assets.length > 0) {
            setImage(result.assets[0]); // Cập nhật ảnh mới được chọn
        }
    };

    const handleUpdateProduct = async () => {
        // --- Bắt đầu Validation ---
        if (!name.trim() || !price.trim() || !rating.trim() || !category.trim()) {
            Toast.show({ type: 'info', text1: 'Vui lòng nhập đầy đủ thông tin bắt buộc' });
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
        // --- Kết thúc Validation ---

        setLoading(true);

        let finalImageUrl = currentImageUrl; // Mặc định là ảnh cũ

        try {
            if (image) { // Nếu có ảnh mới được chọn
                const formData = new FormData();
                formData.append('image', {
                    uri: image.uri,
                    name: 'product_edit.jpg', // Tên file có thể khác để tránh cache nếu cần
                    type: 'image/jpeg' // Sử dụng 'image/jpeg' hoặc 'image/png' tùy loại ảnh
                });

                const resUpload = await fetch(`${linkapi}upload`, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (!resUpload.ok) {
                    const errorText = await resUpload.text();
                    console.error("Lỗi upload ảnh:", resUpload.status, errorText);
                    Toast.show({ type: 'error', text1: 'Tải ảnh thất bại', text2: 'Không thể tải ảnh mới lên server.' });
                    setLoading(false);
                    return;
                }

                const dataUpload = await resUpload.json();
                if (dataUpload.url) { // Nếu backend trả về URL đầy đủ
                    finalImageUrl = dataUpload.url;
                } else if (dataUpload.filename) { // Nếu backend trả về chỉ filename
                    // Cần đảm bảo linkapi đã có sẵn base URL và linkanh là phần /uploads/
                    const baseUrl = linkapi.endsWith('/') ? linkapi.slice(0, -1) : linkapi;
                    finalImageUrl = `${baseUrl}${dataUpload.filename.startsWith('/') ? dataUpload.filename : '/' + dataUpload.filename}`;
                } else {
                    Toast.show({ type: 'error', text1: 'Lỗi đường dẫn ảnh', text2: 'Server không trả về URL ảnh hợp lệ.' });
                    setLoading(false);
                    return;
                }
            }

            const productData = {
                // Không cần restaurant_id khi cập nhật (thường thì id sản phẩm là đủ)
                // Tuy nhiên, nếu API của bạn yêu cầu, hãy giữ lại
                // restaurant_id: restaurantId,
                name,
                description,
                price: numericPrice,
                rating: numericRating,
                image_url: finalImageUrl, // Gửi URL ảnh mới hoặc cũ
                category
            };

            const resUpdateProduct = await fetch(`${linkapi}product/${food._id}`, { // Gửi PUT request đến ID món ăn
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });

            if (resUpdateProduct.ok) {
                Toast.show({ type: 'success', text1: 'Cập nhật món ăn thành công!' });
                if (reload) {
                    reload(); // Gọi hàm reload từ màn ManageFoodsScreen
                }
                // Dùng setTimeout để Toast có thể hiển thị trước khi quay lại
                setTimeout(() => {
                    navigation.goBack();
                }, 500);
            } else {
                const errorData = await resUpdateProduct.json();
                Toast.show({ type: 'error', text1: 'Cập nhật món ăn thất bại', text2: errorData.message || 'Lỗi không xác định từ server' });
            }
        } catch (err) {
            console.error('Lỗi khi cập nhật sản phẩm:', err);
            Toast.show({ type: 'error', text1: 'Lỗi hệ thống', text2: err.message || 'Vui lòng thử lại sau' });
        }

        setLoading(false);
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
                {image ? ( // Nếu đã chọn ảnh mới
                    <Image source={{ uri: image.uri }} style={styles.image} />
                ) : ( // Nếu chưa chọn ảnh mới, hiển thị ảnh cũ nếu có
                    currentImageUrl ? (
                        <Image
                            source={{ uri: `${linkanh}${currentImageUrl}` }} // Kết hợp linkanh với URL ảnh
                            style={styles.image}
                        />
                    ) : ( // Nếu không có ảnh cũ và chưa chọn ảnh mới
                        <View style={[styles.image, { backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' }]}>
                            <Text>Chưa có ảnh</Text>
                        </View>
                    )
                )}

                <TouchableOpacity onPress={pickImage}>
                    <Text style={{ color: '#f55', textAlign: 'center', marginVertical: 10 }}>Thay đổi ảnh</Text>
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
                    keyboardType="numeric"
                    placeholder="Ví dụ: 25000"
                />

                <Text style={styles.label}>Rating(*)</Text>
                <TextInput
                    style={styles.input}
                    value={rating}
                    onChangeText={setRating}
                    keyboardType="numeric"
                />

                {loading ? (
                    <ActivityIndicator size="large" color="#f55" style={{ marginTop: 20 }} />
                ) : (
                    <TouchableOpacity style={styles.button} onPress={handleUpdateProduct}>
                        <Text style={styles.buttonText}>Cập nhật</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
            {/* <Toast /> */}
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
        marginTop: 20,
        marginBottom: 30, // Thêm khoảng cách dưới cùng cho ScrollView
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    }
});