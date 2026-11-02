import { isHoliday, isWeekend, HolidayEntry } from '../constants/holidays';

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export interface NextMonthCostResult {
  year: number;
  monthIndex: number; // 0-11
  monthName: string;
  firstDay: Date;
  lastDay: Date;
  schoolDays: number;
  totalCost: number;
}

export class NotificationService {
  /**
   * Calculates next month's school days and estimated cost based on menu and acogida prices.
   * Mirrors `calculateNextMonthCost` in lib/notification_service.dart
   */
  static calculateNextMonthCost(
    currentDate: Date,
    menuPrice: number,
    acogidaPrice: number,
    holidaysList?: HolidayEntry[]
  ): NextMonthCostResult {
    // Next month: JS Date constructor handles overflow automatically
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11

    const nextMonthIndex = (currentMonth + 1) % 12;
    const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;

    const firstDay = new Date(nextMonthYear, nextMonthIndex, 1);
    // Passing 0 as the day returns the last day of the previous month
    const lastDay = new Date(nextMonthYear, nextMonthIndex + 1, 0);

    let schoolDays = 0;
    const cursor = new Date(firstDay);

    while (cursor <= lastDay) {
      if (!isWeekend(cursor) && !isHoliday(cursor, holidaysList)) {
        schoolDays++;
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    const totalCost = Number(((schoolDays * menuPrice) + acogidaPrice).toFixed(2));

    return {
      year: nextMonthYear,
      monthIndex: nextMonthIndex,
      monthName: MONTH_NAMES_ES[nextMonthIndex],
      firstDay,
      lastDay,
      schoolDays,
      totalCost,
    };
  }

  /**
   * Calculates the next instance of the last day of the month at 10:00 AM
   */
  static getNextScheduledDate(currentDate: Date = new Date()): Date {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Last day of current month at 10:00:00
    let scheduledDate = new Date(year, month + 1, 0, 10, 0, 0);

    if (currentDate.getTime() > scheduledDate.getTime()) {
      // If already past this month's last day 10:00 AM, schedule for next month's last day
      scheduledDate = new Date(year, month + 2, 0, 10, 0, 0);
    }

    return scheduledDate;
  }

  /**
   * Request permission for Web Notifications
   */
  static async requestPermissions(): Promise<NotificationPermission> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        return await Notification.requestPermission();
      } catch (e) {
        console.warn('Error requesting notification permission:', e);
        return 'denied';
      }
    }
    return 'denied';
  }

  /**
   * Schedules or updates monthly reminder settings in localStorage & triggers notification if supported
   */
  static scheduleMonthlyReminder(
    currentDate: Date,
    menuPrice: number,
    acogidaPrice: number,
    holidaysList?: HolidayEntry[]
  ): { scheduledDate: Date; nextMonthInfo: NextMonthCostResult; message: string } {
    const nextMonthInfo = this.calculateNextMonthCost(currentDate, menuPrice, acogidaPrice, holidaysList);
    const scheduledDate = this.getNextScheduledDate(currentDate);

    const message = `Recuerda añadir ${nextMonthInfo.totalCost.toFixed(2)} € para cubrir los gastos de ${nextMonthInfo.monthName}.`;

    try {
      localStorage.setItem('isAlarmScheduled', 'true');
      localStorage.setItem('lastScheduledDate', scheduledDate.toISOString());
      localStorage.setItem('scheduledAmount', nextMonthInfo.totalCost.toString());
      localStorage.setItem('scheduledMonth', nextMonthInfo.monthName);
    } catch {
      // Local storage fallback
    }

    // If permission is already granted, we can also post a reminder notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Recordatorio Mensual de Monedero Programado', {
          body: `Programado para el ${scheduledDate.toLocaleDateString('es-ES')}: ${message}`,
          icon: '/assets/icon/icon.png',
        });
      } catch {
        // Notification API can fail in non-secure or iframe contexts
      }
    }

    return {
      scheduledDate,
      nextMonthInfo,
      message,
    };
  }

  /**
   * Fires an immediate notification for testing or immediate reminder
   */
  static showImmediateNotification(title: string, body: string): boolean {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/assets/icon/icon.png',
        });
        return true;
      } catch (e) {
        console.warn('Failed to display browser notification:', e);
      }
    }
    return false;
  }
}
