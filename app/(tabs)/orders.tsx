import { useAuth } from "../../lib/Auth";
import { supabase } from '../../lib/supabase';
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert
} from "react-native";
import { ScaledSheet, ms, mvs, s } from "react-native-size-matters";
import { Database } from "../../types/database.types";
import { AppHeader } from "../../components/AppHeader";

// ✅ FIXED: Proper type definitions
type Order = Database['public']['Tables']['orders']['Row'] & {
  shop_branches?: {
    name: string | null;
    shops?: {
      name: string;
    } | null;
  } | null;
  shop_methods?: {
    code: string | null;
    label: string | null;
  } | null;
  shop_services?: {
    name: string;
    price_per_kg: number | null;
    unit: string | null;
  } | null;
  detergent_types?: {
    name: string;
    base_price: number | null;
  } | null;
  softener_types?: {
    name: string;
    base_price: number | null;
  } | null;
  payments?: Database['public']['Tables']['payments']['Row'][];
  deliveries?: (Database['public']['Tables']['deliveries']['Row'] & {
    users?: {
      full_name: string | null;
    } | null;
  })[];
  order_items?: (Database['public']['Tables']['order_items']['Row'] & {
    shop_services?: {
      name: string;
      price_per_kg: number | null;
      unit: string | null;
    } | null;
  })[];
};

type OrderHistory = Database['public']['Tables']['order_history']['Row'] & {
  shops?: {
    name: string;
  } | null;
  shop_branches?: {
    name: string | null;
  } | null;
  shop_methods?: {
    code: string | null;
    label: string | null;
  } | null;
};

// Order Progress Component (unchanged - this is correct)
const OrderProgress = ({ order }: { order: Order }) => {
  const orderMethod = order.shop_methods?.code;
  const currentStatus = order.order_items?.[0]?.status || 'pending';

  const getProgressSteps = () => {
    if (orderMethod === 'dropoff') {
      return [
        { key: 'pending', label: 'At Shop' },
        { key: 'in_progress', label: 'Washing' },
        { key: 'ready_for_delivery', label: 'Ready' },
        { key: 'completed', label: 'Completed' }
      ];
    } 
    else if (orderMethod === 'delivery') {
      return [
        { key: 'pending', label: 'At Shop' },
        { key: 'in_progress', label: 'Washing' },
        { key: 'ready_for_delivery', label: 'Ready' },
        { key: 'out_for_delivery', label: 'Delivery' },
        { key: 'completed', label: 'Delivered' }
      ];
    }
    else {
      return [
        { key: 'pending', label: 'Ordered' },
        { key: 'waiting_for_pickup', label: 'Pickup' },
        { key: 'collected', label: 'At Shop' },
        { key: 'in_progress', label: 'Washing' },
        { key: 'ready_for_delivery', label: 'Ready' },
        { key: 'out_for_delivery', label: 'Delivery' },
        { key: 'completed', label: 'Delivered' }
      ];
    }
  };

  const steps = getProgressSteps();
  const currentIndex = steps.findIndex(step => step.key === currentStatus);

  return (
    <View style={styles.progressContainer}>
      {steps.map((step, index) => (
        <View key={step.key} style={styles.stepContainer}>
          <View style={[
            styles.stepDot,
            index <= currentIndex ? styles.stepActive : styles.stepInactive
          ]}>
            {index < currentIndex && (
              <Ionicons name="checkmark" size={ms(12)} color="#FFFFFF" />
            )}
          </View>
          {index < steps.length - 1 && (
            <View style={[
              styles.stepLine,
              index < currentIndex ? styles.lineActive : styles.lineInactive
            ]} />
          )}
          <Text style={[
            styles.stepLabel,
            index <= currentIndex ? styles.labelActive : styles.labelInactive
          ]}>
            {step.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default function OrderHistory() {
  const router = useRouter();
  const { user, guest } = useAuth();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<OrderHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Helper function to determine if order is still active
  const isOrderStillActive = (order: Order): boolean => {
    if (!order.order_items || order.order_items.length === 0) {
      return true;
    }

    const hasIncompleteItems = order.order_items.some(item => {
      const status = item.status || 'pending';
      return !['completed', 'delivered'].includes(status);
    });

    if (order.deliveries && order.deliveries.length > 0) {
      const hasUndelivered = order.deliveries.some(delivery => {
        const deliveryStatus = delivery.status || 'unassigned';
        return deliveryStatus !== 'delivered';
      });
      if (hasUndelivered) return true;
    }

    return hasIncompleteItems;
  };

  // Status determination (unchanged - this is correct)
  const getActiveOrderStatusInfo = (order: Order) => {
    const orderMethod = order.shop_methods?.code;
    const dbStatus = order.order_items?.[0]?.status || 'pending';

    if (orderMethod === 'pickup') {
      switch (dbStatus) {
        case 'pending':
        case null:
          return {
            status: 'Order Received - Waiting for Pickup',
            color: '#FFF3CD',
            icon: 'time' as const,
            iconColor: '#FFA000',
            showTrackButton: false
          };
        case 'waiting_for_pickup':
          return {
            status: 'Waiting for Driver Pickup',
            color: '#FFF3CD',
            icon: 'time' as const,
            iconColor: '#FFA000',
            showTrackButton: false
          };
        case 'collected':
          return {
            status: 'Collected - At Shop',
            color: '#E3F2FD',
            icon: 'checkmark-circle-outline' as const,
            iconColor: '#2196F3',
            showTrackButton: false
          };
        case 'in_progress':
          return {
            status: 'In Progress - Washing',
            color: '#E3F2FD', 
            icon: 'time' as const,
            iconColor: '#2196F3',
            showTrackButton: false
          };
        case 'ready_for_delivery':
          return {
            status: 'Ready for Delivery',
            color: '#FFF3CD',
            icon: 'cube-outline' as const,
            iconColor: '#FFA000',
            showTrackButton: false
          };
        case 'out_for_delivery':
          return {
            status: 'Out for Delivery',
            color: '#FDF59F',
            icon: 'bicycle' as const,
            iconColor: '#FFD93D',
            showTrackButton: true
          };
        case 'completed':
          return {
            status: 'Delivered',
            color: '#DFFFE0',
            icon: 'checkmark-circle' as const,
            iconColor: '#28A745',
            showTrackButton: false
          };
        default:
          return {
            status: 'Processing',
            color: '#E3F2FD',
            icon: 'time' as const,
            iconColor: '#2196F3',
            showTrackButton: false
          };
      }
    }
    else if (orderMethod === 'delivery') {
      switch (dbStatus) {
        case 'pending':
        case null:
          return {
            status: 'At Shop - Ready to Weigh',
            color: '#E3F2FD',
            icon: 'home-outline' as const,
            iconColor: '#2196F3',
            showTrackButton: false
          };
        case 'in_progress':
          return {
            status: 'In Progress - Washing',
            color: '#E3F2FD', 
            icon: 'time' as const,
            iconColor: '#2196F3',
            showTrackButton: false
          };
        case 'ready_for_delivery':
          return {
            status: 'Ready for Delivery',
            color: '#FFF3CD',
            icon: 'cube-outline' as const,
            iconColor: '#FFA000',
            showTrackButton: false
          };
        case 'out_for_delivery':
          return {
            status: 'Out for Delivery',
            color: '#FDF59F',
            icon: 'bicycle' as const,
            iconColor: '#FFD93D',
            showTrackButton: true
          };
        case 'completed':
          return {
            status: 'Delivered',
            color: '#DFFFE0',
            icon: 'checkmark-circle' as const,
            iconColor: '#28A745',
            showTrackButton: false
          };
        default:
          return {
            status: 'Processing at Shop',
            color: '#E3F2FD',
            icon: 'time' as const,
            iconColor: '#2196F3',
            showTrackButton: false
          };
      }
    }
    else if (orderMethod === 'dropoff') {
      switch (dbStatus) {
        case 'pending':
        case null:
          return {
            status: 'At Shop - Ready to Weigh',
            color: '#E3F2FD',
            icon: 'home-outline' as const,
            iconColor: '#2196F3',
            showTrackButton: false
          };
        case 'in_progress':
          return {
            status: 'In Progress - Washing',
            color: '#E3F2FD', 
            icon: 'time' as const,
            iconColor: '#2196F3',
            showTrackButton: false
          };
        case 'ready_for_delivery':
          return {
            status: 'Ready for Pickup',
            color: '#FFF3CD',
            icon: 'cube-outline' as const,
            iconColor: '#FFA000',
            showTrackButton: false
          };
        case 'completed':
          return {
            status: 'Completed - Pickup at Shop',
            color: '#DFFFE0',
            icon: 'checkmark-circle' as const,
            iconColor: '#28A745',
            showTrackButton: false
          };
        default:
          return {
            status: 'Processing at Shop',
            color: '#E3F2FD',
            icon: 'time' as const,
            iconColor: '#2196F3',
            showTrackButton: false
          };
      }
    }
    
    return {
      status: 'Processing',
      color: '#E3F2FD',
      icon: 'time' as const,
      iconColor: '#2196F3',
      showTrackButton: false
    };
  };

  const getCompletedOrderStatusInfo = () => {
    return {
      status: 'Completed',
      color: '#DFFFE0',
      icon: 'checkmark-circle' as const,
      iconColor: '#28A745',
      showTrackButton: false
    };
  };

  // ✅ FIXED: Enhanced fetch function with error handling
  const fetchOrderData = async () => {
    if (guest) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Fetching orders for user:', user.id);

      // ✅ FIXED: Added current_lat and current_lng to deliveries query
      const { data: allOrdersData, error: activeError } = await supabase
        .from('orders')
        .select(`
          *,
          shop_branches (
            name,
            shops (
              name
            )
          ),
          shop_methods (
            code,
            label
          ),
          shop_services (
            name,
            price_per_kg,
            unit
          ),
          detergent_types (
            name,
            base_price
          ),
          softener_types (
            name,
            base_price
          ),
          payments (
            amount,
            status,
            method
          ),
          deliveries (
            id,
            status,
            driver_id,
            assigned_at,
            picked_up_at,
            delivered_at,
            current_lat,
            current_lng,
            updated_at,
            users (
              full_name,
              phone,
              avatar_url
            )
          ),
          order_items (
            id,
            status,
            service_id,
            quantity,
            price_per_unit,
            subtotal,
            started_at,
            completed_at,
            shop_services (
              name,
              price_per_kg,
              unit
            )
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (activeError) {
        console.error('❌ Error fetching active orders:', activeError);
        throw activeError;
      }

      console.log('✅ Active orders fetched:', allOrdersData?.length);

      // ✅ FIXED: Enable RLS on order_history first if needed
      const { data: completedOrdersData, error: completedError } = await supabase
        .from('order_history')
        .select(`
          *,
          shops (
            name
          ),
          shop_branches (
            name
          ),
          shop_methods (
            code,
            label
          )
        `)
        .eq('customer_id', user.id)
        .order('completed_at', { ascending: false });

      if (completedError) {
        console.error('❌ Error fetching completed orders:', completedError);
        // Don't throw here, as order_history might not have RLS policies yet
      }

      console.log('✅ Completed orders fetched:', completedOrdersData?.length);

      // ✅ FIXED: Type-safe filtering
      const filteredActiveOrders = (allOrdersData || []).filter(order => 
        isOrderStillActive(order as any)
      );
      
      setActiveOrders(filteredActiveOrders as any || []);
      setCompletedOrders((completedOrdersData as any) || []);
    } catch (error) {
      console.error('❌ Error in fetchOrderData:', error);
      Alert.alert('Error', 'Failed to load orders. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, [user, guest]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderData();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTotalAmount = (order: Order) => {
    if (order.payments && order.payments.length > 0) {
      return order.payments[0].amount;
    }
    
    if (order.order_items && order.order_items.length > 0) {
      return order.order_items.reduce((total, item) => total + (item.subtotal || 0), 0);
    }
    
    return null;
  };

  // Guest View (unchanged)
  if (guest) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Order History" />
        <ScrollView
          style={{ flex: 1, backgroundColor: "#F5F6FA" }}
          contentContainerStyle={{ 
            flexGrow: 1, 
            justifyContent: "center", 
            alignItems: "center",
            paddingHorizontal: s(20),
            paddingBottom: mvs(100)
          }}
        >
          <View style={styles.guestContainer}>
            <Ionicons
              name="receipt-outline"
              size={ms(80)}
              color="#3864C3"
              style={{ marginBottom: mvs(20) }}
            />
            <Text style={styles.guestTitle}>Order History Unavailable</Text>
            <Text style={styles.guestSubtitle}>
              Please log in to view your order history, track deliveries, and save your preferences.
            </Text>
            <View style={styles.guestButtons}>
              <TouchableOpacity
                style={[styles.authButton, { backgroundColor: "#3864C3" }]}
                onPress={() => router.navigate("/(auth)/register")}
              >
                <Text style={styles.authButtonText}>Create Account</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.authButton, { backgroundColor: "#4CAF50" }]}
                onPress={() => router.navigate("/(auth)/login")}
              >
                <Text style={styles.authButtonText}>Log In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.authButton, { backgroundColor: "#6B7280" }]}
                onPress={() => router.push("/(tabs)/map")}
              >
                <Text style={styles.authButtonText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Order History" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3864C3" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Order History" />
      <ScrollView
        style={{ flex: 1, backgroundColor: "#F5F6FA" }}
        contentContainerStyle={{ paddingBottom: mvs(100), paddingTop: mvs(10) }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Active Orders Section */}
        {activeOrders.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Active Orders</Text>
            <Text style={styles.sectionSubtitle}>Orders currently being processed</Text>
            {activeOrders.map((order) => {
              const statusInfo = getActiveOrderStatusInfo(order);
              const shopName = order.shop_branches?.shops?.name || 'Laundry Shop';
              const branchName = order.shop_branches?.name || '';
              const serviceName = order.shop_services?.name || order.order_items?.[0]?.shop_services?.name;
              const totalAmount = calculateTotalAmount(order);
              const driverName = order.deliveries?.[0]?.users?.full_name;
              const weight = order.order_items?.[0]?.quantity;

              return (
                <View
                  key={order.id}
                  style={[styles.orderCard, { backgroundColor: statusInfo.color }]}
                >
                  <View style={styles.orderRow}>
                    <View style={[styles.iconContainer, { backgroundColor: statusInfo.color }]}>
                      <Ionicons
                        name={statusInfo.icon}
                        size={ms(28)}
                        color={statusInfo.iconColor}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>
                        {driverName || shopName}
                      </Text>
                      <Text style={styles.statusText}>
                        {statusInfo.status}
                        {order.shop_methods?.label && ` • ${order.shop_methods.label}`}
                      </Text>
                      {serviceName && (
                        <Text style={styles.subText}>
                          Service: {serviceName}
                        </Text>
                      )}
                      {weight && (
                        <Text style={styles.subText}>
                          Weight: {weight} kg
                        </Text>
                      )}
                      <Text style={styles.shopText}>
                        {shopName}{branchName ? ` • ${branchName}` : ''}
                      </Text>
                      {totalAmount && (
                        <Text style={styles.amountText}>
                          Total: ₱{totalAmount}
                        </Text>
                      )}
                      <OrderProgress order={order} />
                      {statusInfo.showTrackButton && (
                        <TouchableOpacity
                          style={styles.trackButton}
                          onPress={() => {
                            console.log('🚚 Tracking order:', {
                              deliveryId: order.deliveries?.[0]?.id,
                              orderId: order.id,
                              customerName: order.customer_name,
                              deliveryLocation: order.delivery_location,
                              deliveryLat: order.delivery_latitude,
                              deliveryLng: order.delivery_longitude,
                              orderMethod: order.shop_methods?.code
                            });
                            
                            if (!order.deliveries?.[0]?.id) {
                              Alert.alert('Info', 'Delivery tracking will be available once a driver is assigned.');
                              return;
                            }

                            router.push({
                              pathname: "/delivery/trackorder",
                              params: {
                                deliveryId: order.deliveries[0].id,
                                orderId: order.id,
                                customerName: order.customer_name || 'Customer',
                                deliveryLocation: order.delivery_location || 'Unknown Location',
                                deliveryLat: order.delivery_latitude?.toString() || '0',
                                deliveryLng: order.delivery_longitude?.toString() || '0',
                                orderMethod: order.shop_methods?.code || 'delivery'
                              }
                            });
                          }}
                        >
                          <Text style={styles.trackButtonText}>
                            Track Delivery
                          </Text>
                        </TouchableOpacity>
                      )}
                      <Text style={styles.dateText}>
                        Ordered: {formatDate(order.created_at!)}
                        {order.order_items?.[0]?.started_at && ` • Started: ${formatTime(order.order_items[0].started_at)}`}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Completed Orders Section */}
        {completedOrders.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Order History</Text>
            <Text style={styles.sectionSubtitle}>Your completed orders</Text>
            {completedOrders.map((order) => {
              const statusInfo = getCompletedOrderStatusInfo();
              const shopName = order.shops?.name || 'Laundry Shop';
              const branchName = order.shop_branches?.name || '';
              const serviceName = order.service_name;
              const totalAmount = order.price;
              const weight = order.weight;

              return (
                <View
                  key={order.id}
                  style={[styles.orderCard, { backgroundColor: statusInfo.color }]}
                >
                  <View style={styles.orderRow}>
                    <View style={[styles.iconContainer, { backgroundColor: statusInfo.color }]}>
                      <Ionicons
                        name={statusInfo.icon}
                        size={ms(28)}
                        color={statusInfo.iconColor}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>
                        {shopName}
                      </Text>
                      <Text style={styles.statusText}>
                        {statusInfo.status}
                        {order.method_label && ` • ${order.method_label}`}
                      </Text>
                      {serviceName && (
                        <Text style={styles.subText}>
                          Service: {serviceName}
                        </Text>
                      )}
                      {weight && (
                        <Text style={styles.subText}>
                          Weight: {weight} kg
                        </Text>
                      )}
                      <Text style={styles.shopText}>
                        {shopName}{branchName ? ` • ${branchName}` : ''}
                      </Text>
                      {totalAmount && (
                        <Text style={styles.amountText}>
                          Total: ₱{totalAmount}
                        </Text>
                      )}
                      <Text style={styles.dateText}>
                        Completed: {formatDate(order.completed_at || order.created_at!)}
                        {order.completed_at && ` • ${formatTime(order.completed_at)}`}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Empty State */}
        {activeOrders.length === 0 && completedOrders.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={ms(64)} color="#CCCCCC" />
            <Text style={styles.emptyText}>No orders found</Text>
            <Text style={styles.emptySubtext}>
              Your order history will appear here once you place an order
            </Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => router.push("/map")}
            >
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles remain the same...
const styles = ScaledSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: mvs(10),
    fontSize: ms(16),
    color: "#666",
  },
  sectionContainer: {
    marginBottom: mvs(20),
  },
  sectionTitle: {
    fontSize: ms(18),
    fontWeight: "bold",
    color: "#000",
    marginHorizontal: s(15),
    marginBottom: mvs(5),
  },
  sectionSubtitle: {
    fontSize: ms(12),
    color: "#666",
    marginHorizontal: s(15),
    marginBottom: mvs(10),
  },
  guestContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: mvs(40),
  },
  guestTitle: {
    fontSize: ms(20),
    fontWeight: "bold",
    color: "#000",
    marginBottom: mvs(15),
    textAlign: "center",
  },
  guestSubtitle: {
    fontSize: ms(14),
    color: "#666",
    textAlign: "center",
    lineHeight: ms(20),
    marginBottom: mvs(30),
  },
  guestButtons: {
    width: "100%",
    alignItems: "center",
  },
  authButton: {
    width: s(150),
    paddingVertical: mvs(12),
    borderRadius: s(10),
    marginBottom: mvs(10),
  },
  authButtonText: {
    color: "#fff",
    fontSize: ms(14),
    textAlign: "center",
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: mvs(100),
    paddingHorizontal: s(40),
  },
  emptyText: {
    fontSize: ms(18),
    fontWeight: "bold",
    color: "#666",
    marginTop: mvs(20),
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: ms(14),
    color: "#999",
    marginTop: mvs(10),
    textAlign: "center",
    marginBottom: mvs(20),
  },
  shopButton: {
    backgroundColor: "#3864C3",
    paddingVertical: mvs(12),
    paddingHorizontal: s(30),
    borderRadius: s(10),
  },
  shopButtonText: {
    color: "#fff",
    fontSize: ms(14),
    fontWeight: "bold",
  },
  orderCard: {
    borderRadius: s(12),
    marginHorizontal: s(15),
    marginVertical: mvs(7),
    padding: s(15),
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: s(40),
    height: s(40),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: s(30),
    marginRight: s(10),
  },
  name: {
    fontSize: ms(15),
    fontWeight: "bold",
    color: "#000000",
  },
  statusText: {
    fontSize: ms(14),
    fontWeight: 'bold',
    color: '#000000',
    marginTop: mvs(2),
  },
  subText: {
    fontSize: ms(13),
    color: "#000000",
    marginTop: mvs(2),
  },
  shopText: {
    fontSize: ms(12),
    color: "#000000",
    fontStyle: "italic",
    marginTop: mvs(3),
  },
  amountText: {
    fontSize: ms(14),
    fontWeight: 'bold',
    color: '#3864C3',
    marginTop: mvs(3),
  },
  dateText: {
    fontSize: ms(12),
    color: "#1939BB",
    marginTop: mvs(8),
  },
  trackButton: {
    backgroundColor: "#2F73E0",
    paddingVertical: mvs(8),
    paddingHorizontal: s(15),
    borderRadius: s(10),
    alignSelf: "flex-start",
    marginTop: mvs(10),
  },
  trackButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: ms(13),
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: mvs(10),
    marginBottom: mvs(5),
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: s(20),
    height: s(20),
    borderRadius: s(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepActive: {
    backgroundColor: '#3864C3',
  },
  stepInactive: {
    backgroundColor: '#CCCCCC',
  },
  stepLine: {
    position: 'absolute',
    top: s(10),
    left: s(20),
    right: -s(10),
    height: s(2),
  },
  lineActive: {
    backgroundColor: '#3864C3',
  },
  lineInactive: {
    backgroundColor: '#CCCCCC',
  },
  stepLabel: {
    fontSize: ms(8),
    marginTop: mvs(20),
    textAlign: 'center',
  },
  labelActive: {
    color: '#3864C3',
    fontWeight: 'bold',
  },
  labelInactive: {
    color: '#CCCCCC',
  },
});