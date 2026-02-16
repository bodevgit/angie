import OneSignal from 'react-onesignal';

// NOTE: Keys are now loaded from environment variables
const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;
// const ONESIGNAL_API_KEY = import.meta.env.VITE_ONESIGNAL_API_KEY; 

let isInitialized = false;

export const initOneSignal = async () => {
  if (isInitialized) return;

  if (!ONESIGNAL_APP_ID) {
    console.error('OneSignal App ID is missing. Please check your .env or GitHub Secrets.');
    return;
  }

  console.log(`Initializing OneSignal with App ID: ${ONESIGNAL_APP_ID.slice(0, 8)}...`);

  try {
    // Force cleanup of old workers with wrong scopes
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
            if (registration.scope.includes('angie') && !registration.active) {
                // Try to unregister stale ones if any
                // console.log('Unregistering stale worker:', registration);
                // await registration.unregister();
            }
        }
    }

    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      // For GitHub Pages subdirectory deployment (/angie/)
      // 'path' tells SDK where to look for worker files relative to origin
      path: '/angie/', 
      // 'scope' defines which pages the worker controls. Must be /angie/ or subpath.
      serviceWorkerParam: { scope: '/angie/' },
      // 'serviceWorkerPath' is the file name. 
      // Combined with 'path', it should resolve to /angie/OneSignalSDKWorker.js
      serviceWorkerPath: 'OneSignalSDKWorker.js', 
    });
    isInitialized = true;
    console.log('OneSignal initialized successfully');
  } catch (error) {
    console.error('Error initializing OneSignal:', error);
  }
};

export const setOneSignalUser = async (userId: string) => {
  if (!isInitialized) {
    console.warn('OneSignal not initialized yet, skipping user set.');
    return;
  }
  
  try {
    // Login identifies the user
    await OneSignal.login(userId);
    // Add alias to ensure 'external_id' targeting works reliably
    await OneSignal.User.addAlias("external_id", userId);
    
    // DEBUG: Log current subscription state
    console.log('OneSignal user set and aliased:', userId);
    console.log('Push Subscription ID:', OneSignal.User.PushSubscription.id);
    console.log('Push Subscription Token:', OneSignal.User.PushSubscription.token);
    console.log('Push Subscription Opted In:', OneSignal.User.PushSubscription.optedIn);
    
    // Force subscription refresh
    if (OneSignal.User.PushSubscription.optedIn === false) {
       console.log('User is not opted in. Requesting permission...');
       // This might trigger the browser prompt again if not permanently blocked
       // await OneSignal.User.PushSubscription.optIn(); // Commented out to prevent loops
    }
    
  } catch (error) {
    console.error('Error setting OneSignal user:', error);
  }
};

import { supabase } from './supabase';

// ... existing imports ...

export const sendPushNotification = async (content: string, targetUserId: string) => {
  // We now use Supabase Edge Functions to avoid CORS issues and hide API keys
  try {
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: { content, targetUserId },
    });

    if (error) throw error;
    console.log('Push notification sent via Edge Function:', data);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};
