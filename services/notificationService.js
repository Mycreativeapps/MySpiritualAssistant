const admin = require('firebase-admin');

// Initialize Firebase Admin
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
        if (admin.apps.length === 0) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('Firebase initialized successfully');
        }
    } catch (err) {
        console.error('Error initializing Firebase:', err.message);
    }
} else {
    console.warn('FIREBASE_SERVICE_ACCOUNT_JSON not found in environment. Notifications will be disabled.');
}

/**
 * Sends a push notification to a specific device.
 * @param {string} token - FCM registration token
 * @param {Object} payload - Notification data { title, body }
 */
const sendNotification = async (token, payload) => {
    if (!admin.apps.length || !token) return;

    const message = {
        data: payload.data || {},
        token: token,
        android: {
            priority: 'high',
        },
        apns: {
            payload: {
                aps: {
                    contentAvailable: true,
                },
            },
        },
    };

    if (payload.title) {
        message.notification = {
            title: payload.title,
            body: payload.body,
        };
        message.android.notification = {
            channelId: 'task_alerts_v4',
            sound: 'single_bell.mp3'
        };
        message.apns.payload.aps.sound = 'single_bell.mp3';
    }

    try {
        const response = await admin.messaging().send(message);
        console.log('Notification sent successfully:', response);
        return response;
    } catch (error) {
        console.error('Error sending notification:', error);
        // If token is invalid, we might want to remove it from DB
        if (error.code === 'messaging/registration-token-not-registered') {
            console.log('FCM token no longer valid. Should cleanup.');
        }
    }
};

module.exports = { sendNotification };
