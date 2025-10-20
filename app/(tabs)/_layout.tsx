import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      {/* ===== Core Tabs ===== */}
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
        name="orderhistory"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sync-outline" size={size} color={color} />
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
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />

      {/* ===== Hidden Screens ===== */}
      <Tabs.Screen name="signup" options={{ href: null }} />
      <Tabs.Screen name="shop" options={{ href: null }} />
      <Tabs.Screen name="trackdeliveryboy" options={{ href: null }} />
      <Tabs.Screen name="changepassword" options={{ href: null }} />
      <Tabs.Screen name="editprofile" options={{ href: null }} />
      <Tabs.Screen name="order/[id]" options={{ href: null }} />
      <Tabs.Screen name="order/scan-qr" options={{ href: null }} />
      <Tabs.Screen name="order/confirmation" options={{ href: null }} />
      <Tabs.Screen name="login" options={{ href: null }} />
      <Tabs.Screen name="delivery" options={{ href: null }} />
      <Tabs.Screen name="order/location-map" options={{ href: null }} />
    </Tabs>
  );
}