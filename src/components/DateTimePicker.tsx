import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Button} from '@cloudflare/kumo/components/button';
import {DatePicker} from '@cloudflare/kumo/components/date-picker';
import {Popover} from '@cloudflare/kumo/components/popover';
import {Text} from '@cloudflare/kumo/components/text';
import {ScrollArea} from '@cloudflare/kumo/primitives/scroll-area';
import {CalendarBlank} from '@phosphor-icons/react';
import {enUS, zhCN} from 'date-fns/locale';
import {format, isValid, parse} from 'date-fns';

import {currentLanguage, type AppLanguage} from '../i18n';

export type DateTimePickerLocale = AppLanguage;

export type DateTimePickerProps = {
  value: string;
  onValueChange: (value: string) => void;
  includeTime?: boolean;
  placeholder?: string;
  locale?: DateTimePickerLocale;
  ariaLabel?: string;
  invalid?: boolean;
  clearable?: boolean;
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
  return format(date, 'yyyy-MM-dd');
}

function parseIsoDate(value: string) {
  const date = parse(value, 'yyyy-MM-dd', new Date());
  return isValid(date) && format(date, 'yyyy-MM-dd') === value ? date : undefined;
}

function joinDateTimeValue(date: string, time: string, includeTime?: boolean) {
  if (!date) return '';
  return includeTime ? `${date} ${time || '00:00'}` : date;
}

const hourOptions = Array.from({length: 24}, (_, index) => {
  const value = String(index).padStart(2, '0');
  return {label:value, value};
});
const minuteOptions = Array.from({length: 60}, (_, index) => {
  const value = String(index).padStart(2, '0');
  return {label:value, value};
});

type TimeOptionListProps = {
  label: string;
  value: string;
  options: Array<{label: string; value: string}>;
  onValueChange: (value: string) => void;
};

function TimeOptionList({label, value, options, onValueChange}: TimeOptionListProps) {
  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="text-center">
        <Text as="span" size="xs" variant="secondary">
          {label}
        </Text>
      </div>
      <ScrollArea.Root className="min-h-0 flex-1 overflow-hidden">
        <ScrollArea.Viewport className="h-full overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ScrollArea.Content className="grid gap-1">
            {options.map(option => {
              const selected = option.value === value;
              return (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant="ghost"
                  className={`!h-8 w-full min-w-0 shrink-0 justify-center !rounded-md !px-0 tabular-nums ${
                    selected
                      ? '!bg-kumo-contrast !text-kumo-inverse hover:!bg-kumo-contrast'
                      : 'hover:bg-kumo-tint'
                  }`}
                  aria-pressed={selected}
                  onClick={() => onValueChange(option.value)}
                >
                  {option.label}
                </Button>
              );
            })}
          </ScrollArea.Content>
        </ScrollArea.Viewport>
      </ScrollArea.Root>
    </div>
  );
}

export function DateTimePicker({
  value,
  onValueChange,
  includeTime,
  placeholder,
  locale = currentLanguage(),
  ariaLabel,
  invalid,
  clearable = true,
  className,
}: DateTimePickerProps) {
  const {t} = useTranslation('dateTime');
  const [open, setOpen] = useState(false);
  const {date, time} = splitDateTimeValue(value);
  const selectedDate = parseIsoDate(date);
  const selectedHour = time.slice(0, 2) || '00';
  const selectedMinute = time.slice(3, 5) || '00';
  const displayValue = value
    ? value.replace('T', ' ').slice(0, includeTime ? 16 : 10)
    : placeholder ?? t('selectDate');

  const selectDate = (nextDate?: Date) => {
    if (!nextDate) return;
    onValueChange(joinDateTimeValue(dateToIsoDate(nextDate), time, includeTime));
    if (!includeTime) setOpen(false);
  };

  const selectTime = (hour: string, minute: string) => {
    onValueChange(joinDateTimeValue(date || dateToIsoDate(new Date()), `${hour}:${minute}`, true));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        render={
          <Button
            className={`w-full justify-start ${invalid ? '!ring-kumo-danger' : ''} ${className ?? ''}`}
            type="button"
            variant="secondary"
            icon={CalendarBlank}
            aria-label={ariaLabel ?? displayValue}
          >
            <span className="min-w-0 truncate">{displayValue}</span>
          </Button>
        }
      />
      <Popover.Content
        side="bottom"
        align="start"
        sideOffset={8}
        positionMethod="fixed"
        className={`max-w-[calc(100vw-2rem)] p-3 ${includeTime ? 'w-[38rem]' : 'w-auto'}`}
      >
        <div className={includeTime ? 'grid gap-4 sm:grid-cols-[auto_14rem]' : ''}>
          <DatePicker
            mode="single"
            selected={selectedDate}
            onChange={selectDate}
            locale={locale === 'zh-CN' ? zhCN : enUS}
          />
          {includeTime ? (
            <div className="border-t border-kumo-line pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
              <div className="grid h-72 grid-cols-2 gap-3">
                <TimeOptionList
                  label={t('hour')}
                  value={selectedHour}
                  options={hourOptions}
                  onValueChange={next => selectTime(next, selectedMinute)}
                />
                <TimeOptionList
                  label={t('minute')}
                  value={selectedMinute}
                  options={minuteOptions}
                  onValueChange={next => {
                    selectTime(selectedHour, next);
                    setOpen(false);
                  }}
                />
              </div>
            </div>
          ) : null}
        </div>
        {value && clearable ? (
          <div className="mt-3 flex justify-end border-t border-kumo-line pt-3">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                onValueChange('');
                setOpen(false);
              }}
            >
              {t('clear')}
            </Button>
          </div>
        ) : null}
      </Popover.Content>
    </Popover>
  );
}
