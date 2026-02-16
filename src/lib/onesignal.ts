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
      serviceWorkerParam: { scope: '/angie/' },
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

export const sendPushNotification = async (content: string, targetUserId: string) => {
  if (!ONESIGNAL_APP_ID) {
    console.warn('OneSignal App ID not set. Notification not sent.');
    return;
  }

  try {
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Authorization: `Basic ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        // include_external_user_ids is deprecated but still works for older apps.
        // For new apps, we should use filters or include_aliases if using the new Identity model.
        // However, OneSignal.login(userId) maps to the External ID in the new model.
        // Let's try include_aliases which is the modern way.
        include_aliases: {
          external_id: [targetUserId]
        },
        target_channel: "push",
        contents: { en: content },
        headings: { en: 'New Message' },
        url: window.location.origin + '/#/messages',
      }),
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', options);
    const data = await response.json();
    console.log('Push notification response:', data);
    
    // Fallback to legacy include_external_user_ids if aliases fail (common issue during migration)
    if (data.errors) {
       console.warn('Aliases failed, trying legacy targeting...');
       const legacyOptions = {
          ...options,
          body: JSON.stringify({
            app_id: ONESIGNAL_APP_ID,
            include_external_user_ids: [targetUserId],
            contents: { en: content },
            headings: { en: 'New Message' },
            url: window.location.origin + '/#/messages',
          })
       };
       const legacyRes = await fetch('https://onesignal.com/api/v1/notifications', legacyOptions);
       console.log('Legacy push response:', await legacyRes.json());
    }

  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};
