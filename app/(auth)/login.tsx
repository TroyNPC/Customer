import { useAuth } from '../../lib/Auth';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const scale = (size: number) => (screenWidth / 375) * size;
const verticalScale = (size: number) => (screenHeight / 812) * size;

// Storage key for remembering email
const REMEMBERED_EMAIL_KEY = 'remembered_email';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, loginAsGuest } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);

  // Load remembered email on component mount
  useEffect(() => {
    const loadRememberedEmail = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem(REMEMBERED_EMAIL_KEY);
        if (savedEmail) {
          setForm(prev => ({ ...prev, email: savedEmail }));
          setRememberMe(true);
        }
      } catch (error) {
        console.log('Error loading remembered email:', error);
      }
    };

    loadRememberedEmail();
  }, []);

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      await signIn(form.email.trim().toLowerCase(), form.password);
      
      // Save email if "Remember Me" is checked
      if (rememberMe) {
        await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, form.email.trim().toLowerCase());
      } else {
        // Clear saved email if unchecked
        await AsyncStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
    } catch (error: any) {
      let errorMessage = 'An error occurred during login.';
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please confirm your email address before logging in.';
      }

      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    await loginAsGuest();
  };

  const handleSignUp = () => {
    router.push('/(auth)/register');
  };

  const toggleRememberMe = () => {
    setRememberMe(!rememberMe);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Background with same blue color */}
      <View style={styles.background} />
      
      {/* Content */}
      <View style={styles.content}>
        {/* Logo - Made bigger */}
        <Image
          source={require('../../assets/images/Monochrome.png')}
          style={styles.icon}
          resizeMode="contain"
        />
        
        {/* Title */}
        <Text style={styles.title}>LaundryGo</Text>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back!</Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
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
              placeholder="Password"
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

          {/* Remember Me Row */}
          <View style={styles.rememberMeRow}>
            <TouchableOpacity 
              style={styles.rememberMeContainer}
              onPress={toggleRememberMe}
              disabled={loading}
            >
              <View style={[
                styles.checkbox,
                rememberMe && styles.checkboxChecked
              ]}>
                {rememberMe && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
              <Text style={styles.rememberMeText}>Remember me</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.button, 
              styles.submitButton,
              loading && styles.buttonDisabled
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Sign In</Text>
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

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleSignUp} disabled={loading}>
              <Text style={styles.signupLink}>Sign Up</Text>
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
    paddingTop: verticalScale(20),
  },
  icon: {
    width: scale(350),
    height: verticalScale(180),
    marginBottom: verticalScale(10),
  },
  title: {
    fontSize: scale(42),
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: verticalScale(40),
  },
  card: {
    backgroundColor: 'white',
    width: '100%',
    borderRadius: 20,
    alignItems: 'center',
    paddingVertical: verticalScale(40),
    paddingHorizontal: scale(24),
    marginTop: verticalScale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTitle: {
    fontSize: scale(24),
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: verticalScale(32),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(16),
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputIcon: {
    marginRight: scale(12),
  },
  input: {
    flex: 1,
    paddingVertical: verticalScale(16),
    fontSize: scale(16),
    color: '#1a1a1a',
    fontWeight: '500',
  },
  eyeIcon: {
    padding: scale(4),
  },
  rememberMeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    marginBottom: verticalScale(24),
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#0AADFF',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0AADFF',
  },
  rememberMeText: {
    fontSize: scale(14),
    color: '#666',
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(20),
    width: '100%',
    marginBottom: verticalScale(12),
  },
  submitButton: { 
    backgroundColor: '#0AADFF',
    shadowColor: '#0AADFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
  signupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(16),
  },
  signupText: {
    fontSize: scale(15),
    color: '#666',
    fontWeight: '500',
  },
  signupLink: {
    fontSize: scale(15),
    color: '#355fc7',
    fontWeight: '700',
  },
});