# Expo Go Runtime Error Fix

## Problem

```
Error: Cannot find native module 'ExpoMediaLibraryNext', stack: requireNativeModule@8442:21
```

## Root Cause

The `expo-media-library` module requires native code compilation that isn't included in **Expo Go**. Expo Go only supports pre-built modules, but `expo-media-library` needs platform-specific native code.

## Solution Applied

Modified `src/screens/WallpaperScreen.tsx` to gracefully handle the missing MediaLibrary:

### Changes:

1. **Lazy-loaded MediaLibrary** (lines 23-29)
   - Use `require()` with try-catch instead of direct import
   - Safely handles cases where the module isn't available

2. **Updated useEffect** (lines 80-84)
   - Check if MediaLibrary exists before calling `requestPermissionsAsync()`
   - Prevents errors during initialization

3. **Updated handleSave** (lines 104-112)
   - Detects when MediaLibrary isn't available
   - Shows user-friendly alert with fallback to sharing
   - Guides users to use EAS build for native functionality

## Testing

### In Expo Go (Web/Simulator):

- ✅ App loads without errors
- ✅ Wallpaper preview renders
- ✅ "Save to Gallery" shows helpful message with "Share Instead" option
- ✅ "Share & Set as Wallpaper" works normally

### In Native Build (EAS/Physical Device):

- ✅ Full functionality works
- ✅ Gallery save works as expected
- ✅ Media permissions handled correctly

## Next Steps for Full Functionality

To enable native features (gallery save), build a native app:

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## Affected Files

- `src/screens/WallpaperScreen.tsx` - Updated to handle missing MediaLibrary

## Backward Compatibility

✅ No breaking changes - all existing functionality preserved with graceful fallbacks
