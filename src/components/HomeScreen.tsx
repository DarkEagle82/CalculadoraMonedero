import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bell,
  Sun,
  Moon,
  Calendar as CalendarIcon,
  Sparkles,
  Info,
  CheckCircle2,
  X,
  CreditCard,
  Utensils,
  Clock,
  Euro,
  RotateCcw,
  Settings,
} from 'lucide-react';
import { Calendar } from './Calendar';
import { AppConstants } from '../constants/appConstants';
import { isHoliday, isWeekend, HOLIDAYS_DATA } from '../constants/holidays';
import { NotificationService } from '../services/notificationService';
import { useTheme } from '../context/ThemeContext';

export const HomeScreen: React.FC = () => {
  const { themeMode, toggleTheme } = useTheme();

  // State
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [focusedMonth, setFocusedMonth] = useState<Date>(() => new Date());

  const [menuPriceStr, setMenuPriceStr] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(AppConstants.STORAGE_KEY_CURRENT_MENU);
      if (saved) return saved;
      return AppConstants.getDefaultMenuPrice().toString();
    } catch {
      return AppConstants.getDefaultMenuPrice().toString();
    }
  });

  const [acogidaPriceStr, setAcogidaPriceStr] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(AppConstants.STORAGE_KEY_CURRENT_ACOGIDA);
      if (saved) return saved;
      return AppConstants.getDefaultAcogidaPrice().toString();
    } catch {
      return AppConstants.getDefaultAcogidaPrice().toString();
    }
  });

  const [totalMonederoStr, setTotalMonederoStr] = useState<string>('0');

  // Parsed numerical values
  const menuPrice = useMemo(() => {
    const val = parseFloat(menuPriceStr.replace(',', '.'));
    return isNaN(val) ? 0 : val;
  }, [menuPriceStr]);

  const acogidaPrice = useMemo(() => {
    const val = parseFloat(acogidaPriceStr.replace(',', '.'));
    return isNaN(val) ? 0 : val;
  }, [acogidaPriceStr]);

  const totalMonedero = useMemo(() => {
    const val = parseFloat(totalMonederoStr.replace(',', '.'));
    return isNaN(val) ? 0 : val;
  }, [totalMonederoStr]);

  // SnackBar / Toast state
  const [snackBarMessage, setSnackBarMessage] = useState<string | null>(null);
  const [showHolidaysModal, setShowHolidaysModal] = useState<boolean>(false);
  const [showReminderModal, setShowReminderModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [settingMenuStr, setSettingMenuStr] = useState<string>('');
  const [settingAcogidaStr, setSettingAcogidaStr] = useState<string>('');

  // Save current prices on change
  useEffect(() => {
    try {
      localStorage.setItem(AppConstants.STORAGE_KEY_CURRENT_MENU, menuPriceStr);
      localStorage.setItem(AppConstants.STORAGE_KEY_CURRENT_ACOGIDA, acogidaPriceStr);
    } catch {
      // ignore
    }
  }, [menuPriceStr, acogidaPriceStr]);

  const openSettingsModal = () => {
    setSettingMenuStr(AppConstants.getDefaultMenuPrice().toString());
    setSettingAcogidaStr(AppConstants.getDefaultAcogidaPrice().toString());
    setShowSettingsModal(true);
  };

  const handleSaveDefaults = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsedMenu = parseFloat(settingMenuStr.replace(',', '.'));
    const parsedAcogida = parseFloat(settingAcogidaStr.replace(',', '.'));

    if (isNaN(parsedMenu) || parsedMenu < 0 || isNaN(parsedAcogida) || parsedAcogida < 0) {
      setSnackBarMessage('Por favor introduce precios válidos (números mayores o iguales a 0).');
      return;
    }

    AppConstants.saveDefaultPrices(parsedMenu, parsedAcogida);
    setMenuPriceStr(parsedMenu.toString());
    setAcogidaPriceStr(parsedAcogida.toString());

    setShowSettingsModal(false);
    setSnackBarMessage(`Nuevos precios por defecto guardados: Menú ${parsedMenu.toFixed(2)} €, Acogida ${parsedAcogida.toFixed(2)} €.`);
    setTimeout(() => setSnackBarMessage(null), 3500);
  };

  const handleResetFactoryDefaults = () => {
    AppConstants.resetToFactoryDefaults();
    setSettingMenuStr(AppConstants.factoryMenuPrice.toString());
    setSettingAcogidaStr(AppConstants.factoryAcogidaPrice.toString());
    setMenuPriceStr(AppConstants.factoryMenuPrice.toString());
    setAcogidaPriceStr(AppConstants.factoryAcogidaPrice.toString());
    setShowSettingsModal(false);
    setSnackBarMessage(`Restablecido a valores de fábrica: Menú ${AppConstants.factoryMenuPrice.toFixed(2)} €, Acogida ${AppConstants.factoryAcogidaPrice.toFixed(2)} €.`);
    setTimeout(() => setSnackBarMessage(null), 3500);
  };

  // Initial alarm auto-scheduling mirroring Flutter initState:
  // _loadPrices(); _notificationService.requestPermissions(); _scheduleInitialAlarm();
  useEffect(() => {
    try {
      const isAlarmScheduled = localStorage.getItem('isAlarmScheduled') === 'true';
      if (!isAlarmScheduled) {
        NotificationService.scheduleMonthlyReminder(new Date(), menuPrice, acogidaPrice);
        console.log('Alarma mensual inicial programada automáticamente.');
      }
    } catch {
      // ignore
    }
  }, [menuPrice, acogidaPrice]);

  // Calculate school days between startDate and endDate
  const calculateDays = useCallback((): { count: number; amount: number } => {
    if (!startDate || !endDate) {
      return { count: 0, amount: 0 };
    }

    const startNorm = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endNorm = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    let count = 0;
    const current = new Date(startNorm);

    while (current <= endNorm) {
      if (!isHoliday(current) && !isWeekend(current)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    const amount = count * menuPrice + acogidaPrice - totalMonedero;
    return { count, amount };
  }, [startDate, endDate, menuPrice, acogidaPrice, totalMonedero]);

  const { count: schoolDays, amount: amountToAdd } = calculateDays();

  // Next month calculation for monthly reminder
  const nextMonthInfo = useMemo(() => {
    return NotificationService.calculateNextMonthCost(new Date(), menuPrice, acogidaPrice);
  }, [menuPrice, acogidaPrice]);

  // Date Selection logic mirroring Flutter onDaySelected
  const handleSelectDate = (selectedDay: Date) => {
    setFocusedMonth(new Date(selectedDay.getFullYear(), selectedDay.getMonth(), 1));

    if (startDate === null || endDate !== null) {
      setStartDate(selectedDay);
      setEndDate(null);
    } else {
      const normSelected = new Date(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate()).getTime();
      const normStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();

      if (normSelected < normStart) {
        setEndDate(startDate);
        setStartDate(selectedDay);
      } else {
        setEndDate(selectedDay);
      }
    }
  };

  const handleClearSelection = () => {
    setStartDate(null);
    setEndDate(null);
  };

  // Schedule monthly reminder button click
  const handleScheduleReminder = async () => {
    await NotificationService.requestPermissions();
    NotificationService.scheduleMonthlyReminder(new Date(), menuPrice, acogidaPrice);

    setSnackBarMessage('Recordatorio mensual programado.');

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setSnackBarMessage(prev => (prev === 'Recordatorio mensual programado.' ? null : prev));
    }, 3000);
  };

  const showInstantNotification = async () => {
    const permission = await NotificationService.requestPermissions();
    if (permission === 'granted') {
      const msg = `Saldo estimado para ${nextMonthInfo.monthName}: ${nextMonthInfo.totalCost.toFixed(2)} € (${nextMonthInfo.schoolDays} días lectivos).`;
      NotificationService.showImmediateNotification('Recordatorio de Monedero', msg);
      setSnackBarMessage('Notificación enviada al navegador.');
    } else {
      setSnackBarMessage('Permiso de notificaciones no concedido. Revisa los ajustes del navegador.');
    }
    setTimeout(() => {
      setSnackBarMessage(null);
    }, 3000);
  };

  const resetToDefaults = () => {
    const defMenu = AppConstants.getDefaultMenuPrice();
    const defAcogida = AppConstants.getDefaultAcogidaPrice();
    setMenuPriceStr(defMenu.toString());
    setAcogidaPriceStr(defAcogida.toString());
    setTotalMonederoStr('0');
    setSnackBarMessage(`Valores por defecto aplicados: Menú ${defMenu.toFixed(2)} €, Acogida ${defAcogida.toFixed(2)} €.`);
    setTimeout(() => {
      setSnackBarMessage(null);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] font-roboto transition-colors flex flex-col">
      {/* AppBar (Material 3 Top App Bar) */}
      <header className="sticky top-0 z-30 bg-[#673ab7] dark:bg-[#1f1b2e] text-white shadow-md transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shadow-inner">
              <Euro className="w-5 h-5 text-purple-100" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-oswald tracking-wide drop-shadow-xs">
              Calculadora de Monedero
            </h1>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setShowReminderModal(true)}
              className="p-2 rounded-full hover:bg-white/15 active:scale-95 transition-all text-white/90 hover:text-white"
              title="Información del recordatorio mensual"
              aria-label="Información del recordatorio"
            >
              <Info className="w-5 h-5" />
            </button>

            <button
              onClick={handleScheduleReminder}
              className="p-2 rounded-full hover:bg-white/15 active:scale-95 transition-all text-white/90 hover:text-white"
              title="Programar Recordatorio Mensual"
              aria-label="Programar Recordatorio Mensual"
            >
              <Bell className="w-5 h-5" />
            </button>

            <button
              onClick={openSettingsModal}
              className="p-2 rounded-full hover:bg-white/15 active:scale-95 transition-all text-white/90 hover:text-white"
              title="Configurar precios por defecto"
              aria-label="Configurar precios por defecto"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-white/15 active:scale-95 transition-all text-white/90 hover:text-white"
              title="Cambiar Tema"
              aria-label="Cambiar Tema"
            >
              {themeMode === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-300" />
              ) : (
                <Moon className="w-5 h-5 text-purple-100" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Quick Month Status Banner */}
        <section className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-purple-900 dark:text-purple-200">
                Próximo mes ({nextMonthInfo.monthName} {nextMonthInfo.year}):
              </span>{' '}
              <span className="text-purple-700 dark:text-purple-300">
                {nextMonthInfo.schoolDays} días lectivos previstos. Coste estimado:{' '}
                <strong className="font-bold">{nextMonthInfo.totalCost.toFixed(2)} €</strong>.
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowHolidaysModal(true)}
            className="self-start sm:self-auto text-xs font-semibold px-3 py-1.5 rounded-lg text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors whitespace-nowrap"
          >
            Ver Festivos
          </button>
        </section>

        {/* Interactive Calendar Component */}
        <section aria-label="Calendario de selección de fechas">
          <Calendar
            startDate={startDate}
            endDate={endDate}
            focusedMonth={focusedMonth}
            onFocusedMonthChange={setFocusedMonth}
            onSelectDate={handleSelectDate}
            onClearSelection={handleClearSelection}
          />
        </section>

        {/* Price Inputs Card */}
        <section className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 sm:p-6 transition-colors">
          <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
            <h2 className="text-base sm:text-lg font-bold font-oswald uppercase tracking-wider text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Parámetros de Cálculo
            </h2>
            <div className="flex items-center space-x-2.5">
              <button
                onClick={resetToDefaults}
                className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                title="Restaurar a los precios por defecto configurados"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Valores por defecto
              </button>
              <button
                onClick={openSettingsModal}
                className="flex items-center gap-1 text-xs text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 px-2.5 py-1 rounded-lg font-medium transition-colors border border-purple-200 dark:border-purple-800/60"
                title="Personalizar precios por defecto"
              >
                <Settings className="w-3.5 h-3.5" />
                Configurar por defecto
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Precio Menú Diario */}
            <div className="relative">
              <label
                htmlFor="menuPrice"
                className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
              >
                Precio menú diario (€)
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Utensils className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  id="menuPrice"
                  value={menuPriceStr}
                  onChange={e => setMenuPriceStr(e.target.value)}
                  placeholder="7.00"
                  className="block w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all font-mono"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-sm">
                  €
                </div>
              </div>
            </div>

            {/* Precio Acogida */}
            <div className="relative">
              <label
                htmlFor="acogidaPrice"
                className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
              >
                Precio acogida (€)
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Clock className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  id="acogidaPrice"
                  value={acogidaPriceStr}
                  onChange={e => setAcogidaPriceStr(e.target.value)}
                  placeholder="16.97"
                  className="block w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all font-mono"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-sm">
                  €
                </div>
              </div>
            </div>
          </div>

          {/* Total actual en el monedero */}
          <div>
            <label
              htmlFor="totalMonedero"
              className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
            >
              Total actual en el monedero (€)
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <CreditCard className="w-4 h-4" />
              </div>
              <input
                type="text"
                inputMode="decimal"
                id="totalMonedero"
                value={totalMonederoStr}
                onChange={e => setTotalMonederoStr(e.target.value)}
                placeholder="0.00"
                className="block w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all font-mono"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-sm">
                €
              </div>
            </div>
          </div>
        </section>

        {/* Results Card */}
        <section className="bg-gradient-to-br from-purple-700 to-indigo-900 text-white rounded-2xl shadow-lg p-5 sm:p-7 relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-purple-500/40 pb-4 gap-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-purple-200 font-semibold">
                  Rango seleccionado
                </p>
                <p className="text-sm sm:text-base font-medium">
                  {startDate && endDate ? (
                    <>
                      Del {startDate.toLocaleDateString('es-ES')} al {endDate.toLocaleDateString('es-ES')}
                    </>
                  ) : startDate ? (
                    <>Inicio: {startDate.toLocaleDateString('es-ES')} (Selecciona la fecha de fin)</>
                  ) : (
                    <span className="text-purple-200 italic">
                      Selecciona las fechas de inicio y fin en el calendario superior
                    </span>
                  )}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl self-start sm:self-auto">
                <p className="text-xs text-purple-200">Días lectivos calculados</p>
                <p className="text-xl font-bold font-oswald text-center text-white">{schoolDays}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div>
                <p className="text-xs uppercase tracking-widest text-purple-200 font-medium">
                  Fórmula de cálculo
                </p>
                <p className="text-xs text-purple-100 font-mono mt-0.5">
                  ({schoolDays} días × {menuPrice.toFixed(2)} €) + {acogidaPrice.toFixed(2)} € - {totalMonedero.toFixed(2)} €
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs uppercase tracking-wider text-purple-200 block">
                  Importe a añadir
                </span>
                <span className="text-3xl sm:text-4xl font-bold font-oswald tracking-tight text-white drop-shadow-md">
                  €{amountToAdd.toFixed(2)}
                </span>
              </div>
            </div>

            {amountToAdd < 0 && (
              <div className="bg-white/15 rounded-lg p-2.5 text-xs text-purple-100">
                Tu monedero actual ya tiene saldo suficiente para cubrir este periodo (superávit de {Math.abs(amountToAdd).toFixed(2)} €).
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-500 dark:text-gray-400">
        <p>Calculadora de Monedero &copy; {new Date().getFullYear()} — Diseñada para la gestión de comedor escolar y acogida</p>
      </footer>

      {/* Floating SnackBar Toast (mirrors ScaffoldMessenger SnackBar) */}
      {snackBarMessage && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 text-sm animate-fade-in border border-gray-700 dark:border-gray-300"
        >
          <CheckCircle2 className="w-5 h-5 text-green-400 dark:text-green-600 shrink-0" />
          <span className="font-medium">{snackBarMessage}</span>
          <button
            onClick={() => setSnackBarMessage(null)}
            className="p-1 rounded-md hover:bg-white/20 dark:hover:bg-gray-200 text-gray-300 dark:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Holidays Modal */}
      {showHolidaysModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-purple-50 dark:bg-purple-950/40">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-bold font-oswald text-lg text-gray-900 dark:text-white">
                  Días Festivos y No Lectivos
                </h3>
              </div>
              <button
                onClick={() => setShowHolidaysModal(false)}
                className="p-1 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Estos días están preconfigurados como no lectivos y se descuentan automáticamente del cálculo de comedor escolar.
              </p>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {HOLIDAYS_DATA.map((h, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between text-sm">
                    <span className="font-mono text-purple-700 dark:text-purple-300 font-medium">
                      {h.day.toString().padStart(2, '0')}/{(h.month).toString().padStart(2, '0')}/{h.year}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm text-right">
                      {h.name || 'Día no lectivo'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
              <button
                onClick={() => setShowHolidaysModal(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Reminder Info & Test Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-purple-50 dark:bg-purple-950/40">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-bold font-oswald text-lg text-gray-900 dark:text-white">
                  Recordatorio Mensual Inteligente
                </h3>
              </div>
              <button
                onClick={() => setShowReminderModal(false)}
                className="p-1 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <p>
                La aplicación programa automáticamente una alarma el <strong>último día de cada mes a las 10:00 AM</strong> para recordarte recargar el monedero con la cantidad exacta que necesitarás para el siguiente mes.
              </p>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl space-y-1.5 border border-purple-100 dark:border-purple-900/40">
                <div className="text-xs font-semibold text-purple-900 dark:text-purple-200">
                  Estimación para el próximo mes ({nextMonthInfo.monthName} {nextMonthInfo.year}):
                </div>
                <div className="text-xs text-purple-800 dark:text-purple-300">
                  &bull; Días lectivos: <strong>{nextMonthInfo.schoolDays} días</strong>
                </div>
                <div className="text-xs text-purple-800 dark:text-purple-300">
                  &bull; Menú diario: <strong>{menuPrice.toFixed(2)} €/día</strong>
                </div>
                <div className="text-xs text-purple-800 dark:text-purple-300">
                  &bull; Acogida: <strong>{acogidaPrice.toFixed(2)} €</strong>
                </div>
                <div className="text-sm font-bold text-purple-950 dark:text-purple-100 pt-1">
                  Total a notificar: {nextMonthInfo.totalCost.toFixed(2)} €
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={showInstantNotification}
                  className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  Probar notificación ahora en este navegador
                </button>
                <button
                  onClick={handleScheduleReminder}
                  className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl border border-purple-600 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                >
                  Reprogramar recordatorio de fin de mes
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
              <button
                onClick={() => setShowReminderModal(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal (Configuración de Precios por Defecto) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-200 dark:border-gray-800 animate-fade-in">
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-purple-50 dark:bg-purple-950/40">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-bold font-oswald text-lg text-gray-900 dark:text-white">
                  Configurar Precios por Defecto
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDefaults} className="p-5 space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Personaliza los importes predeterminados que usará la aplicación al iniciarse, al pulsar <em>«Valores por defecto»</em> y en las proyecciones de recordatorios mensuales.
              </p>

              <div className="space-y-3">
                {/* Menú por defecto */}
                <div>
                  <label
                    htmlFor="defaultMenuInput"
                    className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Precio menú diario por defecto (€)
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Utensils className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      inputMode="decimal"
                      id="defaultMenuInput"
                      value={settingMenuStr}
                      onChange={e => setSettingMenuStr(e.target.value)}
                      placeholder="7.00"
                      className="block w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all font-mono"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-sm">
                      €
                    </div>
                  </div>
                </div>

                {/* Acogida por defecto */}
                <div>
                  <label
                    htmlFor="defaultAcogidaInput"
                    className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Precio acogida por defecto (€)
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      inputMode="decimal"
                      id="defaultAcogidaInput"
                      value={settingAcogidaStr}
                      onChange={e => setSettingAcogidaStr(e.target.value)}
                      placeholder="16.97"
                      className="block w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all font-mono"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-sm">
                      €
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl text-xs text-gray-500 dark:text-gray-400 space-y-1 border border-gray-100 dark:border-gray-800">
                <div className="font-medium text-gray-700 dark:text-gray-300">
                  Valores de fábrica originales:
                </div>
                <div>&bull; Menú: <strong>{AppConstants.factoryMenuPrice.toFixed(2)} €</strong></div>
                <div>&bull; Acogida: <strong>{AppConstants.factoryAcogidaPrice.toFixed(2)} €</strong></div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl bg-purple-600 text-white hover:bg-purple-700 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Guardar como mis precios por defecto
                </button>
                <button
                  type="button"
                  onClick={handleResetFactoryDefaults}
                  className="w-full py-2 px-4 text-xs font-medium rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Restablecer a valores de fábrica ({AppConstants.factoryMenuPrice.toFixed(2)} € / {AppConstants.factoryAcogidaPrice.toFixed(2)} €)
                </button>
              </div>
            </form>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
