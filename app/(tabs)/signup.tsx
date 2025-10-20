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

export default function SignUpScreen() {
  const router = useRouter();
  const { setUserLoggedIn, loginAsGuest } = useAuth(); // ✅ Use the new functions
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleGuest = async () => {
    // ✅ Use the dedicated guest login function
    await loginAsGuest();
    router.push("/(tabs)/profile");
  };

  const handleSignUpSubmit = async () => {
    if (!form.name || !form.email || !form.password) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }

    if (form.password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      console.log('Step 1: Creating auth user...');

      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: {
            full_name: form.name,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user data returned");

      console.log('Step 2: Auth user created with ID:', authData.user.id);

      // Optional: Sign in to ensure session
      const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (signInError) {
        console.warn('Sign-in warning:', signInError.message);
      }

      console.log('Step 3: Creating or updating user profile...');

      // ✅ Use upsert to avoid duplicate key conflict
      const { data: profileData, error: profileError } = await supabaseClient
        .from('users')
        .upsert(
          {
            id: authData.user.id, // same as auth.users ID
            full_name: form.name,
            email: form.email.trim().toLowerCase(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' } // This avoids duplicate primary key errors
        )
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation failed:', profileError);
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      console.log('Step 4: Profile created or updated:', profileData);

      // ✅ Use the new function to set user as logged in
      if (signInData?.user) {
        await setUserLoggedIn(signInData.user);
      } else if (authData.user) {
        // Fallback: use the user from signup if signin didn't return a user
        await setUserLoggedIn(authData.user);
      }

      Alert.alert("Registration Successful", "You have successfully registered!", [
        { text: "OK", onPress: () => router.push("/(tabs)/profile") },
      ]);
    } catch (error: any) {
      console.error('Full signup error:', error);
      let errorMessage = "An error occurred during registration.";

      if (error.message.includes('User already registered')) {
        errorMessage = "This email is already registered. Please try logging in.";
      } else if (error.message.includes('invalid_email')) {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message.includes('weak_password')) {
        errorMessage = "Password is too weak. Please choose a stronger one.";
      } else if (error.message.includes('Profile creation failed')) {
        errorMessage = "Account created but profile setup failed. Please contact support.";
      } else if (error.message.includes('duplicate key value')) {
        errorMessage = "This email is already registered. Please try logging in.";
      }

      Alert.alert("Registration Failed", errorMessage);
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.cardTitle}>Create Your Account</Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#888"
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
            editable={!loading}
          />
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
            placeholder="Password (min. 6 characters)"
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
            onPress={handleSignUpSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={[styles.buttonText, { color: "white" }]}>
                Create Account
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
            onPress={() => router.push("/login")} 
            disabled={loading}
          >
            <Text style={[
              styles.signupText, 
              { color: "#355fc7" }, 
              loading && styles.textDisabled
            ]}>
              Already have an account? Login
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
    marginTop: verticalScale(15),
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