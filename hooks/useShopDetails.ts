import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

// Use your exact Supabase types
type ShopBranch = Database['public']['Tables']['shop_branches']['Row'];
type Shop = Database['public']['Tables']['shops']['Row'];
type BranchContact = Database['public']['Tables']['branch_contacts']['Row'];
type OperatingHours = Database['public']['Tables']['branch_operating_hours']['Row'];
type ShopService = Database['public']['Tables']['shop_services']['Row'];
type BranchMethod = Database['public']['Tables']['branch_methods']['Row'] & {
  shop_methods?: Database['public']['Tables']['shop_methods']['Row'];
};

export type ShopDetails = ShopBranch & {
  shops?: Shop | null;
  branch_contacts?: BranchContact[];
  branch_operating_hours?: OperatingHours[];
  shop_services?: ShopService[];
  branch_methods?: BranchMethod[];
};

export const useShopDetails = (shopId: string | string[] | undefined) => {
  return useQuery({
    queryKey: ['shop', shopId],
    queryFn: async (): Promise<ShopDetails> => {
      const id = Array.isArray(shopId) ? shopId[0] : shopId;
      
      if (!id) {
        throw new Error('Shop ID is required');
      }

      const { data, error } = await supabase
        .from('shop_branches')
        .select(`
          *,
          shops (*),
          branch_contacts (*),
          branch_operating_hours (*),
          shop_services (*),
          branch_methods (
            *,
            shop_methods (*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Failed to load shop: ${error.message}`);
      }

      if (!data) {
        throw new Error('Shop not found');
      }

      return data;
    },
    enabled: !!shopId,
    staleTime: 1000 * 60 * 5,
  });
};