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
    // Solicitar permiso de notificaciones estándar
    await flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.requestNotificationsPermission();
    
    // Solicitar permiso para alarmas exactas (crucial para Android 12+)
    await flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.requestExactAlarmsPermission();
  }

  Future<void> showImmediateNotification(String title, String body) async {
    const AndroidNotificationDetails androidNotificationDetails = AndroidNotificationDetails(
      'immediate_channel',
      'Notificaciones Inmediatas',
      channelDescription: 'Canal para notificaciones instantáneas.',
      importance: Importance.high,
      priority: Priority.high,
    );
    const NotificationDetails notificationDetails = NotificationDetails(android: androidNotificationDetails);

    await flutterLocalNotificationsPlugin.show(
      2, // ID de la notificación
      title,
      body,
      notificationDetails,
    );
  }

  double _calculateNextMonthCost(double menuPrice, double acogidaPrice) {
    final now = DateTime.now();
    final nextMonth = (now.month == 12) ? 1 : now.month + 1;
    final year = (now.month == 12) ? now.year + 1 : now.year;

    final firstDayOfNextMonth = DateTime(year, nextMonth, 1);
    final lastDayOfNextMonth = DateTime(year, nextMonth + 1, 0);

    int schoolDays = 0;
    for (DateTime day = firstDayOfNextMonth;
        day.isBefore(lastDayOfNextMonth.add(const Duration(days: 1)));
        day = day.add(const Duration(days: 1))) {
      final normalizedDay = DateTime(day.year, day.month, day.day);
      if (day.weekday < 6 && !holidays.any((holiday) => isSameDay(holiday, normalizedDay))) {
        schoolDays++;
      }
    }
    return (schoolDays * menuPrice) + acogidaPrice;
  }

  Future<void> scheduleMonthlyReminder(double menuPrice, double acogidaPrice) async {
    await flutterLocalNotificationsPlugin.cancel(0); 

    final double amountForNextMonth = _calculateNextMonthCost(menuPrice, acogidaPrice);
    final String notificationBody = 'Recuerda añadir ${amountForNextMonth.toStringAsFixed(2)} € para cubrir los gastos del próximo mes.';

    const AndroidNotificationDetails androidNotificationDetails = AndroidNotificationDetails(
      'monthly_reminder_channel',
      'Recordatorio Mensual del Monedero',
      channelDescription: 'Notificación para recordar añadir saldo al monedero a fin de mes.',
      importance: Importance.high,
      priority: Priority.high,
    );
    const NotificationDetails notificationDetails = NotificationDetails(android: androidNotificationDetails);

    await flutterLocalNotificationsPlugin.zonedSchedule(
      0,
      'Recordatorio de Monedero',
      notificationBody,
      _nextInstanceOfLastDayOfMonth(),
      notificationDetails,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
      matchDateTimeComponents: DateTimeComponents.dayOfMonthAndTime,
    );
  }

  tz.TZDateTime _nextInstanceOfLastDayOfMonth() {
    final tz.TZDateTime now = tz.TZDateTime.now(tz.local);
    tz.TZDateTime scheduledDate = tz.TZDateTime(tz.local, now.year, now.month, 1, 10);
    scheduledDate = tz.TZDateTime(tz.local, scheduledDate.year, scheduledDate.month + 1, 0, 10);

    if (now.isAfter(scheduledDate)) {
      scheduledDate = tz.TZDateTime(tz.local, now.year, now.month + 2, 0, 10);
    }

    return scheduledDate;
  }
}
