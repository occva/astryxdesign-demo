import type {ReactNode} from 'react';
import {Badge} from '@cloudflare/kumo/components/badge';
import type {BadgeVariant} from '@cloudflare/kumo/components/badge';
import {Input} from '@cloudflare/kumo/components/input';
import type {InputProps} from '@cloudflare/kumo/components/input';
import {LayerCard} from '@cloudflare/kumo/components/layer-card';
import {Select} from '@cloudflare/kumo/components/select';
import {Text} from '@cloudflare/kumo/components/text';
import {cn} from '@cloudflare/kumo/utils';

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

export function NativeSelect({
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
  const id = `select-${String(label).replace(/\s+/g, '-')}`;
  return (
    <label className={cn('block w-full', className)} htmlFor={id}>
      <span className="mb-1.5 block text-sm font-medium text-kumo-strong">{label}</span>
      <select
        id={id}
        required={required}
        value={value}
        className={cn('h-9 w-full rounded-lg border border-kumo-line bg-kumo-elevated px-3 text-base text-kumo-default outline-none focus:ring-2 focus:ring-kumo-focus/25', error ? 'border-kumo-danger' : '')}
        onChange={event => onValueChange(event.currentTarget.value)}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="mt-1 block text-sm text-kumo-danger">{error}</span> : null}
    </label>
  );
}

export function Avatar({
  name,
  size = 'base',
  className,
}: {
  name: string;
  size?: 'base' | 'lg';
  className?: string;
}) {
  const initials = name.trim().slice(0, 2).toUpperCase() || 'U';
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-kumo-brand text-sm font-semibold text-white',
        size === 'lg' ? 'size-14 text-lg' : 'size-9',
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
    info: 'info',
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
