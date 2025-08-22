import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const WelcomeScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Image
          source={require('../../assets/images/Banner.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <View style={styles.middle}>
        <Text style={styles.title}>Welcome To EatUp</Text>
        <Text style={styles.subtitle}>
          Order with ease, savor the flavors your{'\n'}favorite food, just a tap away
        </Text>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}>GET STARTED</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFEFD5',
    justifyContent: 'space-between',
  },
  top: {
    flex: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  middle: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#D94F4F',
    marginBottom: 10,
  },
  subtitle: {
    color: '#444',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottom: {
    padding: 20,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#F76C6C',
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 25,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});
