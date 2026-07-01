/**
 * @format
 */

import { AppRegistry, AppState } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType, AndroidStyle, AndroidVisibility } from '@notifee/react-native';
import App from './app/EntryPoint';
import { name as appName } from './app.json';
import { updateTaskScore } from './app/services/task';
import { useUserStore } from './app/store';
import { API_BASE_URL } from './app/services/Config'
import NavigationService from './app/navigation/NavigationService';

// Helper to display task notification with buttons
const displayTaskNotification = async (remoteMessage) => {
    try {
        const { title, body, daily_task_id, options } = remoteMessage.data;
        const optionsObj = options ? (typeof options === 'string' ? JSON.parse(options) : options) : {};

        const choices = Object.entries(optionsObj).map(([score, label]) => {
            const emojis = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣'];
            return {
                title: `${emojis[score] || score}`,
                fullTitle: String(label),
                value: String(score)
            };
        });

        const optionsSummary = Object.entries(optionsObj)
            .map(([score, label]) => `${score}: ${label}`)
            .join('\n');

        const channelId = await notifee.createChannel({
            id: 'task_alerts_v6', // Bumped — v5 may be cached without sound on some devices
            name: 'Task Progress Alerts',
            importance: AndroidImportance.HIGH,
            sound: 'android.resource://com.myspiritualcoach/raw/single_bell',
        });

        const notificationBody = body || 'Select your progress below:';

        await notifee.displayNotification({
            id: daily_task_id ? `local_task_${daily_task_id}` : undefined,
            title: title || 'Task Alert 🕉️',
            body: notificationBody,
            data: { daily_task_id, options, ...remoteMessage.data },
            android: {
                channelId,
                importance: AndroidImportance.HIGH,
                visibility: AndroidVisibility.PUBLIC,
                pressAction: { id: 'default' },
                style: {
                    type: AndroidStyle.BIGTEXT,
                    title: title || 'Task Alert 🕉️',
                    text: notificationBody,
                },
            },
        });
    } catch (error) {
        console.error('Error displaying notification:', error);
    }
};

// Comprehensive handler for all notification events
const handleNotificationEvent = async ({ type, detail }) => {
    const { notification, pressAction, input } = detail;
    console.log(`[Notification Event] Type: ${type}, Action: ${pressAction?.id}, Input: ${input}`);
    if (detail) console.log('[Notification Detail Full]:', JSON.stringify(detail));

    if (type === EventType.ACTION_PRESS) {
        const taskId = notification.data?.daily_task_id;
        const options = notification.data?.options ? (typeof notification.data.options === 'string' ? JSON.parse(notification.data.options) : notification.data.options) : {};
        let score = null;

        // Handle direct score buttons
        if (pressAction?.id === 'score_4') score = 4;
        else if (pressAction?.id === 'score_0') score = 0;
        else if (pressAction?.id === 'open_app') {
            if (taskId) {
                NavigationService.navigate('TaskDetail', { daily_task_id: taskId });
            }
            return;
        }
        // Handle selection input
        else if (pressAction?.id === 'record_score' && input) {
            // Check if input starts with the emoji score (0️⃣, 1️⃣, etc.) or is the label itself
            const inputStr = String(input);
            const scoreMatch = inputStr.match(/([0-4])️⃣/);

            if (scoreMatch) {
                score = parseInt(scoreMatch[1], 10);
            } else {
                for (const [s, label] of Object.entries(options)) {
                    if (label === input) {
                        score = parseInt(s, 10);
                        break;
                    }
                }
            }
        }

        if (taskId && score !== null) {
            console.log(`[Notification Choice] Updating task ${taskId} with score ${score}`);
            try {
                if (!useUserStore.getState().hasHydrated) {
                    await useUserStore.persist.rehydrate();
                }

                // Try store first, fallback to fetch for background safety
                try {
                    await updateTaskScore(taskId, score);
                } catch (storeError) {
                    const token = useUserStore.getState().user?.token;
                    await fetch(`${API_BASE_URL()}/tasks/${taskId}/score`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token ? `Bearer ${token}` : ''
                        },
                        body: JSON.stringify({ score }),
                    });
                }
                await notifee.cancelNotification(notification.id);
            } catch (err) {
                console.error('Failed to update task score from choice notification:', err);
            }
        }
    }
};

// Subscribing to foreground events
notifee.onForegroundEvent(handleNotificationEvent);

// Registering background event handler
notifee.onBackgroundEvent(handleNotificationEvent);

// Register background handler for FCM
messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Background Message:', JSON.stringify(remoteMessage, null, 2));
    const { data } = remoteMessage;
    if (data && data.daily_task_id && data.options) {
        await displayTaskNotification(remoteMessage);
    }
});

// Foreground listener
messaging().onMessage(async remoteMessage => {
    console.log('Foreground Message:', JSON.stringify(remoteMessage, null, 2));
    const { data } = remoteMessage;
    if (data && data.daily_task_id && data.options) {
        await displayTaskNotification(remoteMessage);
    }
});

/**
 * Issue #4 Fix: Show missed notifications when app is opened.
 *
 * FCM "data-only" messages (no notification block) are delivered silently
 * when the app is killed/backgrounded but do NOT automatically display a
 * notification — the background handler runs and calls displayTaskNotification,
 * but if the process was killed before the handler fired, the message is lost.
 *
 * Firebase stores the most-recent message that LAUNCHED the app via
 * messaging().getInitialNotification(). We check this on startup and
 * re-display it if it hasn't been actioned yet (score still 0).
 *
 * We also listen for AppState changes so that if the user switches back to
 * the app from the background we trigger a fresh FCM token/task refresh
 * rather than re-showing a notification (that would already be in the tray).
 */
const checkInitialNotification = async () => {
    try {
        // 1. Was the app opened by tapping a Firebase data message?
        const initialMessage = await messaging().getInitialNotification();
        if (initialMessage) {
            console.log('[Init Notification] App opened via FCM:', JSON.stringify(initialMessage));
            const { data } = initialMessage;
            if (data && data.daily_task_id && data.options) {
                // Display as a notifee notification so the user can act on it
                await displayTaskNotification(initialMessage);
            }
        }

        // 2. Was the app opened by tapping a Notifee notification?
        const initialNotifee = await notifee.getInitialNotification();
        if (initialNotifee) {
            console.log('[Init Notifee] App opened via Notifee tap:', JSON.stringify(initialNotifee));
            // Re-run the event handler so navigation / score-update logic fires
            await handleNotificationEvent({
                type: EventType.PRESS,
                detail: initialNotifee,
            });
        }
    } catch (err) {
        console.error('[Init Notification] Error checking initial notification:', err);
    }
};

// Run the check shortly after the JS bundle loads so the store has time to hydrate
setTimeout(checkInitialNotification, 1500);

AppRegistry.registerComponent(appName, () => App);
