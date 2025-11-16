import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  Dimensions,
  Platform
} from "react-native";
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/Auth';
import { Database } from '../../types/database.types';
import { AppHeader } from '../../components/AppHeader';
import * as Contacts from 'expo-contacts';

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const scale = (size: number) => (screenWidth / 375) * size;

type OrderMethod = 'delivery' | 'pickup' | 'dropoff';

// Use your Supabase types
type ShopService = Database['public']['Tables']['shop_services']['Row'];
type DetergentType = Database['public']['Tables']['detergent_types']['Row'];
type SoftenerType = Database['public']['Tables']['softener_types']['Row'];
type ShopMethod = Database['public']['Tables']['shop_methods']['Row'];

// Custom Picker Component with improved functionality
interface CustomPickerProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  items: { label: string; value: string }[];
  placeholder: string;
  disabled?: boolean;
}

const CustomPicker: React.FC<CustomPickerProps> = ({ 
  label, 
  value, 
  onValueChange, 
  items, 
  placeholder,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const selectedItem = items.find(item => item.value === value);

  // Filter items based on search query
  const filteredItems = searchQuery 
    ? items.filter(item => 
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  const handleSelect = (itemValue: string) => {
    onValueChange(itemValue);
    setIsOpen(false);
    setSearchQuery(""); // Clear search when selection is made
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery(""); // Clear search when closed
  };

  return (
    <View style={styles.pickerContainer}>
      <Text style={[styles.label, disabled && styles.disabledLabel]}>{label}</Text>
      
      <TouchableOpacity 
        style={[
          styles.pickerButton,
          disabled && styles.pickerButtonDisabled,
          isOpen && styles.pickerButtonOpen
        ]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <Text style={[
          selectedItem ? styles.pickerButtonText : styles.pickerButtonPlaceholder,
          disabled && styles.pickerButtonTextDisabled
        ]}>
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={disabled ? "#999" : "#666"} 
        />
      </TouchableOpacity>

      {/* Modal for Picker Dropdown */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContent}>
            {/* Header */}
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{label}</Text>
              <TouchableOpacity 
                style={styles.pickerCloseButton}
                onPress={handleClose}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            {items.length > 5 && (
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#999" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus={false}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            {/* Picker Options */}
            <ScrollView 
              style={styles.pickerScrollView}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.pickerOption,
                      value === item.value && styles.pickerOptionSelected
                    ]}
                    onPress={() => handleSelect(item.value)}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      value === item.value && styles.pickerOptionTextSelected
                    ]}>
                      {item.label}
                    </Text>
                    {value === item.value && (
                      <Ionicons name="checkmark" size={20} color="#3864C3" />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="search-outline" size={40} color="#ccc" />
                  <Text style={styles.noResultsText}>No results found</Text>
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.pickerActions}>
              <TouchableOpacity 
                style={styles.pickerCancelButton}
                onPress={handleClose}
              >
                <Text style={styles.pickerCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              {filteredItems.length > 0 && (
                <TouchableOpacity 
                  style={styles.pickerSelectButton}
                  onPress={() => {
                    if (filteredItems.length > 0) {
                      handleSelect(filteredItems[0].value);
                    }
                  }}
                >
                  <Text style={styles.pickerSelectButtonText}>Select First</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default function CreateOrderPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  
  // Initialize form data with current params to preserve state
  const [formData, setFormData] = useState(() => {
    // Try to get existing form data from params first
    const currentName = Array.isArray(params.currentName) ? params.currentName[0] : params.currentName;
    const currentContact = Array.isArray(params.currentContact) ? params.currentContact[0] : params.currentContact;
    const currentService = Array.isArray(params.currentService) ? params.currentService[0] : params.currentService;
    const currentDetergent = Array.isArray(params.currentDetergent) ? params.currentDetergent[0] : params.currentDetergent;
    const currentSoftener = Array.isArray(params.currentSoftener) ? params.currentSoftener[0] : params.currentSoftener;
    const deliveryLocation = Array.isArray(params.delivery_location) ? params.delivery_location[0] : params.delivery_location;

    return {
      name: currentName || "",
      contact: currentContact || "",
      location: deliveryLocation || "",
      service: currentService || "",
      detergent: currentDetergent || "",
      softener: currentSoftener || "",
    };
  });

  const [loading, setLoading] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [autoFillStatus, setAutoFillStatus] = useState({
    hasName: false,
    hasPhone: false,
    isAutoFilled: false
  });
  const [phoneDetectionStatus, setPhoneDetectionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isNavigating, setIsNavigating] = useState(false);
  // Get shop ID and method safely
  const shopIdStr = Array.isArray(params.shopId) ? params.shopId[0] : params.shopId;
  const method = Array.isArray(params.method) ? params.method[0] : params.method;

  // Safe method validation
  const validMethod = (() => {
    const methodValue = Array.isArray(method) ? method[0] : method;
    return ['delivery', 'pickup', 'dropoff'].includes(methodValue as string) 
      ? methodValue as OrderMethod 
      : null;
  })();

  // Handle incoming location data from location-map page
  useEffect(() => {
    // Check if we have location data from the map page
    const deliveryLocation = Array.isArray(params.delivery_location) ? params.delivery_location[0] : params.delivery_location;
    const deliveryLatitude = Array.isArray(params.delivery_latitude) ? params.delivery_latitude[0] : params.delivery_latitude;
    const deliveryLongitude = Array.isArray(params.delivery_longitude) ? params.delivery_longitude[0] : params.delivery_longitude;

    // Also check for preserved form data
    const currentName = Array.isArray(params.currentName) ? params.currentName[0] : params.currentName;
    const currentContact = Array.isArray(params.currentContact) ? params.currentContact[0] : params.currentContact;
    const currentService = Array.isArray(params.currentService) ? params.currentService[0] : params.currentService;
    const currentDetergent = Array.isArray(params.currentDetergent) ? params.currentDetergent[0] : params.currentDetergent;
    const currentSoftener = Array.isArray(params.currentSoftener) ? params.currentSoftener[0] : params.currentSoftener;

    if (deliveryLocation || currentName || currentContact) {
      // Update the form with ALL the data from location-map
      setFormData(prev => ({
        ...prev,
        ...(deliveryLocation && { location: deliveryLocation }),
        ...(currentName && { name: currentName }),
        ...(currentContact && { contact: currentContact }),
        ...(currentService && { service: currentService }),
        ...(currentDetergent && { detergent: currentDetergent }),
        ...(currentSoftener && { softener: currentSoftener }),
      }));

      // Only show alert if we actually got a new location
      if (deliveryLocation && deliveryLocation !== formData.location) {
        Alert.alert(
          "Location Selected", 
          "Your location has been successfully set!",
          [{ text: "OK" }]
        );
      }

      // Clean up params after using them (optional)
      setTimeout(() => {
        // Note: This might not work perfectly with Expo Router, but worth trying
        const cleanParams = { ...params };
        delete cleanParams.delivery_location;
        delete cleanParams.delivery_latitude;
        delete cleanParams.delivery_longitude;
        delete cleanParams.currentName;
        delete cleanParams.currentContact;
        delete cleanParams.currentService;
        delete cleanParams.currentDetergent;
        delete cleanParams.currentSoftener;
        
        router.setParams(cleanParams as any);
      }, 1000);
    }
  }, [
    params.delivery_location, 
    params.delivery_latitude, 
    params.delivery_longitude,
    params.currentName,
    params.currentContact,
    params.currentService,
    params.currentDetergent,
    params.currentSoftener
  ]);

  // Fetch user data to auto-fill name and contact
  const { data: userData } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select('full_name, phone, email')
        .eq('id', user.id)
        .single();
      
      if (error) {
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  // Auto-fill form when user data is loaded - PRESERVE EXISTING DATA
  useEffect(() => {
    if (userData && user && !autoFillStatus.isAutoFilled) {
      // Only auto-fill if fields are empty and we have data
      const shouldUpdateName = !formData.name && userData.full_name;
      const shouldUpdateContact = !formData.contact && userData.phone;

      if (shouldUpdateName || shouldUpdateContact) {
        const updatedFormData = {
          name: shouldUpdateName ? userData.full_name || '' : formData.name,
          contact: shouldUpdateContact ? userData.phone || '' : formData.contact,
          location: formData.location,
          service: formData.service,
          detergent: formData.detergent,
          softener: formData.softener,
        };
        
        setFormData(updatedFormData);
        
        // Set auto-fill status
        const hasName = !!userData.full_name;
        const hasPhone = !!userData.phone;
        setAutoFillStatus({
          hasName,
          hasPhone,
          isAutoFilled: hasName || hasPhone
        });
      }
    }
  }, [userData, user]);

  // Fetch shop data
  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ['shop-order', shopIdStr],
    queryFn: async () => {
      if (!shopIdStr) throw new Error('Shop ID is required');
      
      const { data, error } = await supabase
        .from('shop_branches')
        .select(`
          *,
          shops (*),
          shop_services (*),
          branch_detergents (
            detergent_types (*)
          ),
          branch_softeners (
            softener_types (*)
          )
        `)
        .eq('id', shopIdStr)
        .single();
      
      if (error) throw new Error('Shop not found');
      return data;
    },
    enabled: !!shopIdStr && !!validMethod,
  });

  // Extract data
  const services: ShopService[] = shop?.shop_services?.filter(s => s.is_active) || [];
  const detergents: DetergentType[] = shop?.branch_detergents
    ?.map(bd => bd.detergent_types)
    .filter((detergent): detergent is DetergentType => detergent !== null) || [];
  
  const softeners: SoftenerType[] = shop?.branch_softeners
    ?.map(bs => bs.softener_types)
    .filter((softener): softener is SoftenerType => softener !== null) || [];

  // Get method data
  const { data: methodData } = useQuery({
    queryKey: ['method', validMethod],
    queryFn: async () => {
      if (!validMethod) throw new Error('Method is required');

      const { data, error } = await supabase
        .from('shop_methods')
        .select('*')
        .eq('code', validMethod)
        .single();
      
      if (error) throw new Error('Method not found');
      return data;
    },
    enabled: !!validMethod,
  });

  // Prepare picker data
  const serviceItems = services.map(service => ({
    label: `${service.name} - ₱${service.price_per_kg || 0}/${service.unit || 'kg'}`,
    value: service.id
  }));

  const detergentItems = detergents.map(detergent => ({
    label: detergent.name,
    value: detergent.name
  }));

  const softenerItems = softeners.map(softener => ({
    label: softener.name,
    value: softener.name
  }));

  // Phone number detection function - FIXED VERSION
  const detectPhoneNumber = async () => {
    if (phoneDetectionStatus === 'loading') return;
    
    try {
      setPhoneDetectionStatus('loading');
      
      // Request contacts permission
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Contacts Permission Required',
          'Please allow access to contacts to auto-fill your phone number.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Contacts.getPermissionsAsync() }
          ]
        );
        setPhoneDetectionStatus('error');
        return;
      }

      // Get contacts
      const { data: contacts } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });

      if (!contacts || contacts.length === 0) {
        Alert.alert('No Contacts Found', 'No phone numbers found in your contacts.');
        setPhoneDetectionStatus('error');
        return;
      }

      // Look for the user's own contact or any contact with phone numbers
      let detectedPhoneNumber: string | null = null;

      for (const contact of contacts) {
        if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
          // Get the first phone number - FIX: Check if phoneNumber exists
          const phoneNumber = contact.phoneNumbers[0]?.number;
          
          // Skip if phoneNumber is undefined
          if (!phoneNumber) continue;
          
          // Clean up the phone number (remove spaces, dashes, etc.)
          const cleanedNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
          
          // Check if it's a valid Philippine mobile number format
          if (isValidPhilippineNumber(cleanedNumber)) {
            detectedPhoneNumber = formatPhoneNumber(cleanedNumber);
            break;
          }
        }
      }

      if (detectedPhoneNumber) {
        setFormData(prev => ({ ...prev, contact: detectedPhoneNumber }));
        setPhoneDetectionStatus('success');
        Alert.alert(
          'Phone Number Detected',
          `Your phone number has been auto-filled: ${detectedPhoneNumber}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'No Valid Number Found',
          'No valid Philippine mobile number found in your contacts.',
          [{ text: 'OK' }]
        );
        setPhoneDetectionStatus('error');
      }

    } catch (error) {
      console.error('Error detecting phone number:', error);
      Alert.alert('Error', 'Failed to detect phone number. Please enter it manually.');
      setPhoneDetectionStatus('error');
    }
  };

  // Validate Philippine mobile number
  const isValidPhilippineNumber = (phoneNumber: string): boolean => {
    // Philippine mobile numbers: +63 followed by 10 digits, or 09 followed by 9 digits
    const phMobileRegex = /^(?:\+63|63|0)?(9\d{9})$/;
    return phMobileRegex.test(phoneNumber);
  };

  // Format phone number for display
  const formatPhoneNumber = (phoneNumber: string): string => {
    // Convert to +639 format for consistency
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    if (cleaned.startsWith('09') && cleaned.length === 11) {
      return '+63' + cleaned.slice(1);
    } else if (cleaned.startsWith('9') && cleaned.length === 10) {
      return '+63' + cleaned;
    } else if (cleaned.startsWith('63') && cleaned.length === 12) {
      return '+' + cleaned;
    } else if (cleaned.startsWith('+63') && cleaned.length === 13) {
      return cleaned;
    }
    
    return phoneNumber; // Return as is if format is unexpected
  };

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: typeof formData) => {
      if (!shopIdStr) throw new Error('Shop ID is required');
      if (!methodData) throw new Error('Invalid order method');

      // Find selected items
      const selectedDetergent = detergents.find(d => d.name === orderData.detergent);
      const selectedSoftener = softeners.find(s => s.name === orderData.softener);
      const selectedService = services.find(s => s.id === orderData.service);

      if (!selectedDetergent || !selectedSoftener || !selectedService) {
        throw new Error('Invalid selection data');
      }

      // Get latitude and longitude from params - MAKE THEM NULLABLE
      const deliveryLatitude = params.delivery_latitude 
        ? parseFloat(Array.isArray(params.delivery_latitude) ? params.delivery_latitude[0] : params.delivery_latitude) 
        : null;
      
      const deliveryLongitude = params.delivery_longitude 
        ? parseFloat(Array.isArray(params.delivery_longitude) ? params.delivery_longitude[0] : params.delivery_longitude) 
        : null;

      // Handle pickup orders differently - create order_items immediately
      if (validMethod === 'pickup') {
        // First create the order
        const { data: order, error } = await supabase
          .from('orders')
          .insert({
            customer_id: user?.id || null,
            branch_id: shopIdStr,
            method_id: methodData.id,
            detergent_id: selectedDetergent.id,
            softener_id: selectedSoftener.id,
            customer_name: orderData.name,
            customer_contact: orderData.contact,
            delivery_location: orderData.location,
            delivery_latitude: deliveryLatitude,
            delivery_longitude: deliveryLongitude,
            service_id: orderData.service,
            meta: {
              is_guest_order: !user?.id,
              order_created_at: new Date().toISOString(),
              order_type: validMethod,
              detergent_name: selectedDetergent.name,
              softener_name: selectedSoftener.name,
              service_name: selectedService.name,
              service_price: selectedService.price_per_kg,
              location_selected_at: new Date().toISOString(),
              has_order_item: true
            }
          })
          .select()
          .single();

        if (error) throw error;

        // Then create order_item for pickup with 'waiting_for_pickup' status
        const { data: orderItem, error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            service_id: orderData.service,
            status: 'waiting_for_pickup',
          })
          .select()
          .single();

        if (itemError) throw itemError;

        return order;

      } else {
        // For delivery/dropoff: create order only (no order_item until weighed)
        const { data: order, error } = await supabase
          .from('orders')
          .insert({
            customer_id: user?.id || null,
            branch_id: shopIdStr,
            method_id: methodData.id,
            detergent_id: selectedDetergent.id,
            softener_id: selectedSoftener.id,
            customer_name: orderData.name,
            customer_contact: orderData.contact,
            delivery_location: orderData.location,
            delivery_latitude: deliveryLatitude,
            delivery_longitude: deliveryLongitude,
            service_id: orderData.service,
            meta: {
              is_guest_order: !user?.id,
              order_created_at: new Date().toISOString(),
              order_type: validMethod,
              detergent_name: selectedDetergent.name,
              softener_name: selectedSoftener.name,
              service_name: selectedService.name,
              service_price: selectedService.price_per_kg,
              location_selected_at: new Date().toISOString(),
              has_order_item: false
            }
          })
          .select()
          .single();

        if (error) throw error;
        return order;
      }
    },
    onSuccess: (order) => {
      setCreatedOrderId(order.id);
      
      // Navigate to confirmation after a brief delay to show processing
      setTimeout(() => {
        setShowProcessingModal(false);
        router.push(`/order/confirmation?id=${order.id}`);
      }, 2000);
    },
    onError: (error) => {
      setShowProcessingModal(false);
      Alert.alert('Order Failed', error.message);
      setLoading(false);
    }
  });

  const handleGuestChoice = (choice: 'login' | 'guest') => {
    setShowGuestModal(false);
    if (choice === 'guest') {
      setIsGuest(true);
      handleProceedToNextStep();
    } else {
      router.push('/login');
    }
  };

  // Location selection for delivery and pickup
  const handleLocationSelect = () => {
    if (!formData.name || !formData.contact) {
      Alert.alert("Missing Info", "Please enter your name and contact information first.");
      return;
    }

    if (!validMethod) return;

    // Pass ALL current form data to location-map
    router.push({
      pathname: "/order/location-map",
      params: { 
        shopId: shopIdStr,
        method: validMethod,
        currentName: formData.name,
        currentContact: formData.contact,
        currentService: formData.service,
        currentDetergent: formData.detergent,
        currentSoftener: formData.softener,
        // Also pass current location if it exists
        ...(formData.location && { currentLocation: formData.location })
      }
    });
  };

  // QR scan for delivery AND dropoff - WITH NULLABLE LOCATION COORDINATES
  // QR scan for delivery AND dropoff - FIXED VERSION
const handleQRScan = () => {
  if (!formData.name || !formData.contact || !formData.service || !formData.detergent || !formData.softener) {
    Alert.alert("Missing Info", "Please fill out all required fields first.");
    return;
  }

  // For delivery, validate that we have coordinates
  if (validMethod === 'delivery') {
    if (!formData.location) {
      Alert.alert("Missing Location", "Please select your delivery location first.");
      return;
    }

    // Check if coordinates exist
    const deliveryLatitude = params.delivery_latitude 
      ? (Array.isArray(params.delivery_latitude) ? params.delivery_latitude[0] : params.delivery_latitude)
      : null;
    
    const deliveryLongitude = params.delivery_longitude 
      ? (Array.isArray(params.delivery_longitude) ? params.delivery_longitude[0] : params.delivery_longitude)
      : null;

    if (!deliveryLatitude || !deliveryLongitude) {
      Alert.alert(
        "Location Error", 
        "Delivery coordinates are missing. Please reselect your location on the map.",
        [
          { 
            text: "Reselect Location", 
            onPress: handleLocationSelect 
          }
        ]
      );
      return;
    }
  }
    setShowProcessingModal(false);

  // Get location coordinates from params
  const deliveryLatitude = params.delivery_latitude 
    ? (Array.isArray(params.delivery_latitude) ? params.delivery_latitude[0] : params.delivery_latitude)
    : null;
  
  const deliveryLongitude = params.delivery_longitude 
    ? (Array.isArray(params.delivery_longitude) ? params.delivery_longitude[0] : params.delivery_longitude)
    : null;

  router.push({
    pathname: "/order/scan-qr",
    params: { 
      shopId: shopIdStr,
      method: validMethod,
      formData: JSON.stringify(formData),
      // CRITICAL FIX: Always include coordinates for delivery orders
      ...(deliveryLatitude && { delivery_latitude: deliveryLatitude }),
      ...(deliveryLongitude && { delivery_longitude: deliveryLongitude }),
      // Always pass location string if it exists
      ...(formData.location && { delivery_location: formData.location })
    }
  });
};
  // Correct flow for all order types
  const handleProceedToNextStep = () => {
    // Close confirmation modal
    setShowConfirmationModal(false);
    
    // Show processing modal
    setShowProcessingModal(true);
    
    // Validate basic fields first
    if (!formData.name || !formData.contact || !formData.service || !formData.detergent || !formData.softener) {
      Alert.alert("Missing Info", "Please fill out all required fields.");
      setShowProcessingModal(false);
      return;
    }

    if (!validMethod) return;

    // CORRECTED FLOW:
    if (validMethod === 'pickup') {
      // PICKUP: Check location, then create order directly
      if (!formData.location) {
        handleLocationSelect();
      } else {
        handleCreateOrder();
      }
    } else {
      // DELIVERY & DROP OFF: Go to QR scanning
      // For delivery, check if location is selected
      if (validMethod === 'delivery' && !formData.location) {
        handleLocationSelect();
      } else {
        handleQRScan();
      }
    }
  };

  const handleCreateOrder = () => {
    setLoading(true);
    createOrderMutation.mutate(formData);
  };

  const handleSubmit = () => {
    // Basic validation
    if (!formData.name || !formData.contact || !formData.service || !formData.detergent || !formData.softener) {
      Alert.alert("Missing Info", "Please fill out all required fields.");
      return;
    }

    // Guest check
    if (!user && !isGuest) {
      setShowGuestModal(true);
      return;
    }

    if (!validMethod) return;

    // Location validation for delivery AND pickup
    if ((validMethod === 'delivery' || validMethod === 'pickup') && !formData.location) {
      Alert.alert("Missing Info", `Please select your ${validMethod} location.`);
      return;
    }

    // Show confirmation modal instead of proceeding directly
    setShowConfirmationModal(true);
  };

  // Helper functions to get display values
  const getSelectedServiceName = () => {
    return services.find(s => s.id === formData.service)?.name || 'Not selected';
  };

  const getSelectedServicePrice = () => {
    return services.find(s => s.id === formData.service)?.price_per_kg || 0;
  };

  // Method-specific UI conditions
  const showLocationField = validMethod === 'delivery' || validMethod === 'pickup';
  const requiresQRScan = validMethod === 'delivery' || validMethod === 'dropoff';
  const methodTitle = validMethod ? `${validMethod.charAt(0).toUpperCase() + validMethod.slice(1)} Order` : 'Create Order';
  
  const methodDescription = {
    delivery: "You'll need to scan the shop's QR code to verify your location and we'll deliver it back to your selected location when ready.",
    pickup: "We'll pick up your laundry from your selected location and deliver it back when ready.",
    dropoff: "You'll need to scan the shop's QR code to verify your location and submit the order."
  }[validMethod || 'delivery'];

  const getLocationLabel = () => {
    if (validMethod === 'delivery') return 'Delivery Location *';
    if (validMethod === 'pickup') return 'Pickup Location *';
    return 'Location *';
  };

  const getLocationPlaceholder = () => {
    if (validMethod === 'delivery') return 'Select delivery location on Map';
    if (validMethod === 'pickup') return 'Select pickup location on Map';
    return 'Select location on Map';
  };

  // Correct button text for all order types
  const getSubmitButtonText = () => {
    if (!validMethod) return "Create Order";
    
    if (validMethod === 'pickup') {
      if (!formData.location) {
        return `Select Pickup Location`;
      } else {
        return `Create Pickup Order`;
      }
    } else {
      // Delivery & Dropoff
      if (validMethod === 'delivery' && !formData.location) {
        return `Select Delivery Location`;
      } else {
        return `Scan QR Code to Order`;
      }
    }
  };

  if (!validMethod) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Create Order" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={scale(60)} color="#FF6B6B" />
          <Text style={styles.errorText}>Invalid order method</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (shopLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title={methodTitle} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3864C3" />
          <Text style={styles.loadingText}>Loading shop information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <AppHeader 
        title={methodTitle}
        rightElement={
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => {
              Alert.alert(
                "Order Help", 
                methodDescription,
                [{ text: "OK" }]
              );
            }}
          >
            <Ionicons name="help-circle-outline" size={24} color="white" />
          </TouchableOpacity>
        }
      />

      {/* Scrollable Form */}
      <ScrollView
        style={{ flex: 1, backgroundColor: "white" }}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          {/* User Status Indicator */}
          {user && autoFillStatus.isAutoFilled && (
            <View style={styles.userStatus}>
              <Ionicons name="person" size={16} color="#3864C3" />
              <View style={styles.userStatusDetails}>
                <Text style={styles.userStatusText}>
                  Logged in as {user.email}
                </Text>
                <Text style={styles.autoFillDetails}>
                  {autoFillStatus.hasName && autoFillStatus.hasPhone 
                    ? "Name and phone auto-filled" 
                    : autoFillStatus.hasName 
                    ? "Name auto-filled" 
                    : "Phone auto-filled"
                  }
                </Text>
              </View>
            </View>
          )}

          {/* Method Description */}
          <View style={styles.methodDescription}>
            <Ionicons 
              name={validMethod === 'delivery' ? 'bicycle' : validMethod === 'pickup' ? 'cube' : 'walk'} 
              size={scale(24)} 
              color="#3864C3" 
            />
            <Text style={styles.methodDescriptionText}>{methodDescription}</Text>
          </View>

          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
          />

          <Text style={styles.label}>Contact Information *</Text>
          <View style={styles.contactInputContainer}>
            <TextInput
              style={styles.contactInput}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              value={formData.contact}
              onChangeText={(text) => setFormData(prev => ({ ...prev, contact: text }))}
            />
            <TouchableOpacity 
              style={[
                styles.detectPhoneButton,
                phoneDetectionStatus === 'loading' && styles.detectPhoneButtonLoading
              ]}
              onPress={detectPhoneNumber}
              disabled={phoneDetectionStatus === 'loading'}
            >
              {phoneDetectionStatus === 'loading' ? (
                <ActivityIndicator size="small" color="#3864C3" />
              ) : (
                <Ionicons name="phone-portrait-outline" size={20} color="#3864C3" />
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.contactHelperRow}>
            {user && !autoFillStatus.hasPhone && (
              <Text style={styles.fieldHint}>
                Please enter your phone number for order updates
              </Text>
            )}
            <TouchableOpacity onPress={detectPhoneNumber}>
              <Text style={styles.detectPhoneText}>
                Auto-detect my number
              </Text>
            </TouchableOpacity>
          </View>

          {/* Location field for delivery AND pickup */}
          {showLocationField && (
            <>
              <Text style={styles.label}>{getLocationLabel()}</Text>
              <TouchableOpacity 
                style={styles.locationInput}
                onPress={handleLocationSelect}
              >
                <Text style={formData.location ? styles.locationText : styles.locationPlaceholder}>
                  {formData.location || getLocationPlaceholder()}
                </Text>
                <Ionicons name="map" size={20} color="#3864C3" />
              </TouchableOpacity>
              {formData.location && (
                <Text style={styles.selectedLocationText}>
                  Selected: {formData.location}
                </Text>
              )}
            </>
          )}

          {/* QR Info for delivery AND dropoff */}
          {requiresQRScan && (
            <View style={styles.qrInfo}>
              <Ionicons name="qr-code" size={scale(20)} color="#3864C3" />
              <Text style={styles.qrInfoText}>
                {validMethod === 'delivery' 
                  ? "You'll need to scan the shop's QR code to verify your delivery order"
                  : "You'll need to scan the shop's QR code to complete your dropoff order"
                }
              </Text>
            </View>
          )}

          {/* Custom Pickers */}
          <CustomPicker
            label="Select Service *"
            value={formData.service}
            onValueChange={(value) => setFormData(prev => ({ ...prev, service: value }))}
            items={serviceItems}
            placeholder="Choose a service"
          />

          <CustomPicker
            label="Select Detergent *"
            value={formData.detergent}
            onValueChange={(value) => setFormData(prev => ({ ...prev, detergent: value }))}
            items={detergentItems}
            placeholder="Choose detergent type"
          />

          <CustomPicker
            label="Select Softener *"
            value={formData.softener}
            onValueChange={(value) => setFormData(prev => ({ ...prev, softener: value }))}
            items={softenerItems}
            placeholder="Choose softener type"
          />

          <TouchableOpacity
            style={[styles.submitButton, (loading || createOrderMutation.isPending) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading || createOrderMutation.isPending}
          >
            {(loading || createOrderMutation.isPending) ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>
                {getSubmitButtonText()}
              </Text>
            )}
          </TouchableOpacity>

          {!user && (
            <Text style={styles.guestInfo}>
              {isGuest ? "Continuing as guest" : "You can continue as guest or login for order tracking"}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal 
        visible={showConfirmationModal} 
        transparent 
        animationType="slide"
        onRequestClose={() => setShowConfirmationModal(false)}
      >
        <View style={styles.confirmationModalOverlay}>
          <View style={styles.confirmationModalContent}>
            <Text style={styles.confirmationModalTitle}>Confirm Your Order</Text>
            <Text style={styles.confirmationModalSubtitle}>
              Please review your order details before proceeding:
            </Text>

            <ScrollView style={styles.confirmationDetails} showsVerticalScrollIndicator={false}>
              {/* Order Details */}
              <View style={styles.confirmationSection}>
                <Text style={styles.confirmationSectionTitle}>Personal Information</Text>
                <View style={styles.confirmationRow}>
                  <Text style={styles.confirmationLabel}>Name:</Text>
                  <Text style={styles.confirmationValue}>{formData.name}</Text>
                </View>
                <View style={styles.confirmationRow}>
                  <Text style={styles.confirmationLabel}>Contact:</Text>
                  <Text style={styles.confirmationValue}>{formData.contact}</Text>
                </View>
              </View>

              {/* Service Details */}
              <View style={styles.confirmationSection}>
                <Text style={styles.confirmationSectionTitle}>Service Details</Text>
                <View style={styles.confirmationRow}>
                  <Text style={styles.confirmationLabel}>Service:</Text>
                  <Text style={styles.confirmationValue}>
                    {getSelectedServiceName()}
                  </Text>
                </View>
                <View style={styles.confirmationRow}>
                  <Text style={styles.confirmationLabel}>Detergent:</Text>
                  <Text style={styles.confirmationValue}>{formData.detergent}</Text>
                </View>
                <View style={styles.confirmationRow}>
                  <Text style={styles.confirmationLabel}>Softener:</Text>
                  <Text style={styles.confirmationValue}>{formData.softener}</Text>
                </View>
              </View>

              {/* Location Details */}
              {showLocationField && formData.location && (
                <View style={styles.confirmationSection}>
                  <Text style={styles.confirmationSectionTitle}>
                    {validMethod === 'delivery' ? 'Delivery Location' : 'Pickup Location'}
                  </Text>
                  <View style={styles.confirmationRow}>
                    <Text style={styles.confirmationLabel}>Address:</Text>
                    <Text style={styles.confirmationValue}>{formData.location}</Text>
                  </View>
                </View>
              )}

              {/* Order Method */}
              <View style={styles.confirmationSection}>
                <Text style={styles.confirmationSectionTitle}>Order Method</Text>
                <View style={styles.confirmationRow}>
                  <Text style={styles.confirmationLabel}>Type:</Text>
                  <Text style={styles.confirmationValue}>
                    {validMethod?.charAt(0).toUpperCase() + validMethod?.slice(1)}
                  </Text>
                </View>
                {validMethod === 'pickup' && (
                  <Text style={styles.confirmationNote}>
                    * A driver will be assigned to collect your laundry
                  </Text>
                )}
                {(validMethod === 'delivery' || validMethod === 'dropoff') && (
                  <Text style={styles.confirmationNote}>
                    * You'll need to scan the shop's QR code to complete your order
                  </Text>
                )}
              </View>

              {/* Price Information */}
              <View style={styles.confirmationSection}>
                <Text style={styles.confirmationSectionTitle}>Pricing</Text>
                <View style={styles.confirmationRow}>
                  <Text style={styles.confirmationLabel}>Rate:</Text>
                  <Text style={styles.confirmationValue}>
                    ₱{getSelectedServicePrice()} per kg
                  </Text>
                </View>
                <Text style={styles.confirmationNote}>
                  * Final price will be calculated based on actual weight
                </Text>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.confirmationActions}>
              <TouchableOpacity 
                style={styles.confirmationCancelButton}
                onPress={() => setShowConfirmationModal(false)}
              >
                <Text style={styles.confirmationCancelButtonText}>Edit Order</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmationConfirmButton}
                onPress={handleProceedToNextStep}
              >
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.confirmationConfirmButtonText}>
                  {validMethod === 'pickup' ? 'Place Order' : 'Scan QR Code'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Processing Modal */}
      <Modal 
        visible={showProcessingModal} 
        transparent 
        animationType="fade"
      >
        <View style={styles.processingModalOverlay}>
          <View style={styles.processingModalContent}>
            <ActivityIndicator size="large" color="#3864C3" />
            <Text style={styles.processingModalTitle}>Creating Your Order</Text>
            <Text style={styles.processingModalText}>
              Please wait while we process your order...
            </Text>
            {createdOrderId && (
              <View style={styles.orderIdContainer}>
                <Text style={styles.orderIdLabel}>Order ID:</Text>
                <Text style={styles.orderIdValue}>{createdOrderId.substring(0, 8).toUpperCase()}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Guest Modal */}
      <Modal 
        visible={showGuestModal} 
        transparent 
        animationType="slide"
        onRequestClose={() => setShowGuestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Continue with Account</Text>
            <Text style={styles.modalSubtitle}>
              Login to track your orders and save your preferences, or continue as guest.
            </Text>
            
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => handleGuestChoice('login')}
            >
              <Ionicons name="log-in" size={20} color="white" />
              <Text style={styles.loginButtonText}>Login to Account</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.guestButton}
              onPress={() => handleGuestChoice('guest')}
            >
              <Ionicons name="person-outline" size={20} color="#3864C3" />
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowGuestModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  helpButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  formContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  userStatus: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F4FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  userStatusDetails: {
    flex: 1,
    marginLeft: 8,
  },
  userStatusText: {
    fontSize: 14,
    color: '#3864C3',
    fontWeight: '500',
    marginBottom: 2,
  },
  autoFillDetails: {
    fontSize: 12,
    color: '#3864C3',
    fontStyle: 'italic',
  },
  methodDescription: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  methodDescriptionText: {
    fontSize: 14,
    color: '#3864C3',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  qrInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  qrInfoText: {
    fontSize: 14,
    color: '#856404',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginTop: 15,
    marginBottom: 6,
  },
  disabledLabel: {
    color: "#999",
  },
  input: {
    borderWidth: 1,
    borderColor: "#B3B3B3",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#F7F7F7",
    color: "#000",
  },
  // New styles for phone detection
  contactInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#B3B3B3",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#F7F7F7",
    color: "#000",
  },
  detectPhoneButton: {
    marginLeft: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#3864C3",
    borderRadius: 8,
    backgroundColor: 'white',
  },
  detectPhoneButtonLoading: {
    backgroundColor: '#f0f0f0',
  },
  contactHelperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  fieldHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  detectPhoneText: {
    fontSize: 12,
    color: '#3864C3',
    textDecorationLine: 'underline',
  },
  locationInput: {
    borderWidth: 1,
    borderColor: "#B3B3B3",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#F7F7F7",
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationText: {
    color: "#000",
    fontSize: 16,
    flex: 1,
  },
  locationPlaceholder: {
    color: "#666",
    fontSize: 16,
    flex: 1,
  },
  selectedLocationText: {
    fontSize: 12,
    color: "#3864C3",
    marginTop: 5,
    fontStyle: 'italic',
  },
  // Enhanced Custom Picker Styles
  pickerContainer: {
    marginBottom: 15,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: "#B3B3B3",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F7F7F7",
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonOpen: {
    borderColor: "#3864C3",
    borderWidth: 2,
  },
  pickerButtonDisabled: {
    backgroundColor: "#f5f5f5",
    borderColor: "#e0e0e0",
  },
  pickerButtonText: {
    fontSize: 16,
    color: "#000",
    flex: 1,
  },
  pickerButtonTextDisabled: {
    color: "#999",
  },
  pickerButtonPlaceholder: {
    fontSize: 16,
    color: "#666",
    flex: 1,
  },
  // Modal Styles for Picker
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  pickerCloseButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 16,
    color: '#000',
  },
  pickerScrollView: {
    maxHeight: 300,
  },
  pickerOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerOptionSelected: {
    backgroundColor: '#F0F8FF',
  },
  pickerOptionText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  pickerOptionTextSelected: {
    color: "#3864C3",
    fontWeight: '600',
  },
  noResultsContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  pickerActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  pickerCancelButton: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    borderColor: '#3864C3',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  pickerCancelButtonText: {
    color: '#3864C3',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerSelectButton: {
    flex: 1,
    padding: 14,
    backgroundColor: '#3864C3',
    borderRadius: 8,
    alignItems: 'center',
  },
  pickerSelectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: "#1939BB",
    borderRadius: 12,
    marginTop: 30,
    alignItems: "center",
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: "#cccccc",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  guestInfo: {
    fontSize: 12,
    color: "#3864C3",
    textAlign: "center",
    marginTop: 10,
    fontStyle: 'italic',
  },
  // Confirmation Modal Styles
  confirmationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  confirmationModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#092B75',
  },
  confirmationModalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    lineHeight: 20,
  },
  confirmationDetails: {
    maxHeight: 300,
    marginBottom: 20,
  },
  confirmationSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  confirmationSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3864C3',
    marginBottom: 8,
  },
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  confirmationLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  confirmationValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  confirmationNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  confirmationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmationCancelButton: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    borderColor: '#3864C3',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  confirmationCancelButtonText: {
    color: '#3864C3',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmationConfirmButton: {
    flex: 2,
    padding: 14,
    backgroundColor: '#3864C3',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmationConfirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Processing Modal Styles
  processingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    margin: 20,
    minWidth: 250,
  },
  processingModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3864C3',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  processingModalText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  orderIdContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    alignItems: 'center',
  },
  orderIdLabel: {
    fontSize: 12,
    color: '#3864C3',
    fontWeight: '500',
    marginBottom: 4,
  },
  orderIdValue: {
    fontSize: 14,
    color: '#3864C3',
    fontWeight: 'bold',
  },
  // Guest Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#092B75',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: '#3864C3',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  guestButton: {
    borderWidth: 2,
    borderColor: '#3864C3',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    backgroundColor: 'white',
  },
  guestButtonText: {
    color: '#3864C3',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
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
    paddingBottom: 100,
  },
  errorText: {
    fontSize: 18,
    color: "#FF6B6B",
    marginTop: 12,
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "#3864C3",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});