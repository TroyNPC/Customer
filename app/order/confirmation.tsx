// app/order/confirmation.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  BackHandler,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Dimensions
} from "react-native";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database.types';
import { AppHeader } from '../../components/AppHeader';

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const scale = (size: number) => (screenWidth / 375) * size;

type Order = Database['public']['Tables']['orders']['Row'];
type ShopBranch = Database['public']['Tables']['shop_branches']['Row'];
type ShopMethod = Database['public']['Tables']['shop_methods']['Row'];

export default function ConfirmationPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get order ID from params
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        handleBackToShop();
        return true; // Prevent default behavior
      }
    );

    return () => backHandler.remove();
  }, []);

  // Fetch order details
  const { data: orderData, isLoading, error } = useQuery({
    queryKey: ['order-confirmation', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required');

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          shop_branches (
            name,
            address
          ),
          shop_methods (
            code,
            label
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        throw new Error('Order not found');
      }

      return data;
    },
    enabled: !!orderId,
  });

  const order = orderData as (Order & { 
    shop_branches: ShopBranch | null;
    shop_methods: ShopMethod | null;
  }) | undefined;

  const meta = order?.meta as any;

  const handleNewOrder = () => {
    router.replace('/(tabs)/map');
  };

  const handleViewOrders = () => {
    router.push('/(tabs)/orders');
  };

  const handleBackToShop = () => {
    // Navigate back to map tab
    router.replace('/(tabs)/map');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Order Confirmation" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3864C3" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Order Confirmation" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={scale(60)} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Order Not Found</Text>
          <Text style={styles.errorText}>
            {error?.message || "We couldn't find your order details."}
          </Text>
          
          <TouchableOpacity style={styles.primaryButton} onPress={handleBackToShop}>
            <Text style={styles.primaryButtonText}>Back to Map</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <AppHeader 
        title="Order Confirmed"
        rightElement={
          <TouchableOpacity 
            style={styles.homeButton}
            onPress={handleBackToShop}
          >
            <Ionicons name="home-outline" size={24} color="white" />
          </TouchableOpacity>
        }
      />

      {/* Content */}
      <ScrollView
        style={{ flex: 1, backgroundColor: "white" }}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          {/* Success Section */}
          <View style={styles.successSection}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={scale(32)} color="white" />
            </View>
            <Text style={styles.successTitle}>Order Confirmed!</Text>
            <Text style={styles.successText}>
              Your laundry order has been successfully placed and is being processed
            </Text>
          </View>

          {/* Order Summary Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Summary</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Order ID</Text>
              <Text style={styles.infoValue}>{orderId?.substring(0, 8).toUpperCase()}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date & Time</Text>
              <Text style={styles.infoValue}>
                {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}
              </Text>
            </View>

            {order.shop_branches && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Laundry Branch</Text>
                <Text style={styles.infoValue}>{order.shop_branches.name}</Text>
              </View>
            )}

            {order.shop_methods && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Service Type</Text>
                <Text style={styles.infoValue}>{order.shop_methods.label}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Customer Name</Text>
              <Text style={styles.infoValue}>{order.customer_name}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contact Number</Text>
              <Text style={styles.infoValue}>{order.customer_contact}</Text>
            </View>

            {/* Location Information */}
            {order.delivery_location && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  {order.shop_methods?.code === 'delivery' ? 'Delivery Location' : 'Pickup Location'}
                </Text>
                <Text style={styles.infoValue}>{order.delivery_location}</Text>
              </View>
            )}

            {/* Service Details */}
            {meta?.service_name && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Service</Text>
                <Text style={styles.infoValue}>{meta.service_name}</Text>
              </View>
            )}

            {meta?.detergent_name && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Detergent</Text>
                <Text style={styles.infoValue}>{meta.detergent_name}</Text>
              </View>
            )}

            {meta?.softener_name && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Softener</Text>
                <Text style={styles.infoValue}>{meta.softener_name}</Text>
              </View>
            )}

            {meta?.service_price && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Price Rate</Text>
                <Text style={styles.infoValue}>₱{meta.service_price} per kg</Text>
              </View>
            )}
          </View>

          {/* Next Steps */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>What Happens Next?</Text>
            
            <View style={styles.step}>
              <Ionicons name="time-outline" size={20} color="#3864C3" />
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Order Processing</Text>
                <Text style={styles.stepText}>
                  Your order is now being processed. We'll notify you when it's ready.
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <Ionicons name="notifications-outline" size={20} color="#3864C3" />
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Status Updates</Text>
                <Text style={styles.stepText}>
                  You'll receive notifications about your order status and pickup/delivery times.
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <Ionicons name="card-outline" size={20} color="#3864C3" />
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Payment</Text>
                <Text style={styles.stepText}>
                  Final payment will be calculated based on actual weight at pickup/delivery.
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleNewOrder}
            >
              <Ionicons name="add-circle-outline" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Place New Order</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleViewOrders}
            >
              <Ionicons name="list-outline" size={20} color="#3864C3" />
              <Text style={styles.secondaryButtonText}>View My Orders</Text>
            </TouchableOpacity>
          </View>

          {/* Support Info */}
          <View style={styles.support}>
            <Text style={styles.supportText}>
              Need help with your order? Contact support at{' '}
              <Text style={styles.supportLink}>support@laundryapp.com</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  homeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  formContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100, // Account for header height
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    paddingBottom: 100, // Account for header height
  },
  errorTitle: {
    fontSize: 20,
    color: "#FF6B6B",
    marginTop: 12,
    textAlign: "center",
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
    marginBottom: 20,
  },
  successSection: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    marginBottom: 20,
  },
  successIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  successText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
    textAlign: "right",
    flex: 1,
    marginLeft: 10,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  stepContent: {
    flex: 1,
    marginLeft: 12,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  stepText: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  actions: {
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: "#1939BB",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#3864C3",
  },
  secondaryButtonText: {
    color: "#3864C3",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  support: {
    alignItems: "center",
    paddingVertical: 16,
  },
  supportText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  supportLink: {
    color: "#3864C3",
    fontWeight: "500",
  },
});