// lib/supabase-queries.ts
import { supabase } from "./supabase";
import { Tables } from "../types/database.types";

export interface ShopWithDetails {
  id: string;
  name: string;
  branchName: string;
  address: string;
  pricePerKg: number;
  serviceName: string;
  logoUrl?: string | null;
  distance?: number;
  latitude?: number | null;
  longitude?: number | null;
}

export interface OrderStatusResult {
  id: string;
  createdAt: string;
  customerName: string;
  customerContact: string | null;
  deliveryLocation: string | null;
  weight: number | null;
  status: string;
  shopName: string;
  branchName: string | null;
  serviceName: string;
  pricePerKg: number | null;
  detergentName?: string | null;
  softenerName?: string | null;
  deliveryStatus?: string | null;
}

type ShopServiceWithRelations = Tables<'shop_services'> & {
  shop_branches?: (Tables<'shop_branches'> & {
    shops?: Tables<'shops'> | null;
  }) | null;
};

type ShopBranchWithRelations = Tables<'shop_branches'> & {
  shops?: Tables<'shops'> | null;
  shop_services?: Tables<'shop_services'>[] | null;
};

type OrderWithRelations = Tables<'orders'> & {
  shop_branches?: (Tables<'shop_branches'> & {
    shops?: Tables<'shops'> | null;
  }) | null;
  shop_services?: Tables<'shop_services'> | null;
  detergent_types?: Tables<'detergent_types'> | null;
  softener_types?: Tables<'softener_types'> | null;
  deliveries?: Tables<'deliveries'>[] | null;
};

export async function getCheapestLaundries(limit: number = 5): Promise<{
  success: boolean;
  data?: ShopWithDetails[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("shop_services")
      .select(`
        *,
        shop_branches!inner (
          *,
          shops!inner (*)
        )
      `)
      .eq("is_active", true)
      .order("price_per_kg", { ascending: true })
      .limit(limit) as { data: ShopServiceWithRelations[] | null; error: any };

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        success: false,
        error: "No laundry services found",
      };
    }

    const formattedData: ShopWithDetails[] = data
  .filter(item => item.shop_branches && item.shop_branches.shops)
  .map((item) => {
    const branch = item.shop_branches!;
    const shop = branch.shops!;
    
    return {
      id: branch.id,
      name: shop.name,
      branchName: branch.name || "Main Branch",
      address: branch.address || "Address not available",
      latitude: branch.latitude,
      longitude: branch.longitude,
      pricePerKg: item.price_per_kg || 0,
      serviceName: item.name,
      logoUrl: shop.logo_url,
    };
  });

    // Filter out items with null price and sort manually
    const validData = formattedData
      .filter(item => item.pricePerKg > 0)
      .sort((a, b) => a.pricePerKg - b.pricePerKg);

    return {
      success: true,
      data: validData,
    };
  } catch (error) {
    console.error("Error fetching cheapest laundries:", error);
    return {
      success: false,
      error: "Failed to fetch cheapest laundries",
    };
  }
}

export async function getNearbyLaundries(
  userLat?: number,
  userLng?: number,
  limit: number = 5
): Promise<{
  success: boolean;
  data?: ShopWithDetails[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("shop_branches")
      .select(`
        *,
        shops (*),
        shop_services (*)
      `)
      .eq("is_active", true)
      .limit(limit) as { data: ShopBranchWithRelations[] | null; error: any };

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        success: false,
        error: "No nearby laundries found",
      };
    }

    const formattedData: ShopWithDetails[] = data
      .filter((branch): branch is ShopBranchWithRelations & { shops: NonNullable<typeof branch.shops> } => 
        !!branch.shops
      )
      .map((branch) => {
        // Get the cheapest service for this branch
        const services = branch.shop_services || [];
        const validServices = services.filter(s => s.price_per_kg !== null && s.price_per_kg > 0);
        const cheapestService = validServices.length > 0
          ? validServices.reduce((min, service) => 
              (service.price_per_kg || 0) < (min.price_per_kg || 0) ? service : min
            )
          : null;

        // Calculate approximate distance if coordinates are available
        let distance = undefined;
        if (userLat && userLng && branch.latitude && branch.longitude) {
          const latDiff = Math.abs(userLat - branch.latitude);
          const lngDiff = Math.abs(userLng - branch.longitude);
          distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // Rough km conversion
        }

        return {
          id: branch.id,
          name: branch.shops.name,
          branchName: branch.name || "Main Branch",
          address: branch.address || "Address not available",
          latitude: branch.latitude,
          longitude: branch.longitude,
          pricePerKg: cheapestService?.price_per_kg || 0,
          serviceName: cheapestService?.name || "Wash & Dry",
          logoUrl: branch.shops.logo_url,
          distance: distance,
        };
      });

    // Sort by distance (closest first) if we have coordinates
    if (userLat && userLng) {
      formattedData.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    }

    return {
      success: true,
      data: formattedData,
    };
  } catch (error) {
    console.error("Error fetching nearby laundries:", error);
    return {
      success: false,
      error: "Failed to fetch nearby laundries",
    };
  }
}

export async function getServicesByShop(
  shopName?: string
): Promise<{
  success: boolean;
  data?: ShopServiceWithRelations[];
  error?: string;
}> {
  try {
    let query = supabase
      .from("shop_services")
      .select(`
        *,
        shop_branches!inner (
          *,
          shops!inner (*)
        )
      `)
      .eq("is_active", true);

    if (shopName) {
      query = query.ilike("shop_branches.shops.name", `%${shopName}%`);
    }

    const { data, error } = await query.limit(20) as { data: ShopServiceWithRelations[] | null; error: any };

    if (error) throw error;

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error("Error fetching services:", error);
    return {
      success: false,
      error: "Failed to fetch services",
    };
  }
}

export async function getOrderStatus(
  orderId?: string,
  userId?: string
): Promise<{
  success: boolean;
  data?: OrderStatusResult;
  error?: string;
}> {
  try {
    let query = supabase
      .from("orders")
      .select(`
        *,
        shop_branches (
          *,
          shops (*)
        ),
        shop_services (*),
        detergent_types (*),
        softener_types (*),
        deliveries (*)
      `)
      .order("created_at", { ascending: false });

    if (orderId) {
      query = query.eq("id", orderId);
    } else if (userId) {
      query = query.eq("customer_id", userId);
    } else {
      return {
        success: false,
        error: "Either orderId or userId is required",
      };
    }

    const { data, error } = await query.limit(1).single() as { data: OrderWithRelations | null; error: any };

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: "Order not found",
        };
      }
      throw error;
    }

    if (!data) {
      return {
        success: false,
        error: "Order not found",
      };
    }

    // Determine order status based on deliveries if available
    let orderStatus = "pending";
    let deliveryStatus = undefined;
    
    if (data.deliveries && data.deliveries.length > 0) {
      const delivery = data.deliveries[0];
      deliveryStatus = delivery.status;
      
      // Map delivery status to order status
      const statusMap: { [key: string]: string } = {
        'unassigned': 'Processing',
        'assigned': 'Driver Assigned',
        'picked_up': 'Processing at Shop',
        'delivered': 'Completed'
      };
      orderStatus = statusMap[delivery.status || ''] || 'Processing';
    }

    const result: OrderStatusResult = {
      id: data.id,
      createdAt: data.created_at || new Date().toISOString(),
      customerName: data.customer_name || "Customer",
      customerContact: data.customer_contact || null,
      deliveryLocation: data.delivery_location || null,
      weight: data.meta && typeof data.meta === 'object' && 'weight' in data.meta ? Number(data.meta.weight) : null,
      status: orderStatus,
      shopName: data.shop_branches?.shops?.name || "Unknown Shop",
      branchName: data.shop_branches?.name || null,
      serviceName: data.shop_services?.name || "Wash & Dry",
      pricePerKg: data.shop_services?.price_per_kg || null,
      detergentName: data.detergent_types?.name,
      softenerName: data.softener_types?.name,
      deliveryStatus: deliveryStatus,
    };

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error fetching order status:", error);
    return {
      success: false,
      error: "Failed to fetch order status",
    };
  }
}

export async function getDetergentOptions(): Promise<{
  success: boolean;
  data?: Tables<'detergent_types'>[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("detergent_types")
      .select("*")
      .order("base_price", { ascending: true });

    if (error) throw error;

    // Filter out null prices and sort manually
    const validData = (data || [])
      .filter(item => item.base_price !== null)
      .sort((a, b) => (a.base_price || 0) - (b.base_price || 0));

    return {
      success: true,
      data: validData,
    };
  } catch (error) {
    console.error("Error fetching detergents:", error);
    return {
      success: false,
      error: "Failed to fetch detergent options",
    };
  }
}

export async function getSoftenerOptions(): Promise<{
  success: boolean;
  data?: Tables<'softener_types'>[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("softener_types")
      .select("*")
      .order("base_price", { ascending: true });

    if (error) throw error;

    // Filter out null prices and sort manually
    const validData = (data || [])
      .filter(item => item.base_price !== null)
      .sort((a, b) => (a.base_price || 0) - (b.base_price || 0));

    return {
      success: true,
      data: validData,
    };
  } catch (error) {
    console.error("Error fetching softeners:", error);
    return {
      success: false,
      error: "Failed to fetch softener options",
    };
  }
}

export async function getBranchOperatingHours(
  branchId?: string,
  shopName?: string
): Promise<{
  success: boolean;
  data?: (Tables<'branch_operating_hours'> & {
    shop_branches?: (Tables<'shop_branches'> & {
      shops?: Tables<'shops'> | null;
    }) | null;
  })[];
  error?: string;
}> {
  try {
    let query = supabase
      .from("branch_operating_hours")
      .select(`
        *,
        shop_branches!inner (
          *,
          shops!inner (*)
        )
      `)
      .order("day_of_week", { ascending: true });

    if (branchId) {
      query = query.eq("branch_id", branchId);
    } else if (shopName) {
      query = query.ilike("shop_branches.shops.name", `%${shopName}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error("Error fetching operating hours:", error);
    return {
      success: false,
      error: "Failed to fetch operating hours",
    };
  }
}

export async function getUserOrders(
  userId: string,
  limit: number = 5
): Promise<{
  success: boolean;
  data?: OrderStatusResult[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        shop_branches (
          *,
          shops (*)
        ),
        shop_services (*)
      `)
      .eq("customer_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit) as { data: OrderWithRelations[] | null; error: any };

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        success: false,
        error: "No orders found",
      };
    }

    const formattedData: OrderStatusResult[] = data
  .filter(order => order.shop_branches && order.shop_branches.shops)
  .map((order) => {
    const branch = order.shop_branches!;
    const shop = branch.shops!;
    
    // Extract status from meta if available
    let status = "pending";
    if (order.meta && typeof order.meta === 'object' && 'status' in order.meta) {
      status = String(order.meta.status);
    }

    return {
      id: order.id,
      createdAt: order.created_at || new Date().toISOString(),
      customerName: order.customer_name || "Customer",
      customerContact: order.customer_contact || null,
      deliveryLocation: order.delivery_location || null,
      weight: order.meta && typeof order.meta === 'object' && 'weight' in order.meta ? Number(order.meta.weight) : null,
      status: status,
      shopName: shop.name,
      branchName: branch.name || null,
      serviceName: order.shop_services?.name || "Wash & Dry",
      pricePerKg: order.shop_services?.price_per_kg || null,
    };
  });
    return {
      success: true,
      data: formattedData,
    };
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return {
      success: false,
      error: "Failed to fetch orders",
    };
  }
}

// Laundry tips helper (static data)
export async function getLaundryTips(
  topic?: string
): Promise<{
  success: boolean;
  data?: string[];
  error?: string;
}> {
  const tips = {
    stains: [
      "🧂 For wine stains, cover with salt immediately to absorb",
      "☕ For coffee stains, blot with cold water then apply white vinegar",
      "🫒 For oil stains, apply dish soap before washing",
      "🩸 For blood stains, use cold water only (hot water sets the stain)",
      "🍅 For tomato-based stains, treat with lemon juice and sunlight",
    ],
    whites: [
      "✨ Add baking soda to brighten white clothes",
      "☀️ Use oxygen bleach for stubborn stains on whites",
      "🧺 Dry white clothes in sunlight for natural bleaching",
      "⚪ Avoid overloading the machine for better cleaning",
    ],
    colors: [
      "🌈 Turn clothes inside out to prevent fading",
      "❄️ Wash in cold water to preserve colors",
      "🧴 Add vinegar to set colors and prevent bleeding",
      "🎨 Sort by color intensity (dark, medium, light)",
    ],
    general: [
      "📋 Check pockets before washing (especially tissues!)",
      "🤐 Close zippers to prevent snagging",
      "🧦 Don't overload your washing machine",
      "🧼 Measure detergent properly - too much leaves residue",
      "🌀 Clean your washing machine monthly",
    ],
  };

  if (topic?.toLowerCase().includes("stain")) {
    return { success: true, data: tips.stains };
  } else if (topic?.toLowerCase().includes("white")) {
    return { success: true, data: tips.whites };
  } else if (topic?.toLowerCase().includes("color")) {
    return { success: true, data: tips.colors };
  } else {
    return { success: true, data: tips.general };
  }
}