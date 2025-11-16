import 'dotenv/config';

export default {
  "expo": {
    "name": "Doctor Plus",
    "slug": "DOCTOR",
    "scheme": "doctor",
    "version": "1.0.7",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/icon2.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "extra": {
      "supabaseUrl": process.env.SUPABASE_URL,
      "supabaseAnonKey": process.env.SUPABASE_ANON_KEY,
      "eas": {
        "projectId": "e2619b61-6ef5-4958-90bc-a400bbc8c50a"
      }
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": ".",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false,
        "NSPhotoLibraryUsageDescription": "Allow $(PRODUCT_NAME) to access your photos for profile photo, diploma, or certificate selection.",
        "NSCameraUsageDescription": "Allow $(PRODUCT_NAME) to access your camera to take profile photos, diplomas, or certificates."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "splash": {
        "image": "./assets/icon2.png",
        "resizeMode": "contain",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "package": "com.kis.production.DOCTOR",
      "googleServicesFile": "./google-services.json",
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": false,
          "data": [
            { "scheme": "doctor" },
            { "scheme": "doctor", "host": "payment_result" }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ],
      "permissions": [
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.CAMERA",
        "android.permission.ACCESS_MEDIA_LOCATION",
        "android.permission.VIBRATE"
      ]
    },
    "web": {
      "favicon": "./assets/icon.png"
    },
    "plugins": [
      "expo-localization",
      "expo-secure-store",
      "expo-font",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "ios": {
            "allowBadge": true,
            "allowSound": true,
            "allowAlert": true
          }
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow $(PRODUCT_NAME) to access your photos for profile photo, diploma, or certificate selection.",
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera to take profile photos, diplomas, or certificates."
        }
      ],
      "expo-web-browser"
    ]
  }
};