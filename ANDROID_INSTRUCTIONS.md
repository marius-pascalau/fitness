# Step-by-Step Guide: Export and Install "Fit with Diana - Tracker" on an Android Phone

This guide shows you how to export this application from Google AI Studio and build a native **Android App (APK)** using **Ionic Capacitor** so you can run it directly on an Android device!

---

## 🛠 Prerequisites

To compile the app locally, ensure you have these installed on your computer:
1. **Node.js** (v18 or newer) -> Download from [nodejs.org](https://nodejs.org)
2. **Android Studio** -> Download from [developer.android.com/studio](https://developer.android.com/studio)

---

## 📥 Step 1: Export the Project from Google AI Studio

1. In the Google AI Studio top-right settings bar, look for the **Settings** gear or export menu.
2. Click **Export as ZIP** to download the entire structured codebase as a single zip file to your computer.
3. Unzip the file into a folder of your choice (e.g., `fit-with-diana-tracker`).

---

## 🚀 Step 2: Initialize and Sync the Android Codebase

Open your computer's terminal (Command Prompt, PowerShell, or Terminal) in the unzipped project folder and run these four commands:

```bash
# 1. Install all dependencies
npm install

# 2. Build the optimized production React web bundle
npm run build

# 3. Add the native Android platform wrapper
npx cap add android

# 4. Sync our web bundle to Android Studio
npx cap sync
```

---

## 📱 Step 3: Run the App on Your Android Phone

There are two primary ways to load and run the application on your mobile device.

### Option A: Direct USB Installation (Recommended & Fastest)

1. **Activate Developer Options on your phone**:
   - Go to Android **Settings** > **About Phone**.
   - Tap **Build Number** 7 times until it says *"You are now a developer!"*.
   - Search for **Developer Options** in Settings, and enable **USB Debugging**.
2. **Connect your phone to your computer** using a high-quality USB cable.
3. Open your project terminal and run:
   ```bash
   npm run cap:open
   ```
   *This will automatically launch Android Studio with your project loaded.*
4. In Android Studio, wait for the dependencies to synchronize (Gradle Sync). 
5. Select your connected phone model from the device dropdown at the top of the toolbar and click the **green Play button (Run)**.
6. The app will immediately install and launch on your phone!

---

### Option B: Build a Shareable APK installer (.apk)

If you want to build a standalone file you can share with clients or install manually:

1. Open the project in Android Studio by running `npm run cap:open`.
2. In the top menu, go to: **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3. Once completed, a notification dialog in the bottom right will show you a **Locate** button.
4. Click **Locate** to find your compiled `app-debug.apk` file.
5. Email or transfer this `.apk` file to your Android phone, tap on it in your phone's File Manager, and choose **Install**!

---

## 🔋 Bonus: Dynamic Live-Reload during Development

If you want to edit code on your computer and immediately see updates on your connected Android phone in real-time, update the `server` block in `capacitor.config.ts` replacing it with your computer's local Wi-Fi IP address:

```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  // ...
  server: {
    url: "http://192.168.1.XX:3000", // Replace with your computer's local network IP address
    cleartext: true
  }
};
```
*Run `npm run dev` in your terminal, then press Run in Android Studio, and any code changes will instantly update on your phone screen!*
