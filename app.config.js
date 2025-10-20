export default {
  expo: {
    name: "Application",
    slug: "Application",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "application",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      router: {},
      eas: {
        "projectId": "8e3a24f5-4fd3-43d5-8bb3-a2b5f4bd99aa"
      },
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.application.app",
      infoPlist: {
        NSCameraUsageDescription: "Allow $(PRODUCT_NAME) to access your camera",
        NSMicrophoneUsageDescription:
          "Allow $(PRODUCT_NAME) to access your microphone",
      },
    },

    android: {
      package: "com.application.app",
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: ["CAMERA", "RECORD_AUDIO"],
    },

    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },

    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: { backgroundColor: "#000000" },
        },
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Allow $(PRODUCT_NAME) to access your camera",
          microphonePermission:
            "Allow $(PRODUCT_NAME) to access your microphone",
          recordAudioAndroid: true,
        },
      ],
      "expo-web-browser",
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
