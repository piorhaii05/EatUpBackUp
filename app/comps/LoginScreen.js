import { Entypo, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';

import {
  Image, Pressable,
  StyleSheet,
  Text, TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { linkapi } from '../navigation/config'; // Đường dẫn import config tùy theo cấu trúc của bạn


export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('User');

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: 'info',
        text1: 'Vui lòng nhập đầy đủ thông tin!',
      });
      return;
    }

    try {
      const response = await fetch(linkapi + 'login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          password_hash: password,
          role: role
        })
      });

      const data = await response.json();

      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: 'Đăng nhập thành công!',
        });

        const userId = data?.user?._id;

        if (userId) {
          await AsyncStorage.setItem('restaurant_id', userId); // ✅ dùng _id là id nhà hàng
          await AsyncStorage.setItem('user', JSON.stringify(data.user));
        } else {
          console.warn('⚠️ Không tìm thấy _id trong user');
        }

        // Phân quyền điều hướng:
        if (data.user.role === 'Admin') {
          navigation.navigate('HomeAdmin');
        } else {
          navigation.navigate('Home');
        }

      } else {
        Toast.show({
          type: 'error',
          text1: data.message || 'Đăng nhập thất bại!',
        });
      }

    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Có lỗi xảy ra, vui lòng thử lại!',
      });
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/Logo.png')} style={styles.logo} />

      <Text style={styles.title}>ĐĂNG NHẬP</Text>

      <View style={styles.inputBox}>
        <Entypo name="email" size={22} color="#f55" style={styles.icon} />
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputBox}>
        <Entypo name="lock" size={22} color="#f55" style={styles.icon} />
        <TextInput
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          placeholderTextColor="#999"
        />
        <Pressable onPress={() => setShowPassword(!showPassword)}>
          <Feather name={showPassword ? 'eye-off' : 'eye'} size={22} color="#222" />
        </Pressable>
      </View>

      <View style={styles.roleRow}>
        <TouchableOpacity style={styles.radioGroup} onPress={() => setRole('Admin')}>
          <View style={styles.radioOuter}>
            {role === 'Admin' && <View style={styles.radioInner} />}
          </View>
          <Text style={styles.roleText}>Nhà hàng</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.radioGroup} onPress={() => setRole('User')}>
          <View style={styles.radioOuter}>
            {role === 'User' && <View style={styles.radioInner} />}
          </View>
          <Text style={styles.roleText}>Khách hàng</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
        <Text style={styles.loginText}>Đăng Nhập</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.forgotText}>Quên mật khẩu?</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        Bạn chưa có tài khoản?
        <Text style={styles.registerText} onPress={() => navigation.navigate('Register')}> Đăng ký</Text>
      </Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 35,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 130,
    height: 130,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 26,
    marginBottom: 30,
    color: '#000',
  },
  inputBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#f55',
    borderRadius: 30,
    paddingHorizontal: 18,
    marginBottom: 18,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 17,
    color: '#000',
  },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 25,
  },
  radioGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f55',
  },
  roleText: {
    fontSize: 18,
    color: '#444',
  },
  loginBtn: {
    backgroundColor: '#f55',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 15,
  },
  loginText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  forgotText: {
    color: '#f55',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  footerText: {
    textAlign: 'center',
    color: '#444',
    fontSize: 16,
  },
  registerText: {
    color: '#f55',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
