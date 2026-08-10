import {useCallback, useEffect, useMemo, useRef, useState, type CSSProperties} from 'react';
import {CalendarBlank, Clock, X} from './vercel-icons';

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

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
  const rootRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const [panelSide, setPanelSide] = useState<'top' | 'bottom'>('bottom');
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

  const updatePanelPosition = useCallback(() => {
    const trigger = rootRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const edge = 16;
    const gap = 8;
    const panelWidth = panelRef.current?.offsetWidth ?? (includeTime ? Math.min(520, viewportWidth - edge * 2) : 288);
    const panelHeight = panelRef.current?.offsetHeight ?? (includeTime ? 360 : 328);
    const shouldOpenUp = viewportHeight - rect.bottom < panelHeight + edge + gap && rect.top > panelHeight + edge + gap;
    const nextTop = shouldOpenUp ? rect.top - panelHeight - gap : rect.bottom + gap;
    const nextLeft = Math.min(Math.max(rect.left, edge), viewportWidth - panelWidth - edge);

    setPanelSide(shouldOpenUp ? 'top' : 'bottom');
    setPanelStyle({
      left: `${nextLeft}px`,
      top: `${Math.max(edge, Math.min(nextTop, viewportHeight - panelHeight - edge))}px`,
    });
  }, [includeTime]);

  useEffect(() => {
    if (!open) return undefined;

    updatePanelPosition();
    const frame = window.requestAnimationFrame(updatePanelPosition);

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updatePanelPosition);
    window.addEventListener('scroll', updatePanelPosition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updatePanelPosition);
      window.removeEventListener('scroll', updatePanelPosition, true);
    };
  }, [open, updatePanelPosition]);

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
    'vbg-custom-date-trigger',
    value ? '' : 'vbg-custom-date-trigger--placeholder',
    invalid ? 'vbg-custom-date-trigger--invalid' : '',
    className,
  );
  const timeListClassName = 'vbg-custom-time-list';
  const timeOptionClassName = 'vbg-custom-time-option';

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
    <span className="vbg-custom-popover vbg-custom-date-popover" ref={rootRef}>
      <button
        className={triggerClassName}
        data-clearable={Boolean(value) || undefined}
        type="button"
        aria-label={ariaLabel ?? displayValue}
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
      >
        <span className="vbg-custom-truncate">{displayValue}</span>
        <CalendarBlank aria-hidden="true" className="vbg-custom-icon" />
      </button>
      {value ? (
        <button
          className="vbg-custom-field-clear"
          type="button"
          aria-label={locale === 'zh' ? '清除日期' : 'Clear date'}
          onClick={() => {
            onValueChange('');
            setOpen(false);
          }}
        >
          <X className="vbg-custom-icon vbg-custom-icon--xs" />
        </button>
      ) : null}
      {open ? (
      <div
        className={cn('vbg-custom-popover__content vbg-custom-date-panel', includeTime ? 'vbg-custom-date-panel--with-time' : '')}
        data-side={panelSide}
        ref={panelRef}
        style={panelStyle}
      >
        <div className="vbg-custom-date-grid">
          <div className="vbg-custom-date-calendar">
            <div className="vbg-custom-date-nav">
              <button
                type="button"
                className="vbg-custom-icon-button"
                aria-label={locale === 'zh' ? '上个月' : 'Previous month'}
                onClick={() => setVisibleMonth(current => addMonths(current, -1))}
              >
                <span className="vbg-custom-date-nav__arrow vbg-custom-date-nav__arrow--left" aria-hidden="true" />
              </button>
              <span className="vbg-custom-text vbg-custom-text--bold">{monthLabel}</span>
              <button
                type="button"
                className="vbg-custom-icon-button"
                aria-label={locale === 'zh' ? '下个月' : 'Next month'}
                onClick={() => setVisibleMonth(current => addMonths(current, 1))}
              >
                <span className="vbg-custom-date-nav__arrow vbg-custom-date-nav__arrow--right" aria-hidden="true" />
              </button>
            </div>
            <div className="vbg-custom-weekdays">
              {weekdays.map((day, index) => (
                <span key={`${day}-${index}`}>{day}</span>
              ))}
            </div>
            <div className="vbg-custom-days">
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
                      'vbg-custom-day',
                      isSelected ? 'vbg-custom-day--selected' : '',
                      !isSelected && isMuted ? 'vbg-custom-day--muted' : '',
                      !isSelected && isToday ? 'vbg-custom-day--today' : '',
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
            <div className="vbg-custom-time-panel">
              <div className="vbg-custom-time-title">
                <Clock aria-hidden="true" className="vbg-custom-icon" />
                <span>{locale === 'zh' ? '时间' : 'Time'}</span>
              </div>
              <div className="vbg-custom-time-grid">
                <div>
                  <span className="vbg-meta">
                    {locale === 'zh' ? '时' : 'Hour'}
                  </span>
                  <div className={timeListClassName}>
                    {hourOptions.map(option => (
                      <button
                        key={option}
                        type="button"
                        className={cn(
                          timeOptionClassName,
                          option === selectedHour ? 'vbg-custom-time-option--selected' : '',
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
                  <span className="vbg-meta">
                    {locale === 'zh' ? '分' : 'Minute'}
                  </span>
                  <div className={timeListClassName}>
                    {minuteOptions.map(option => (
                      <button
                        key={option}
                        type="button"
                        className={cn(
                          timeOptionClassName,
                          option === selectedMinute ? 'vbg-custom-time-option--selected' : '',
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
      </div>
      ) : null}
    </span>
  );
}
