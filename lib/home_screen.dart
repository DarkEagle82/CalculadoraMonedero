import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:myapp/alarm_helpers.dart';
import 'package:myapp/notification_service.dart';
import 'package:provider/provider.dart';
import 'package:myapp/theme_provider.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:myapp/holidays.dart';
import 'package:myapp/app_constants.dart'; // Importar constantes

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final NotificationService _notificationService = NotificationService();

  DateTime? startDate;
  DateTime? endDate;
  int schoolDays = 0;
  double totalMoneder = 0.0;
  double amountToAdd = 0.0;
  double menuPrice = AppConstants.defaultMenuPrice; // Valor por defecto
  double acogidaPrice = AppConstants.defaultAcogidaPrice; // Valor por defecto

  DateTime _focusedDay = DateTime.now();

  late final TextEditingController _menuPriceController;
  late final TextEditingController _acogidaPriceController;
  late final TextEditingController _totalMonederoController;

  @override
  void initState() {
    super.initState();
    _menuPriceController = TextEditingController();
    _acogidaPriceController = TextEditingController();
    _totalMonederoController = TextEditingController();

    _loadPrices();
    _notificationService.requestPermissions().then((_) {
      _scheduleInitialAlarm(); // Programar la alarma automáticamente
    });
  }

  @override
  void dispose() {
    _menuPriceController.dispose();
    _acogidaPriceController.dispose();
    _totalMonederoController.dispose();
    super.dispose();
  }

  Future<void> _scheduleInitialAlarm() async {
    final prefs = await SharedPreferences.getInstance();
    final bool isAlarmScheduled = prefs.getBool('isAlarmScheduled') ?? false;

    if (!isAlarmScheduled) {
      scheduleMonthlyAlarm();
      await prefs.setBool('isAlarmScheduled', true);
      debugPrint("Alarma mensual inicial programada automáticamente.");
    }
  }

  Future<void> _loadPrices() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      menuPrice = prefs.getDouble('menuPrice') ?? AppConstants.defaultMenuPrice;
      acogidaPrice = prefs.getDouble('acogidaPrice') ?? AppConstants.defaultAcogidaPrice;
      _menuPriceController.text = menuPrice.toString();
      _acogidaPriceController.text = acogidaPrice.toString();
    });
  }

  Future<void> _savePrices() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setDouble('menuPrice', menuPrice);
    await prefs.setDouble('acogidaPrice', acogidaPrice);
  }

  void calculateDays() {
    if (startDate == null || endDate == null) return;

    int count = 0;
    for (
      DateTime date = startDate!;
      date.isBefore(endDate!.add(const Duration(days: 1)));
      date = date.add(const Duration(days: 1))
    ) {
      final normalizedDate = DateTime(date.year, date.month, date.day);
      if (!holidays.any((holiday) => isSameDay(holiday, normalizedDate)) &&
          date.weekday < 6) {
        count++;
      }
    }

    setState(() {
      schoolDays = count;
      amountToAdd = (schoolDays * menuPrice + acogidaPrice - totalMoneder);
    });
  }

  bool isSelectable(DateTime day) {
    final normalizedDay = DateTime(day.year, day.month, day.day);
    return day.weekday < 6 &&
        !holidays.any((holiday) => isSameDay(holiday, normalizedDay));
  }

  bool isInRange(DateTime day) {
    if (startDate == null || endDate == null) return false;
    final normalizedDay = DateTime(day.year, day.month, day.day);
    return !normalizedDay.isBefore(
          DateTime(startDate!.year, startDate!.month, startDate!.day),
        ) &&
        !normalizedDay.isAfter(
          DateTime(endDate!.year, endDate!.month, endDate!.day),
        );
  }

  bool isWorkDayInRange(DateTime day) {
    final normalizedDay = DateTime(day.year, day.month, day.day);
    return isInRange(day) &&
        !holidays.any((holiday) => isSameDay(holiday, normalizedDay)) &&
        day.weekday < 6;
  }

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Calculadora de Monedero'),
        actions: [
          IconButton(
            icon: const Icon(Icons.science_outlined),
            onPressed: () {
              scheduleTestMonthlyAlarm();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text(
                    'Alarma de prueba mensual programada para dentro de 10 segundos.',
                  ),
                  duration: Duration(seconds: 3),
                ),
              );
            },
            tooltip: 'Probar Alarma Mensual',
          ),
          IconButton(
            icon: Icon(
              themeProvider.themeMode == ThemeMode.dark
                  ? Icons.light_mode
                  : Icons.dark_mode,
            ),
            onPressed: () => themeProvider.toggleTheme(),
            tooltip: 'Cambiar Tema',
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: SingleChildScrollView(
          child: Column(
            children: [
              TableCalendar(
                availableCalendarFormats: const {CalendarFormat.month: 'Month'},
                locale: 'es_ES',
                startingDayOfWeek: StartingDayOfWeek.monday,
                firstDay: DateTime.utc(2023, 1, 1),
                lastDay: DateTime.utc(2030, 12, 31),
                focusedDay: _focusedDay,
                selectedDayPredicate: (day) =>
                    isSameDay(startDate, day) || isSameDay(endDate, day),
                onDaySelected: (selectedDay, focusedDay) {
                  if (!isSelectable(selectedDay)) return;
                  setState(() {
                    _focusedDay = focusedDay;

                    if (startDate == null || endDate != null) {
                      startDate = selectedDay;
                      endDate = null;
                    } else if (selectedDay.isBefore(startDate!)) {
                      endDate = startDate;
                      startDate = selectedDay;
                    } else {
                      endDate = selectedDay;
                    }
                    calculateDays();
                  });
                },
                onPageChanged: (focusedDay) {
                  _focusedDay = focusedDay;
                },
                calendarBuilders: CalendarBuilders(
                  defaultBuilder: (context, day, focusedDay) {
                    Color? bgColor;
                    if (holidays.any((h) => isSameDay(h, day)) ||
                        day.weekday >= 6) {
                      bgColor = Colors.red[300];
                    } else if (isWorkDayInRange(day)) {
                      bgColor = Colors.green[300];
                    } else if (isInRange(day)) {
                      bgColor = Colors.red[100];
                    }

                    return Container(
                      margin: const EdgeInsets.all(4.0),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: bgColor,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '${day.day}',
                        style: TextStyle(
                          color: (bgColor != null && bgColor != Colors.red[100])
                              ? Colors.white
                              : Colors.black,
                        ),
                      ),
                    );
                  },
                  selectedBuilder: (context, day, focusedDay) {
                    return Container(
                      margin: const EdgeInsets.all(4.0),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: Colors.blue[600],
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '${day.day}',
                        style: const TextStyle(color: Colors.white),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _menuPriceController,
                      decoration: const InputDecoration(
                        labelText: "Precio menú diario",
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      onChanged: (val) {
                        setState(() {
                          menuPrice =
                              double.tryParse(val.replaceAll(',', '.')) ?? 0;
                          calculateDays();
                          _savePrices();
                        });
                      },
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextField(
                      controller: _acogidaPriceController,
                      decoration: const InputDecoration(
                        labelText: "Precio acogida",
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      onChanged: (val) {
                        setState(() {
                          acogidaPrice =
                              double.tryParse(val.replaceAll(',', '.')) ?? 0;
                          calculateDays();
                          _savePrices();
                        });
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              TextField(
                controller: _totalMonederoController,
                decoration: const InputDecoration(
                  labelText: "Total actual en el monedero",
                  border: OutlineInputBorder(),
                ),
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                onChanged: (val) {
                  setState(() {
                    totalMoneder =
                        double.tryParse(val.replaceAll(',', '.')) ?? 0;
                    calculateDays();
                  });
                },
              ),
              const SizedBox(height: 20),
              Text(
                "Días lectivos calculados: $schoolDays",
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 10),
              Text(
                "Importe a añadir: €${amountToAdd.toStringAsFixed(2)}",
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
