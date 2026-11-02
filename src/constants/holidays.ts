// Holidays ported directly from lib/holidays.dart
// Months in JS Date: 0 = Enero, 1 = Febrero, ..., 8 = Septiembre, 9 = Octubre, 10 = Noviembre, 11 = Diciembre

export interface HolidayEntry {
  year: number;
  month: number; // 1-12
  day: number;
  name?: string;
}

export const HOLIDAYS_DATA: HolidayEntry[] = [
  // 2025
  { year: 2025, month: 9, day: 11, name: 'Diada Nacional de Catalunya' },
  { year: 2025, month: 10, day: 31, name: 'Día no lectivo / Festivo' },
  { year: 2025, month: 12, day: 8, name: 'Inmaculada Concepción' },
  { year: 2025, month: 12, day: 22, name: 'Vacaciones de Navidad' },
  { year: 2025, month: 12, day: 23, name: 'Vacaciones de Navidad' },
  { year: 2025, month: 12, day: 24, name: 'Nochebuena' },
  { year: 2025, month: 12, day: 25, name: 'Navidad' },
  { year: 2025, month: 12, day: 26, name: 'San Esteban' },
  { year: 2025, month: 12, day: 29, name: 'Vacaciones de Navidad' },
  { year: 2025, month: 12, day: 30, name: 'Vacaciones de Navidad' },
  { year: 2025, month: 12, day: 31, name: 'Fin de Año' },

  // 2026
  { year: 2026, month: 1, day: 1, name: 'Año Nuevo' },
  { year: 2026, month: 1, day: 2, name: 'Vacaciones de Navidad' },
  { year: 2026, month: 1, day: 5, name: 'Vacaciones de Navidad' },
  { year: 2026, month: 1, day: 6, name: 'Día de Reyes' },
  { year: 2026, month: 1, day: 7, name: 'Vacaciones de Navidad' },
  { year: 2026, month: 1, day: 19, name: 'Festivo local / libre disposición' },
  { year: 2026, month: 2, day: 13, name: 'Carnaval / libre disposición' },
  { year: 2026, month: 2, day: 16, name: 'Carnaval / libre disposición' },
  { year: 2026, month: 3, day: 30, name: 'Semana Santa' },
  { year: 2026, month: 3, day: 31, name: 'Semana Santa' },
  { year: 2026, month: 4, day: 1, name: 'Semana Santa' },
  { year: 2026, month: 4, day: 2, name: 'Jueves Santo' },
  { year: 2026, month: 4, day: 3, name: 'Viernes Santo' },
  { year: 2026, month: 4, day: 6, name: 'Lunes de Pascua' },
  { year: 2026, month: 5, day: 1, name: 'Día del Trabajador' },
  { year: 2026, month: 5, day: 11, name: 'Festivo local' },
];

export function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isHoliday(date: Date): boolean {
  const y = date.getFullYear();
  const m = date.getMonth() + 1; // 1-12
  const d = date.getDate();
  return HOLIDAYS_DATA.some(h => h.year === y && h.month === m && h.day === d);
}

export function getHolidayInfo(date: Date): HolidayEntry | undefined {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return HOLIDAYS_DATA.find(h => h.year === y && h.month === m && h.day === d);
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay(); // 0 is Sunday, 6 is Saturday
  return day === 0 || day === 6;
}

// In Flutter: isSelectable = day.weekday < 6 && !holidays.any((holiday) => isSameDay(holiday, normalizedDay))
// (Flutter weekday: 1 = Monday, ..., 5 = Friday, 6 = Saturday, 7 = Sunday)
export function isSelectable(date: Date): boolean {
  return !isWeekend(date) && !isHoliday(date);
}

export function normalizeDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
