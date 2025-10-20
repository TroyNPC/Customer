import { useAuth } from "@/hooks/useAuth";
import { supabaseClient } from "@/lib/supabaseClient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";
import Svg, { Path } from "react-native-svg";

// Define the user profile type based on your database schema
interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export default function Profile() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { logout, guest, loggedIn, user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile data when user is logged in
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user || guest) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching profile for user:', user.id);
        
        const { data, error } = await supabaseClient
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          // If no profile exists, create a basic one from auth data
          setUserProfile({
            id: user.id,
            full_name: user.user_metadata?.full_name || 'User',
            email: user.email || '',
            phone: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } else {
          console.log('User profile found:', data);
          setUserProfile(data);
        }
      } catch (error) {
        console.error('Error in fetchUserProfile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, guest]);

  // Use the auth hook state instead of URL params
  const isGuest = guest;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { minHeight: height }]}>
        <View style={[styles.headerBox, { height: verticalScale(100) }]}>
          <Svg
            width={"100%"}
            height={verticalScale(200)}
            viewBox="0 0 1200 320"
            style={styles.waveTop}
            preserveAspectRatio="none"
          >
            <Path
              fill="#3864C3"
              d="M0,64 C480,-32 720,256 1440,64 L1440,0 L0,0 Z"
            />
          </Svg>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>PROFILE</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3864C3" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { minHeight: height }]}>
      {/* Header */}
      <View style={[styles.headerBox, { height: verticalScale(100) }]}>
        <Svg
          width={"100%"}
          height={verticalScale(200)}
          viewBox="0 0 1200 320"
          style={styles.waveTop}
          preserveAspectRatio="none"
        >
          <Path
            fill="#3864C3"
            d="M0,64 C480,-32 720,256 1440,64 L1440,0 L0,0 Z"
          />
        </Svg>

        <View
          style={[
            styles.headerContent,
            { marginTop: height < 700 ? verticalScale(20) : verticalScale(30) },
          ]}
        >
          <Text
            style={[
              styles.headerTitle,
              { fontSize: moderateScale(width < 360 ? 18 : 22) },
            ]}
          >
            {isGuest ? "PROFILE" : "PROFILE"}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          paddingVertical: verticalScale(30),
          paddingBottom: verticalScale(100),
        }}
        showsVerticalScrollIndicator={false}
      >
        {isGuest ? (
          // ✅ Guest view - Show login prompt
          <View style={styles.guestContainer}>
            <Ionicons
              name="person-circle-outline"
              size={moderateScale(110)}
              color="#3864C3"
              style={{ marginBottom: verticalScale(10) }}
            />
            <Text style={styles.guestTitle}>Please Log In to See Profile</Text>
            <Text style={styles.guestSubtitle}>
              Create an account or sign in to access your profile, save preferences, and view your order history.
            </Text>

            <View style={{ marginTop: verticalScale(30), alignItems: "center" }}>
              <TouchableOpacity
                style={[styles.authButton, { backgroundColor: "#3864C3" }]}
                onPress={() => router.push("/signup")}
              >
                <Text style={styles.authText}>Create Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.authButton, { backgroundColor: "#4CAF50" }]}
                onPress={() => router.push("/login")}
              >
                <Text style={styles.authText}>Log In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.authButton, { backgroundColor: "#6B7280", marginTop: verticalScale(10) }]}
                onPress={() => router.push("/")}
              >
                <Text style={styles.authText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // ✅ Logged-in view with real user data
          <>
            <View style={styles.profileContainer}>
              <Ionicons
                name="person-circle"
                size={moderateScale(90)}
                color="#3864C3"
                style={{ marginBottom: verticalScale(10) }}
              />
              <Text style={styles.profileName}>
                {userProfile?.full_name || 'User'}
              </Text>
              <Text style={styles.profileRole}>Customer</Text>
              {userProfile?.phone && (
                <Text style={styles.profileNumber}>{userProfile.phone}</Text>
              )}
              <Text style={styles.profileEmail}>
                {userProfile?.email || user?.email || 'No email provided'}
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.logoutButton}
                onPress={() => {
                  logout();
                  router.replace("/");
                }}
              >
                <Text style={styles.logoutText}>LOG OUT</Text>
              </TouchableOpacity>
            </View>

            {/* Menu */}
            <View style={styles.menuContainer}>
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => router.push("/(tabs)/editprofile")}
              >
                <Ionicons
                  name="person-outline"
                  size={moderateScale(18)}
                  color="#000"
                />
                <Text style={styles.menuText}>Edit Profile</Text>
                <Ionicons
                  name="chevron-forward"
                  size={moderateScale(18)}
                  color="#888"
                  style={{ marginLeft: "auto" }}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => router.push("/(tabs)/changepassword")}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={moderateScale(18)}
                  color="#000"
                />
                <Text style={styles.menuText}>Change Password</Text>
                <Ionicons
                  name="chevron-forward"
                  size={moderateScale(18)}
                  color="#888"
                  style={{ marginLeft: "auto" }}
                />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  headerBox: {
    width: "100%",
    backgroundColor: "#0AADFF",
    justifyContent: "center",
    overflow: "hidden",
  },
  waveTop: { position: "absolute", top: 0, left: 0, zIndex: 1 },
  headerContent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    paddingHorizontal: scale(10),
    zIndex: 2,
  },
  headerTitle: {
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: verticalScale(10),
    fontSize: moderateScale(16),
    color: "#666",
  },
  guestContainer: { 
    alignItems: "center", 
    marginTop: verticalScale(50),
    paddingHorizontal: scale(20),
  },
  guestTitle: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: "#000",
    marginBottom: verticalScale(15),
    textAlign: "center",
  },
  guestSubtitle: {
    fontSize: moderateScale(14),
    color: "#666",
    textAlign: "center",
    lineHeight: moderateScale(20),
    marginBottom: verticalScale(10),
  },
  authButton: {
    width: scale(200),
    paddingVertical: verticalScale(12),
    borderRadius: scale(10),
    marginBottom: verticalScale(10),
  },
  authText: {
    color: "#fff",
    fontSize: moderateScale(14),
    textAlign: "center",
    fontWeight: "bold",
  },
  profileContainer: {
    alignItems: "center",
    marginBottom: verticalScale(25),
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: scale(20),
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    paddingVertical: verticalScale(20),
  },
  profileName: { 
    fontSize: moderateScale(18), 
    fontWeight: "bold", 
    color: "#000",
    marginBottom: verticalScale(4),
  },
  profileRole: { 
    fontSize: moderateScale(14), 
    color: "#007AFF", 
    marginVertical: verticalScale(4),
    fontWeight: "600",
  },
  profileNumber: { 
    fontSize: moderateScale(14), 
    color: "#333",
    marginBottom: verticalScale(4),
  },
  profileEmail: { 
    fontSize: moderateScale(13), 
    color: "#777", 
    marginBottom: verticalScale(10),
  },
  logoutButton: {
    backgroundColor: "#FF4D4D",
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(40),
    borderRadius: scale(10),
    marginTop: verticalScale(10),
  },
  logoutText: { 
    color: "#fff", 
    fontSize: moderateScale(14), 
    fontWeight: "bold" 
  },
  menuContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: scale(15),
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    paddingVertical: verticalScale(10),
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(15),
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  menuText: { 
    fontSize: moderateScale(14), 
    color: "#000", 
    marginLeft: scale(10) 
  },
});