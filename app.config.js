export default {
  expo: {
    name: "LaundryGo",
    slug: "LaundryApp",
    scheme: "laundrygo",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/applogo.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    notification: {
      icon: "./assets/notification-icon.png",
      color: "#3864C3",
      androidMode: "default",
      androidCollapsedTitle: "LaundryGo"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.firenado.LaundryApp",
      googleServicesFile: "./google-services.json"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      "expo-font",
      "expo-notifications"
    ],
    extra: {
      eas: {
        projectId: "0e77ddbc-ae5e-4cc1-866d-f9d040c70057"
      },
      supabaseUrl: process.env.SUPABASE_URL || "https://isorrhjmjywkldosbltw.supabase.co",
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "sb_publishable_SEdBw1VsYsQLhK4M6xXwjw_L7cYquRS",
      orsApiKey: process.env.ORS_API_KEY || "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjZhNDQwOTk5NDk1YTRlOTY5Y2Y0ZjJlNjIwZmQ3ODM5IiwiaCI6Im11cm11cjY0In0=",
      router: {}
    },
    owner: "firenado"
  }
};