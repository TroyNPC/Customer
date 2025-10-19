import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/hooks/useAuth";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { loggedIn } = useAuth(); // ✅ true = logged in, signed up, or guest

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      {/* ===== Core Tabs (Always Visible) ===== */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orderhistory"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sync-outline" size={size} color={color} />
          ),
        }}
      />

      {/* ===== ON/OFF System for Auth Tabs ===== */}
      <Tabs.Screen
        name="login"
        options={{
          // 🚀 Login tab only visible when NOT logged in
          href: loggedIn ? null : undefined,
          title: "Login",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="log-in-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          // 🚀 Profile tab only visible when logged in/signed up/guest
          href: loggedIn ? undefined : null,
          title: "User",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />

      {/* ===== Hidden Screens ===== */}
      <Tabs.Screen name="signup" options={{ href: null }} />
      <Tabs.Screen name="shop" options={{ href: null }} />
      <Tabs.Screen name="sendinfoafterqr" options={{ href: null }} />
      <Tabs.Screen name="deliveryonly" options={{ href: null }} />
      <Tabs.Screen name="onlyscan" options={{ href: null }} />
      <Tabs.Screen name="trackdeliveryboy" options={{ href: null }} />
      <Tabs.Screen name="changepassword" options={{ href: null }} />
      <Tabs.Screen name="editprofile" options={{ href: null }} />
    </Tabs>
  );
}
