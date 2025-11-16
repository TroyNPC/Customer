import { useAuth } from "../../lib/Auth";
import { supabase } from "../../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Linking,
} from "react-native";
import { ScaledSheet, ms, mvs, s } from "react-native-size-matters";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { AppHeader } from "../../components/AppHeader";

interface Notification {
  id: string;
  title: string;
  body: string;
  payload: {
    order_id?: string;
    order_status?: string;
    order_type?: string;
    delivery_status?: string;
    shop_name?: string;
    branch_name?: string;
    total_amount?: number;
    weight?: number;
    price_per_kg?: number;
    service_name?: string;
    notificationId?: string;
  };
  sent_at: string;
  read_at: string | null;
}

interface OrderItem {
  subtotal: number | null;
  quantity: number | null;
  price_per_unit: number | null;
  shop_services?: {
    name: string;
    price_per_kg: number | null;
  } | null;
}

interface OrderWithPrice {
  id: string;
  order_items?: OrderItem[];
}

interface RawNotification {
  id: string;
  title: string | null;
  body: string | null;
  payload: any;
  sent_at: string | null;
  read_at: string | null;
  user_id: string | null;
}

interface PushToken {
  id?: string;
  user_id: string;
  expo_push_token: string;
  device_id?: string;
  created_at?: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user, guest } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [orderPrices, setOrderPrices] = useState<Record<string, OrderWithPrice>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notificationPermissions, setNotificationPermissions] = useState(false);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // ==================== PUSH NOTIFICATION SETUP ====================

  useEffect(() => {
    // Configure notification handler with proper typing
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: Platform.OS === 'ios',
        shouldShowList: Platform.OS === 'ios',
      }),
    });

    // Set up Android notification channel
    const setupAndroidChannel = async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3864C3',
        });
      }
    };

    setupAndroidChannel();
  }, []);

  // ==================== NOTIFICATION FUNCTIONS ====================

  const transformNotification = (raw: RawNotification): Notification => {
    let parsedPayload = raw.payload;
    if (typeof raw.payload === 'string') {
      try {
        parsedPayload = JSON.parse(raw.payload);
      } catch (error) {
        parsedPayload = {};
      }
    }

    return {
      id: raw.id,
      title: raw.title || 'Notification',
      body: raw.body || '',
      payload: parsedPayload || {},
      sent_at: raw.sent_at || new Date().toISOString(),
      read_at: raw.read_at,
    };
  };

  const fetchNotifications = async () => {
    setError(null);
    
    if (guest) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const { data: notificationsData, error, status } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false });

      if (error) {
        setError(error.message);
        Alert.alert('Error', `Failed to fetch notifications: ${error.message}`);
        return;
      }

      if (!notificationsData) {
        setNotifications([]);
        return;
      }

      const transformedNotifications: Notification[] = notificationsData.map(transformNotification);
      setNotifications(transformedNotifications);

      if (transformedNotifications.length > 0) {
        await fetchOrderPrices(transformedNotifications);
      }

    } catch (error) {
      setError('Failed to load notifications');
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchOrderPrices = async (notificationsData: Notification[]) => {
    try {
      const orderIds = notificationsData
        .map(notif => notif.payload?.order_id)
        .filter((id): id is string => Boolean(id));

      if (orderIds.length === 0) {
        return;
      }

      const { data: ordersData, error } = await supabase
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
        return;
      }

      const pricesMap: Record<string, OrderWithPrice> = {};
      ordersData?.forEach(order => {
        if (order.id) {
          pricesMap[order.id] = order as OrderWithPrice;
        }
      });

      setOrderPrices(pricesMap);

    } catch (error) {
      // Error handled silently
    }
  };

  // ==================== READ STATUS MANAGEMENT ====================

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking as read:', error);
        return;
      }

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;

    try {
      setMarkingAllAsRead(true);
      
      const unreadNotifications = notifications.filter(notif => !notif.read_at);
      if (unreadNotifications.length === 0) return;

      const unreadIds = unreadNotifications.map(notif => notif.id);

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds)
        .eq('user_id', user.id);

      if (error) {
        Alert.alert('Error', 'Failed to mark all as read');
        return;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          read_at: notif.read_at || new Date().toISOString() 
        }))
      );

    } catch (error) {
      Alert.alert('Error', 'Failed to mark all as read');
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  const markAsReadOnOpen = async () => {
    if (!user || notifications.length === 0) return;

    try {
      const unreadNotifications = notifications.filter(notif => !notif.read_at);
      if (unreadNotifications.length === 0) return;

      const unreadIds = unreadNotifications.map(notif => notif.id);

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds)
        .eq('user_id', user.id);

      if (!error) {
        setNotifications(prev => 
          prev.map(notif => ({ 
            ...notif, 
            read_at: notif.read_at || new Date().toISOString() 
          }))
        );
      }
    } catch (error) {
      console.error('Error marking as read on open:', error);
    }
  };

  // ==================== PUSH NOTIFICATION FUNCTIONS ====================

  const registerForPushNotifications = async () => {
    if (!user) return;

    try {
      if (!Device.isDevice) {
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        setNotificationPermissions(false);
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications to receive order updates and delivery status.',
          [
            { 
              text: 'Open Settings', 
              onPress: () => Linking.openSettings() 
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }

      setNotificationPermissions(true);

      const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        Alert.alert('Configuration Error', 'Push notifications not properly configured.');
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      const token = tokenData.data;

      setExpoPushToken(token);
      await savePushTokenToDatabase(token);

    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  const savePushTokenToDatabase = async (token: string) => {
    if (!user) return;

    try {
      const deviceId = Device.modelName || 'unknown';
      const platform = Platform.OS;

      const { data: existingTokens, error: fetchError } = await supabase
        .from('user_push_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('device_id', deviceId);

      if (fetchError) {
        return;
      }

      if (existingTokens && existingTokens.length > 0) {
        const { error: updateError } = await supabase
          .from('user_push_tokens')
          .update({
            expo_push_token: token,
            platform: platform,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('device_id', deviceId);

        if (updateError) {
          return;
        }
      } else {
        const { error: insertError } = await supabase
          .from('user_push_tokens')
          .insert({
            user_id: user.id,
            expo_push_token: token,
            device_id: deviceId,
            platform: platform,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          return;
        }
      }
      
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };

  const setupNotificationListeners = () => {
    if (notificationListener.current) {
      notificationListener.current.remove();
    }
    if (responseListener.current) {
      responseListener.current.remove();
    }

    // Listener for notifications received in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      fetchNotifications(); // Refresh list when new notification arrives
    });

    // Listener for when user taps on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(async response => {
      const data = response.notification.request.content.data as any;
      
      // Mark this specific notification as read when tapped
      if (data?.notificationId) {
        await markAsRead(data.notificationId);
      }
      
      // Navigate based on notification data
      if (data?.order_id && !data.test) {
        router.push(`/(tabs)/orders/${data.order_id}`);
      } else if (data?.screen) {
        router.push(data.screen as any);
      }
    });
  };

  // ==================== UTILITY FUNCTIONS ====================

  const getOrderTotal = (orderId: string): number | null => {
    const order = orderPrices[orderId];
    if (!order) {
      return null;
    }

    if (order.order_items && order.order_items.length > 0) {
      const total = order.order_items.reduce((total, item) => {
        const subtotal = item.subtotal || 0;
        return total + subtotal;
      }, 0);
      return total;
    }

    return null;
  };

  const getPriceInfo = (notification: Notification) => {
    const orderId = notification.payload.order_id;
    if (!orderId) {
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

    if (notification.payload.total_amount) {
      return {
        total: notification.payload.total_amount,
        formattedTotal: `₱${notification.payload.total_amount.toFixed(2)}`,
        hasPrice: true
      };
    }

    if (notification.payload.price_per_kg) {
      return {
        pricePerUnit: notification.payload.price_per_kg,
        formattedPricePerUnit: `₱${notification.payload.price_per_kg}/${notification.payload.service_name?.toLowerCase().includes('dry') ? 'load' : 'kg'}`,
        hasPrice: true
      };
    }

    return null;
  };

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
    
    return { icon: 'notifications-outline' as const, color: '#666' };
  };

  const formatRelativeTime = (dateString: string) => {
    try {
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
    } catch (error) {
      return 'Unknown time';
    }
  };

  const getUnreadCount = () => {
    return notifications.filter(notif => !notif.read_at).length;
  };

  // ==================== USE EFFECTS ====================

  useEffect(() => {
    if (user && !guest) {
      registerForPushNotifications();
      setupNotificationListeners();

      return () => {
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        if (responseListener.current) {
          responseListener.current.remove();
        }
      };
    }
  }, [user, guest]);

  useEffect(() => {
    fetchNotifications();
  }, [user, guest]);

  // Auto-mark as read when screen is focused (optional - uncomment if desired)
  // useFocusEffect(
  //   useCallback(() => {
  //     if (user && !guest && notifications.length > 0) {
  //       markAsReadOnOpen();
  //     }
  //   }, [user, guest, notifications.length])
  // );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleRetry = () => {
    setLoading(true);
    fetchNotifications();
  };

  const handleGuestNavigation = (route: string) => {
    try {
      router.push(route);
    } catch (error) {
      router.push('/');
    }
  };

  // ==================== RENDER FUNCTIONS ====================

  if (guest) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Notifications" />

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
              onPress={() => handleGuestNavigation("/(auth)/register")}
            >
              <Text style={styles.authButtonText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.authButton, { backgroundColor: "#4CAF50" }]}
              onPress={() => handleGuestNavigation("/(auth)/login")}
            >
              <Text style={styles.authButtonText}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Notifications" />

        <View style={styles.errorContainer}>
          <Ionicons
            name="warning-outline"
            size={ms(64)}
            color="#FF6B6B"
          />
          <Text style={styles.errorText}>Failed to load notifications</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Notifications" />
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3864C3" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const unreadCount = getUnreadCount();

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader 
        title={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
      />

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
 headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllButton: {
    paddingHorizontal: s(12),
    paddingVertical: s(6),
    borderRadius: s(6),
    backgroundColor: 'rgba(56, 100, 195, 0.1)',
  },
  markAllText: {
    color: "#3864C3",
    fontSize: ms(12),
    fontWeight: "600",
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
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s(40),
  },
  errorText: {
    fontSize: ms(18),
    fontWeight: "bold",
    color: "#FF6B6B",
    marginTop: mvs(20),
    textAlign: "center",
  },
  errorSubtext: {
    fontSize: ms(14),
    color: "#666",
    marginTop: mvs(10),
    textAlign: "center",
    marginBottom: mvs(30),
  },
  retryButton: {
    backgroundColor: "#3864C3",
    paddingHorizontal: s(20),
    paddingVertical: mvs(12),
    borderRadius: s(8),
  },
  retryButtonText: {
    color: "#fff",
    fontSize: ms(14),
    fontWeight: "bold",
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