import { useAuth } from '../../lib/Auth';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
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
// Storage key for tracking failed attempts
const FAILED_ATTEMPTS_KEY = 'failed_login_attempts';
const LOCKOUT_UNTIL_KEY = 'login_lockout_until';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, loginAsGuest } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false); // Prevent multiple clicks

  // Load remembered email and failed attempts on component mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        // Load remembered email
        const savedEmail = await AsyncStorage.getItem(REMEMBERED_EMAIL_KEY);
        if (savedEmail) {
          setForm(prev => ({ ...prev, email: savedEmail }));
          setRememberMe(true);
        }

        // Load failed attempts
        const savedAttempts = await AsyncStorage.getItem(FAILED_ATTEMPTS_KEY);
        if (savedAttempts) {
          setFailedAttempts(parseInt(savedAttempts));
        }

        // Check for active lockout
        const lockoutUntil = await AsyncStorage.getItem(LOCKOUT_UNTIL_KEY);
        if (lockoutUntil) {
          const lockoutTime = parseInt(lockoutUntil);
          const now = Date.now();
          
          if (lockoutTime > now) {
            setIsLockedOut(true);
            const timeLeft = Math.ceil((lockoutTime - now) / 1000);
            setLockoutTimeLeft(timeLeft);
            startLockoutTimer(timeLeft);
          } else {
            // Lockout has expired, reset counters
            await resetFailedAttempts();
          }
        }
      } catch (error) {
        console.log('Error loading saved data:', error);
      }
    };

    loadSavedData();

    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Start the lockout timer
  const startLockoutTimer = (seconds: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setLockoutTimeLeft(seconds);
    
    timerRef.current = setInterval(() => {
      setLockoutTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          handleLockoutEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle when lockout ends
  const handleLockoutEnd = async () => {
    setIsLockedOut(false);
    setLockoutTimeLeft(0);
    await AsyncStorage.removeItem(LOCKOUT_UNTIL_KEY);
    await resetFailedAttempts();
  };

  // Reset failed attempts
  const resetFailedAttempts = async () => {
    setFailedAttempts(0);
    await AsyncStorage.removeItem(FAILED_ATTEMPTS_KEY);
  };

  // Save failed attempts
  const saveFailedAttempts = async (attempts: number) => {
    setFailedAttempts(attempts);
    await AsyncStorage.setItem(FAILED_ATTEMPTS_KEY, attempts.toString());
  };

  // Start lockout period
  const startLockout = async () => {
    const lockoutDuration = 30; // seconds
    const lockoutUntil = Date.now() + (lockoutDuration * 1000);
    
    setIsLockedOut(true);
    setLockoutTimeLeft(lockoutDuration);
    
    await AsyncStorage.setItem(LOCKOUT_UNTIL_KEY, lockoutUntil.toString());
    startLockoutTimer(lockoutDuration);
  };

  const handleLogin = async () => {
    // Prevent multiple simultaneous login attempts
    if (isProcessingRef.current || loading) {
      return;
    }

    if (isLockedOut) {
      Alert.alert(
        'Account Temporarily Locked',
        `Too many failed attempts. Please try again in ${lockoutTimeLeft} seconds.`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (!form.email || !form.password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    isProcessingRef.current = true;
    setLoading(true);
    console.log('Starting login process...');

    try {
      await signIn(form.email.trim().toLowerCase(), form.password);
      
      // Login successful - these will run only if no error was thrown
      await resetFailedAttempts();
      
      // Save email if "Remember Me" is checked
      if (rememberMe) {
        await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, form.email.trim().toLowerCase());
      } else {
        // Clear saved email if unchecked
        await AsyncStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
      
      console.log('Login process completed successfully');
    } catch (error: any) {
      // Increment failed attempts
      const newAttempts = failedAttempts + 1;
      await saveFailedAttempts(newAttempts);
      
      let errorMessage = 'An error occurred during login.';
      let shouldClearPassword = true;
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
        
        // Check if we need to lockout after 5 attempts
        if (newAttempts >= 5) {
          await startLockout();
          errorMessage = `Too many failed attempts. Account locked for 30 seconds.`;
          shouldClearPassword = false;
        }
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please confirm your email address before logging in.';
      }

      Alert.alert('Login Failed', errorMessage);
      
      // Clear only the password field on error (keep email for retry)
      if (shouldClearPassword) {
        setForm(prev => ({ ...prev, password: '' }));
      }
      
      console.log('Login error:', error.message);
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  };

  const handleGuest = async () => {
    if (isLockedOut) {
      Alert.alert(
        'Account Locked',
        `Your account is temporarily locked. Please wait ${lockoutTimeLeft} seconds before trying again.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    setLoading(true);
    try {
      await loginAsGuest();
    } catch (error) {
      Alert.alert('Error', 'Unable to continue as guest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push('/(auth)/register');
  };

  const toggleRememberMe = () => {
    setRememberMe(!rememberMe);
  };

  // Format time display
  const formatTime = (seconds: number) => {
    return seconds < 10 ? `0${seconds}` : `${seconds}`;
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

          {/* Lockout Warning */}
          {isLockedOut && (
            <View style={styles.lockoutWarning}>
              <Ionicons name="lock-closed" size={20} color="#FF3B30" />
              <Text style={styles.lockoutText}>
                Account locked. Try again in 00:{formatTime(lockoutTimeLeft)}
              </Text>
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={[
                styles.input,
                isLockedOut && styles.inputDisabled
              ]}
              placeholder="Email address"
              placeholderTextColor="#888"
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading && !isLockedOut}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={[
                styles.input,
                isLockedOut && styles.inputDisabled
              ]}
              placeholder="Password"
              placeholderTextColor="#888"
              secureTextEntry={secureTextEntry}
              value={form.password}
              onChangeText={(text) => setForm({ ...form, password: text })}
              editable={!loading && !isLockedOut}
            />
            <TouchableOpacity 
              onPress={() => setSecureTextEntry(!secureTextEntry)}
              style={styles.eyeIcon}
              disabled={loading || isLockedOut}
            >
              <Ionicons 
                name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'} 
                size={20} 
                color="#888" 
              />
            </TouchableOpacity>
          </View>

          {/* Attempts Counter (only show when there are attempts) */}
          {failedAttempts > 0 && !isLockedOut && (
            <Text style={styles.attemptsText}>
              Attempts: {failedAttempts}/5
            </Text>
          )}

          {/* Remember Me Row */}
          <View style={styles.rememberMeRow}>
            <TouchableOpacity 
              style={styles.rememberMeContainer}
              onPress={toggleRememberMe}
              disabled={loading || isLockedOut}
            >
              <View style={[
                styles.checkbox,
                rememberMe && styles.checkboxChecked,
                (loading || isLockedOut) && styles.checkboxDisabled
              ]}>
                {rememberMe && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
              <Text style={[
                styles.rememberMeText,
                (loading || isLockedOut) && styles.textDisabled
              ]}>Remember me</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.button, 
              styles.submitButton,
              (loading || isLockedOut) && styles.buttonDisabled
            ]}
            onPress={handleLogin}
            disabled={loading || isLockedOut}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : isLockedOut ? (
              <Text style={styles.submitButtonText}>
                Locked (00:{formatTime(lockoutTimeLeft)})
              </Text>
            ) : (
              <Text style={styles.submitButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Guest Button */}
          <TouchableOpacity 
            style={[
              styles.button, 
              styles.guestButton,
              (loading || isLockedOut) && styles.buttonDisabled
            ]}
            onPress={handleGuest} 
            disabled={loading || isLockedOut}
          >
            <Text style={[
              styles.guestButtonText,
              (loading || isLockedOut) && styles.textDisabled
            ]}>Continue as Guest</Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={[
              styles.signupText,
              (loading || isLockedOut) && styles.textDisabled
            ]}>Don't have an account? </Text>
            <TouchableOpacity 
              onPress={handleSignUp} 
              disabled={loading || isLockedOut}
            >
              <Text style={[
                styles.signupLink,
                (loading || isLockedOut) && styles.textDisabled
              ]}>Sign Up</Text>
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
    marginBottom: verticalScale(16),
  },
  lockoutWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: 8,
    marginBottom: verticalScale(16),
    width: '100%',
  },
  lockoutText: {
    fontSize: scale(14),
    color: '#FF3B30',
    fontWeight: '600',
    marginLeft: scale(8),
  },
  attemptsText: {
    fontSize: scale(12),
    color: '#FF9500',
    fontWeight: '500',
    alignSelf: 'flex-start',
    marginBottom: verticalScale(16),
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
  inputDisabled: {
    color: '#999',
    backgroundColor: '#f0f0f0',
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
  checkboxDisabled: {
    borderColor: '#ccc',
    backgroundColor: '#f0f0f0',
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
  textDisabled: {
    opacity: 0.5,
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