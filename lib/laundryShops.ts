import { supabaseClient } from "./supabaseClient";

// ==================== INTERFACES ====================

export interface LaundryShop {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  logo_url?: string;
  is_active: boolean;
  methods: string[]; // This will contain: 'delivery', 'dropoff', 'pickup'
}

export interface ShopMethod {
  code: string | null; // Allow null
  label: string | null; // Allow null
}

export interface BranchMethod {
  is_enabled: boolean | null; // Allow null
  shop_methods: ShopMethod;
}

export interface OperatingHours {
  day_of_week: number;
  open_time: string | null; // Allow null
  close_time: string | null; // Allow null
  is_closed: boolean | null; // Allow null
}

export interface Contact {
  contact_type: string;
  value: string;
  is_primary: boolean | null; // Allow null
}

export interface Service {
  id: string;
  name: string;
  description: string | null; // Allow null
  price_per_kg: number | null; // Allow null
  unit: string | null; // Allow null
  is_active: boolean | null; // Allow null
  image_url?: string | null; // Allow null
}

export interface Shop {
  id: string;
  name: string;
  description: string | null; // Allow null
  logo_url: string | null; // Allow null
  owner_id: string | null; // Allow null
}

export interface ShopDetails {
  id: string;
  name: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean | null;
  shops: Shop | null;
  branch_operating_hours: OperatingHours[];
  branch_contacts: Contact[];
  branch_methods: BranchMethod[];
  shop_services: Service[];
}

// ==================== FUNCTIONS ====================

/**
 * Fetch all active laundry shops with their methods
 */
export const fetchLaundryShops = async (): Promise<LaundryShop[]> => {
  try {
    const { data, error } = await supabaseClient
      .from('shop_branches')
      .select(`
        id,
        name,
        address,
        latitude,
        longitude,
        is_active,
        shops (
          name,
          description,
          logo_url
        ),
        branch_methods (
          is_enabled,
          shop_methods (
            code
          )
        )
      `)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching laundry shops:', error);
      return [];
    }

    console.log('=== DEBUG: Raw data from Supabase ===');
    console.log(JSON.stringify(data, null, 2));

    // Transform the data to match our interface
    const shops: LaundryShop[] = data.map((branch: any) => {
      // Debug the branch_methods structure
      console.log(`=== Processing branch: ${branch.name} ===`);
      console.log('branch_methods:', branch.branch_methods);
      
      let methods: string[] = [];
      
      if (branch.branch_methods && Array.isArray(branch.branch_methods)) {
        branch.branch_methods.forEach((bm: any) => {
          console.log('Method item:', bm);
          console.log('is_enabled:', bm.is_enabled);
          console.log('shop_methods:', bm.shop_methods);
          console.log('code:', bm.shop_methods?.code);
          
          if (bm.is_enabled === true && bm.shop_methods?.code) {
            methods.push(bm.shop_methods.code);
          }
        });
      }
      
      console.log(`Final methods for ${branch.name}:`, methods);
      
      return {
        id: branch.id,
        name: branch.shops?.name || branch.name,
        description: branch.shops?.description,
        latitude: branch.latitude,
        longitude: branch.longitude,
        address: branch.address,
        logo_url: branch.shops?.logo_url,
        is_active: branch.is_active,
        methods: methods
      };
    });

    console.log('=== FINAL SHOPS DATA ===');
    console.log(JSON.stringify(shops, null, 2));
    
    return shops;
  } catch (error) {
    console.error('Error in fetchLaundryShops:', error);
    return [];
  }
};

/**
 * Fetch detailed information for a specific shop branch
 */
export const fetchShopDetails = async (branchId: string): Promise<ShopDetails | null> => {
  try {
    const { data, error } = await supabaseClient
      .from('shop_branches')
      .select(`
        id,
        name,
        address,
        latitude,
        longitude,
        is_active,
        shops (
          id,
          name,
          description,
          logo_url,
          owner_id
        ),
        branch_operating_hours (
          day_of_week,
          open_time,
          close_time,
          is_closed
        ),
        branch_contacts (
          contact_type,
          value,
          is_primary
        ),
        branch_methods (
          is_enabled,
          shop_methods (
            code,
            label
          )
        ),
        shop_services (
          id,
          name,
          description,
          price_per_kg,
          unit,
          is_active,
          image_url
        )
      `)
      .eq('id', branchId)
      .single();

    if (error) {
      console.error('Error fetching shop details:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchShopDetails:', error);
    return null;
  }
};

/**
 * Fetch operating hours for a specific shop branch
 */
export const fetchShopOperatingHours = async (branchId: string): Promise<OperatingHours[] | null> => {
  try {
    const { data, error } = await supabaseClient
      .from('branch_operating_hours')
      .select('*')
      .eq('branch_id', branchId)
      .order('day_of_week');

    if (error) {
      console.error('Error fetching operating hours:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchShopOperatingHours:', error);
    return null;
  }
};

/**
 * Fetch contact information for a specific shop branch
 */
export const fetchShopContacts = async (branchId: string): Promise<Contact[] | null> => {
  try {
    const { data, error } = await supabaseClient
      .from('branch_contacts')
      .select('*')
      .eq('branch_id', branchId);

    if (error) {
      console.error('Error fetching contacts:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchShopContacts:', error);
    return null;
  }
};

/**
 * Fetch services for a specific shop branch
 */
export const fetchShopServices = async (branchId: string): Promise<Service[] | null> => {
  try {
    const { data, error } = await supabaseClient
      .from('shop_services')
      .select('*')
      .eq('branch_id', branchId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching services:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchShopServices:', error);
    return null;
  }
};

/**
 * Fetch available methods for a specific shop branch
 */
export const fetchShopMethods = async (branchId: string): Promise<BranchMethod[] | null> => {
  try {
    const { data, error } = await supabaseClient
      .from('branch_methods')
      .select(`
        is_enabled,
        shop_methods (
          code,
          label
        )
      `)
      .eq('branch_id', branchId)
      .eq('is_enabled', true);

    if (error) {
      console.error('Error fetching shop methods:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchShopMethods:', error);
    return null;
  }
}