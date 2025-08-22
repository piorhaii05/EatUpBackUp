import { linkanh, linkapi } from '@/app/navigation/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { formatPriceVND } from '../../navigation/currency';



const screenWidth = Dimensions.get('window').width;
const BASE_SERVER_URL = linkapi;

export default function RevenueScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        todayRevenue: 0,
        totalOrders: 0,
        revenueByDate: {},
        topProducts: [],
    });
    const [error, setError] = useState('');

    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    const [selectedDateType, setSelectedDateType] = useState(null);

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);

    const [startDate, setStartDate] = useState(sevenDaysAgo);
    const [endDate, setEndDate] = useState(today);

    const formatDate = (date) => {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    };

    const loadData = useCallback(async (start, end, isRefreshing = false) => {
        if (!isRefreshing) setLoading(true);
        setError('');

        try {
            const id = await AsyncStorage.getItem('restaurant_id');
            if (!id) {
                throw new Error('Không tìm thấy restaurant_id. Vui lòng đăng nhập lại.');
            }

            const formattedStartDate = formatDate(start);
            const formattedEndDate = formatDate(end);

            const apiUrl = `${BASE_SERVER_URL}admin/revenue/by-restaurant/${id}?startDate=${formattedStartDate}&endDate=${formattedEndDate}`;
            console.log('Đang gọi API thống kê doanh thu:', apiUrl);

            const res = await fetch(apiUrl);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Lỗi khi tải dữ liệu từ server.');
            }

            console.log('📊 Dữ liệu thống kê doanh thu:', data);

            // Backend đã trả về topProducts đã sắp xếp, không cần sắp xếp lại ở đây
            // data.topProducts đã là mảng các object { name, quantity, total, image }
            setStats(data); // Cập nhật toàn bộ object stats

        } catch (e) {
            console.error("Lỗi tải dữ liệu doanh thu:", e);
            setError(e.message || 'Không thể tải dữ liệu.');
        } finally {
            if (!isRefreshing) setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData(startDate, endDate, true);
    }, [loadData, startDate, endDate]);

    useFocusEffect(
        useCallback(() => {
            loadData(startDate, endDate);
            // Không cần hàm cleanup cụ thể ở đây trừ khi có lắng nghe sự kiện
            return () => {
                console.log('RevenueScreen unfocused.');
            };
        }, [loadData, startDate, endDate]) // Dependencies: loadData, startDate, endDate
    );

    const showDatePicker = (type) => {
        setSelectedDateType(type);
        setDatePickerVisible(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisible(false);
    };

    const handleConfirm = (date) => {
        // Luôn đảm bảo ngày bắt đầu không lớn hơn ngày kết thúc và ngược lại
        if (selectedDateType === 'start') {
            const newStartDate = date;
            if (newStartDate > endDate) {
                setStartDate(newStartDate);
                setEndDate(newStartDate); // Nếu ngày bắt đầu > ngày kết thúc, đặt ngày kết thúc = ngày bắt đầu
            } else {
                setStartDate(newStartDate);
            }
        } else if (selectedDateType === 'end') {
            const newEndDate = date;
            if (newEndDate < startDate) {
                setEndDate(newEndDate);
                setStartDate(newEndDate); // Nếu ngày kết thúc < ngày bắt đầu, đặt ngày bắt đầu = ngày kết thúc
            } else {
                setEndDate(newEndDate);
            }
        }
        hideDatePicker();
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centeredView}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
        );
    }
    if (error) {
        return (
            <View style={styles.centeredView}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={() => loadData(startDate, endDate)} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const dates = Object.keys(stats.revenueByDate).sort();
    const revenueValues = dates.map(d => stats.revenueByDate[d]);

    const chartData = {
        labels: dates.length > 0 ? dates : ['Không có dữ liệu'],
        datasets: [{ data: revenueValues.length > 0 ? revenueValues : [0] }],
    };

    const chartConfig = {
        backgroundGradientFrom: '#fff',
        backgroundGradientTo: '#fff',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(14, 17, 22, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(68, 68, 68, ${opacity})`,
        propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#ffa726'
        },
        propsForLabels: {
            fontSize: 10,
        },
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0000ff']} />
            }
        >

            <Text style={styles.dateRangeText}>
                Thống kê từ: {formatDate(startDate)} đến: {formatDate(endDate)}
            </Text>

            <View style={styles.datePickerContainer}>
                <TouchableOpacity onPress={() => showDatePicker('start')} style={styles.dateInput}>
                    <Text style={styles.dateInputText}>Từ: {formatDate(startDate)}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => showDatePicker('end')} style={styles.dateInput}>
                    <Text style={styles.dateInputText}>Đến: {formatDate(endDate)}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.cardsRow}>
                <View style={styles.card}>
                    <Text style={styles.cardNum}>{formatPriceVND(stats.totalRevenue)}</Text>

                    <Text style={styles.cardText}>Tổng doanh thu</Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardNum}>{formatPriceVND(stats.todayRevenue)}</Text>

                    <Text style={styles.cardText}>Doanh thu hôm nay</Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardNum}>{stats.totalOrders}</Text>
                    <Text style={styles.cardText}>Đơn hoàn tất</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Doanh thu theo ngày</Text>
            {/* Đảm bảo có dữ liệu trước khi render LineChart */}
            {dates.length > 0 && revenueValues.some(val => val > 0) ? (
                <LineChart
                    data={chartData}
                    width={screenWidth - 30}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    fromZero
                    style={{ marginVertical: 8, borderRadius: 16 }}
                />
            ) : (
                <Text style={styles.noDataText}>Không có dữ liệu doanh thu trong khoảng thời gian này.</Text>
            )}

            <Text style={styles.sectionTitle}>Top 5 món bán chạy</Text>
            {stats.topProducts.length > 0 ? (
                stats.topProducts.slice(0, 5).map((item, index) => (
                    <View key={item.name + index} style={styles.productRow}>
                        <Text style={styles.pIdx}>{index + 1}.</Text>
                        <Image
                            source={{ uri: linkanh + item.image }} // Đảm bảo item.image là đường dẫn tương đối để ghép với linkanh
                            style={styles.productImage}
                            defaultSource={require('../../../assets/images/AVT.jpg')} // Đường dẫn ảnh mặc định cục bộ
                        />
                        <View style={styles.pInfo}>
                            <Text style={styles.pName}>{item.name}</Text>
                            <Text style={styles.pDetail}>
                                {`Số lượng: ${item.quantity} | Doanh thu: ${formatPriceVND(item.total)}`}

                            </Text>
                        </View>
                    </View>
                ))
            ) : (
                <Text style={styles.noDataText}>Không có sản phẩm bán chạy trong khoảng thời gian này.</Text>
            )}

            {isDatePickerVisible && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={selectedDateType === 'start' ? startDate : endDate}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        hideDatePicker();
                        if (selectedDate) {
                            handleConfirm(selectedDate);
                        }
                    }}
                />
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#333', textAlign: 'center' },
    dateRangeText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 15,
        fontStyle: 'italic',
    },
    cardsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    card: {
        flex: 1,
        backgroundColor: '#fff',
        marginHorizontal: 5,
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    cardNum: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    cardText: { fontSize: 13, color: '#666', marginTop: 5, textAlign: 'center' },
    sectionTitle: { marginTop: 25, fontWeight: 'bold', fontSize: 18, marginBottom: 10, color: '#333' },
    productRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 15,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
    },
    pIdx: { width: 30, fontSize: 16, color: '#555', fontWeight: 'bold' },
    pInfo: { flex: 1 },
    pName: { fontSize: 16, color: '#333', fontWeight: '600' },
    pDetail: { fontSize: 13, color: '#666', marginTop: 4 },
    errorText: { color: 'red', textAlign: 'center', marginTop: 50, fontSize: 16 }, // Đổi tên để khớp với các màn hình khác
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: '#007bff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    datePickerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 0,
    },
    dateInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 15,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    dateInputText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    noDataText: {
        textAlign: 'center',
        color: '#888',
        marginTop: 30,
        marginBottom: 30,
        fontSize: 15,
        fontStyle: 'italic',
        paddingHorizontal: 20,
    },
    productImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
        borderWidth: 1,
        borderColor: '#eee',
    },
});