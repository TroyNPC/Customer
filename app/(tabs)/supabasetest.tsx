import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ScaledSheet, ms, mvs, s } from "react-native-size-matters";
import { supabaseClient } from "@/lib/supabaseClient";

interface TestResult {
  name: string;
  status: 'loading' | 'success' | 'error';
  message: string;
  data?: any;
}

export default function SupabaseTestScreen() {
  const router = useRouter();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const updateResult = (name: string, status: 'loading' | 'success' | 'error', message: string, data?: any) => {
    setResults(prev => {
      const filtered = prev.filter(r => r.name !== name);
      return [...filtered, { name, status, message, data }];
    });
  };

  const testEnvironmentVariables = () => {
    updateResult('Environment Variables', 'loading', 'Checking environment variables...');
    
    const envVars = {
      'Supabase URL': process.env.EXPO_PUBLIC_SUPABASE_URL,
      'Supabase Anon Key': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '*** Set ***' : 'Missing',
    };

    const missingVars = Object.entries(envVars).filter(([key, value]) => !value);
    
    if (missingVars.length > 0) {
      updateResult('Environment Variables', 'error', `Missing: ${missingVars.map(([key]) => key).join(', ')}`, envVars);
    } else {
      updateResult('Environment Variables', 'success', 'All environment variables are set!', envVars);
    }
  };

  const testSupabaseConnection = async () => {
    updateResult('Supabase Connection', 'loading', 'Testing connection to Supabase...');
    
    try {
      const { data, error } = await supabaseClient.from('shop_branches').select('count').limit(1);
      
      if (error) {
        updateResult('Supabase Connection', 'error', `Connection failed: ${error.message}`, error);
      } else {
        updateResult('Supabase Connection', 'success', 'Successfully connected to Supabase!', data);
      }
    } catch (error: any) {
      updateResult('Supabase Connection', 'error', `Connection error: ${error.message}`, error);
    }
  };

  const testShopBranchesQuery = async () => {
    updateResult('Shop Branches Query', 'loading', 'Fetching shop branches...');
    
    try {
      const { data, error } = await supabaseClient
        .from('shop_branches')
        .select('id, name, address, latitude, longitude, is_active')
        .eq('is_active', true)
        .limit(5);

      if (error) {
        updateResult('Shop Branches Query', 'error', `Query failed: ${error.message}`, error);
      } else {
        updateResult('Shop Branches Query', 'success', `Found ${data?.length || 0} active shop branches`, data);
      }
    } catch (error: any) {
      updateResult('Shop Branches Query', 'error', `Query error: ${error.message}`, error);
    }
  };

  const runAllTests = async () => {
    setIsTesting(true);
    setResults([]);
    
    // Test environment variables first
    testEnvironmentVariables();
    
    // Wait a bit then test connection
    setTimeout(() => {
      testSupabaseConnection();
    }, 500);
    
    // Wait a bit more then test query
    setTimeout(() => {
      testShopBranchesQuery();
    }, 1000);

    setTimeout(() => setIsTesting(false), 2000);
  };

  useEffect(() => {
    runAllTests();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      case 'loading': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'loading': return 'time';
      default: return 'help-circle';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={ms(24)} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SUPABASE TEST</Text>
          <TouchableOpacity onPress={runAllTests} disabled={isTesting}>
            <Ionicons name="refresh" size={ms(24)} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Supabase Connection Test</Text>
          <Text style={styles.cardSubtitle}>Testing your environment setup and database connection</Text>
          
          <TouchableOpacity 
            style={[styles.testButton, isTesting && styles.testButtonDisabled]} 
            onPress={runAllTests}
            disabled={isTesting}
          >
            <Ionicons name="refresh" size={ms(20)} color="white" />
            <Text style={styles.testButtonText}>
              {isTesting ? 'Testing...' : 'Run Tests'}
            </Text>
          </TouchableOpacity>

          <View style={styles.resultsContainer}>
            {results.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <View style={styles.resultHeader}>
                  <Ionicons 
                    name={getStatusIcon(result.status)} 
                    size={ms(20)} 
                    color={getStatusColor(result.status)} 
                  />
                  <Text style={styles.resultName}>{result.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(result.status) }]}>
                    <Text style={styles.statusText}>{result.status.toUpperCase()}</Text>
                  </View>
                </View>
                
                <Text style={styles.resultMessage}>{result.message}</Text>
                
                {result.data && (
                  <View style={styles.dataContainer}>
                    <Text style={styles.dataLabel}>Data:</Text>
                    <Text style={styles.dataText}>
                      {typeof result.data === 'object' 
                        ? JSON.stringify(result.data, null, 2) 
                        : String(result.data)
                      }
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Environment Info</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Node Environment:</Text>
            <Text style={styles.infoValue}>{process.env.NODE_ENV || 'development'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Supabase URL:</Text>
            <Text style={styles.infoValue}>
              {process.env.EXPO_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Supabase Key:</Text>
            <Text style={styles.infoValue}>
              {process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  headerBox: { 
    width: "100%", 
    height: mvs(120), 
    backgroundColor: "#3864C3", 
    justifyContent: "flex-end",
    paddingBottom: mvs(20)
  },
  headerContent: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingHorizontal: s(20) 
  },
  headerTitle: { 
    fontSize: ms(18), 
    fontWeight: "bold", 
    color: "white" 
  },
  content: {
    flex: 1,
    padding: s(16)
  },
  card: {
    backgroundColor: "white",
    borderRadius: ms(12),
    padding: mvs(16),
    marginBottom: mvs(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  cardTitle: {
    fontSize: ms(18),
    fontWeight: "bold",
    marginBottom: mvs(4)
  },
  cardSubtitle: {
    fontSize: ms(14),
    color: "#6B7280",
    marginBottom: mvs(16)
  },
  testButton: {
    flexDirection: "row",
    backgroundColor: "#3864C3",
    paddingHorizontal: s(16),
    paddingVertical: mvs(12),
    borderRadius: ms(8),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: mvs(16)
  },
  testButtonDisabled: {
    opacity: 0.6
  },
  testButtonText: {
    color: "white",
    fontSize: ms(16),
    fontWeight: "bold",
    marginLeft: s(8)
  },
  resultsContainer: {
    marginTop: mvs(8)
  },
  resultItem: {
    borderLeftWidth: 4,
    borderLeftColor: "#E5E7EB",
    paddingLeft: s(12),
    marginBottom: mvs(16)
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: mvs(4)
  },
  resultName: {
    fontSize: ms(16),
    fontWeight: "600",
    flex: 1,
    marginLeft: s(8)
  },
  statusBadge: {
    paddingHorizontal: s(8),
    paddingVertical: mvs(2),
    borderRadius: ms(12)
  },
  statusText: {
    color: "white",
    fontSize: ms(10),
    fontWeight: "bold"
  },
  resultMessage: {
    fontSize: ms(14),
    color: "#6B7280",
    marginBottom: mvs(8)
  },
  dataContainer: {
    backgroundColor: "#F9FAFB",
    padding: s(12),
    borderRadius: ms(6),
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  dataLabel: {
    fontSize: ms(12),
    fontWeight: "bold",
    color: "#374151",
    marginBottom: mvs(4)
  },
  dataText: {
    fontSize: ms(11),
    color: "#6B7280",
    fontFamily: 'monospace'
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: mvs(8),
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6"
  },
  infoLabel: {
    fontSize: ms(14),
    color: "#374151",
    fontWeight: "500"
  },
  infoValue: {
    fontSize: ms(14),
    color: "#6B7280"
  }
});