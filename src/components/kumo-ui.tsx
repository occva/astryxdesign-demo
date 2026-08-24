import type {ReactNode} from 'react';
import {Badge} from '@cloudflare/kumo/components/badge';
import type {BadgeVariant} from '@cloudflare/kumo/components/badge';
import {Input, InputGroup} from '@cloudflare/kumo/components/input';
import type {InputProps} from '@cloudflare/kumo/components/input';
import {Field} from '@cloudflare/kumo/components/field';
import {LayerCard} from '@cloudflare/kumo/components/layer-card';
import {SkeletonLine} from '@cloudflare/kumo/components/loader';
import {Select} from '@cloudflare/kumo/components/select';
import {Text} from '@cloudflare/kumo/components/text';
import {cn} from '@cloudflare/kumo/utils';
import {Eye, EyeSlash} from '@phosphor-icons/react';
import {useState} from 'react';
import {DateTimePicker} from './DateTimePicker';
import type {DateTimePickerLocale} from './DateTimePicker';

export {DateTimePicker};
export type {DateTimePickerLocale, DateTimePickerProps} from './DateTimePicker';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';
export type SelectItem = {label: string; value: string};

export function PageTitle({
  title,
  actions,
}: {
  title: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <Text variant="heading2" as="h1">{title}</Text>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <LayerCard className={cn('min-w-0 p-5', className)}>
      {children}
    </LayerCard>
  );
}

export function Skeleton({className}: {className?: string}) {
  return <SkeletonLine minWidth={100} maxWidth={100} className={className} />;
}

export function SectionTitle({
  title,
  aside,
}: {
  title: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Text variant="heading3" as="h2">{title}</Text>
      {aside}
    </div>
  );
}

export function FormInput({
  value,
  onValueChange,
  required,
  className,
  ...props
}: Omit<InputProps, 'onChange' | 'value' | 'required'> & {
  value: string;
  onValueChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <Input
      {...props}
      value={value}
      required={required}
      className={cn('w-full', className)}
      onChange={event => onValueChange(event.currentTarget.value)}
    />
  );
}

export function FormPasswordInput({
  value,
  onValueChange,
  showLabel,
  hideLabel,
  label,
  required,
  error,
  autoComplete,
  autoFocus,
}: {
  value: string;
  onValueChange: (value: string) => void;
  showLabel: string;
  hideLabel: string;
  label: ReactNode;
  required?: boolean;
  error?: string;
  autoComplete?: string;
  autoFocus?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const visibilityLabel = visible ? hideLabel : showLabel;
  return (
    <InputGroup label={label} required={required} error={error ? {message: error, match: true} : undefined}>
      <InputGroup.Input
        value={value}
        type={visible ? 'text' : 'password'}
        aria-label={typeof label === 'string' ? label : undefined}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        onChange={event => onValueChange(event.currentTarget.value)}
      />
      <InputGroup.Addon align="end">
        <InputGroup.Button
          type="button"
          icon={visible ? EyeSlash : Eye}
          tooltip={visibilityLabel}
          aria-label={visibilityLabel}
          aria-pressed={visible}
          onClick={() => setVisible(current => !current)}
        />
      </InputGroup.Addon>
    </InputGroup>
  );
}

export function FormSelect({
  label,
  value,
  options,
  onValueChange,
  placeholder,
  error,
  required,
  className,
}: {
  label: ReactNode;
  value: string;
  options: SelectItem[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
}) {
  const allValue = '__all__';
  const safeValue = value === '' ? allValue : value;
  const items = Object.fromEntries(options.map(option => [option.value || allValue, option.label]));
  return (
    <Select<string>
      className={cn('w-full', className)}
      label={label}
      value={safeValue}
      placeholder={placeholder}
      items={items}
      renderValue={selected => items[selected] ?? selected}
      error={error}
      required={required}
      onValueChange={next => onValueChange(String(next ?? '') === allValue ? '' : String(next ?? ''))}
    />
  );
}

export function FormDateInput({
  label,
  value,
  onValueChange,
  includeTime,
  placeholder,
  locale = 'en-US',
  error,
  required,
  className,
}: {
  label: ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  includeTime?: boolean;
  placeholder?: string;
  locale?: DateTimePickerLocale;
  error?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <Field
      label={label}
      required={required}
      error={error ? {message:error, match:true} : undefined}
    >
      <DateTimePicker
        value={value}
        onValueChange={onValueChange}
        includeTime={includeTime}
        placeholder={placeholder}
        locale={locale}
        ariaLabel={String(label)}
        invalid={Boolean(error)}
        clearable={!required}
        className={className}
      />
    </Field>
  );
}

export function Avatar({
  name,
  src,
  size = 'base',
  className,
}: {
  name: string;
  src?: string;
  size?: 'base' | 'lg';
  className?: string;
}) {
  const initials = name.trim().slice(0, 2).toUpperCase() || 'U';
  const sizeClass = size === 'lg' ? 'size-14 text-lg' : 'size-9';
  if (src) {
    return (
      <img
        className={cn('shrink-0 rounded-full object-cover', sizeClass, className)}
        src={src}
        alt={name}
      />
    );
  }
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-kumo-brand text-sm font-semibold text-white',
        sizeClass,
        className,
      )}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

export function StatusBadge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: StatusTone;
}) {
  const variantByTone: Record<StatusTone, BadgeVariant> = {
    neutral: 'neutral',
    info: 'neutral',
    success: 'success',
    warning: 'warning',
    error: 'error',
  };
  return (
    <Badge appearance="dot" variant={variantByTone[tone]}>
      {children}
    </Badge>
  );
}

export function colorToBadgeVariant(color?: string): BadgeVariant {
  if (color === 'red') return 'red';
  if (color === 'orange' || color === 'yellow') return 'orange';
  if (color === 'green') return 'green';
  if (color === 'teal' || color === 'cyan') return 'teal';
  if (color === 'blue') return 'blue';
  if (color === 'purple' || color === 'pink') return 'purple';
  return 'neutral';
}
