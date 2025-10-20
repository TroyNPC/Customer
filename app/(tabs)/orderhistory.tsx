import { useAuth } from "@/hooks/useAuth";
import { supabaseClient } from "@/lib/supabaseClient";
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
  View
} from "react-native";
import { ScaledSheet, ms, mvs, s } from "react-native-size-matters";
import Svg, { Path } from "react-native-svg";

const vbW = 1440;
const vbH = 320;

// Define types based on your database schema
interface OrderItem {
  id: string;
  order_id: string;
  service_id: string;
  quantity: number;
  price_per_unit: number;
  subtotal: number;
  status: 'in_progress' | 'ready' | 'delivering' | 'completed';
  started_at: string;
  completed_at: string | null;
  shop_services?: {
    name: string;
  };
}

interface Order {
  id: string;
  customer_id: string;
  branch_id: string;
  method_id: string;
  created_at: string;
  customer_name: string | null;
  customer_contact: string | null;
  delivery_location: string | null;
  service_id: string | null;
  detergent_id: string | null;
  softener_id: string | null;
  shop_branches?: {
    name: string;
    shops?: {
      name: string;
    };
  };
  shop_methods?: {
    code: string;
    label: string;
  };
  shop_services?: {
    name: string;
    price_per_kg: number;
  };
  detergent_types?: {
    name: string;
  };
  softener_types?: {
    name: string;
  };
  payments?: {
    amount: number;
    status: string;
    method: string;
  }[];
  deliveries?: {
    status: string;
    driver_id: string;
    assigned_at: string | null;
    picked_up_at: string | null;
    delivered_at: string | null;
    users?: {
      full_name: string;
    };
  }[];
  order_items?: OrderItem[];
}

interface OrderHistory {
  id: string;
  shop_id: string;
  branch_id: string;
  customer_name: string;
  customer_contact: string;
  delivery_location: string | null;
  method_id: string;
  method_code: string;
  method_label: string;
  service_name: string;
  detergent_name: string | null;
  softener_name: string | null;
  weight: number;
  price: number;
  status: string;
  completed_at: string;
  created_at: string;
  shop_branches?: {
    name: string;
    shops?: {
      name: string;
    };
  };
}

export default function OrderHistory() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<OrderHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrderData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching order data for user:', user.id);
      
      // Fetch active orders from orders table
      const { data: activeOrdersData, error: activeError } = await supabaseClient
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
            price_per_kg
          ),
          detergent_types (
            name
          ),
          softener_types (
            name
          ),
          payments (
            amount,
            status,
            method
          ),
          deliveries (
            status,
            driver_id,
            assigned_at,
            picked_up_at,
            delivered_at,
            users (
              full_name
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
              name
            )
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (activeError) {
        console.error('Error fetching active orders:', activeError);
      }

      // Fetch completed orders from order_history table
      const { data: completedOrdersData, error: completedError } = await supabaseClient
        .from('order_history')
        .select(`
          *,
          shop_branches (
            name,
            shops (
              name
            )
          )
        `)
        .eq('customer_name', user.user_metadata?.full_name || user.email) // Adjust based on how you store customer info
        .order('completed_at', { ascending: false });

      if (completedError) {
        console.error('Error fetching completed orders:', completedError);
      }

      console.log('Active orders:', activeOrdersData?.length);
      console.log('Completed orders:', completedOrdersData?.length);
      
      setActiveOrders(activeOrdersData || []);
      setCompletedOrders(completedOrdersData || []);
    } catch (error) {
      console.error('Error in fetchOrderData:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderData();
  };

  // Helper function to determine order status and styling for active orders
  const getActiveOrderStatusInfo = (order: Order) => {
    // Check delivery status
    if (order.deliveries && order.deliveries.length > 0) {
      const delivery = order.deliveries[0];
      switch (delivery.status) {
        case 'assigned':
          return {
            status: 'Driver Assigned',
            color: '#FDF59F',
            icon: 'bicycle' as const,
            iconColor: '#FFD93D',
            showTrackButton: true
          };
        case 'picked_up':
          return {
            status: 'On the Way',
            color: '#FDF59F',
            icon: 'bicycle' as const,
            iconColor: '#FFD93D',
            showTrackButton: true
          };
        case 'delivered':
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

    // Check order items status
    if (order.order_items && order.order_items.length > 0) {
      const itemsStatus = order.order_items.map(item => item.status);
      
      if (itemsStatus.includes('delivering')) {
        return {
          status: 'Out for Delivery',
          color: '#FDF59F',
          icon: 'bicycle' as const,
          iconColor: '#FFD93D',
          showTrackButton: true
        };
      } else if (itemsStatus.includes('ready')) {
        return {
          status: 'Ready for Pickup/Delivery',
          color: '#FFF3CD',
          icon: 'cube' as const,
          iconColor: '#FFA000',
          showTrackButton: false
        };
      } else if (itemsStatus.every(status => status === 'completed')) {
        return {
          status: 'Completed',
          color: '#DFFFE0',
          icon: 'checkmark-circle' as const,
          iconColor: '#28A745',
          showTrackButton: false
        };
      }
    }

    // Default status
    return {
      status: 'Processing',
      color: '#E3F2FD',
      icon: 'time' as const,
      iconColor: '#2196F3',
      showTrackButton: false
    };
  };

  // Helper function for completed orders from order_history
  const getCompletedOrderStatusInfo = (order: OrderHistory) => {
    return {
      status: 'Completed',
      color: '#DFFFE0',
      icon: 'checkmark-circle' as const,
      iconColor: '#28A745',
      showTrackButton: false
    };
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
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
              d={`M0,${vbH * 0.2} C ${vbW * 0.5},${vbH * -0.1} ${vbW * 0.45},${vbH *
                0.6} ${vbW},${vbH * 0.2} L${vbW},0 L0,0 Z`}
            />
          </Svg>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={ms(24)} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Order History</Text>
            <View style={{ width: s(24) }} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3864C3" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const allOrders = [
    ...activeOrders.map(order => ({ ...order, type: 'active' as const })),
    ...completedOrders.map(order => ({ ...order, type: 'completed' as const }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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
            d={`M0,${vbH * 0.2} C ${vbW * 0.5},${vbH * -0.1} ${vbW * 0.45},${vbH *
              0.6} ${vbW},${vbH * 0.2} L${vbW},0 L0,0 Z`}
          />
        </Svg>

        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={ms(24)} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order History</Text>
          <View style={{ width: s(24) }} />
        </View>
      </View>

      {/* Scroll Section */}
      <ScrollView
        style={{ flex: 1, backgroundColor: "#F5F6FA" }}
        contentContainerStyle={{ paddingBottom: mvs(100), paddingTop: mvs(10) }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {allOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={ms(64)} color="#CCCCCC" />
            <Text style={styles.emptyText}>No orders found</Text>
            <Text style={styles.emptySubtext}>
              Your order history will appear here
            </Text>
          </View>
        ) : (
          allOrders.map((order) => {
            const statusInfo = order.type === 'active' 
              ? getActiveOrderStatusInfo(order)
              : getCompletedOrderStatusInfo(order);

            const shopName = order.shop_branches?.shops?.name || 'Laundry Shop';
            const branchName = order.shop_branches?.name || '';
            const serviceName = order.type === 'active' 
              ? order.shop_services?.name 
              : (order as OrderHistory).service_name;
            const totalAmount = order.type === 'active'
              ? order.payments?.[0]?.amount
              : (order as OrderHistory).price;

            const driverName = order.type === 'active' 
              ? order.deliveries?.[0]?.users?.full_name
              : null;

            return (
              <View
                key={order.id}
                style={[styles.orderCard, { backgroundColor: statusInfo.color }]}
              >
                {/* Icon and Info */}
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
                    <Text style={styles.subText}>
                      {statusInfo.status}
                      {order.type === 'active' && (order as Order).shop_methods?.label && 
                        ` - ${(order as Order).shop_methods.label}`}
                      {order.type === 'completed' && (order as OrderHistory).method_label && 
                        ` - ${(order as OrderHistory).method_label}`}
                    </Text>
                    
                    {serviceName && (
                      <Text style={styles.subText}>
                        Service: {serviceName}
                      </Text>
                    )}
                    
                    <Text style={styles.shopText}>
                      {shopName}{branchName ? ` - ${branchName}` : ''}
                    </Text>

                    {totalAmount && (
                      <Text style={styles.subText}>
                        Total: ₱{totalAmount}
                      </Text>
                    )}

                    {statusInfo.showTrackButton && (
                      <TouchableOpacity
                        style={styles.trackButton}
                        onPress={() => router.push("/trackdeliveryboy")}
                      >
                        <Text style={styles.trackButtonText}>
                          Track Delivery
                        </Text>
                      </TouchableOpacity>
                    )}

                    <Text style={styles.dateText}>
                      {formatDate(order.created_at)}
                      {order.type === 'completed' && (
                        ` • ${formatTime((order as OrderHistory).completed_at)}`
                      )}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
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
  waveTop: { position: "absolute", top: 0, left: 0, zIndex: 1 },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: s(20),
    zIndex: 2,
  },
  headerTitle: {
    fontSize: ms(18),
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
    marginTop: mvs(10),
    fontSize: ms(16),
    color: "#666",
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
});