import { LocalNotifications, ScheduleOptions } from "@capacitor/local-notifications";

// Notification IDs
const MEAL_REMINDER_ID = 1001;
const SHOPPING_REMINDER_ID = 1002;

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const perm = await LocalNotifications.requestPermissions();
    return perm.display === "granted";
  } catch {
    return false;
  }
}

export async function checkNotificationPermission(): Promise<boolean> {
  try {
    const perm = await LocalNotifications.checkPermissions();
    return perm.display === "granted";
  } catch {
    return false;
  }
}

export async function scheduleMealReminder(enabled: boolean, hour: number = 17): Promise<void> {
  try {
    // Cancel existing meal reminders
    await LocalNotifications.cancel({ notifications: [{ id: MEAL_REMINDER_ID }] });

    if (!enabled) return;

    // Schedule daily reminder
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, 0, 0, 0);

    // If the time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const options: ScheduleOptions = {
      notifications: [
        {
          id: MEAL_REMINDER_ID,
          title: "What's for dinner? 🧈",
          body: "Butter's ready to help plan tonight's meal!",
          schedule: {
            at: scheduledTime,
            repeats: true,
            every: "day",
          },
          sound: "default",
          smallIcon: "ic_stat_butter",
          largeIcon: "ic_launcher",
        },
      ],
    };

    await LocalNotifications.schedule(options);
  } catch (e) {
    console.error("Failed to schedule meal reminder:", e);
  }
}

export async function scheduleShoppingReminder(enabled: boolean, dayOfWeek: number = 6, hour: number = 10): Promise<void> {
  try {
    // Cancel existing shopping reminders
    await LocalNotifications.cancel({ notifications: [{ id: SHOPPING_REMINDER_ID }] });

    if (!enabled) return;

    // Schedule weekly reminder (default: Saturday at 10am)
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, 0, 0, 0);

    // Calculate days until target day of week
    const currentDay = now.getDay();
    let daysUntil = dayOfWeek - currentDay;
    if (daysUntil < 0 || (daysUntil === 0 && scheduledTime <= now)) {
      daysUntil += 7;
    }
    scheduledTime.setDate(now.getDate() + daysUntil);

    const options: ScheduleOptions = {
      notifications: [
        {
          id: SHOPPING_REMINDER_ID,
          title: "Time to shop! 🛒",
          body: "Check your shopping list before heading out.",
          schedule: {
            at: scheduledTime,
            repeats: true,
            every: "week",
          },
          sound: "default",
          smallIcon: "ic_stat_butter",
          largeIcon: "ic_launcher",
        },
      ],
    };

    await LocalNotifications.schedule(options);
  } catch (e) {
    console.error("Failed to schedule shopping reminder:", e);
  }
}

export async function cancelAllReminders(): Promise<void> {
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: MEAL_REMINDER_ID }, { id: SHOPPING_REMINDER_ID }],
    });
  } catch (e) {
    console.error("Failed to cancel reminders:", e);
  }
}

export async function getScheduledNotifications() {
  try {
    const pending = await LocalNotifications.getPending();
    return pending.notifications;
  } catch {
    return [];
  }
}
