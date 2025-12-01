import 'package:flutter_test/flutter_test.dart';
import 'package:calculadora_monedero/main.dart';

void main() {
  testWidgets('App title is displayed', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const MyApp());

    // Verify that the app title is displayed.
    expect(find.text('Calculadora Monedero'), findsOneWidget);
  });
}
