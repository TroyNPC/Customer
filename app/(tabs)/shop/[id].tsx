import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { fetchShopDetails, ShopDetails } from "../../../lib/laundryShops";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const scale = (size: number) => (screenWidth / 375) * size;
const vbW = 1440;
const vbH = 320;

export default function ShopDetailsPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [shop, setShop] = useState<ShopDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShopData = async () => {
      if (id) {
        const shopData = await fetchShopDetails(id as string);
        setShop(shopData);
        setLoading(false);
      }
    };

    loadShopData();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3864C3" />
          <Text style={styles.loadingText}>Loading shop details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!shop) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={scale(60)} color="#FF6B6B" />
          <Text style={styles.errorText}>Shop not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const shopName = shop.shops?.name || shop.name || "Unknown Shop";
  const primaryPhone = shop.branch_contacts?.find(contact => 
    contact.contact_type === 'phone' && contact.is_primary
  )?.value;

  const activeServices = shop.shop_services?.filter(service => service.is_active) || [];
  
  // Get available methods with null checks
  const availableMethods = shop.branch_methods?.filter(bm => bm.is_enabled && bm.shop_methods?.code) || [];

  // Function to handle order button press
  const handleOrderPress = (methodType: string) => {
     router.push(`../order/${id}?method=${methodType}`);
  };

  // Function to get button configuration based on method
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

  // Function to get method icon name with proper typing
  const getMethodIconName = (methodCode: string) => {
    const icons = {
      delivery: 'bicycle' as const,
      pickup: 'cube' as const,
      dropoff: 'walk' as const
    };
    return icons[methodCode as keyof typeof icons] || 'walk';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBox}>
        <Svg
          width={screenWidth}
          height={screenHeight * 0.4}
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
          <TouchableOpacity onPress={() => router.push("/map")}>
            <Ionicons name="arrow-back" size={scale(22)} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{shopName}</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      {/* Shop Content */}
      <ScrollView 
        style={{ flex: 1, backgroundColor: "white" }}
        contentContainerStyle={{ paddingVertical: scale(10) }}
        showsVerticalScrollIndicator={false}
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

            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: scale(8) }}>
            </View>
          </View>

          <Image
            source={{ uri: shop.shops?.logo_url || "https://i.ibb.co/3shhNns/laundry-logo.png" }}
            style={styles.shopLogo}
            resizeMode="contain"
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
        {activeServices.length > 0 && (
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
                        uri: service.image_url || `https://picsum.photos/200/200?random=${index}` 
                      }} 
                      style={styles.serviceImage}
                      defaultSource={require('../../../assets/images/placeholder-image.jpg')}
                      resizeMode="contain"
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
                Swipe left/right to see more services
              </Text>
              <Ionicons name="chevron-forward" size={scale(16)} color="#3864C3" />
            </View>

            {/* ORDER BUTTONS - Dynamic based on available methods */}
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
          </View>
        )}

        {/* Operating Hours */}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  headerBox: {
    width: "100%",
    height: screenHeight * 0.15,
    backgroundColor: "#0AADFF",
    paddingTop: screenHeight * 0.05,
    justifyContent: "center",
    overflow: "hidden",
  },
  waveTop: { position: "absolute", top: 0, left: 0, zIndex: 1 },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(20),
    zIndex: 2,
  },
  headerTitle: {
    fontSize: scale(16),
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  // Shop Info Section
  shopInfo: {
    backgroundColor: "#D4F6F9",
    padding: scale(15),
    flexDirection: "row",
    alignItems: "flex-start",
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
  shopButton: {
    backgroundColor: "#193ABC",
    borderRadius: scale(20),
    paddingVertical: scale(8),
    paddingHorizontal: scale(15),
    marginRight: scale(8),
    marginBottom: scale(5),
  },
  buttonText: {
    color: "white",
    fontSize: scale(12),
    fontWeight: "bold",
  },
  shopLogo: {
    width: scale(80),
    height: scale(80),
    marginLeft: scale(10),
    borderRadius: scale(40),
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
    marginTop: scale(10),
  },
  servicesTitle: {
    color: "#FFFFFF",
    fontSize: scale(20),
    fontWeight: "bold",
  },
  section: {
    marginBottom: scale(24),
    paddingHorizontal: scale(8),
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
    paddingVertical: scale(4),
  },
  serviceCard: {
    width: screenWidth * 0.75,
    backgroundColor: "white",
    borderRadius: scale(15),
    marginHorizontal: scale(8),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  },
  serviceImage: {
    width: "100%",
    height: "100%",
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
    color: "#092B75",
    textAlign: "center",
    marginBottom: scale(8),
    lineHeight: scale(16),
  },
  detailTag: {
    backgroundColor: "#09ADFF",
    borderRadius: scale(5),
    paddingVertical: scale(4),
    paddingHorizontal: scale(8),
    marginBottom: scale(8),
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
    marginTop: scale(12),
    padding: scale(8),
  },
  scrollIndicatorText: {
    fontSize: scale(12),
    color: "#3864C3",
    marginRight: scale(4),
  },
  // Order Buttons Styles
  orderButtonsContainer: {
    marginTop: scale(20),
    paddingHorizontal: scale(16),
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
});