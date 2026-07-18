/**
 * notificationScheduler.ts
 *
 * Schedules LOCAL trigger notifications via Notifee (Android AlarmManager).
 * These fire at EXACT scheduled_time without needing a network connection
 * or server cron job. The server cron remains a fallback for devices where
 * the app hasn't been opened that day.
 *
 * Flow:
 *  1. User opens app / tasks are fetched  → scheduleTaskNotifications()
 *  2. User completes a task               → cancelTaskNotification(taskId)
 *  3. User logs out / tasks reset         → cancelAllTaskNotifications()
 */

import notifee, {
  TriggerType,
  AndroidImportance,
  AndroidStyle,
  AndroidVisibility,
  TimestampTrigger,
} from '@notifee/react-native';
import { Platform } from 'react-native';
import { DailyTask } from '../store/taskStore';

const CHANNEL_ID = 'task_alerts_v6'; // Bumped to force fresh channel with correct sound
const TASK_ID_PREFIX = 'local_task_';

// Use explicit Android resource URI for the sound.
// A bare filename string can fail in release builds where resource names
// get processed differently by R8/ProGuard shrinking.
const SOUND_URI = 'android.resource://com.myspiritualcoach/raw/single_bell';

/** Ensure the notification channel exists (idempotent). */
const ensureChannel = async () => {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Task Progress Alerts',
    importance: AndroidImportance.HIGH,
    sound: SOUND_URI,
  });
};

/**
 * Convert a "HH:mm" or "HH:mm:ss" string AND a "YYYY-MM-DD" date string to unix timestamp (ms).
 * Returns null if the time cannot be parsed or has already passed.
 */
const getTimestampForDate = (scheduledTime: string, scheduledDate: string): number | null => {
  if (!scheduledTime || !scheduledDate) return null;

  const parts = scheduledTime.split(':');
  if (parts.length < 2) return null;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parts[2] ? parseInt(parts[2], 10) : 0;

  if (isNaN(hours) || isNaN(minutes)) return null;

  const dateParts = scheduledDate.split('-');
  if (dateParts.length < 3) return null;
  
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // 0-indexed
  const day = parseInt(dateParts[2], 10);

  const target = new Date(year, month, day, hours, minutes, seconds, 0);

  // If this time has already passed, don't schedule
  if (target.getTime() <= Date.now()) return null;

  return target.getTime();
};

/**
 * Build a short options summary to show in the expanded notification body.
 * e.g. "1: Didn't do  |  10: Completed"
 */
const buildOptionsSummary = (options: any): string => {
  if (!options) return '';
  const obj =
    typeof options === 'string' ? JSON.parse(options) : options;
  return Object.entries(obj)
    .map(([score, label]) => `${score}: ${label}`)
    .join('  |  ');
};

/**
 * Schedule local trigger notifications for all PENDING tasks today.
 * Call this every time tasks are fetched/refreshed.
 */
export const scheduleTaskNotifications = async (
  tasks: DailyTask[],
): Promise<void> => {
  if (Platform.OS !== 'android') {
    // iOS trigger notifications need extra entitlements; skip for now
    return;
  }

  try {
    await ensureChannel();

    // Cancel previously scheduled local notifications before re-scheduling
    await cancelAllTaskNotifications();

    let scheduled = 0;
    let skipped = 0;

    for (const task of tasks) {
      if (task.notifications_enabled === false) {
        skipped++;
        continue;
      }

      // Check if max score is reached
      let optionsObj: any = {};
      if (task.options) {
        optionsObj = typeof task.options === 'string' ? JSON.parse(task.options) : task.options;
      }
      const scores = Object.keys(optionsObj).map(Number).filter(n => !isNaN(n));
      const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
      
      // Skip if already completed to max score
      if (maxScore > 0 && task.score >= maxScore) {
        skipped++;
        continue;
      }
      if (maxScore === 0 && task.score > 0) {
        skipped++;
        continue;
      }

      let nTimes: string[] = [];
      if (Array.isArray(task.notification_times)) {
        nTimes = task.notification_times;
      } else if (typeof task.notification_times === 'string') {
        try { nTimes = JSON.parse(task.notification_times); } catch (e) { nTimes = []; }
      }
      
      const timesToCheck = (nTimes && nTimes.length > 0) ? nTimes : (task.scheduled_time ? [task.scheduled_time] : []);
      
      if (timesToCheck.length === 0) {
        skipped++;
        continue;
      }

      const optionsSummary = buildOptionsSummary(task.options);
      const titleText = `🕉️ ${task.task_name}`;
      const bodyText = 'Time for your spiritual practice!';

      for (let i = 0; i < timesToCheck.length; i++) {
        const timeStr = timesToCheck[i];
        
        // Use task date if available, fallback to today's date if missing for some reason
        const taskDate = (task as any).date || new Date().toISOString().split('T')[0];
        const timestamp = getTimestampForDate(timeStr, taskDate);
        
        if (!timestamp) {
          skipped++;
          continue;
        }

        const trigger: TimestampTrigger = {
          type: TriggerType.TIMESTAMP,
          timestamp,
          alarmManager: {
            allowWhileIdle: true,
          },
        };

        await notifee.createTriggerNotification(
          {
            id: `${TASK_ID_PREFIX}${task.daily_task_id}_${i}`,
            title: titleText,
            body: bodyText,
            data: {
              daily_task_id: String(task.daily_task_id),
              options: JSON.stringify(optionsObj),
              title: titleText,
              body: bodyText,
            },
            android: {
              channelId: CHANNEL_ID,
              importance: AndroidImportance.HIGH,
              visibility: AndroidVisibility.PUBLIC,
              pressAction: { id: 'default' },
              style: {
                type: AndroidStyle.BIGTEXT,
                title: titleText,
                text: bodyText,
              },
            },
          },
          trigger,
        );

        console.log(
          `[Scheduler] ✅ Scheduled "${task.task_name}" at ${new Date(timestamp).toLocaleString('en-IN')}`,
        );
        scheduled++;
      }
    }

    console.log(
      `[Scheduler] Done — ${scheduled} scheduled, ${skipped} skipped.`,
    );
  } catch (err) {
    console.error('[Scheduler] Error scheduling notifications:', err);
  }
};

/**
 * Cancel the local trigger notification for a single task.
 * Call this immediately after a task score is updated (task completed).
 */
export const cancelTaskNotification = async (
  taskId: number | string,
): Promise<void> => {
  try {
    const triggerNotifications = await notifee.getTriggerNotifications();
    const taskOnes = triggerNotifications.filter(n =>
      n.notification.id === `${TASK_ID_PREFIX}${taskId}` ||
      n.notification.id?.startsWith(`${TASK_ID_PREFIX}${taskId}_`)
    );

    await Promise.all(
      taskOnes.map(n =>
        notifee.cancelTriggerNotification(n.notification.id!),
      ),
    );
    console.log(`[Scheduler] Cancelled ${taskOnes.length} notifications for task ${taskId}`);
  } catch (err) {
    console.error(
      `[Scheduler] Error cancelling notification for task ${taskId}:`,
      err,
    );
  }
};

/**
 * Cancel ALL locally scheduled task notifications.
 * Call this on logout or when tasks are fully reset.
 */
export const cancelAllTaskNotifications = async (): Promise<void> => {
  try {
    const triggerNotifications = await notifee.getTriggerNotifications();
    const taskOnes = triggerNotifications.filter(n =>
      n.notification.id?.startsWith(TASK_ID_PREFIX),
    );

    await Promise.all(
      taskOnes.map(n =>
        notifee.cancelTriggerNotification(n.notification.id!),
      ),
    );

    if (taskOnes.length > 0) {
      console.log(
        `[Scheduler] Cancelled ${taskOnes.length} scheduled notifications.`,
      );
    }
  } catch (err) {
    console.error('[Scheduler] Error cancelling all notifications:', err);
  }
};
