import 'package:android_alarm_manager_plus/android_alarm_manager_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:myapp/notification_service.dart';
import 'package:flutter/foundation.dart';
import 'package:myapp/holidays.dart';
import 'package:myapp/app_constants.dart'; // Importar constantes

const int monthlyAlarmId = 1;
const int testMonthlyAlarmId = 2; // ID para la alarma de prueba

int calculateWorkingDays(int year, int month) {
  int workingDays = 0;
  final daysInMonth = DateTime(year, month + 1, 0).day;

  for (int day = 1; day <= daysInMonth; day++) {
    final date = DateTime(year, month, day);
    if (date.weekday != 6 && date.weekday != 7) {
      if (!holidays.any((holiday) => holiday.year == date.year && holiday.month == date.month && holiday.day == date.day)) {
        workingDays++;
      }
    }
  }
  return workingDays;
}

@pragma('vm:entry-point')
void fireMonthlyAlarm() async {
  debugPrint("¡La alarma mensual se ha disparado! Ejecutando en segundo plano.");

  final NotificationService notificationService = NotificationService();
  await notificationService.init();

  final prefs = await SharedPreferences.getInstance();
  // Usar los valores por defecto desde AppConstants
  final double menuPrice = prefs.getDouble('menuPrice') ?? AppConstants.defaultMenuPrice;
  final double acogidaPrice = prefs.getDouble('acogidaPrice') ?? AppConstants.defaultAcogidaPrice;

  final now = DateTime.now();
  final nextMonth = (now.month == 12) ? 1 : now.month + 1;
  final year = (now.month == 12) ? now.year + 1 : now.year;
  
  final workingDays = calculateWorkingDays(year, nextMonth);
  final totalAmount = (workingDays * menuPrice) + acogidaPrice;

  final title = '🔔 Recordatorio de Pago del Monedero 🔔';
  final body = 'Debes ingresar un total de ${totalAmount.toStringAsFixed(2)}€ para el próximo mes.';

  await notificationService.showImmediateNotification(title, body);

  // Re-programar la alarma para el mes siguiente
  scheduleMonthlyAlarm(); 
}

void scheduleMonthlyAlarm() {
  final now = DateTime.now();
  
  // Calcula la hora de la alarma: 10:00 en el último día del mes actual.
  final lastDayOfThisMonth = DateTime(now.year, now.month + 1, 0);
  var scheduleTime = DateTime(lastDayOfThisMonth.year, lastDayOfThisMonth.month, lastDayOfThisMonth.day, 10, 0);

  // Si la hora de la alarma para el mes actual ya ha pasado, prográmala para el último día del mes SIGUIENTE.
  if (scheduleTime.isBefore(now)) {
    final lastDayOfNextMonth = DateTime(now.year, now.month + 2, 0);
    scheduleTime = DateTime(lastDayOfNextMonth.year, lastDayOfNextMonth.month, lastDayOfNextMonth.day, 10, 0);
  }

  AndroidAlarmManager.oneShot(
    scheduleTime.difference(now),
    monthlyAlarmId,
    fireMonthlyAlarm,
    exact: true,
    wakeup: true,
  );
  debugPrint("Alarma mensual programada para el $scheduleTime.");
}


// Nueva función para probar la alarma en 10 segundos
void scheduleTestMonthlyAlarm() {
  AndroidAlarmManager.oneShot(
    const Duration(seconds: 10),
    testMonthlyAlarmId,
    fireMonthlyAlarm, // Reutilizamos la misma función de la alarma
    exact: true,
    wakeup: true,
  );
  debugPrint("Alarma de prueba mensual programada para dentro de 10 segundos.");
}
