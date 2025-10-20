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
  View,
} from "react-native";
import { ScaledSheet, ms, mvs, s } from "react-native-size-matters";
import Svg, { Path } from "react-native-svg";

const vbW = 1440;
const vbH = 320;

interface Notification {
  id: string;
  title: string;
  body: string;
  payload: {
    order_id?: string;
    order_status?: string;
    delivery_status?: string;
    shop_name?: string;
    branch_name?: string;
    total_amount?: number;
    weight?: number;
    price_per_kg?: number;
    service_name?: string;
  };
  sent_at: string;
  read_at: string | null;
}

interface OrderItem {
  subtotal: number;
  quantity: number;
  price_per_unit: number;
  shop_services?: {
    name: string;
    price_per_kg: number;
  };
}

interface OrderWithPrice {
  id: string;
  order_items?: OrderItem[];
}

export default function Notifications() {
  const router = useRouter();
  const { user, guest } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [orderPrices, setOrderPrices] = useState<Record<string, OrderWithPrice>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    // Check if user is guest - skip API calls
    if (guest) {
      console.log('Guest mode - skipping notifications fetch');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching notifications for user:', user.id);
      
      const { data: notificationsData, error } = await supabaseClient
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      console.log('Notifications fetched:', notificationsData?.length);
      setNotifications(notificationsData || []);

      // Fetch price information for orders mentioned in notifications
      await fetchOrderPrices(notificationsData || []);

    } catch (error) {
      console.error('Error in fetchNotifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchOrderPrices = async (notificationsData: Notification[]) => {
    try {
      // Extract unique order IDs from notifications
      const orderIds = notificationsData
        .map(notif => notif.payload.order_id)
        .filter(Boolean) as string[];

      if (orderIds.length === 0) return;

      console.log('Fetching price data for orders:', orderIds);

      // Fetch order data with price information (simplified - no payments)
      const { data: ordersData, error } = await supabaseClient
        .from('orders')
        .select(`
          id,
          order_items (
            subtotal,
            quantity,
            price_per_unit,
            shop_services (
              name,
              price_per_kg
            )
          )
        `)
        .in('id', orderIds);

      if (error) {
        console.error('Error fetching order prices:', error);
        return;
      }

      // Create a map of order IDs to price data
      const pricesMap: Record<string, OrderWithPrice> = {};
      ordersData?.forEach(order => {
        pricesMap[order.id] = order;
      });

      setOrderPrices(pricesMap);
      console.log('Price data loaded for orders:', Object.keys(pricesMap));

    } catch (error) {
      console.error('Error in fetchOrderPrices:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabaseClient
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (error) {
      console.error('Error in markAsRead:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user, guest]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // Calculate total price for an order from order items
  const getOrderTotal = (orderId: string): number | null => {
    const order = orderPrices[orderId];
    if (!order) return null;

    // Calculate from order items
    if (order.order_items && order.order_items.length > 0) {
      const total = order.order_items.reduce((total, item) => total + (item.subtotal || 0), 0);
      console.log(`Calculated total for order ${orderId}: ${total}`);
      return total;
    }

    console.log(`No order items found for order ${orderId}`);
    return null;
  };

  // Get price information for display
  const getPriceInfo = (notification: Notification) => {
    const orderId = notification.payload.order_id;
    if (!orderId) {
      console.log('No order ID in notification');
      return null;
    }

    const totalAmount = getOrderTotal(orderId);

    if (totalAmount && totalAmount > 0) {
      return {
        total: totalAmount,
        formattedTotal: `₱${totalAmount.toFixed(2)}`,
        hasPrice: true
      };
    }

    // If no total amount, check if we have price from notification payload
    if (notification.payload.total_amount) {
      return {
        total: notification.payload.total_amount,
        formattedTotal: `₱${notification.payload.total_amount.toFixed(2)}`,
        hasPrice: true
      };
    }

    // Check for service rate information
    if (notification.payload.price_per_kg) {
      return {
        pricePerUnit: notification.payload.price_per_kg,
        formattedPricePerUnit: `₱${notification.payload.price_per_kg}/${notification.payload.service_name?.toLowerCase().includes('dry') ? 'load' : 'kg'}`,
        hasPrice: true
      };
    }

    console.log(`No price information found for order ${orderId}`);
    return null;
  };

  // Get appropriate icon and color based on notification content
  const getNotificationIcon = (notification: Notification) => {
    const { payload, title } = notification;
    const priceInfo = getPriceInfo(notification);
    
    if (priceInfo) {
      return { icon: 'cash-outline' as const, color: '#27AE60' };
    }
    if (title?.toLowerCase().includes('ready') || payload.order_status === 'ready') {
      return { icon: 'cube-outline' as const, color: '#FFA000' };
    }
    if (title?.toLowerCase().includes('deliver') || payload.delivery_status === 'delivering') {
      return { icon: 'bicycle-outline' as const, color: '#3864C3' };
    }
    if (title?.toLowerCase().includes('complete') || payload.order_status === 'completed') {
      return { icon: 'checkmark-circle-outline' as const, color: '#27AE60' };
    }
    if (title?.toLowerCase().includes('received') || payload.order_status === 'received') {
      return { icon: 'shirt-outline' as const, color: '#9C27B0' };
    }
    
    // Default icon
    return { icon: 'notifications-outline' as const, color: '#666' };
  };

  // Format relative time (e.g., "1 hour ago")
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Guest View
  if (guest) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {/* Header with Wave */}
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
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={ms(24)} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={{ width: s(24) }} />
          </View>
        </View>

        {/* Guest Content */}
        <View style={styles.guestContainer}>
          <Ionicons
            name="notifications-off-outline"
            size={ms(80)}
            color="#CCCCCC"
            style={{ marginBottom: mvs(20) }}
          />
          <Text style={styles.guestTitle}>Notifications Unavailable</Text>
          <Text style={styles.guestSubtitle}>
            Please log in to receive order updates and notifications about your laundry.
          </Text>

          <View style={styles.guestButtons}>
            <TouchableOpacity
              style={[styles.authButton, { backgroundColor: "#3864C3" }]}
              onPress={() => router.push("/signup")}
            >
              <Text style={styles.authButtonText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.authButton, { backgroundColor: "#4CAF50" }]}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.authButtonText}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
              d={`M0,${vbH * 0.2} C ${vbW * 0.5},${vbH * -0.1} ${vbW * 0.45},${vbH * 0.6} ${vbW},${vbH * 0.2} L${vbW},0 L0,0 Z`}
            />
          </Svg>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={ms(24)} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={{ width: s(24) }} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3864C3" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with Wave */}
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
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={ms(24)} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: s(24) }} />
        </View>
      </View>

      {/* Notification List */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: mvs(40) }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notifications.length > 0 ? (
          notifications.map((item) => {
            const { icon, color } = getNotificationIcon(item);
            const isUnread = !item.read_at;
            const priceInfo = getPriceInfo(item);

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, isUnread && styles.unreadCard]}
                onPress={() => markAsRead(item.id)}
              >
                <View style={styles.cardHeader}>
                  <Ionicons
                    name={icon}
                    size={ms(26)}
                    color={color}
                    style={styles.icon}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.body}>{item.body}</Text>
                    
                    {/* Price Information */}
                    {priceInfo && (
                      <View style={styles.priceContainer}>
                        {priceInfo.formattedTotal && (
                          <Text style={styles.totalPrice}>
                            Total: {priceInfo.formattedTotal}
                          </Text>
                        )}
                        {priceInfo.formattedPricePerUnit && (
                          <Text style={styles.unitPrice}>
                            Rate: {priceInfo.formattedPricePerUnit}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Shop/Branch Information */}
                    {item.payload.shop_name && (
                      <Text style={styles.location}>
                        {item.payload.shop_name}
                        {item.payload.branch_name ? ` - ${item.payload.branch_name}` : ''}
                      </Text>
                    )}
                  </View>
                  {isUnread && <View style={styles.unreadDot} />}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.time}>
                    {formatRelativeTime(item.sent_at)}
                  </Text>
                  
                  {/* Order ID for reference */}
                  {item.payload.order_id && (
                    <Text style={styles.orderId}>
                      #{item.payload.order_id.substring(0, 8)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="notifications-outline"
              size={ms(64)}
              color="#CCCCCC"
            />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>
              You'll get notifications here when your order status changes
            </Text>
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
  guestContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s(40),
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
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: s(12),
    marginHorizontal: s(16),
    marginTop: mvs(12),
    padding: s(14),
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  unreadCard: {
    backgroundColor: "#F0F7FF",
    borderLeftWidth: 3,
    borderLeftColor: "#3864C3",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  icon: {
    marginRight: s(10),
    marginTop: s(2),
  },
  cardTitle: {
    fontSize: ms(14),
    fontWeight: "600",
    color: "#333",
    flexShrink: 1,
    marginBottom: mvs(4),
  },
  body: {
    fontSize: ms(13),
    color: "#666",
    lineHeight: ms(18),
    marginBottom: mvs(4),
  },
  priceContainer: {
    marginTop: mvs(6),
    marginBottom: mvs(4),
  },
  totalPrice: {
    fontSize: ms(13),
    fontWeight: "700",
    color: "#27AE60",
    marginBottom: mvs(2),
  },
  unitPrice: {
    fontSize: ms(12),
    color: "#666",
    fontStyle: "italic",
  },
  location: {
    fontSize: ms(12),
    color: "#777",
    fontStyle: "italic",
  },
  cardFooter: {
    marginTop: mvs(10),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  time: {
    fontSize: ms(12),
    color: "#999",
  },
  orderId: {
    fontSize: ms(11),
    color: "#999",
    fontFamily: 'monospace',
  },
  unreadDot: {
    width: s(8),
    height: s(8),
    borderRadius: s(4),
    backgroundColor: "#3864C3",
    marginLeft: s(5),
  },
});