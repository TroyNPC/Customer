import { useAuth } from "../../lib/Auth";
import { supabase } from "../../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { AppHeader } from "../../components/AppHeader";

// Define the user profile type based on your database schema
interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface EditProfileData {
  full_name: string;
  phone: string;
}

export default function Profile() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { logout, guest, loggedIn, user, isLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  // Modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  
  // Form states
  const [editForm, setEditForm] = useState<EditProfileData>({
    full_name: '',
    phone: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Loading states
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Function to fetch user profile
  const fetchUserProfile = useCallback(async () => {
    if (!loggedIn || guest || !user) {
      setUserProfile(null);
      setProfileLoading(false);
      return;
    }

    try {
      setProfileLoading(true);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // If no profile exists, create a basic one from auth data
        setUserProfile({
          id: user.id,
          full_name: user.user_metadata?.full_name || 'User',
          email: user.email || '',
          phone: null,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        setUserProfile(data);
        // Pre-fill edit form
        setEditForm({
          full_name: data.full_name || '',
          phone: data.phone || '',
        });
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setProfileLoading(false);
    }
  }, [user, guest, loggedIn]);

  // Fetch user profile when component mounts or dependencies change
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Refresh profile data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [fetchUserProfile])
  );

  const handleLogout = async () => {
    try {
      await logout();
      setUserProfile(null);
      router.replace("/");
    } catch (error) {
      // Error handled silently
    }
  };

  // Profile Picture Functions
  const handleAvatarPick = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to change your profile picture.');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        await uploadAvatar(result.assets[0].base64);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadAvatar = async (base64Image: string) => {
    if (!userProfile) return;

    try {
      setUploadingAvatar(true);

      // Create unique file name
      const fileExt = 'jpg';
      const fileName = `${userProfile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(base64Image), {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.id);

      if (updateError) throw updateError;

      // Update local state
      setUserProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      
      Alert.alert('Success', 'Profile picture updated!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!userProfile?.avatar_url) return;

    try {
      setUploadingAvatar(true);
      
      const { error } = await supabase
        .from('users')
        .update({ 
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.id);

      if (error) throw error;

      setUserProfile(prev => prev ? { ...prev, avatar_url: null } : null);
      Alert.alert('Success', 'Profile picture removed');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to remove profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Edit Profile Functions
  const openEditModal = () => {
    setEditForm({
      full_name: userProfile?.full_name || '',
      phone: userProfile?.phone || '',
    });
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
  };

  const handleUpdateProfile = async () => {
    if (!userProfile) return;

    try {
      setUpdatingProfile(true);
      
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editForm.full_name,
          phone: editForm.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userProfile.id);

      if (error) {
        throw error;
      }

      // Update local state
      setUserProfile(prev => prev ? {
        ...prev,
        full_name: editForm.full_name,
        phone: editForm.phone,
        updated_at: new Date().toISOString(),
      } : null);

      Alert.alert('Success', 'Profile updated successfully!');
      closeEditModal();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Change Password Functions
  const openPasswordModal = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordModalVisible(true);
  };

  const closePasswordModal = () => {
    setPasswordModalVisible(false);
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      setChangingPassword(true);

      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Password changed successfully!');
      closePasswordModal();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  // Show loading if auth is still loading
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { minHeight: height }]}>
        <AppHeader title="Profile" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3864C3" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const showGuestView = !loggedIn || guest;

  return (
    <SafeAreaView style={[styles.container, { minHeight: height }]}>
      <AppHeader title="Profile" />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          paddingVertical: verticalScale(30),
          paddingBottom: verticalScale(100),
        }}
        showsVerticalScrollIndicator={false}
      >
        {showGuestView ? (
          // Guest view
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
                onPress={() => router.push("/(auth)/register")}
              >
                <Text style={styles.authText}>Create Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.authButton, { backgroundColor: "#4CAF50" }]}
                onPress={() => router.push("/(auth)/login")}
              >
                <Text style={styles.authText}>Log In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.authButton, { backgroundColor: "#6B7280", marginTop: verticalScale(10) }]}
                onPress={() => router.push("/map")}
              >
                <Text style={styles.authText}>Go to Map</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Logged-in view
          <>
            {profileLoading ? (
              <View style={styles.profileLoadingContainer}>
                <ActivityIndicator size="large" color="#3864C3" />
                <Text style={styles.loadingText}>Loading profile...</Text>
              </View>
            ) : (
              <>
                <View style={styles.profileContainer}>
                  {/* Profile Picture Display Only */}
                  <View style={styles.avatarContainer}>
                    {userProfile?.avatar_url ? (
                      <Image
                        source={{ uri: userProfile.avatar_url }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <Ionicons
                        name="person-circle"
                        size={moderateScale(90)}
                        color="#3864C3"
                      />
                    )}
                  </View>

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
                    onPress={handleLogout}
                  >
                    <Text style={styles.logoutText}>LOG OUT</Text>
                  </TouchableOpacity>
                </View>

                {/* Menu */}
                <View style={styles.menuContainer}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    activeOpacity={0.7}
                    onPress={openEditModal}
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
                    onPress={openPasswordModal}
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
          </>
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeEditModal}
      >
        <TouchableWithoutFeedback onPress={closeEditModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalContent}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Profile</Text>
                  <TouchableOpacity onPress={closeEditModal}>
                    <Ionicons name="close" size={24} color="#000" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                  {/* Profile Picture Section in Modal */}
                  <View style={styles.avatarSection}>
                    <Text style={styles.sectionLabel}>Profile Picture</Text>
                    <View style={styles.avatarContainerModal}>
                      {userProfile?.avatar_url ? (
                        <TouchableOpacity onPress={handleAvatarPick} disabled={uploadingAvatar}>
                          <Image
                            source={{ uri: userProfile.avatar_url }}
                            style={styles.avatarImageModal}
                          />
                          {uploadingAvatar && (
                            <View style={styles.avatarOverlay}>
                              <ActivityIndicator size="small" color="#fff" />
                            </View>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity onPress={handleAvatarPick} disabled={uploadingAvatar}>
                          <Ionicons
                            name="person-circle"
                            size={moderateScale(80)}
                            color="#3864C3"
                          />
                          {uploadingAvatar && (
                            <View style={styles.avatarOverlay}>
                              <ActivityIndicator size="small" color="#fff" />
                            </View>
                          )}
                        </TouchableOpacity>
                      )}
                      
                      <View style={styles.avatarButtons}>
                        <TouchableOpacity 
                          style={styles.avatarButton} 
                          onPress={handleAvatarPick}
                          disabled={uploadingAvatar}
                        >
                          <Text style={styles.avatarButtonText}>
                            {userProfile?.avatar_url ? 'Change Photo' : 'Add Photo'}
                          </Text>
                        </TouchableOpacity>
                        
                        {userProfile?.avatar_url && (
                          <TouchableOpacity 
                            style={[styles.avatarButton, styles.removeButton]} 
                            onPress={handleRemoveAvatar}
                            disabled={uploadingAvatar}
                          >
                            <Text style={styles.avatarButtonText}>Remove</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editForm.full_name}
                      onChangeText={(text) => setEditForm(prev => ({ ...prev, full_name: text }))}
                      placeholder="Enter your full name"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editForm.phone}
                      onChangeText={(text) => setEditForm(prev => ({ ...prev, phone: text }))}
                      placeholder="Enter your phone number"
                      keyboardType="phone-pad"
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.saveButton, updatingProfile && styles.saveButtonDisabled]}
                    onPress={handleUpdateProfile}
                    disabled={updatingProfile}
                  >
                    {updatingProfile ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={passwordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closePasswordModal}
      >
        <TouchableWithoutFeedback onPress={closePasswordModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalContent}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Change Password</Text>
                  <TouchableOpacity onPress={closePasswordModal}>
                    <Ionicons name="close" size={24} color="#000" />
                  </TouchableOpacity>
                </View>

                <View style={styles.formContainer}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>New Password</Text>
                    <TextInput
                      style={styles.textInput}
                      value={passwordForm.newPassword}
                      onChangeText={(text) => setPasswordForm(prev => ({ ...prev, newPassword: text }))}
                      placeholder="Enter new password"
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Confirm New Password</Text>
                    <TextInput
                      style={styles.textInput}
                      value={passwordForm.confirmPassword}
                      onChangeText={(text) => setPasswordForm(prev => ({ ...prev, confirmPassword: text }))}
                      placeholder="Confirm new password"
                      secureTextEntry
                    />
                  </View>

                  <Text style={styles.passwordHint}>
                    Password must be at least 6 characters long
                  </Text>

                  <TouchableOpacity
                    style={[styles.saveButton, changingPassword && styles.saveButtonDisabled]}
                    onPress={handleChangePassword}
                    disabled={changingPassword}
                  >
                    {changingPassword ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>Change Password</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileLoadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(50),
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(15),
  },
  avatarImage: {
    width: moderateScale(90),
    height: moderateScale(90),
    borderRadius: moderateScale(45),
    borderWidth: 3,
    borderColor: '#3864C3',
  },
  // Modal-specific avatar styles
  avatarSection: {
    marginBottom: verticalScale(25),
  },
  sectionLabel: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: verticalScale(15),
    textAlign: 'center',
  },
  avatarContainerModal: {
    alignItems: 'center',
  },
  avatarImageModal: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    borderWidth: 3,
    borderColor: '#3864C3',
    marginBottom: verticalScale(10),
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: moderateScale(50),
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarButtons: {
    flexDirection: 'row',
    gap: scale(10),
  },
  avatarButton: {
    backgroundColor: '#3864C3',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(8),
    borderRadius: scale(20),
  },
  removeButton: {
    backgroundColor: '#FF4D4D',
  },
  avatarButtonText: {
    color: '#fff',
    fontSize: moderateScale(12),
    fontWeight: '600',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#000',
  },
  formContainer: {
    padding: scale(20),
  },
  inputGroup: {
    marginBottom: verticalScale(20),
  },
  inputLabel: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: verticalScale(8),
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: scale(10),
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(12),
    fontSize: moderateScale(16),
    backgroundColor: '#f9f9f9',
  },
  passwordHint: {
    fontSize: moderateScale(12),
    color: '#666',
    marginBottom: verticalScale(20),
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#3864C3',
    paddingVertical: verticalScale(15),
    borderRadius: scale(10),
    alignItems: 'center',
    marginTop: verticalScale(10),
  },
  saveButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
});