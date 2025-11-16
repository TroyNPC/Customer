import { useAuth } from '../../lib/Auth';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const scale = (size: number) => (screenWidth / 375) * size;
const verticalScale = (size: number) => (screenHeight / 812) * size;

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, loginAsGuest } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const handleGuest = async () => {
    await loginAsGuest();
  };

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }

    if (form.password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(form.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      await signUp(form.email.trim().toLowerCase(), form.password, form.name);
    } catch (error: any) {
      let errorMessage = 'An error occurred during registration.';

      if (error.message.includes('User already registered')) {
        errorMessage = 'This email is already registered. Please try logging in.';
      } else if (error.message.includes('invalid_email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message.includes('weak_password')) {
        errorMessage = 'Password is too weak. Please choose a stronger one.';
      } else if (error.message.includes('duplicate key value')) {
        errorMessage = 'This email is already registered. Please try logging in.';
      }

      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.background} />
      
      <View style={styles.content}>
        <Image
          source={require('../../assets/images/Monochrome.png')}
          style={styles.icon}
          resizeMode="contain"
        />
        
        <Text style={styles.title}>LaundryGo</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create Account</Text>

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#888"
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
              editable={!loading}
              autoCapitalize="words"
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#888"
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password (min. 6 characters)"
              placeholderTextColor="#888"
              secureTextEntry={secureTextEntry}
              value={form.password}
              onChangeText={(text) => setForm({ ...form, password: text })}
              editable={!loading}
            />
            <TouchableOpacity 
              onPress={() => setSecureTextEntry(!secureTextEntry)}
              style={styles.eyeIcon}
            >
              <Ionicons 
                name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'} 
                size={20} 
                color="#888" 
              />
            </TouchableOpacity>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.button, 
              styles.submitButton,
              loading && styles.buttonDisabled
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Guest Button */}
          <TouchableOpacity 
            style={[
              styles.button, 
              styles.guestButton,
              loading && styles.buttonDisabled
            ]}
            onPress={handleGuest} 
            disabled={loading}
          >
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleLogin} disabled={loading}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0AADFF',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0AADFF',
  },
  content: {
    flex: 1,
    width: '85%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: scale(300), // Slightly smaller
    height: verticalScale(150),
    marginBottom: verticalScale(10),
  },
  title: {
    fontSize: scale(36),
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginBottom: verticalScale(30),
  },
  card: {
    backgroundColor: 'white',
    width: '100%',
    borderRadius: 20,
    alignItems: 'center',
    paddingVertical: verticalScale(25), // Reduced padding
    paddingHorizontal: scale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTitle: {
    fontSize: scale(20), // Smaller title
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: verticalScale(20), // Reduced margin
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(12), // Reduced spacing
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputIcon: {
    marginRight: scale(12),
  },
  input: {
    flex: 1,
    paddingVertical: verticalScale(14), // Slightly smaller
    fontSize: scale(16),
    color: '#1a1a1a',
    fontWeight: '500',
  },
  eyeIcon: {
    padding: scale(4),
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: verticalScale(14), // Smaller buttons
    paddingHorizontal: scale(20),
    width: '100%',
    marginBottom: verticalScale(10), // Reduced spacing
  },
  submitButton: { 
    backgroundColor: '#0AADFF',
  },
  guestButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0AADFF',
  },
  buttonDisabled: { 
    opacity: 0.6,
  },
  submitButtonText: { 
    fontSize: scale(16), 
    fontWeight: '700',
    color: 'white',
  },
  guestButtonText: { 
    fontSize: scale(16), 
    fontWeight: '600',
    color: '#0AADFF',
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(12), // Reduced spacing
  },
  loginText: {
    fontSize: scale(14),
    color: '#666',
    fontWeight: '500',
  },
  loginLink: {
    fontSize: scale(14),
    color: '#355fc7',
    fontWeight: '700',
  },
});