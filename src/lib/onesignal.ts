import OneSignal from 'react-onesignal';

// NOTE: Keys are now loaded from environment variables
const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = import.meta.env.VITE_ONESIGNAL_API_KEY; 

let isInitialized = false;

export const initOneSignal = async () => {
  if (isInitialized) return;

  if (!ONESIGNAL_APP_ID) {
    console.error('OneSignal App ID is missing. Please check your .env or GitHub Secrets.');
    return;
  }

  console.log(`Initializing OneSignal with App ID: ${ONESIGNAL_APP_ID.slice(0, 8)}...`);

  try {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
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
    await OneSignal.login(userId);
    console.log('OneSignal user set:', userId);
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
