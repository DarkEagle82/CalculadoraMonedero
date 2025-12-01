import 'package:flutter_test/flutter_test.dart';
import 'package:myapp/notification_service.dart';
import 'package:timezone/data/latest.dart' as tz;

void main() {
  // Necesario para inicializar la base de datos de zonas horarias para los tests
  setUpAll(() {
    tz.initializeTimeZones();
    // No estableceremos una zona horaria por defecto aquí para evitar el error
  });

  test('calculateNextMonthCost calculates cost correctly for next month', () {
    // 1. ARRANGE
    final notificationService = NotificationService();
    final testDate = DateTime(2024, 5, 15); // Mitad de Mayo
    const menuPrice = 10.0;
    const acogidaPrice = 50.0;

    // Lógica de cálculo de coste para Junio (20 días laborables)
    // (20 días * 10.0 €/día) + 50.0 € = 250.0 €
    const expectedAmount = 250.0;

    // 2. ACT
    final calculatedCost = notificationService.calculateNextMonthCost(testDate, menuPrice, acogidaPrice);

    // 3. ASSERT
    expect(calculatedCost, expectedAmount);
  });
}
