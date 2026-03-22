// lib/formatHelpers.ts

/**
 * Format price to Philippine Peso
 */
export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return "Price unavailable";
  return `₱${price.toFixed(2)}`;
}

/**
 * Format distance in kilometers or meters
 */
export function formatDistance(distance?: number | null): string {
  if (!distance) return "Distance unknown";
  if (distance < 1) {
    return `${(distance * 1000).toFixed(0)}m away`;
  }
  return `${distance.toFixed(1)}km away`;
}

/**
 * Format order status with emoji
 */
export function formatOrderStatus(status: string | null | undefined): string {
  if (!status) return "⏳ Processing";
  
  const statusMap: { [key: string]: string } = {
    'pending': '⏳ Pending',
    'waiting_for_pickup': '📦 Waiting for Pickup',
    'assigned': '🛵 Driver Assigned',
    'collected': '📥 Collected',
    'in_progress': '👕 Being Washed',
    'ready_for_delivery': '✅ Ready for Delivery',
    'out_for_delivery': '🚚 Out for Delivery',
    'completed': '🎉 Completed',
    'cancelled': '❌ Cancelled',
    'processing': '⏳ Processing',
    'driver assigned': '🛵 Driver Assigned',
    'processing at shop': '👕 Being Washed',
    'unassigned': '⏳ Finding Driver',
    'picked_up': '📦 Picked Up',
    'delivered': '✅ Delivered'
  };
  
  return statusMap[status.toLowerCase()] || status;
}

/**
 * Format day of week number to name
 */
export function formatDayOfWeek(day: number | null | undefined): string {
  if (day === null || day === undefined) return 'Unknown';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day] || 'Unknown';
}

/**
 * Format time string (removes seconds)
 */
export function formatTime(time: string | null | undefined): string {
  if (!time) return "Closed";
  // Handle time format (assuming HH:MM:SS or HH:MM)
  return time.substring(0, 5);
}

/**
 * Format date to readable format
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "Date unavailable";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return "Invalid date";
  }
}

/**
 * Format phone number (simple formatting)
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "No contact number";
  // Simple formatting - you can customize this based on PH phone formats
  if (phone.length === 11 && phone.startsWith('09')) {
    return phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  return phone;
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: string | null | undefined): string {
  if (!status) return '#666666';
  
  const colorMap: { [key: string]: string } = {
    'pending': '#FFA500', // Orange
    'waiting_for_pickup': '#FFA500',
    'assigned': '#3498db', // Blue
    'collected': '#9b59b6', // Purple
    'in_progress': '#3498db',
    'ready_for_delivery': '#2ecc71', // Green
    'out_for_delivery': '#3498db',
    'completed': '#2ecc71', // Green
    'cancelled': '#e74c3c', // Red
    'processing': '#FFA500',
    'delivered': '#2ecc71'
  };
  
  return colorMap[status.toLowerCase()] || '#666666';
}

/**
 * Format weight with unit
 */
export function formatWeight(weight: number | null | undefined): string {
  if (!weight) return "0 kg";
  return `${weight} kg`;
}

/**
 * Format address to shorter version
 */
export function formatAddress(address: string | null | undefined, maxLength: number = 50): string {
  if (!address) return "Address not available";
  if (address.length <= maxLength) return address;
  return address.substring(0, maxLength) + '...';
}

/**
 * Create a shop display string
 */
export function formatShopDisplay(shopName: string, branchName: string | null | undefined): string {
  if (branchName && branchName !== "Main Branch") {
    return `${shopName} (${branchName})`;
  }
  return shopName;
}