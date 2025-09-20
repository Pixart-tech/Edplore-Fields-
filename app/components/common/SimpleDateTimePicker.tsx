import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';

type ChangeEvent = {
  type: 'set';
  nativeEvent: {
    timestamp: number;
  };
};

type Props = {
  mode: 'date' | 'time';
  value: Date;
  minimumDate?: Date;
  onChange: (event: ChangeEvent, date?: Date) => void;
  minuteInterval?: number;
};

const clampToMinimum = (date: Date, minimumDate?: Date) => {
  if (!minimumDate) {
    return date;
  }

  return date.getTime() < minimumDate.getTime() ? new Date(minimumDate) : date;
};

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const DEFAULT_YEARS_AHEAD = 5;
const DEFAULT_MINUTE_INTERVAL = 5;

const generateYears = (minimumDate: Date) => {
  const startYear = minimumDate.getFullYear();
  return Array.from({ length: DEFAULT_YEARS_AHEAD + 1 }, (_, index) => startYear + index);
};

const generateHours = () => Array.from({ length: 24 }, (_, index) => index);

const generateMinutes = (interval: number) =>
  Array.from({ length: Math.ceil(60 / interval) }, (_, index) => index * interval).filter((minute) => minute < 60);

const formatMonthLabel = (monthIndex: number) => {
  const base = new Date(2000, monthIndex, 1);
  return base.toLocaleDateString(undefined, {
    month: 'short',
  });
};

const formatDayLabel = (year: number, month: number, day: number) => {
  const base = new Date(year, month, day);
  return base.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const SimpleDateTimePicker: React.FC<Props> = ({
  mode,
  value,
  minimumDate,
  onChange,
  minuteInterval = DEFAULT_MINUTE_INTERVAL,
}) => {
  const resolvedMinimumDate = useMemo(() => minimumDate ?? new Date(0), [minimumDate]);

  const [internalDate, setInternalDate] = useState(() =>
    clampToMinimum(new Date(value), minimumDate),
  );

  useEffect(() => {
    setInternalDate(clampToMinimum(new Date(value), minimumDate));
  }, [value, minimumDate]);

  const emitChange = (nextDate: Date) => {
    const sanitized = clampToMinimum(nextDate, minimumDate);
    setInternalDate(sanitized);
    onChange(
      {
        type: 'set',
        nativeEvent: {
          timestamp: sanitized.getTime(),
        },
      },
      sanitized,
    );
  };

  const handleYearChange = (year: number) => {
    const updated = new Date(internalDate);
    updated.setFullYear(year);

    const minMonth = year === resolvedMinimumDate.getFullYear() ? resolvedMinimumDate.getMonth() : 0;
    if (updated.getMonth() < minMonth) {
      updated.setMonth(minMonth);
    }

    const daysInMonth = getDaysInMonth(updated.getFullYear(), updated.getMonth());
    if (updated.getDate() > daysInMonth) {
      updated.setDate(daysInMonth);
    }

    emitChange(updated);
  };

  const handleMonthChange = (month: number) => {
    const updated = new Date(internalDate);
    updated.setMonth(month);

    const daysInMonth = getDaysInMonth(updated.getFullYear(), month);
    if (updated.getDate() > daysInMonth) {
      updated.setDate(daysInMonth);
    }

    emitChange(updated);
  };

  const handleDayChange = (day: number) => {
    const updated = new Date(internalDate);
    updated.setDate(day);
    emitChange(updated);
  };

  const handleHourChange = (hour: number) => {
    const updated = new Date(internalDate);
    updated.setHours(hour);
    emitChange(updated);
  };

  const handleMinuteChange = (minute: number) => {
    const updated = new Date(internalDate);
    updated.setMinutes(minute, 0, 0);
    emitChange(updated);
  };

  const availableYears = useMemo(() => generateYears(resolvedMinimumDate), [resolvedMinimumDate]);

  const availableMonths = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, index) => index);
    const minYear = resolvedMinimumDate.getFullYear();

    if (internalDate.getFullYear() === minYear) {
      return months.filter((month) => month >= resolvedMinimumDate.getMonth());
    }

    return months;
  }, [internalDate, resolvedMinimumDate]);

  const availableDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(internalDate.getFullYear(), internalDate.getMonth());
    const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);

    const minYear = resolvedMinimumDate.getFullYear();
    const minMonth = resolvedMinimumDate.getMonth();

    if (
      internalDate.getFullYear() === minYear &&
      internalDate.getMonth() === minMonth
    ) {
      return days.filter((day) => day >= resolvedMinimumDate.getDate());
    }

    return days;
  }, [internalDate, resolvedMinimumDate]);

  const availableMinutes = useMemo(() => {
    const sanitizedInterval = Math.min(Math.max(1, minuteInterval), 30);
    return generateMinutes(sanitizedInterval);
  }, [minuteInterval]);

  useEffect(() => {
    if (mode !== 'time' || availableMinutes.length === 0) {
      return;
    }

    if (!availableMinutes.includes(internalDate.getMinutes())) {
      handleMinuteChange(availableMinutes[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, availableMinutes.join(',')]);

  useEffect(() => {
    if (availableMonths.length === 0) {
      return;
    }

    if (!availableMonths.includes(internalDate.getMonth())) {
      handleMonthChange(availableMonths[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableMonths.join(',')]);

  useEffect(() => {
    if (availableDays.length === 0) {
      return;
    }

    if (!availableDays.includes(internalDate.getDate())) {
      handleDayChange(availableDays[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableDays.join(',')]);

  const containerStyle = useMemo(() => {
    if (Platform.OS === 'ios') {
      return styles.iosContainer;
    }

    return styles.container;
  }, []);

  if (mode === 'time') {
    const selectedHour = internalDate.getHours();
    const selectedMinute = internalDate.getMinutes();

    return (
      <View style={containerStyle}>
        <View style={styles.pickerRow}>
          <Picker
            style={styles.picker}
            selectedValue={selectedHour}
            onValueChange={(hour: number) => handleHourChange(hour)}
          >
            {generateHours().map((hour) => (
              <Picker.Item key={`hour-${hour}`} label={hour.toString().padStart(2, '0')} value={hour} />
            ))}
          </Picker>
          <Picker
            style={styles.picker}
            selectedValue={availableMinutes.includes(selectedMinute) ? selectedMinute : availableMinutes[0]}
            onValueChange={(minute: number) => handleMinuteChange(minute)}
          >
            {availableMinutes.map((minute) => (
              <Picker.Item
                key={`minute-${minute}`}
                label={minute.toString().padStart(2, '0')}
                value={minute}
              />
            ))}
          </Picker>
        </View>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <View style={styles.pickerRow}>
        <Picker
          style={styles.picker}
          selectedValue={internalDate.getFullYear()}
          onValueChange={(year: number) => handleYearChange(year)}
        >
          {availableYears.map((year) => (
            <Picker.Item key={`year-${year}`} label={year.toString()} value={year} />
          ))}
        </Picker>
        <Picker
          style={styles.picker}
          selectedValue={internalDate.getMonth()}
          onValueChange={(month: number) => handleMonthChange(month)}
        >
          {availableMonths.map((month) => (
            <Picker.Item
              key={`month-${month}`}
              label={formatMonthLabel(month)}
              value={month}
            />
          ))}
        </Picker>
        <Picker
          style={styles.picker}
          selectedValue={internalDate.getDate()}
          onValueChange={(day: number) => handleDayChange(day)}
        >
          {availableDays.map((day) => (
            <Picker.Item
              key={`day-${day}`}
              label={formatDayLabel(internalDate.getFullYear(), internalDate.getMonth(), day)}
              value={day}
            />
          ))}
        </Picker>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 2,
  },
  iosContainer: {
    paddingVertical: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  picker: {
    flex: 1,
  },
});

export default SimpleDateTimePicker;
