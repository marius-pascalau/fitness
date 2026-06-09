import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.fitwithdiana.tracker",
  appName: "Fit with Diana - tracker",
  webDir: "dist",
  server: {
    androidScheme: "https"
  }
};

export default config;
