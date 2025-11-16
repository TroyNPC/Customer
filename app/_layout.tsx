import { Stack } from 'expo-router';
import { AuthProvider } from '../lib/Auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create client outside component to avoid recreating on re-renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Better for mobile
      retry: 1,
      gcTime: 1000 * 60 * 5, // 5 minutes cache
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="shop/[id]" />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}