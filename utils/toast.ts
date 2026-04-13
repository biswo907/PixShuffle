import { Alert, Platform, ToastAndroid } from 'react-native';

/**
 * Show toast message (Cross-platform)
 * Android -> Native Toast
 * iOS/Web -> Alert fallback (safe)
 */
export const showToast = (message: string) => {
  try {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else if (Platform.OS === 'ios') {
      Alert.alert('', message);
    } else {
      // Web fallback
      if (typeof window !== 'undefined') {
        // You can replace this with custom UI later
        console.log('Toast:', message);
        alert(message);
      }
    }
  } catch (error) {
    console.log('Toast Error:', error);
  }
};

/**
 * Optional: Long Toast (Android only fallback handled)
 */
export const showLongToast = (message: string) => {
  try {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.LONG);
    } else {
      Alert.alert('', message);
    }
  } catch (error) {
    console.log('Toast Error:', error);
  }
};