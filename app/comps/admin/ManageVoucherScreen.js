import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet, Text,
  TextInput, TouchableOpacity, View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { linkapi } from '../../navigation/config';
import { formatPriceVND } from '../../navigation/currency';

const { width } = Dimensions.get('window');

const ManageVoucherScreen = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editVoucher, setEditVoucher] = useState(null);
  const navigation = useNavigation();

  const [editCode, setEditCode] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDiscountType, setEditDiscountType] = useState(''); // 'percentage' or 'fixed'
  const [editDiscountValue, setEditDiscountValue] = useState('');
  const [editMinOrderAmount, setEditMinOrderAmount] = useState('');
  const [editMaxDiscountAmount, setEditMaxDiscountAmount] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editUsageLimit, setEditUsageLimit] = useState('');
  const now = new Date();

  const fetchVouchers = async () => {
    try {
      const restaurantId = await AsyncStorage.getItem('restaurant_id');
      if (!restaurantId) {
        setLoading(false);
        Toast.show({ // Sử dụng Toast
          type: 'error',
          text1: 'Không tìm thấy ID nhà hàng.',
        });
        return;
      }
      const API_URL = linkapi + 'vouchers/by-restaurant/' + restaurantId;
      const response = await fetch(API_URL);
      const data = await response.json();
      // Sắp xếp voucher: còn hạn trước, hết hạn sau
      const sortedVouchers = data.sort((a, b) => {
        const endDateA = new Date(a.end_date);
        const endDateB = new Date(b.end_date);

        const isExpiredA = endDateA < now;
        const isExpiredB = endDateB < now;

        if (isExpiredA && !isExpiredB) return 1; // A hết hạn, B còn hạn -> A đứng sau
        if (!isExpiredA && isExpiredB) return -1; // A còn hạn, B hết hạn -> A đứng trước
        return 0; // Cả hai cùng trạng thái, giữ nguyên thứ tự
      });
      setVouchers(sortedVouchers);
    } catch (error) {
      console.error('Lỗi khi tải voucher:', error);
      Toast.show({ // Sử dụng Toast
        type: 'error',
        text1: 'Lỗi tải voucher',
        text2: 'Không thể tải danh sách voucher. Vui lòng thử lại.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchVouchers();
    });
    return unsubscribe;
  }, [navigation]);

  const openEditModal = (voucher) => {
    setEditVoucher(voucher);
    setEditCode(voucher.code || '');
    setEditDescription(voucher.description || '');
    setEditDiscountType(voucher.discount_type || '');
    setEditDiscountValue(String(voucher.discount_value ?? ''));
    setEditMinOrderAmount(String(voucher.min_order_amount ?? ''));
    setEditMaxDiscountAmount(String(voucher.max_discount_amount ?? ''));
    setEditStartDate(voucher.start_date ? voucher.start_date.substring(0, 10) : '');
    setEditEndDate(voucher.end_date ? voucher.end_date.substring(0, 10) : '');
    setEditUsageLimit(String(voucher.usage_limit ?? ''));
    setEditModalVisible(true);
  };

  const handleEditSave = async () => {
    if (!editVoucher) return;

    if (!editCode || !editDescription || !editDiscountType || !editDiscountValue || !editStartDate || !editEndDate) {
      Alert.alert(
        'Thiếu thông tin!',
        'Vui lòng điền đầy đủ các trường bắt buộc.'
      );
      return;
    }

    const numEditDiscountValue = Number(editDiscountValue);
    const numEditMinOrderAmount = Number(editMinOrderAmount);
    const numEditMaxDiscountAmount = Number(editMaxDiscountAmount);
    const numEditUsageLimit = Number(editUsageLimit);

    // Validate giá trị giảm giá dựa trên loại
    if (editDiscountType === 'percentage') {
        if (isNaN(numEditDiscountValue) || numEditDiscountValue <= 0 || numEditDiscountValue > 100) {
            Alert.alert('Giá trị không hợp lệ!', 'Với loại phần trăm, giá trị phải từ 1 đến 100.');
            return;
        }
    } else if (editDiscountType === 'fixed') {
        if (isNaN(numEditDiscountValue) || numEditDiscountValue <= 0) {
            Alert.alert('Giá trị không hợp lệ!', 'Với loại cố định, giá trị phải là số dương.');
            return;
        }
    } else {
        Alert.alert("Lỗi loại giảm giá", "Loại giảm giá phải là 'percentage' hoặc 'fixed'.");
        return;
    }

    // Validate giá trị đơn hàng tối thiểu
    if (editMinOrderAmount && (isNaN(numEditMinOrderAmount) || numEditMinOrderAmount < 0)) {
        Alert.alert('Giá trị không hợp lệ!', 'Giá trị đơn hàng tối thiểu phải là số dương.');
        return;
    }

    // Validate giá trị giảm tối đa
    if (editMaxDiscountAmount && (isNaN(numEditMaxDiscountAmount) || numEditMaxDiscountAmount < 0)) {
        Alert.alert('Giá trị không hợp lệ!', 'Giá trị giảm tối đa phải là số dương.');
        return;
    }

    // Kiểm tra logic: maxDiscountAmount phải nhỏ hơn hoặc bằng giá trị giảm giá
    if (editDiscountType === 'percentage' && editMaxDiscountAmount && numEditMaxDiscountAmount < (numEditMinOrderAmount * numEditDiscountValue / 100)) {
        Alert.alert('Lỗi giá trị!', 'Giảm tối đa phải lớn hơn hoặc bằng giá trị giảm thực tế ở đơn hàng tối thiểu.');
        return;
    }
    
    // Kiểm tra logic: minOrderAmount phải lớn hơn giá trị giảm giá (đối với fixed)
    if (editDiscountType === 'fixed' && editMinOrderAmount && numEditMinOrderAmount < numEditDiscountValue) {
        Alert.alert('Lỗi giá trị!', 'Đơn hàng tối thiểu không thể nhỏ hơn giá trị giảm giá.');
        return;
    }

    // Validate số lượt sử dụng
    if (editUsageLimit && (isNaN(numEditUsageLimit) || numEditUsageLimit < 1)) {
        Alert.alert('Số lượt sử dụng không hợp lệ!', 'Vui lòng nhập một số nguyên dương.');
        return;
    }

    if (editDiscountType !== 'percentage' && editDiscountType !== 'fixed') {
      Alert.alert(
        'Lỗi loại giảm giá',
        "Loại giảm giá phải là 'percentage' hoặc 'fixed'."
      );
      return;
    }

    // --- Thêm đoạn kiểm tra ngày tháng ở đây ---
    const start = new Date(editStartDate);
    const end = new Date(editEndDate);

     // Kiểm tra định dạng ngày hợp lệ
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        Alert.alert('Lỗi định dạng ngày!', 'Vui lòng nhập ngày theo định dạng YYYY-MM-DD.');
        return;
    }

    if (end < start) {
      Alert.alert(
        'Lỗi ngày tháng!',
        'Ngày kết thúc phải sau ngày bắt đầu.'
      );
      return; // Dừng hàm nếu ngày tháng không hợp lệ
    }

    try {
      const response = await fetch(linkapi + 'vouchers/' + editVoucher._id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: editCode,
          description: editDescription,
          discount_type: editDiscountType,
          discount_value: Number(editDiscountValue),
          min_order_amount: Number(editMinOrderAmount),
          max_discount_amount: Number(editMaxDiscountAmount),
          start_date: editStartDate,
          end_date: editEndDate,
          usage_limit: Number(editUsageLimit)
        })
      });
      const data = await response.json();
      if (response.ok) {
        setEditModalVisible(false);
        setEditVoucher(null);
        fetchVouchers();
        Toast.show({
          type: 'success',
          text1: 'Thành công',
          text2: 'Voucher đã được cập nhật!',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Cập nhật thất bại',
          text2: data.message || 'Cập nhật voucher thất bại!',
        });
      }
    } catch (error) {
      console.error('Lỗi khi sửa voucher:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi hệ thống',
        text2: 'Đã xảy ra lỗi khi sửa voucher. Vui lòng thử lại.',
      });
    }
  };

  const handleDelete = (voucherId) => {
    Alert.alert(
      "Xác nhận xoá",
      "Bạn có chắc chắn muốn xoá voucher này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xoá", style: "destructive", onPress: async () => {
            try {
              const response = await fetch(linkapi + 'vouchers/' + voucherId, {
                method: 'DELETE',
              });
              const data = await response.json();
              if (response.ok) {
                Toast.show({ // Sử dụng Toast
                  type: 'success',
                  text1: 'Thành công',
                  text2: 'Voucher đã được xoá!',
                });
                fetchVouchers();
              } else {
                Toast.show({ // Sử dụng Toast
                  type: 'error',
                  text1: 'Xóa thất bại',
                  text2: data.message || 'Xoá voucher thất bại!',
                });
              }
            } catch (error) {
              Toast.show({ // Sử dụng Toast
                type: 'error',
                text1: 'Lỗi hệ thống',
                text2: 'Đã xảy ra lỗi khi xoá voucher!',
              });
              console.error(error);
            }
          }
        }
      ]
    );
  };

  const renderVoucherItem = ({ item }) => {
    const startDate = new Date(item.start_date);
    const endDate = new Date(item.end_date);
    const isExpired = endDate < new Date();

    const isUpcoming = startDate > now;

    const isUsageLimitReached = item.usage_limit && item.used_count >= item.usage_limit;

    const discountText = item.discount_type === 'percentage'
      ? `Giảm ${item.discount_value}%`
      : `Giảm ${formatPriceVND(item.discount_value)}`;

    const isInactive = isExpired || isUsageLimitReached;

    return (
      <View style={[styles.voucherItem, isInactive && styles.voucherItemInactive, isExpired && styles.voucherItemExpired, isUpcoming && { borderLeftColor: '#2196F3', opacity: 0.7 }]}>
        <View style={styles.voucherHeader}>
          <Text style={styles.voucherCode}>{item.code}</Text>
          {isUpcoming ? (
            <Text style={styles.upcomingTag}>Chưa bắt đầu</Text>
          ) : isExpired ? (
            <Text style={styles.expiredTag}>Đã hết hạn</Text>
          ) : isUsageLimitReached ? (
            <Text style={styles.usageLimitTag}>Hết lượt dùng</Text>
          ) : null}
          {/* {isExpired && <Text style={styles.expiredTag}>Đã hết hạn</Text>}
          {isUpcoming && <Text style={[styles.expiredTag, { backgroundColor: '#2196F3' }]}>Chưa bắt đầu</Text>}
          {isUsageLimitReached && !isExpired && <Text style={styles.usageLimitTag}>Hết lượt dùng</Text>} */}
        </View>
        <Text style={styles.descriptionText}>{item.description}</Text>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Loại giảm:</Text> {discountText}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Đơn tối thiểu:</Text> {formatPriceVND(item.min_order_amount) || '0 ₫'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Giảm tối đa:</Text> {item.max_discount_amount ? formatPriceVND(item.max_discount_amount) : 'Không giới hạn'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>HSD:</Text> {endDate.toLocaleDateString('vi-VN')}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Lượt dùng:</Text> {item.used_count || 0}/{item.usage_limit ?? '∞'}
          </Text>
        </View>


        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
            <Text style={styles.buttonText}>Sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item._id)}>
            <Text style={styles.buttonText}>Xoá</Text>
          </TouchableOpacity>
        </View>

      </View>
    );
  };

  return (
    <View style={styles.container}>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddVoucher')}
      >
        <Text style={styles.addButtonText}>➕ Thêm Voucher Mới</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={styles.loadingIndicator} />
      ) : vouchers.length === 0 ? (
        <View style={styles.emptyListContainer}>
          <Text style={styles.emptyListText}>Chưa có voucher nào được tạo.</Text>
          <Text style={styles.emptyListSubText}>Hãy thêm voucher để thu hút khách hàng!</Text>
        </View>
      ) : (
        <FlatList
          data={vouchers}
          keyExtractor={item => item._id}
          renderItem={renderVoucherItem}
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>

          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Sửa thông tin Voucher</Text>

              <Text style={styles.inputLabel}>Mã voucher <Text style={{ color: 'red' }}>*</Text></Text>
              <TextInput style={styles.input} value={editCode} onChangeText={setEditCode} placeholder="VD: SUMMER15" />

              <Text style={styles.inputLabel}>Mô tả <Text style={{ color: 'red' }}>*</Text></Text>
              <TextInput style={styles.input} value={editDescription} onChangeText={setEditDescription} placeholder="VD: Giảm 15% cho mọi đơn hàng mùa hè, tối đa 20" multiline numberOfLines={2} />

              <Text style={styles.inputLabel}>Loại giảm giá <Text style={{ color: 'red' }}>*</Text></Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={editDiscountType}
                  onValueChange={(itemValue) => setEditDiscountType(itemValue)}
                  style={{ color: '#333' }}
                >
                  <Picker.Item label="Chọn loại..." value="" />
                  <Picker.Item label="Phần trăm (%)" value="percentage" />
                  <Picker.Item label="Giá trị cố định (₫)" value="fixed" />
                </Picker>
              </View>

              <Text style={styles.inputLabel}>Giá trị giảm <Text style={{ color: 'red' }}>*</Text></Text>
              <TextInput style={styles.input} value={editDiscountValue} onChangeText={setEditDiscountValue} placeholder="VD: 20" keyboardType="numeric" />

              <Text style={styles.inputLabel}>Giá trị đơn hàng tối thiểu</Text>
              <TextInput style={styles.input} value={editMinOrderAmount} onChangeText={setEditMinOrderAmount} placeholder="VD: 100" keyboardType="numeric" />

              <Text style={styles.inputLabel}>Giá trị giảm tối đa</Text>
              <TextInput style={styles.input} value={editMaxDiscountAmount} onChangeText={setEditMaxDiscountAmount} placeholder="VD: 20" keyboardType="numeric" />

              <Text style={styles.inputLabel}>Ngày bắt đầu (YYYY-MM-DD) <Text style={{ color: 'red' }}>*</Text></Text>
              <TextInput style={styles.input} value={editStartDate} onChangeText={setEditStartDate} placeholder="VD: 2025-06-01" />

              <Text style={styles.inputLabel}>Ngày hết hạn (YYYY-MM-DD) <Text style={{ color: 'red' }}>*</Text></Text>
              <TextInput style={styles.input} value={editEndDate} onChangeText={setEditEndDate} placeholder="VD: 2025-07-22" />

              <Text style={styles.inputLabel}>Số lượt sử dụng tối đa</Text>
              <TextInput style={styles.input} value={editUsageLimit} onChangeText={setEditUsageLimit} placeholder="VD: 100 (để trống nếu không giới hạn)" keyboardType="numeric" />

              <View style={styles.modalActionButtons}>
                <TouchableOpacity style={styles.modalSaveButton} onPress={handleEditSave}>
                  <Text style={styles.buttonText}>Lưu</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.buttonText}>Hủy</Text>
                </TouchableOpacity>
              </View>
            </View>

          </ScrollView>
        </View>
      </Modal>
      {/* <Toast /> */}
    </View >
  );
};

export default ManageVoucherScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC', // Nền tổng thể nhẹ nhàng
    padding: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#FDFDFD',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#4CAF50', // Màu xanh lá cây tươi mới
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyListText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyListSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  listContentContainer: {
    paddingBottom: 20, // Đảm bảo có khoảng trống dưới cùng của danh sách
  },
  voucherItem: {
    padding: 20,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 }, // Đổ bóng rõ hơn
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    borderLeftWidth: 6, // Đường viền nổi bật hơn
    borderLeftColor: '#4CAF50', // Màu xanh lá cây cho voucher còn hạn
  },
  voucherItemInactive: {
    opacity: 0.7,
    borderLeftColor: '#9B59B6',
  },
  voucherItemExpired: {
    opacity: 0.7, // Mờ đi nếu voucher hết hạn
    borderLeftColor: '#FF5722', // Màu cam cho voucher hết hạn
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  voucherCode: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  expiredTag: {
    backgroundColor: '#FF5722',
    color: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 'bold',
  },
  descriptionText: {
    color: '#666',
    fontSize: 15,
    marginBottom: 12,
    lineHeight: 22,
  },
  detailsContainer: {
    marginBottom: 15,
  },
  detailText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#333',
  },
  upcomingTag: {
    backgroundColor: '#2196F3', // Màu xanh dương
    color: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 10, // Khoảng cách giữa các nút hành động
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  editButton: {
    backgroundColor: '#FFC107', // Vàng cam
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  deleteButton: {
    backgroundColor: '#F44336', // Đỏ tươi
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 25,
    borderRadius: 20,
    width: width * 0.9,
    // Loại bỏ maxHeight nếu có thể, hoặc đặt giá trị linh hoạt
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FDFDFD',
  },
  modalActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    gap: 15,
  },
  usageLimitTag: {
    backgroundColor: '#9B59B6', // Màu tím (hoặc bất kỳ màu nào bạn muốn)
    color: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#78909C',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center', // <<< Đây là vấn đề
    paddingVertical: 20,
  },
});