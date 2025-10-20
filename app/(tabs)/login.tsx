import { useAuth } from "@/hooks/useAuth";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
} from "react-native";
import Svg, { Path } from "react-native-svg";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const scale = (size: number) => (screenWidth / 375) * size;
const verticalScale = (size: number) => (screenHeight / 812) * size;

const svgHeight = screenHeight * 0.25;
const vbW = 1440;
const vbH = 320;

export default function LoginScreen() {
  const router = useRouter();
  const { loginAsGuest, setUserLoggedIn } = useAuth(); // ✅ Use the new functions
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting login...');

      // Sign in with Supabase
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      if (!data.user) {
        throw new Error("No user data returned");
      }

      console.log('Login successful for user:', data.user.id);

      // Get user profile to ensure it exists
      const { data: profile, error: profileError } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.warn('Profile fetch error (user might not have profile):', profileError);
        // Continue anyway - the user exists in auth
      }

      // ✅ Use the new function to set user as logged in
      await setUserLoggedIn(data.user);
      
      Alert.alert("Login Successful", "Welcome back!", [
        { text: "OK", onPress: () => router.push("/(tabs)/profile") },
      ]);

    } catch (error: any) {
      console.error('Full login error:', error);
      
      let errorMessage = "An error occurred during login.";
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = "Please confirm your email address before logging in.";
      } else if (error.message.includes('Invalid email')) {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message.includes('Email rate limit exceeded')) {
        errorMessage = "Too many login attempts. Please try again later.";
      }

      Alert.alert("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    // ✅ Use the dedicated guest login function
    await loginAsGuest();
    router.push("/(tabs)/profile");
  };

  return (
    <View style={styles.container}>
      {/* ===== Top Wave ===== */}
      <Svg
        width={screenWidth}
        height={verticalScale(300)}
        viewBox={`0 0 ${vbW} ${vbH}`}
        style={styles.topWave}
        preserveAspectRatio="none"
      >
        <Path
          fill="#355fc7"
          d={`M0,0 L0,${vbH * 0.3} C ${vbW * 0.3},${vbH * 0.1} ${vbW * 0.6},${vbH *
            0.8} ${vbW},${vbH * 0.7} L${vbW},0 Z`}
        />
      </Svg>

      {/* ===== Content ===== */}
      <View style={styles.content}>
        <Image
          source={require("../../assets/images/Monochrome.png")}
          style={styles.icon}
          resizeMode="contain"
        />
        <Text style={styles.title}>LaundryGo</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back!</Text>

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
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={form.password}
            onChangeText={(text) => setForm({ ...form, password: text })}
            editable={!loading}
          />

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
              <ActivityIndicator color="white" />
            ) : (
              <Text style={[styles.buttonText, { color: "white" }]}>
                Login
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.button, 
              styles.guestButton,
              loading && styles.buttonDisabled
            ]}
            onPress={handleGuest} 
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: "#0AADFF" }]}>
              Continue as Guest
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push("/(tabs)/signup")} 
            disabled={loading}
          >
            <Text style={[
              styles.signupText, 
              { color: "#355fc7" }, 
              loading && styles.textDisabled
            ]}>
              Don't have an account? Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ===== Bottom Wave ===== */}
      <Svg
        width={screenWidth}
        height={verticalScale(120)}
        viewBox={`0 0 ${vbW} ${vbH}`}
        style={styles.bottomWave}
        preserveAspectRatio="none"
      >
        <Path
          fill="#355fc7"
          d={`M0,${vbH * 0.2} C ${vbW * 0.25},${vbH * 0.9} ${vbW * 0.55},${vbH *
            -0.2} ${vbW},${vbH * 0.4} L ${vbW},${vbH} L 0,${vbH} Z`}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0AADFF",
    alignItems: "center",
  },
  topWave: { position: "absolute", top: 0, left: 0 },
  bottomWave: { position: "absolute", bottom: 0, left: 0 },
  content: {
    width: "85%",
    marginTop: svgHeight * 0.4,
    alignItems: "center",
  },
  icon: {
    width: scale(300),
    height: verticalScale(150),
    marginTop: verticalScale(-20),
  },
  title: {
    fontSize: scale(36),
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: verticalScale(25),
  },
  card: {
    zIndex: 1,
    backgroundColor: "white",
    width: "100%",
    borderRadius: 15,
    alignItems: "center",
    paddingVertical: verticalScale(40),
    paddingHorizontal: scale(20),
    marginTop: verticalScale(20),
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  cardTitle: {
    fontSize: scale(16),
    fontWeight: "bold",
    color: "black",
    marginBottom: verticalScale(20),
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(20),
    width: "100%",
    justifyContent: "center",
    marginBottom: verticalScale(15),
  },
  submitButton: { 
    backgroundColor: "#0AADFF" 
  },
  guestButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#0AADFF",
  },
  buttonDisabled: { 
    backgroundColor: "#cccccc",
    borderColor: "#cccccc" 
  },
  buttonText: { 
    fontSize: scale(16), 
    fontWeight: "600" 
  },
  signupText: {
    fontSize: scale(15),
    fontWeight: "500",
    color: "black",
    marginTop: verticalScale(10),
  },
  textDisabled: { 
    color: "#cccccc" 
  },
  input: {
    width: "100%",
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(15),
    fontSize: scale(16),
    color: "#000",
    marginBottom: verticalScale(15),
  },
});