import OneSignal from 'react-onesignal';

// NOTE: You need to replace these with your actual OneSignal keys
const ONESIGNAL_APP_ID = 'YOUR_ONESIGNAL_APP_ID';
const ONESIGNAL_API_KEY = 'YOUR_ONESIGNAL_REST_API_KEY'; 

export const initOneSignal = async () => {
  try {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      // notifyButton: {
      //   enable: true,
      // },
    });
    console.log('OneSignal initialized');
  } catch (error) {
    console.error('Error initializing OneSignal:', error);
  }
};

export const setOneSignalUser = async (userId: string) => {
  try {
    await OneSignal.login(userId);
    console.log('OneSignal user set:', userId);
  } catch (error) {
    console.error('Error setting OneSignal user:', error);
  }
};

export const sendPushNotification = async (content: string, targetUserId: string) => {
  if (ONESIGNAL_APP_ID === 'YOUR_ONESIGNAL_APP_ID') {
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
        include_external_user_ids: [targetUserId], // Target the other user by their ID ('angy' or 'bozy')
        contents: { en: content },
        headings: { en: 'New Message' },
        url: window.location.origin + '/#/messages', // Open the messages page when clicked
      }),
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', options);
    const data = await response.json();
    console.log('Push notification sent:', data);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};
