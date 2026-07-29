import {useEffect, useMemo, useState} from 'react';
import {Popover} from '@cloudflare/kumo/components/popover';
import {Text} from '@cloudflare/kumo/components/text';
import {CalendarBlank, CaretLeft, CaretRight, Clock} from '@phosphor-icons/react';
import {cn} from '@cloudflare/kumo/utils';

export type DateTimePickerLocale = 'en' | 'zh';

export type DateTimePickerProps = {
  value: string;
  onValueChange: (value: string) => void;
  includeTime?: boolean;
  placeholder?: string;
  locale?: DateTimePickerLocale;
  ariaLabel?: string;
  invalid?: boolean;
  className?: string;
};

function splitDateTimeValue(value: string) {
  const normalized = value.replace('T', ' ');
  return {
    date: normalized.slice(0, 10),
    time: normalized.match(/\d{2}:\d{2}/)?.[0] ?? '',
  };
}

function dateToIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
  return date;
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function calendarDays(monthDate: Date) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());
  return Array.from({length: 42}, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

function joinDateTimeValue(date: string, time: string, includeTime?: boolean) {
  if (!date) return '';
  return includeTime ? `${date} ${time || '00:00'}` : date;
}

const hourOptions = Array.from({length: 24}, (_, index) => String(index).padStart(2, '0'));
const minuteOptions = Array.from({length: 60}, (_, index) => String(index).padStart(2, '0'));

export function DateTimePicker({
  value,
  onValueChange,
  includeTime,
  placeholder,
  locale = 'en',
  ariaLabel,
  invalid,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const {date, time} = splitDateTimeValue(value);
  const selectedHour = time.slice(0, 2) || '00';
  const selectedMinute = time.slice(3, 5) || '00';
  const selectedDate = parseIsoDate(date);
  const today = dateToIsoDate(new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => selectedDate ?? new Date());
  useEffect(() => {
    if (!open) return;
    setVisibleMonth(parseIsoDate(date) ?? new Date());
  }, [date, open]);

  const days = useMemo(() => calendarDays(visibleMonth), [visibleMonth]);
  const monthLabel = useMemo(
    () => visibleMonth.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {month: 'long', year: 'numeric'}),
    [locale, visibleMonth],
  );
  const displayValue = value ? value.replace('T', ' ').slice(0, includeTime ? 16 : 10) : placeholder ?? (locale === 'zh' ? '选择日期' : 'Select date');
  const weekdays = locale === 'zh'
    ? ['日', '一', '二', '三', '四', '五', '六']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const triggerClassName = cn(
    'flex h-9 w-full items-center justify-between gap-2 rounded-lg border-0 bg-kumo-control px-3 text-left text-base ring ring-kumo-line outline-none',
    'focus:ring-[1.5px] focus:ring-kumo-focus/50',
    value ? 'text-kumo-default' : 'text-kumo-subtle',
    invalid ? 'ring-kumo-danger focus:ring-kumo-danger/50' : '',
    className,
  );
  const timeListClassName = 'mt-2 max-h-64 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';
  const timeOptionClassName = 'mb-1 flex h-8 w-full items-center justify-center rounded-md text-sm outline-none focus-visible:bg-kumo-tint';

  const selectDate = (nextDate: string) => {
    onValueChange(joinDateTimeValue(nextDate, time, includeTime));
    const parsed = parseIsoDate(nextDate);
    if (parsed) setVisibleMonth(parsed);
    if (!includeTime) setOpen(false);
  };

  const selectHour = (nextHour: string) => {
    onValueChange(joinDateTimeValue(date || today, `${nextHour}:${selectedMinute}`, true));
  };

  const selectMinute = (nextMinute: string) => {
    onValueChange(joinDateTimeValue(date || today, `${selectedHour}:${nextMinute}`, true));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        render={
          <button className={triggerClassName} type="button" aria-label={ariaLabel ?? displayValue}>
            <span className="min-w-0 truncate">{displayValue}</span>
            <CalendarBlank aria-hidden="true" className="size-4 shrink-0 text-kumo-subtle" />
          </button>
        }
      />
      <Popover.Content
        side="bottom"
        align="start"
        sideOffset={8}
        positionMethod="fixed"
        className={cn('max-w-[calc(100vw-2rem)] p-3', includeTime ? 'w-72 sm:w-[32.25rem]' : 'w-72')}
      >
        <div className={cn('grid gap-3', includeTime ? 'grid-cols-1 sm:grid-cols-[18rem_12rem]' : 'grid-cols-1')}>
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-lg text-kumo-subtle hover:bg-kumo-tint hover:text-kumo-default"
                aria-label={locale === 'zh' ? '上个月' : 'Previous month'}
                onClick={() => setVisibleMonth(current => addMonths(current, -1))}
              >
                <CaretLeft aria-hidden="true" className="size-4" />
              </button>
              <Text as="span" bold>{monthLabel}</Text>
              <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-lg text-kumo-subtle hover:bg-kumo-tint hover:text-kumo-default"
                aria-label={locale === 'zh' ? '下个月' : 'Next month'}
                onClick={() => setVisibleMonth(current => addMonths(current, 1))}
              >
                <CaretRight aria-hidden="true" className="size-4" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-medium text-kumo-subtle">
              {weekdays.map((day, index) => (
                <span key={`${day}-${index}`}>{day}</span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {days.map(day => {
                const nextDate = dateToIsoDate(day);
                const isSelected = nextDate === date;
                const isToday = nextDate === today;
                const isMuted = day.getMonth() !== visibleMonth.getMonth();
                return (
                  <button
                    key={nextDate}
                    type="button"
                    className={cn(
                      'flex aspect-square items-center justify-center rounded-lg text-sm outline-none focus:ring-[1.5px] focus:ring-kumo-focus/50',
                      isSelected ? 'bg-kumo-brand text-white' : 'hover:bg-kumo-tint',
                      !isSelected && isMuted ? 'text-kumo-disabled' : '',
                      !isSelected && !isMuted ? 'text-kumo-default' : '',
                      !isSelected && isToday ? 'ring ring-kumo-line' : '',
                    )}
                    onClick={() => selectDate(nextDate)}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
          {includeTime ? (
            <div className="min-w-0 border-t border-kumo-line pt-3 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
              <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-kumo-strong">
                <Clock aria-hidden="true" className="size-4 text-kumo-subtle" />
                <span>{locale === 'zh' ? '时间' : 'Time'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Text as="span" variant="secondary" size="xs">
                    {locale === 'zh' ? '时' : 'Hour'}
                  </Text>
                  <div className={timeListClassName}>
                    {hourOptions.map(option => (
                      <button
                        key={option}
                        type="button"
                        className={cn(
                          timeOptionClassName,
                          option === selectedHour ? 'bg-kumo-brand text-white' : 'text-kumo-default hover:bg-kumo-tint',
                        )}
                        onMouseDown={event => event.preventDefault()}
                        onClick={() => selectHour(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Text as="span" variant="secondary" size="xs">
                    {locale === 'zh' ? '分' : 'Minute'}
                  </Text>
                  <div className={timeListClassName}>
                    {minuteOptions.map(option => (
                      <button
                        key={option}
                        type="button"
                        className={cn(
                          timeOptionClassName,
                          option === selectedMinute ? 'bg-kumo-brand text-white' : 'text-kumo-default hover:bg-kumo-tint',
                        )}
                        onMouseDown={event => event.preventDefault()}
                        onClick={() => selectMinute(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </Popover.Content>
    </Popover>
  );
}
