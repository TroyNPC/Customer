import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl
} from "react-native";
import { useShopDetails } from "../../hooks/useShopDetails";
import { AppHeader } from '../../components/AppHeader';

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const scale = (size: number) => (screenWidth / 375) * size;

export default function ShopDetailsPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const { 
    data: shop, 
    isLoading, 
    isError, 
    error,
    refetch,
    isRefetching 
  } = useShopDetails(id);

  // ✅ FIXED: All methods go to single create page
  const handleOrderPress = (methodType: string) => {
    if (!id) return;
    
    const shopId = Array.isArray(id) ? id[0] : id;
    
    // All 3 buttons go to the SAME create page with method parameter
    router.push(`/order/create?shopId=${shopId}&method=${methodType}`);
  };

  // Get method icon name
  const getMethodIconName = (methodCode: string) => {
    const icons = {
      delivery: 'bicycle' as const,
      pickup: 'cube' as const,
      dropoff: 'walk' as const
    };
    return icons[methodCode as keyof typeof icons] || 'walk';
  };

  // Get button configuration
  const getButtonConfig = (methodCode: string) => {
    const configs = {
      delivery: {
        icon: 'bicycle' as const,
        title: 'Delivery Order',
        subtitle: 'You drop off and we deliver',
        color: '#3864C3'
      },
      pickup: {
        icon: 'cube' as const,
        title: 'Pickup Order',
        subtitle: 'We pick up and deliver',
        color: '#09ADFF'
      },
      dropoff: {
        icon: 'walk' as const,
        title: 'Drop-off Order',
        subtitle: 'You bring to shop',
        color: '#193ABC'
      }
    };
    return configs[methodCode as keyof typeof configs] || configs.dropoff;
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Shop Details" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3864C3" />
          <Text style={styles.loadingText}>Loading shop details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (isError || !shop) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Shop Details" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={scale(60)} color="#FF6B6B" />
          <Text style={styles.errorText}>
            {error?.message || 'Shop not found'}
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Extract data with safe fallbacks
  const shopName = shop.shops?.name || shop.name || "Unknown Shop";
  const primaryPhone = shop.branch_contacts?.find(contact => 
    contact.contact_type === 'phone' && contact.is_primary
  )?.value;

  const activeServices = shop.shop_services?.filter(service => service.is_active) || [];
  const availableMethods = shop.branch_methods?.filter(bm => 
    bm.is_enabled && bm.shop_methods?.code
  ) || [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <AppHeader 
        title={shopName}
        rightElement={
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => refetch()}
          >
            <Ionicons 
              name="refresh" 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        }
      />

      {/* Shop Content */}
      <ScrollView 
        style={{ flex: 1, backgroundColor: "white" }}
        contentContainerStyle={{ paddingVertical: scale(10) }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            colors={['#3864C3']}
            tintColor={'#3864C3'}
          />
        }
      >
        {/* Shop Info Section */}
        <View style={styles.shopInfo}>
          <View style={{ flex: 1 }}>
            <Text style={styles.shopTitle}>Laundry Shop Information</Text>
            <Text style={styles.shopDesc}>
              {shop.shops?.description || "Pick-up and Delivery available. Tailored to the services you choose."}
            </Text>

            {/* Available Methods Badges */}
            <View style={styles.methodsBadgeContainer}>
              <Text style={styles.availableMethodsText}>Available Methods:</Text>
              <View style={styles.methodsBadges}>
                {availableMethods.map(bm => {
                  const methodCode = bm.shop_methods?.code;
                  const methodLabel = bm.shop_methods?.label;
                  
                  if (!methodCode) return null;
                  
                  return (
                    <View key={methodCode} style={styles.methodBadge}>
                      <Ionicons 
                        name={getMethodIconName(methodCode)} 
                        size={scale(12)} 
                        color="#3864C3" 
                      />
                      <Text style={styles.methodBadgeText}>
                        {methodLabel || methodCode.toUpperCase()}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          <Image
            source={{ 
              uri: shop.shops?.logo_url || "https://via.placeholder.com/80x80/3864C3/FFFFFF?text=LS" 
            }}
            style={styles.shopLogo}
            resizeMode="cover"
            defaultSource={require('../../assets/images/placeholder-image.jpg')}
          />
        </View>

        {/* Contact Info */}
        <View style={styles.contactSection}>
          <View style={styles.contactItem}>
            <Ionicons name="location" size={scale(18)} color="#3864C3" />
            <Text style={styles.contactText}>{shop.address || "Address not available"}</Text>
          </View>
          {primaryPhone && (
            <View style={styles.contactItem}>
              <Ionicons name="call" size={scale(18)} color="#3864C3" />
              <Text style={styles.contactText}>{primaryPhone}</Text>
            </View>
          )}
        </View>

        {/* Services Header */}
        <View style={styles.servicesHeader}>
          <Text style={styles.servicesTitle}>Available Laundry Services</Text>
        </View>

        {/* Services - Horizontal Scroll Cards */}
        {activeServices.length > 0 ? (
          <View style={styles.section}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.servicesScrollView}
              contentContainerStyle={styles.servicesScrollContent}
              snapToInterval={screenWidth * 0.75 + scale(16)}
              decelerationRate="fast"
            >
              {activeServices.map((service, index) => (
                <View key={service.id} style={styles.serviceCard}>
                  {/* Service Image */}
                  <View style={styles.imageContainer}>
                    <Image 
                      source={{ 
                        uri: service.image_url || `https://via.placeholder.com/70x70/09ADFF/FFFFFF?text=${service.name?.charAt(0)}` 
                      }} 
                      style={styles.serviceImage}
                      resizeMode="cover"
                    />
                  </View>
                  
                  {/* Service Content */}
                  <View style={styles.serviceContent}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    {service.description && (
                      <Text style={styles.serviceDescription} numberOfLines={2}>
                        {service.description}
                      </Text>
                    )}
                    <View style={styles.detailTag}>
                      <Text style={styles.detailText}>
                        ₱{service.price_per_kg || 0}/{service.unit || 'kg'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
            
            {/* Scroll Indicator */}
            <View style={styles.scrollIndicator}>
              <Text style={styles.scrollIndicatorText}>
                Swipe to see more services
              </Text>
              <Ionicons name="chevron-forward" size={scale(16)} color="#3864C3" />
            </View>
          </View>
        ) : (
          <View style={styles.noServicesContainer}>
            <Ionicons name="shirt-outline" size={scale(40)} color="#CCC" />
            <Text style={styles.noServicesText}>No services available</Text>
          </View>
        )}

        {/* ORDER BUTTONS */}
        <View style={styles.orderButtonsContainer}>
          <Text style={styles.orderSectionTitle}>Start Your Order</Text>
          <Text style={styles.orderSectionSubtitle}>
            Choose how you'd like to get your laundry done
          </Text>
          
          {availableMethods.length > 0 ? (
            availableMethods.map((method) => {
              const methodCode = method.shop_methods?.code;
              if (!methodCode) return null;
              
              const config = getButtonConfig(methodCode);
              return (
                <TouchableOpacity 
                  key={methodCode}
                  style={[styles.orderButton, { backgroundColor: config.color }]}
                  onPress={() => handleOrderPress(methodCode)}
                >
                  <View style={styles.orderButtonContent}>
                    <View style={styles.orderButtonIcon}>
                      <Ionicons name={config.icon} size={scale(24)} color="white" />
                    </View>
                    <View style={styles.orderButtonTextContainer}>
                      <Text style={styles.orderButtonTitle}>{config.title}</Text>
                      <Text style={styles.orderButtonSubtitle}>{config.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={scale(20)} color="white" />
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.noMethodsContainer}>
              <Ionicons name="alert-circle" size={scale(40)} color="#FF6B6B" />
              <Text style={styles.noMethodsText}>
                No ordering methods available at the moment
              </Text>
            </View>
          )}
        </View>

        {/* Operating Hours */}
        {shop.branch_operating_hours && shop.branch_operating_hours.length > 0 && (
          <View style={styles.hoursSection}>
            <Text style={styles.sectionTitle}>Operating Hours</Text>
            {shop.branch_operating_hours
              ?.sort((a, b) => a.day_of_week - b.day_of_week)
              .map(hours => (
                <View key={hours.day_of_week} style={styles.hoursItem}>
                  <Text style={styles.dayText}>
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][hours.day_of_week]}
                  </Text>
                  <Text style={styles.hoursText}>
                    {hours.is_closed ? 'Closed' : `${hours.open_time || 'N/A'} - ${hours.close_time || 'N/A'}`}
                  </Text>
                </View>
              ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  // Shop Info Section
  shopInfo: {
    backgroundColor: "#D4F6F9",
    padding: scale(15),
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: scale(15),
    marginTop: scale(10),
    borderRadius: scale(12),
  },
  shopTitle: {
    fontSize: scale(16),
    fontWeight: "bold",
    color: "#000",
    marginBottom: scale(6),
  },
  shopDesc: {
    fontSize: scale(13),
    color: "#333",
    marginBottom: scale(8),
    lineHeight: scale(18),
  },
  // Available Methods Badges
  methodsBadgeContainer: {
    marginBottom: scale(8),
  },
  availableMethodsText: {
    fontSize: scale(11),
    color: "#666",
    fontWeight: "500",
    marginBottom: scale(4),
  },
  methodsBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  methodBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(56, 100, 195, 0.1)",
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(12),
    marginRight: scale(6),
    marginBottom: scale(4),
  },
  methodBadgeText: {
    fontSize: scale(10),
    color: "#3864C3",
    fontWeight: "500",
    marginLeft: scale(4),
  },
  shopLogo: {
    width: scale(80),
    height: scale(80),
    marginLeft: scale(10),
    borderRadius: scale(12),
  },
  contactSection: {
    backgroundColor: "white",
    padding: scale(15),
    marginHorizontal: scale(15),
    marginTop: scale(10),
    borderRadius: scale(12),
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(8),
  },
  contactText: {
    fontSize: scale(14),
    marginLeft: scale(8),
    color: "#555",
  },
  servicesHeader: {
    backgroundColor: "#3864C3",
    paddingVertical: scale(12),
    alignItems: "center",
    marginTop: scale(15),
  },
  servicesTitle: {
    color: "#FFFFFF",
    fontSize: scale(18),
    fontWeight: "bold",
  },
  section: {
    marginBottom: scale(24),
  },
  sectionTitle: {
    fontSize: scale(18),
    fontWeight: "bold",
    color: "#092B75",
    marginBottom: scale(12),
    paddingHorizontal: scale(16),
  },
  // Services Scroll Styles
  servicesScrollView: {
    marginHorizontal: scale(-8),
  },
  servicesScrollContent: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(12),
  },
  serviceCard: {
    width: screenWidth * 0.75,
    backgroundColor: "white",
    borderRadius: scale(15),
    marginHorizontal: scale(8),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: "center",
    padding: scale(12),
  },
  imageContainer: {
    width: scale(70),
    height: scale(70),
    marginBottom: scale(10),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#F8F9FA',
    borderRadius: scale(8),
  },
  serviceImage: {
    width: "100%",
    height: "100%",
    borderRadius: scale(8),
  },
  serviceContent: {
    alignItems: "center",
    width: "100%",
  },
  serviceName: {
    fontSize: scale(16),
    fontWeight: "bold",
    color: "#092B75",
    marginBottom: scale(5),
    textAlign: "center",
  },
  serviceDescription: {
    fontSize: scale(12),
    color: "#666",
    textAlign: "center",
    marginBottom: scale(8),
    lineHeight: scale(16),
  },
  detailTag: {
    backgroundColor: "#09ADFF",
    borderRadius: scale(5),
    paddingVertical: scale(4),
    paddingHorizontal: scale(8),
  },
  detailText: {
    color: "white",
    fontSize: scale(10),
    fontWeight: "bold",
    textAlign: "center",
  },
  scrollIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: scale(8),
    padding: scale(8),
  },
  scrollIndicatorText: {
    fontSize: scale(12),
    color: "#3864C3",
    marginRight: scale(4),
  },
  noServicesContainer: {
    alignItems: "center",
    padding: scale(40),
    backgroundColor: "#f8f9fa",
    marginHorizontal: scale(15),
    borderRadius: scale(12),
    marginTop: scale(10),
  },
  noServicesText: {
    fontSize: scale(14),
    color: "#666",
    marginTop: scale(8),
  },
  // Order Buttons Styles
  orderButtonsContainer: {
    marginTop: scale(10),
    paddingHorizontal: scale(16),
    marginBottom: scale(20),
  },
  orderSectionTitle: {
    fontSize: scale(20),
    fontWeight: "bold",
    color: "#092B75",
    textAlign: "center",
    marginBottom: scale(4),
  },
  orderSectionSubtitle: {
    fontSize: scale(14),
    color: "#666",
    textAlign: "center",
    marginBottom: scale(20),
  },
  orderButton: {
    borderRadius: scale(12),
    padding: scale(16),
    marginBottom: scale(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  orderButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderButtonIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  orderButtonTextContainer: {
    flex: 1,
    marginLeft: scale(12),
  },
  orderButtonTitle: {
    color: "white",
    fontSize: scale(16),
    fontWeight: "bold",
    marginBottom: scale(2),
  },
  orderButtonSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: scale(12),
  },
  noMethodsContainer: {
    alignItems: "center",
    padding: scale(20),
    backgroundColor: "#f8f9fa",
    borderRadius: scale(12),
  },
  noMethodsText: {
    fontSize: scale(14),
    color: "#666",
    textAlign: "center",
    marginTop: scale(8),
  },
  hoursSection: {
    backgroundColor: "white",
    padding: scale(15),
    marginHorizontal: scale(15),
    marginTop: scale(10),
    borderRadius: scale(12),
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: scale(20),
  },
  hoursItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scale(6),
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dayText: {
    fontSize: scale(14),
    color: "#333",
  },
  hoursText: {
    fontSize: scale(14),
    color: "#666",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: scale(12),
    fontSize: scale(16),
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20),
    paddingBottom: 100,
  },
  errorText: {
    fontSize: scale(18),
    color: "#FF6B6B",
    marginTop: scale(12),
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "#3864C3",
    paddingHorizontal: scale(24),
    paddingVertical: scale(12),
    borderRadius: scale(8),
    marginTop: scale(20),
  },
  backButtonText: {
    color: "white",
    fontSize: scale(16),
    fontWeight: "600",
  },
  retryButton: {
    backgroundColor: "#09ADFF",
    paddingHorizontal: scale(24),
    paddingVertical: scale(12),
    borderRadius: scale(8),
    marginTop: scale(10),
  },
  retryButtonText: {
    color: "white",
    fontSize: scale(16),
    fontWeight: "600",
  },
});