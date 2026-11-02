import React from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { isHoliday, isSameDay, isWeekend, isSelectable, getHolidayInfo, HolidayEntry } from '../constants/holidays';

interface CalendarProps {
  startDate: Date | null;
  endDate: Date | null;
  focusedMonth: Date;
  holidaysList?: HolidayEntry[];
  onFocusedMonthChange: (date: Date) => void;
  onSelectDate: (date: Date) => void;
  onClearSelection: () => void;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const Calendar: React.FC<CalendarProps> = ({
  startDate,
  endDate,
  focusedMonth,
  holidaysList,
  onFocusedMonthChange,
  onSelectDate,
  onClearSelection,
}) => {
  const year = focusedMonth.getFullYear();
  const month = focusedMonth.getMonth(); // 0-indexed

  // Month navigation
  const prevMonth = () => {
    onFocusedMonthChange(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    onFocusedMonthChange(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    onFocusedMonthChange(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  // Build grid days starting from Monday
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Day of week: 0 = Sun, 1 = Mon, ... 6 = Sat
  // Convert so Monday = 0, ..., Sunday = 6
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  const daysInMonth = lastDayOfMonth.getDate();

  // Days from previous month to fill the first row
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevMonthDays: { date: Date; isCurrentMonth: boolean }[] = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    prevMonthDays.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false,
    });
  }

  // Days of current month
  const currentMonthDays: { date: Date; isCurrentMonth: boolean }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    currentMonthDays.push({
      date: new Date(year, month, d),
      isCurrentMonth: true,
    });
  }

  // Fill end of grid to complete 7-day row
  const totalCells = prevMonthDays.length + currentMonthDays.length;
  const remainingCells = (7 - (totalCells % 7)) % 7;
  const nextMonthDays: { date: Date; isCurrentMonth: boolean }[] = [];
  for (let d = 1; d <= remainingCells; d++) {
    nextMonthDays.push({
      date: new Date(year, month + 1, d),
      isCurrentMonth: false,
    });
  }

  const allDays = [...prevMonthDays, [...currentMonthDays], ...nextMonthDays].flat();

  // Range checks
  const isInRange = (day: Date): boolean => {
    if (!startDate || !endDate) return false;
    const norm = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
    const startNorm = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
    const endNorm = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
    return norm >= startNorm && norm <= endNorm;
  };

  const isWorkDayInRange = (day: Date): boolean => {
    return isInRange(day) && !isHoliday(day, holidaysList) && !isWeekend(day);
  };

  const today = new Date();

  return (
    <div className="w-full bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 sm:p-6 transition-colors">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-oswald tracking-wide text-gray-900 dark:text-white capitalize">
            {MONTH_NAMES[month]} {year}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Haz clic en los días lectivos para marcar el rango
          </p>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={goToToday}
            className="px-2.5 py-1 text-xs font-medium rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 dark:text-purple-300 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 transition-colors"
            title="Ir al mes actual"
          >
            Hoy
          </button>

          {(startDate || endDate) && (
            <button
              onClick={onClearSelection}
              className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:text-gray-400 transition-colors"
              title="Limpiar selección"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 mb-2 text-center">
        {WEEKDAYS.map((wd, index) => {
          const isWeekendCol = index >= 5;
          return (
            <div
              key={wd}
              className={`text-xs sm:text-sm font-semibold py-1 uppercase tracking-wider ${
                isWeekendCol
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {wd}
            </div>
          );
        })}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {allDays.map(({ date, isCurrentMonth }, idx) => {
          const isStart = isSameDay(startDate, date);
          const isEnd = isSameDay(endDate, date);
          const isEndpoint = isStart || isEnd;
          const isWorkDay = isWorkDayInRange(date);
          const inRange = isInRange(date);
          const holiday = isHoliday(date, holidaysList);
          const weekend = isWeekend(date);
          const nonSchoolDay = holiday || weekend;
          const selectable = isSelectable(date, holidaysList);
          const isTodayDate = isSameDay(today, date);
          const holidayInfo = getHolidayInfo(date, holidaysList);

          // Determine styling exactly mirroring Flutter custom CalendarBuilders:
          // 1. If start or end: Blue circle (Colors.blue[600], text white)
          // 2. If non-school day (weekend or holiday) AND not endpoint:
          //    - If in range: Colors.red[100] (in Flutter: if isInRange => red[100])
          //    - Outside range: Colors.red[300] (red[300], text white)
          // 3. If work day in range: Colors.green[300] (text white)
          // 4. Default selectable day: transparent / normal

          let circleClass = 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800';
          let titleTooltip = `${date.getDate()} de ${MONTH_NAMES[date.getMonth()]} de ${date.getFullYear()}`;

          if (holidayInfo?.name) {
            titleTooltip += ` - ${holidayInfo.name}`;
          } else if (weekend) {
            titleTooltip += ` - Fin de semana`;
          }

          if (isEndpoint) {
            circleClass = 'bg-blue-600 text-white font-bold shadow-md ring-2 ring-blue-300 dark:ring-blue-400/50 scale-105';
            titleTooltip += isStart ? ' (Inicio de rango)' : ' (Fin de rango)';
          } else if (isWorkDay) {
            circleClass = 'bg-green-500 hover:bg-green-600 text-white font-semibold shadow-sm';
            titleTooltip += ' (Día lectivo computado)';
          } else if (inRange) {
            circleClass = 'bg-red-100 text-red-800 font-medium dark:bg-red-950/70 dark:text-red-300';
            titleTooltip += ' (No lectivo en rango)';
          } else if (nonSchoolDay) {
            circleClass = 'bg-red-400 text-white font-medium';
          }

          const opacityClass = !isCurrentMonth ? 'opacity-35' : 'opacity-100';

          return (
            <div key={idx} className="aspect-square flex items-center justify-center p-0.5">
              <button
                type="button"
                onClick={() => {
                  if (selectable) {
                    onSelectDate(date);
                  }
                }}
                disabled={!selectable}
                title={titleTooltip}
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex flex-col items-center justify-center text-xs sm:text-sm transition-all duration-150 relative ${circleClass} ${opacityClass} ${
                  selectable ? 'cursor-pointer active:scale-95' : 'cursor-not-allowed opacity-80'
                } ${isTodayDate && !isEndpoint ? 'ring-2 ring-purple-600 dark:ring-purple-400 font-bold' : ''}`}
              >
                <span>{date.getDate()}</span>
                {holidayInfo && (
                  <span className="w-1 h-1 rounded-full bg-white/90 absolute bottom-1"></span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/80 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center space-x-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-blue-600 inline-block shadow-xs"></span>
          <span>Inicio / Fin</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-green-500 inline-block shadow-xs"></span>
          <span>Día lectivo</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-red-400 inline-block shadow-xs"></span>
          <span>Festivo / Fin de semana</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-800 inline-block"></span>
          <span>No lectivo en rango</span>
        </div>
      </div>
    </div>
  );
};
