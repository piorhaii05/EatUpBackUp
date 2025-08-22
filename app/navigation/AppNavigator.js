import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import AddAddressScreen from '../comps/AddAddressScreen';
import AddBankScreen from '../comps/AddBankScreen';
import AddressListScreen from '../comps/AddressListScreen';
import BankListScreen from '../comps/BankListScreen';
import CartScreen from '../comps/CartScreen';
import CategoryProductsScreen from '../comps/CategoryProductsScreen';
import ChangePasswordScreen from '../comps/ChangePasswordScreen';
import ChatDetailScreen from '../comps/ChatDetailScreen';
import CheckoutScreen from '../comps/CheckoutScreen';
import EditAddressScreen from '../comps/EditAddressScreen';
import EditNamePhoneScreen from '../comps/EditNamePhoneScreen';
import ForgotPasswordScreen from '../comps/ForgotPasswordScreen';
import HistoryOrdersScreen from '../comps/HistoryOrdersScreen';
import LoginScreen from '../comps/LoginScreen';
import MyRatingsScreen from '../comps/MyRatingsScreen';
import OrderDetailsScreen from '../comps/OrderDetailsScreen';
import ProductDetail from '../comps/ProductDetail';
import RateProductsScreen from '../comps/RateProductsScreen';
import RegisterScreen from '../comps/RegisterScreen';
import RestaurantDetailScreen from '../comps/RestaurantDetailScreen';
import SearchResultsScreen from '../comps/SearchResultsScreen';
import SplashScreen from '../comps/SplashScreen';
import VoucherListScreen from '../comps/VoucherListScreen';
import VoucherScreen from '../comps/VoucherScreen';
import WelcomeScreen from '../comps/WelcomeScreen';
import AddVoucherScreen from '../comps/admin/AddVoucherScreen';
import AdminAddProductScreen from '../comps/admin/AdminAddProductScreen';
import AdminChatDetailScreen from '../comps/admin/AdminChatDetailScreen';
import AdminDashboardScreen from '../comps/admin/AdminDashboardScreen';
import AdminEditFoodScreen from '../comps/admin/AdminEditFoodScreen';
import AdminOrderDetailScreen from '../comps/admin/AdminOrderDetailScreen';
import AdminProductDetailScreen from '../comps/admin/AdminProductDetailScreen';
import AdminProfileScreen from '../comps/admin/AdminProfileScreen';
import AdminReviewsListScreen from '../comps/admin/AdminReviewsListScreen';
import EditAddressAdminScreen from '../comps/admin/EditAddressAdminScreen';
import EditNameAdminScreen from '../comps/admin/EditNameAdminScreen';
import EditPasswordAdminScreen from '../comps/admin/EditPasswordAdminScreen';
import ManageFoodsScreen from '../comps/admin/ManageFoodsScreen';
import ManageVoucherScreen from '../comps/admin/ManageVoucherScreen';
import AdminAppNavigatorScreen from './AdminAppNavigator';

import Bottombar from './Bottombar';

const Stack = createNativeStackNavigator();

const AppNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Splash" component={SplashScreen} />
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="Home" component={Bottombar} />
    <Stack.Screen name="Cart" component={CartScreen} />
    <Stack.Screen name="AddressList" component={AddressListScreen} />
    <Stack.Screen name="AddAddress" component={AddAddressScreen} />
    <Stack.Screen name="EditAddress" component={EditAddressScreen} />
    <Stack.Screen name="BankList" component={BankListScreen} />
    <Stack.Screen name="AddBank" component={AddBankScreen} />
    <Stack.Screen name="EditNamePhone" component={EditNamePhoneScreen} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
    <Stack.Screen name="HomeAdmin" component={AdminAppNavigatorScreen} />
    <Stack.Screen name="Checkout" component={CheckoutScreen} />
    <Stack.Screen name="AdminAddProduct" component={AdminAddProductScreen} />
    <Stack.Screen name="ProductDetail" component={ProductDetail} options={{ title: 'Chi tiết sản phẩm' }} />
    <Stack.Screen name="ManagerFood" component={ManageFoodsScreen} />
    <Stack.Screen name="ManageVoucher" component={ManageVoucherScreen} />
    <Stack.Screen name="EditFood" component={AdminEditFoodScreen} />
    <Stack.Screen name="HistoryOrders" component={HistoryOrdersScreen} />
    <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
    <Stack.Screen name="Voucher" component={VoucherScreen} />
    <Stack.Screen name="VoucherList" component={VoucherListScreen} />
    <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
    <Stack.Screen name="RateProducts" component={RateProductsScreen} />
    <Stack.Screen name="MyRatings" component={MyRatingsScreen} />
    <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
    <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="CategoryProduct" component={CategoryProductsScreen} />

    <Stack.Screen name="AdminProfile" component={AdminProfileScreen} />
    <Stack.Screen name="EditNameAdmin" component={EditNameAdminScreen} />
    <Stack.Screen name="EditPasswordAdmin" component={EditPasswordAdminScreen} />
    <Stack.Screen name="AdminProductDetail" component={AdminProductDetailScreen} />
    <Stack.Screen name="AdminOrderDetail" component={AdminOrderDetailScreen} />
    <Stack.Screen name="AdminReviewsList" component={AdminReviewsListScreen} />
    <Stack.Screen name="EditAddressAdmin" component={EditAddressAdminScreen} />
    <Stack.Screen name="AdminChatDetail" component={AdminChatDetailScreen} />
     <Stack.Screen name="AddVoucher" component={AddVoucherScreen} />
  </Stack.Navigator>
);

export default AppNavigator;