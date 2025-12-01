import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz;
import 'package:myapp/holidays.dart';

class NotificationService {
  static final NotificationService _notificationService = NotificationService._internal();

  factory NotificationService() {
    return _notificationService;
  }

  NotificationService._internal();

  final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

  Future<void> init() async {
    tz.initializeTimeZones();
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const InitializationSettings initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
    );

    await flutterLocalNotificationsPlugin.initialize(initializationSettings);
  }
  
  Future<void> requestPermissions() async {
    await flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.requestExactAlarmsPermission();
  }

  double calculateNextMonthCost(DateTime currentDate, double menuPrice, double acogidaPrice) {
    final nextMonthDate = DateTime(currentDate.year, currentDate.month + 1, 1);
    final year = nextMonthDate.year;
    final month = nextMonthDate.month;

    final firstDayOfMonth = DateTime(year, month, 1);
    final lastDayOfMonth = DateTime(year, month + 1, 0);

    int schoolDays = 0;
    for (DateTime day = firstDayOfMonth; day.isBefore(lastDayOfMonth.add(const Duration(days: 1))); day = day.add(const Duration(days: 1))) {
      if (day.weekday >= 1 && day.weekday <= 5) { // Lunes a Viernes
        final normalizedDay = DateTime(day.year, day.month, day.day);
        if (!holidays.any((holiday) => isSameDay(holiday, normalizedDay))) {
          schoolDays++;
        }
      }
    }
    return (schoolDays * menuPrice) + acogidaPrice;
  }

  tz.TZDateTime _nextInstanceOfLastDayOfMonth(DateTime currentDate) {
    final tz.TZDateTime now = tz.TZDateTime.from(currentDate, tz.local);
    
    tz.TZDateTime scheduledDate = tz.TZDateTime(tz.local, now.year, now.month + 1, 0, 10, 0);

    if (now.isAfter(scheduledDate)) {
        scheduledDate = tz.TZDateTime(tz.local, now.year, now.month + 2, 0, 10, 0);
    }
    
    return scheduledDate;
  }

  Future<void> scheduleMonthlyReminder(DateTime currentDate, double menuPrice, double acogidaPrice) async {
    await flutterLocalNotificationsPlugin.cancel(0);

    final double amountForNextMonth = calculateNextMonthCost(currentDate, menuPrice, acogidaPrice);
    final String notificationBody = 'Recuerda añadir ${amountForNextMonth.toStringAsFixed(2)} € para cubrir los gastos del próximo mes.';
    final tz.TZDateTime scheduledDate = _nextInstanceOfLastDayOfMonth(currentDate);

    debugPrint("Scheduling notification with body: $notificationBody");
    debugPrint("Calculated schedule date: $scheduledDate");

    const AndroidNotificationDetails androidNotificationDetails = AndroidNotificationDetails(
      'monthly_reminder_channel',
      'Recordatorio Mensual del Monedero',
      channelDescription: 'Notificación para recordar añadir saldo al monedero a fin de mes.',
      importance: Importance.max,
      priority: Priority.high,
    );
    const NotificationDetails notificationDetails = NotificationDetails(android: androidNotificationDetails);

    await flutterLocalNotificationsPlugin.zonedSchedule(
      0,
      'Recordatorio de Monedero',
      notificationBody,
      scheduledDate,
      notificationDetails,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      matchDateTimeComponents: DateTimeComponents.dayOfMonthAndTime,
    );
  }
}
