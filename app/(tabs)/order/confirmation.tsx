// app/(tabs)/order/confirmation.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ScaledSheet, ms, mvs, s } from "react-native-size-matters";
import Svg, { Path } from "react-native-svg";
import { supabaseClient } from "../../../lib/supabaseClient";
import { Database } from "../../../types/supabase";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
type ShopService = Database["public"]["Tables"]["shop_services"]["Row"];
type ShopBranch = Database["public"]["Tables"]["shop_branches"]["Row"];
type ShopMethod = Database["public"]["Tables"]["shop_methods"]["Row"];
type Detergent = Database["public"]["Tables"]["detergent_types"]["Row"];
type Softener = Database["public"]["Tables"]["softener_types"]["Row"];

const vbW = 1440;
const vbH = 320;

export default function ConfirmationPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = Array.isArray(params.orderId)
    ? params.orderId[0]
    : params.orderId;

  console.log('=== CONFIRMATION PAGE DEBUG ===');
  console.log('📱 Confirmation page mounted');
  console.log('📋 Order ID from params:', orderId);
  console.log('🔍 All params:', params);
  console.log('========================');

  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [services, setServices] = useState<ShopService[]>([]);
  const [branch, setBranch] = useState<ShopBranch | null>(null);
  const [method, setMethod] = useState<ShopMethod | null>(null);
  const [detergent, setDetergent] = useState<Detergent | null>(null);
  const [softener, setSoftener] = useState<Softener | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 useEffect triggered, orderId:', orderId);
    if (orderId) {
      fetchOrderDetails();
    } else {
      console.error('❌ No orderId provided to confirmation page');
      setError("No order ID provided");
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    console.log('🔄 Fetching order details for:', orderId);
    try {
      setLoading(true);
      setError(null);

      // Fetch order with related data
      console.log('📡 Fetching order data...');
      const { data: orderData, error: orderError } = await supabaseClient
        .from("orders")
        .select(`
          *,
          shop_branches (*),
          shop_methods (*),
          detergent_types (*),
          softener_types (*),
          shop_services (*)
        `)
        .eq("id", orderId)
        .single();

      if (orderError) {
        console.error('❌ Error fetching order:', orderError);
        throw orderError;
      }

      console.log('✅ Order data loaded:', orderData?.id);
      setOrder(orderData);

      // Set related data
      if (orderData.shop_branches) {
        console.log('🏪 Branch data:', orderData.shop_branches.name);
        setBranch(orderData.shop_branches);
      }
      if (orderData.shop_methods) {
        console.log('🚚 Method data:', orderData.shop_methods.label);
        setMethod(orderData.shop_methods);
      }
      if (orderData.detergent_types) {
        console.log('🧴 Detergent data:', orderData.detergent_types.name);
        setDetergent(orderData.detergent_types);
      }
      if (orderData.softener_types) {
        console.log('🌊 Softener data:', orderData.softener_types.name);
        setSoftener(orderData.softener_types);
      }
      if (orderData.shop_services) {
        console.log('🛠️ Service data:', orderData.shop_services.name);
        setServices([orderData.shop_services]);
      }

      // Fetch order items
      console.log('📦 Fetching order items...');
      const { data: orderItemsData, error: itemsError } = await supabaseClient
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (itemsError) {
        console.error('❌ Error fetching order items:', itemsError);
        throw itemsError;
      }

      console.log('✅ Order items loaded:', orderItemsData?.length || 0);
      setOrderItems(orderItemsData || []);

      // If no service from order, fetch services from order items
      if (!orderData.shop_services && orderItemsData && orderItemsData.length > 0) {
        const serviceIds = orderItemsData.map(item => item.service_id).filter(Boolean);
        console.log('🔄 Fetching services from order items:', serviceIds);
        
        if (serviceIds.length > 0) {
          const { data: servicesData, error: servicesError } = await supabaseClient
            .from("shop_services")
            .select("*")
            .in("id", serviceIds);

          if (servicesError) throw servicesError;
          setServices(servicesData || []);
          console.log('✅ Additional services loaded:', servicesData?.length || 0);
        }
      }

      console.log('✅ All order data loaded successfully');

    } catch (error) {
      console.error('❌ Error fetching order details:', error);
      setError("Failed to load order details. Please try again.");
      Alert.alert("Error", "Failed to load order details. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshing(true);
    fetchOrderDetails();
  };

  const handleRetry = () => {
    console.log('🔄 Retry button pressed');
    setError(null);
    setLoading(true);
    fetchOrderDetails();
  };

  const handleNewOrder = () => {
    console.log('🎯 Creating new order');
    router.push("/map");
  };

  const handleViewOrders = () => {
    console.log('🎯 Viewing all orders');
    router.push("/(tabs)/orderhistory");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "#10B981";
      case "pending":
        return "#F59E0B";
      case "washing":
        return "#3B82F6";
      case "ready":
        return "#8B5CF6";
      case "delivered":
        return "#10B981";
      case "cancelled":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Order Confirmed";
      case "pending":
        return "Pending";
      case "washing":
        return "In Progress";
      case "ready":
        return "Ready for Pickup";
      case "delivered":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const getOrderStatus = () => {
    if (!orderItems.length) {
      console.log('📊 No order items, status: pending');
      return "pending";
    }

    const allCompleted = orderItems.every(
      (item) => item.status === "completed"
    );
    const anyReady = orderItems.some((item) => item.status === "ready");
    const anyInProgress = orderItems.some(
      (item) => item.status === "in_progress"
    );

    let status = "confirmed";
    if (allCompleted) status = "delivered";
    else if (anyReady) status = "ready";
    else if (anyInProgress) status = "washing";

    console.log('📊 Order status calculated:', status);
    return status;
  };

  // REMOVED calculateTotalPrice function since we don't show total amount

  if (loading) {
    console.log('⏳ Showing loading state');
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3864C3" />
          <Text style={styles.loadingText}>Loading order details...</Text>
          <Text style={styles.debugText}>Order ID: {orderId}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    console.log('❌ Showing error state:', error);
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={ms(64)} color="#DC2626" />
          <Text style={styles.errorTitle}>
            {error ? "Unable to Load Order" : "Order Not Found"}
          </Text>
          <Text style={styles.errorText}>
            {error || "We couldn't find the order details. Please check your order ID and try again."}
          </Text>
          
          <TouchableOpacity style={styles.primaryButton} onPress={handleRetry}>
            <Ionicons name="refresh" size={ms(20)} color="white" />
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleNewOrder}>
            <Ionicons name="add-circle-outline" size={ms(20)} color="#3864C3" />
            <Text style={styles.secondaryButtonText}>Create New Order</Text>
          </TouchableOpacity>

          <Text style={styles.debugText}>Order ID: {orderId}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStatus = getOrderStatus();

  console.log('✅ Rendering confirmation page with order:', order.id);
  console.log('📊 Current status:', currentStatus);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerBox}>
        <Svg
          width="100%"
          height={mvs(300)}
          viewBox={`0 0 ${vbW} ${vbH}`}
          style={styles.waveTop}
          preserveAspectRatio="none"
        >
          <Path
            fill="#3864C3"
            d={`M0,${vbH * 0.2} C ${vbW * 0.5},${vbH * -0.1} ${vbW * 0.45},${vbH * 0.6} ${vbW},${vbH * 0.2} L${vbW},0 L0,0 Z`}
          />
        </Svg>

        <View style={styles.headerContent}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => {
            console.log('🔙 Back button pressed');
            router.back();
          }}>
            <Ionicons name="arrow-back" size={ms(25)} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Confirmed</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={handleRefresh}>
            <Ionicons
              name="refresh"
              size={ms(25)}
              color="white"
              style={refreshing && { transform: [{ rotate: "360deg" }] }}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#3864C3"]}
            tintColor="#3864C3"
          />
        }
      >
        {/* Success Icon */}
        <View style={styles.successContainer}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={ms(40)} color="white" />
          </View>
          <Text style={styles.successTitle}>Order Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your laundry order has been successfully placed
          </Text>
        </View>

        {/* Order Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Order Status</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(currentStatus) },
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {getStatusText(currentStatus)}
              </Text>
            </View>
          </View>
          <Text style={styles.orderNumber}>
            Order #: {orderId?.substring(0, 8).toUpperCase()}
          </Text>
          <Text style={styles.orderDate}>
            Placed on:{" "}
            {new Date(order.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        {/* Order Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Order Details</Text>

          {/* Branch Information */}
          {branch && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Branch</Text>
              <Text style={styles.detailValue}>{branch.name}</Text>
            </View>
          )}

          {/* Service Information */}
          {services.length > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {services.length > 1 ? "Services" : "Service"}
              </Text>
              <View style={styles.servicesList}>
                {services.map((service, index) => (
                  <Text key={service.id} style={styles.detailValue}>
                    {service.name}
                    {service.price_per_kg && ` - ₱${service.price_per_kg}/kg`}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* Method */}
          {method && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Method</Text>
              <Text style={styles.detailValue}>{method.label}</Text>
            </View>
          )}

          {/* Customer Information */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Customer</Text>
            <Text style={styles.detailValue}>{order.customer_name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Contact</Text>
            <Text style={styles.detailValue}>{order.customer_contact}</Text>
          </View>

          {/* Delivery Location */}
          {order.delivery_location && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Delivery Location</Text>
              <Text style={styles.detailValue}>{order.delivery_location}</Text>
            </View>
          )}

          {/* Detergent */}
          {detergent && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Detergent</Text>
              <Text style={styles.detailValue}>{detergent.name}</Text>
            </View>
          )}

          {/* Softener */}
          {softener && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Softener</Text>
              <Text style={styles.detailValue}>{softener.name}</Text>
            </View>
          )}

          {/* Order Items Details */}
          {orderItems.length > 0 && (
            <View style={styles.orderItemsSection}>
              <Text style={styles.sectionSubtitle}>Items:</Text>
              {orderItems.map((item, index) => {
                const service = services.find((s) => s.id === item.service_id);
                return (
                  <View key={item.id} style={styles.orderItem}>
                    <Text style={styles.itemName}>
                      {service?.name || `Item ${index + 1}`}
                    </Text>
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemQuantity}>
                        {item.quantity} {service?.unit || "kg"}
                      </Text>
                      {/* REMOVED item price since there's no amount yet */}
                    </View>
                    <View
                      style={[
                        styles.itemStatusBadge,
                        {
                          backgroundColor: getStatusColor(
                            item.status || "in_progress"
                          ),
                        },
                      ]}
                    >
                      <Text style={styles.itemStatusText}>
                        {item.status === "in_progress"
                          ? "In Progress"
                          : item.status === "ready"
                          ? "Ready"
                          : item.status === "completed"
                          ? "Completed"
                          : "Pending"}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* REMOVED Total Price section since there's no amount calculated yet */}
        </View>

        {/* Next Steps */}
        <View style={styles.nextStepsCard}>
          <Text style={styles.nextStepsTitle}>What's Next?</Text>

          <View style={styles.step}>
            <View style={styles.stepIcon}>
              <Ionicons name="time-outline" size={ms(20)} color="#3864C3" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Processing</Text>
              <Text style={styles.stepDescription}>
                Your order is being processed. We'll notify you when we start
                working on your laundry.
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepIcon}>
              <Ionicons
                name="notifications-outline"
                size={ms(20)}
                color="#3864C3"
              />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Updates</Text>
              <Text style={styles.stepDescription}>
                You'll receive notifications about your order status and when
                it's ready for pickup/delivery.
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepIcon}>
              <Ionicons name="card-outline" size={ms(20)} color="#3864C3" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Payment</Text>
              <Text style={styles.stepDescription}>
                Payment will be calculated based on the actual weight and collected 
                when you pick up your laundry or upon delivery.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNewOrder}
          >
            <Ionicons name="add-circle-outline" size={ms(20)} color="white" />
            <Text style={styles.primaryButtonText}>Create New Order</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleViewOrders}
          >
            <Ionicons name="list-outline" size={ms(20)} color="#3864C3" />
            <Text style={styles.secondaryButtonText}>View My Orders</Text>
          </TouchableOpacity>
        </View>

        {/* Support Info */}
        <View style={styles.supportCard}>
          <Ionicons name="help-circle-outline" size={ms(20)} color="#6B7280" />
          <Text style={styles.supportText}>
            Need help? Contact support at{" "}
            <Text style={styles.supportLink}>support@laundryapp.com</Text>
          </Text>
        </View>

        {/* Debug Info - Only visible in development */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>Debug Information</Text>
            <Text style={styles.debugText}>Order ID: {orderId}</Text>
            <Text style={styles.debugText}>Status: {currentStatus}</Text>
            <Text style={styles.debugText}>Items: {orderItems.length}</Text>
            {/* REMOVED total price from debug info */}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = ScaledSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerBox: {
    width: "100%",
    height: mvs(120),
    backgroundColor: "#0AADFF",
    paddingTop: mvs(40),
    justifyContent: "center",
    overflow: "hidden",
  },
  waveTop: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: s(20),
    zIndex: 2,
  },
  headerTitle: {
    fontSize: ms(22),
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  contentContainer: {
    paddingBottom: mvs(30),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: s(20),
  },
  loadingText: {
    marginTop: mvs(16),
    fontSize: ms(16),
    color: "#6B7280",
    textAlign: "center",
  },
  debugText: {
    fontSize: ms(10),
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: mvs(8),
    fontFamily: 'monospace',
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: s(20),
    backgroundColor: "#F8FAFC",
  },
  errorTitle: {
    fontSize: ms(20),
    fontWeight: "bold",
    color: "#DC2626",
    marginTop: mvs(16),
    marginBottom: mvs(8),
    textAlign: "center",
  },
  errorText: {
    fontSize: ms(14),
    color: "#6B7280",
    textAlign: "center",
    lineHeight: mvs(20),
    marginBottom: mvs(24),
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: mvs(30),
    paddingHorizontal: s(20),
  },
  successCircle: {
    width: ms(80),
    height: ms(80),
    borderRadius: ms(40),
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: mvs(16),
  },
  successTitle: {
    fontSize: ms(24),
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: mvs(8),
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: ms(16),
    color: "#6B7280",
    textAlign: "center",
    lineHeight: mvs(20),
  },
  statusCard: {
    backgroundColor: "white",
    marginHorizontal: s(16),
    marginBottom: mvs(16),
    padding: s(20),
    borderRadius: s(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: mvs(12),
  },
  statusTitle: {
    fontSize: ms(18),
    fontWeight: "bold",
    color: "#1F2937",
  },
  statusBadge: {
    paddingHorizontal: s(12),
    paddingVertical: s(6),
    borderRadius: s(20),
  },
  statusBadgeText: {
    color: "white",
    fontSize: ms(12),
    fontWeight: "bold",
  },
  orderNumber: {
    fontSize: ms(14),
    color: "#6B7280",
    marginBottom: mvs(4),
  },
  orderDate: {
    fontSize: ms(14),
    color: "#6B7280",
  },
  detailsCard: {
    backgroundColor: "white",
    marginHorizontal: s(16),
    marginBottom: mvs(16),
    padding: s(20),
    borderRadius: s(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: ms(18),
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: mvs(16),
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: mvs(8),
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailLabel: {
    fontSize: ms(14),
    color: "#6B7280",
    flex: 1,
  },
  detailValue: {
    fontSize: ms(14),
    color: "#1F2937",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  servicesList: {
    flex: 1,
    alignItems: "flex-end",
  },
  orderItemsSection: {
    marginTop: mvs(16),
    paddingTop: mvs(16),
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  sectionSubtitle: {
    fontSize: ms(14),
    fontWeight: "600",
    color: "#374151",
    marginBottom: mvs(8),
  },
  orderItem: {
    backgroundColor: "#F9FAFB",
    padding: s(12),
    borderRadius: s(8),
    marginBottom: mvs(8),
  },
  itemName: {
    fontSize: ms(14),
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: mvs(4),
  },
  itemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: mvs(4),
  },
  itemQuantity: {
    fontSize: ms(12),
    color: "#6B7280",
  },
  // REMOVED itemPrice style since it's not used anymore
  itemStatusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: s(8),
    paddingVertical: s(4),
    borderRadius: s(12),
  },
  itemStatusText: {
    fontSize: ms(10),
    color: "white",
    fontWeight: "600",
  },
  // REMOVED totalRow, totalLabel, and totalPrice styles since they're not used
  nextStepsCard: {
    backgroundColor: "white",
    marginHorizontal: s(16),
    marginBottom: mvs(16),
    padding: s(20),
    borderRadius: s(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  nextStepsTitle: {
    fontSize: ms(18),
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: mvs(16),
  },
  step: {
    flexDirection: "row",
    marginBottom: mvs(16),
  },
  stepIcon: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: s(12),
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: ms(14),
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: mvs(4),
  },
  stepDescription: {
    fontSize: ms(12),
    color: "#6B7280",
    lineHeight: mvs(16),
  },
  actionsContainer: {
    paddingHorizontal: s(16),
    marginBottom: mvs(24),
  },
  primaryButton: {
    backgroundColor: "#3864C3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: mvs(16),
    paddingHorizontal: s(20),
    borderRadius: s(12),
    marginBottom: mvs(12),
  },
  primaryButtonText: {
    color: "white",
    fontSize: ms(16),
    fontWeight: "bold",
    marginLeft: s(8),
  },
  secondaryButton: {
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: mvs(16),
    paddingHorizontal: s(20),
    borderRadius: s(12),
    borderWidth: 2,
    borderColor: "#3864C3",
    marginBottom: mvs(12),
  },
  secondaryButtonText: {
    color: "#3864C3",
    fontSize: ms(16),
    fontWeight: "bold",
    marginLeft: s(8),
  },
  supportCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s(16),
    paddingVertical: mvs(16),
    backgroundColor: "#F3F4F6",
    marginHorizontal: s(16),
    borderRadius: s(8),
  },
  supportText: {
    fontSize: ms(12),
    color: "#6B7280",
    marginLeft: s(8),
    textAlign: "center",
  },
  supportLink: {
    color: "#3864C3",
    fontWeight: "500",
  },
  debugContainer: {
    backgroundColor: "#FEF3C7",
    marginHorizontal: s(16),
    marginBottom: mvs(16),
    padding: s(12),
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  debugTitle: {
    fontSize: ms(12),
    fontWeight: "bold",
    color: "#92400E",
    marginBottom: mvs(4),
  },
});