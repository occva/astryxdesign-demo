import {
  createContext,
  cloneElement,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ComponentType,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import {CaretDown, SidebarSimple, X} from './vercel-icons';
import {DateTimePicker} from './DateTimePicker';
import type {DateTimePickerLocale, DateTimePickerProps} from './DateTimePicker';

export {DateTimePicker};
export type {DateTimePickerLocale, DateTimePickerProps};

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export type BadgeVariant =
  | 'neutral'
  | 'secondary'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'red'
  | 'orange'
  | 'green'
  | 'teal'
  | 'blue'
  | 'purple';

type TextProps<T extends ElementType = 'p'> = {
  as?: T;
  variant?: 'primary' | 'secondary' | 'heading1' | 'heading2' | 'heading3';
  size?: 'xs' | 'sm' | 'base';
  bold?: boolean;
  truncate?: boolean;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

export function Text<T extends ElementType = 'p'>({
  as,
  variant = 'primary',
  size = 'base',
  bold,
  truncate,
  className,
  children,
  ...props
}: TextProps<T>) {
  const Component = (as ?? 'p') as ElementType;
  return (
    <Component
      className={cn(
        'vbg-custom-text',
        `vbg-custom-text--${variant}`,
        `vbg-custom-text--${size}`,
        bold && 'vbg-custom-text--bold',
        truncate && 'vbg-custom-truncate',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?:
    | 'primary'
    | 'secondary'
    | 'destructive'
    | 'secondary-destructive';
  size?: 'sm' | 'base';
  shape?: 'default' | 'square';
  icon?: ComponentType<{className?: string}>;
  loading?: boolean;
};

export function Button({
  variant = 'secondary',
  size = 'base',
  shape = 'default',
  icon: Icon,
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'vbg-button',
        `vbg-button--${variant}`,
        `vbg-button--${size}`,
        shape === 'square' && 'vbg-button--square',
        className,
      )}
      disabled={disabled || loading}
      type={props.type ?? 'button'}
      {...props}
    >
      {Icon ? <Icon className="vbg-custom-icon" aria-hidden="true" /> : null}
      {loading ? <span className="vbg-custom-spinner" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function Link({
  className,
  ...props
}: HTMLAttributes<HTMLAnchorElement> & {href: string}) {
  return <a className={cn('vbg-custom-link', className)} {...props} />;
}

export function Badge({
  children,
  variant = 'neutral',
  appearance,
  className,
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  appearance?: 'dot';
  className?: string;
}) {
  return (
    <span
      className={cn('vbg-custom-token', appearance === 'dot' && 'vbg-custom-token--dot', className)}
      data-variant={variant}
    >
      {children}
    </span>
  );
}

export function Banner({
  title,
  action,
  variant = 'info',
}: {
  title: ReactNode;
  action?: ReactNode;
  variant?: 'info' | 'error' | 'success' | 'warning';
}) {
  return (
    <div className="vbg-custom-banner" data-variant={variant} role={variant === 'error' ? 'alert' : 'status'}>
      <span>{title}</span>
      {action ? <span>{action}</span> : null}
    </div>
  );
}

export function Card({children, className}: {children: ReactNode; className?: string}) {
  return <section className={cn('vbg-custom-card', className)}>{children}</section>;
}

export function LayerCard({children, className}: {children: ReactNode; className?: string}) {
  return <section className={cn('vbg-custom-layer', className)}>{children}</section>;
}

LayerCard.Secondary = function LayerCardSecondary({children}: {children: ReactNode}) {
  return <div className="vbg-custom-layer__secondary">{children}</div>;
};

LayerCard.Primary = function LayerCardPrimary({children}: {children: ReactNode}) {
  return <div className="vbg-custom-layer__primary">{children}</div>;
};

export function PageTitle({title, actions}: {title: ReactNode; actions?: ReactNode}) {
  return (
    <header className="vbg-custom-page-title">
      <Text variant="heading2" as="h1">{title}</Text>
      {actions ? <div className="vbg-custom-actions">{actions}</div> : null}
    </header>
  );
}

export function SectionTitle({title, aside}: {title: ReactNode; aside?: ReactNode}) {
  return (
    <div className="vbg-custom-section-title">
      <Text variant="heading3" as="h2">{title}</Text>
      {aside ? <div className="vbg-custom-section-title__aside">{aside}</div> : null}
    </div>
  );
}

type FormInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'required'> & {
  label?: ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  required?: boolean;
  error?: string;
};

export function FormInput({
  label,
  value,
  onValueChange,
  required,
  error,
  className,
  id,
  ...props
}: FormInputProps) {
  const inputId = id ?? `field-${String(label ?? props.name ?? 'input').replace(/\s+/g, '-')}`;
  return (
    <label className={cn('vbg-field', className)} htmlFor={inputId}>
      {label ? <span className="vbg-label">{label}{required ? <span aria-hidden="true"> *</span> : null}</span> : null}
      <input
        {...props}
        id={inputId}
        value={value}
        required={required}
        aria-invalid={Boolean(error)}
        className="vbg-custom-input"
        onChange={(event) => onValueChange(event.currentTarget.value)}
      />
      {error ? <span className="vbg-error">{error}</span> : null}
    </label>
  );
}

export type SelectItem = {label: string; value: string};

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
  const id = `select-${String(label).replace(/\s+/g, '-')}`;
  const canClear = Boolean(value) && !required;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuOptions = [
    ...(placeholder ? [{label: placeholder, value: ''}] : []),
    ...(!placeholder && !required && !options.some((option) => option.value === '') ? [{label: '', value: ''}] : []),
    ...options,
  ];
  const selectedOption = menuOptions.find((option) => option.value === value);
  const displayValue = selectedOption?.label || placeholder || '';

  useEffect(() => {
    if (!open) return undefined;

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

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className={cn('vbg-field', className)} ref={rootRef}>
      <span className="vbg-label" id={`${id}-label`}>{label}{required ? <span aria-hidden="true"> *</span> : null}</span>
      <span className="vbg-custom-select-wrap">
        <button
          id={id}
          className="vbg-custom-input vbg-custom-select vbg-custom-select-trigger"
          data-clearable={canClear || undefined}
          type="button"
          aria-expanded={open}
          aria-invalid={Boolean(error)}
          aria-labelledby={`${id}-label ${id}`}
          onClick={() => setOpen((current) => !current)}
        >
          <span className={cn('vbg-custom-truncate', value ? '' : 'vbg-custom-select-placeholder')}>{displayValue}</span>
        </button>
        {canClear ? (
          <button
            className="vbg-custom-field-clear"
            type="button"
            aria-label={`${String(label)} clear`}
            onClick={() => {
              onValueChange('');
              setOpen(false);
            }}
          >
            <X className="vbg-custom-icon vbg-custom-icon--xs" />
          </button>
        ) : null}
        <CaretDown aria-hidden="true" className="vbg-custom-select-icon" />
        {open ? (
          <div className="vbg-custom-select-menu" role="listbox" aria-labelledby={`${id}-label`}>
            {menuOptions.map((option) => (
              <button
                key={`${option.value}-${option.label}`}
                className="vbg-custom-select-option"
                data-selected={option.value === value || undefined}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onValueChange(option.value);
                  setOpen(false);
                }}
              >
                <span className="vbg-custom-select-option__check" data-selected={option.value === value || undefined} aria-hidden="true" />
                <span className="vbg-custom-truncate">{option.label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </span>
      {error ? <span className="vbg-error">{error}</span> : null}
    </div>
  );
}

export function FormDateInput({
  label,
  value,
  onValueChange,
  includeTime,
  placeholder,
  locale = 'en',
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
    <div className={cn('vbg-field', className)}>
      <span className="vbg-label">{label}{required ? <span aria-hidden="true"> *</span> : null}</span>
      <DateTimePicker
        value={value}
        onValueChange={onValueChange}
        includeTime={includeTime}
        placeholder={placeholder}
        locale={locale}
        ariaLabel={String(label)}
        invalid={Boolean(error)}
      />
      {error ? <span className="vbg-error">{error}</span> : null}
    </div>
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
  return (
    <FormSelect
      label={label}
      value={value}
      options={options}
      onValueChange={onValueChange}
      placeholder={placeholder}
      error={error}
      required={required}
      className={className}
    />
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
  const sizeClass = size === 'lg' ? 'vbg-custom-avatar--lg' : 'vbg-custom-avatar--base';
  if (src) {
    return <img className={cn('vbg-custom-avatar', sizeClass, className)} src={src} alt={name} />;
  }
  return (
    <span className={cn('vbg-custom-avatar', sizeClass, className)} aria-hidden="true">
      {initials}
    </span>
  );
}

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

export function StatusBadge({children, tone = 'neutral'}: {children: ReactNode; tone?: StatusTone}) {
  return <Badge appearance="dot" variant={tone}>{children}</Badge>;
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

type DialogContextValue = {onOpenChange?: (open: boolean) => void};
const DialogContext = createContext<DialogContextValue>({});

function DialogRoot({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  role?: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return <DialogContext.Provider value={{onOpenChange}}>{children}</DialogContext.Provider>;
}

function DialogPanel({
  children,
  className,
  size = 'base',
}: {
  children: ReactNode;
  className?: string;
  size?: 'base' | 'lg' | 'xl';
}) {
  const {onOpenChange} = useContext(DialogContext);
  return (
    <div className="vbg-custom-dialog" role="presentation">
      <button className="vbg-custom-dialog__scrim" type="button" aria-label="Close" onClick={() => onOpenChange?.(false)} />
      <section className={cn('vbg-custom-dialog__panel', `vbg-custom-dialog__panel--${size}`, className)} role="dialog" aria-modal="true">
        {children}
      </section>
    </div>
  );
}

DialogPanel.Root = DialogRoot;
DialogPanel.Title = function DialogTitle({children}: {children: ReactNode}) {
  return <h2 className="vbg-heading-20">{children}</h2>;
};
DialogPanel.Description = function DialogDescription({children}: {children: ReactNode}) {
  return <p className="vbg-custom-text vbg-custom-text--secondary">{children}</p>;
};

export const Dialog = DialogPanel;

type MenuContextValue = {open: boolean; setOpen: (open: boolean) => void};
const DropdownContext = createContext<MenuContextValue | null>(null);

export function DropdownMenu({children}: {children: ReactNode}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const value = useMemo(() => ({open, setOpen}), [open]);

  useEffect(() => {
    if (!open) return undefined;

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

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <DropdownContext.Provider value={value}>
      <span className="vbg-custom-menu" ref={rootRef}>
        {children}
      </span>
    </DropdownContext.Provider>
  );
}

DropdownMenu.Trigger = function DropdownTrigger({render}: {render: ReactElement}) {
  const context = useContext(DropdownContext);
  if (!context || !isValidElement(render)) return render;
  const originalOnClick = (render.props as {onClick?: (event: unknown) => void}).onClick;
  return cloneElement(render, {
    'aria-expanded': context.open,
    onClick: (event: unknown) => {
      originalOnClick?.(event);
      context.setOpen(!context.open);
    },
  } as Partial<unknown>);
};

DropdownMenu.Content = function DropdownContent({children, className, side = 'bottom', align = 'start'}: {children: ReactNode; className?: string; side?: string; align?: string}) {
  const context = useContext(DropdownContext);
  if (!context?.open) return null;
  return <div className={cn('vbg-custom-menu__content', className)} data-side={side} data-align={align}>{children}</div>;
};

DropdownMenu.Item = function DropdownItem({
  children,
  icon,
  className,
  onClick,
}: {
  children: ReactNode;
  icon?: ComponentType<{className?: string}> | ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const context = useContext(DropdownContext);
  const Icon = typeof icon === 'function' ? icon : null;
  const iconNode = Icon ? <Icon className="vbg-custom-icon" aria-hidden="true" /> : (icon as ReactNode);
  return (
    <button
      className={cn('vbg-custom-menu__item', className)}
      type="button"
      onClick={() => {
        onClick?.();
        context?.setOpen(false);
      }}
    >
      {iconNode}
      {children}
    </button>
  );
};

type PopoverContextValue = {open: boolean; setOpen: (open: boolean) => void};
const PopoverContext = createContext<PopoverContextValue | null>(null);

export function Popover({
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const value = useMemo(() => ({open, setOpen}), [open]);

  useEffect(() => {
    if (!open) return undefined;

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

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <PopoverContext.Provider value={value}>
      <span className="vbg-custom-popover" ref={rootRef}>
        {children}
      </span>
    </PopoverContext.Provider>
  );
}

Popover.Trigger = function PopoverTrigger({render}: {render: ReactElement}) {
  const context = useContext(PopoverContext);
  if (!context || !isValidElement(render)) return render;
  const originalOnClick = (render.props as {onClick?: (event: unknown) => void}).onClick;
  return cloneElement(render, {
    'aria-expanded': context.open,
    onClick: (event: unknown) => {
      originalOnClick?.(event);
      context.setOpen(!context.open);
    },
  } as Partial<unknown>);
};

Popover.Content = function PopoverContent({children, className, side = 'bottom', align = 'start'}: {children: ReactNode; className?: string; side?: string; align?: string; sideOffset?: number; positionMethod?: string}) {
  const context = useContext(PopoverContext);
  if (!context?.open) return null;
  return <div className={cn('vbg-custom-popover__content', className)} data-side={side} data-align={align}>{children}</div>;
};

export function Meter({label, value, max = 100, showValue = true}: {label: string; value: number; max?: number; showValue?: boolean}) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="vbg-custom-meter" aria-label={label}>
      <span className="vbg-custom-meter__track"><span className="vbg-custom-meter__fill" style={{width: `${percent}%`}} /></span>
      {showValue ? <span className="vbg-meta">{Math.round(percent)}%</span> : null}
    </div>
  );
}

export function Tabs({
  value,
  onValueChange,
  tabs,
}: {
  size?: 'sm';
  value: string;
  onValueChange: (value: string) => void;
  tabs: Array<{value: string; label: ReactNode}>;
}) {
  return (
    <div className="vbg-custom-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className="vbg-custom-tabs__tab"
          data-active={value === tab.value || undefined}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onValueChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

type PaginationContextValue = {
  page: number;
  setPage: (page: number) => void;
  perPage: number;
  totalCount: number;
  labels: Record<string, string>;
};
const PaginationContext = createContext<PaginationContextValue | null>(null);

export function Pagination({
  page,
  setPage,
  perPage,
  totalCount,
  labels,
  children,
}: PaginationContextValue & {children: ReactNode}) {
  return (
    <PaginationContext.Provider value={{page, setPage, perPage, totalCount, labels}}>
      <div className="vbg-custom-pagination">{children}</div>
    </PaginationContext.Provider>
  );
}

Pagination.Info = function PaginationInfo({children}: {children: (info: {pageShowingRange: string; totalCount: number}) => ReactNode}) {
  const context = useContext(PaginationContext);
  if (!context) return null;
  const start = context.totalCount === 0 ? 0 : (context.page - 1) * context.perPage + 1;
  const end = Math.min(context.page * context.perPage, context.totalCount);
  return <>{children({pageShowingRange: `${start}-${end}`, totalCount: context.totalCount})}</>;
};

Pagination.Separator = function PaginationSeparator() {
  return <span className="vbg-custom-pagination__separator" aria-hidden="true" />;
};

Pagination.PageSize = function PaginationPageSize({
  value,
  label,
  options,
  onChange,
}: {
  value: number;
  label: string;
  options: number[];
  onChange: (value: number) => void;
}) {
  return (
    <label className="vbg-custom-pagination__size">
      <span className="vbg-meta">{label}</span>
      <select className="vbg-custom-input" value={value} onChange={(event) => onChange(Number(event.currentTarget.value))}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
};

Pagination.Controls = function PaginationControls(_props: {pageSelector?: string}) {
  const context = useContext(PaginationContext);
  if (!context) return null;
  const pageCount = Math.max(1, Math.ceil(context.totalCount / context.perPage));
  return (
    <span className="vbg-custom-pagination__controls">
      <Button size="sm" variant="secondary" disabled={context.page <= 1} onClick={() => context.setPage(1)}>{context.labels.firstPage}</Button>
      <Button size="sm" variant="secondary" disabled={context.page <= 1} onClick={() => context.setPage(context.page - 1)}>{context.labels.previousPage}</Button>
      <input
        className="vbg-custom-input vbg-custom-pagination__input"
        aria-label={context.labels.pageNumber}
        value={context.page}
        onChange={(event) => {
          const next = Number(event.currentTarget.value);
          if (Number.isFinite(next)) context.setPage(Math.min(Math.max(next, 1), pageCount));
        }}
      />
      <Button size="sm" variant="secondary" disabled={context.page >= pageCount} onClick={() => context.setPage(context.page + 1)}>{context.labels.nextPage}</Button>
      <Button size="sm" variant="secondary" disabled={context.page >= pageCount} onClick={() => context.setPage(pageCount)}>{context.labels.lastPage}</Button>
    </span>
  );
};

export function Table({children, className, style}: {children: ReactNode; className?: string; style?: CSSProperties}) {
  return <table className={cn('vbg-custom-table', className)} style={style}>{children}</table>;
}

Table.Caption = function TableCaption({children}: {children: ReactNode}) {
  return <caption className="vbg-visually-hidden">{children}</caption>;
};
Table.Header = function TableHeader({children, className}: {children: ReactNode; className?: string; sticky?: boolean}) {
  return <thead className={className}>{children}</thead>;
};
Table.Body = function TableBody({children}: {children: ReactNode}) {
  return <tbody>{children}</tbody>;
};
Table.Row = function TableRow({children}: {children: ReactNode}) {
  return <tr>{children}</tr>;
};
Table.Head = function TableHead({children, className, sticky}: {children: ReactNode; className?: string; sticky?: string}) {
  return <th className={className} data-sticky={sticky} scope="col">{children}</th>;
};
Table.Cell = function TableCell({children, className, sticky}: {children: ReactNode; className?: string; sticky?: string}) {
  return <td className={className} data-sticky={sticky}>{children}</td>;
};

export function Switch({
  label,
  checked,
  transitioning,
  disabled,
  controlFirst,
  onCheckedChange,
}: {
  label: ReactNode;
  checked: boolean;
  transitioning?: boolean;
  disabled?: boolean;
  controlFirst?: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  const control = (
    <span className="vbg-custom-switch__control" data-checked={checked || undefined} data-transitioning={transitioning || undefined}>
      <span className="vbg-custom-switch__thumb" />
    </span>
  );
  return (
    <label className="vbg-custom-switch">
      {controlFirst !== false ? control : null}
      <span className="vbg-custom-switch__label">{label}</span>
      {controlFirst === false ? control : null}
      <input
        className="vbg-visually-hidden"
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onCheckedChange(event.currentTarget.checked)}
      />
    </label>
  );
}

type SidebarContextValue = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
const SidebarContext = createContext<SidebarContextValue | null>(null);

type SidebarCollapsibleContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};
const SidebarCollapsibleContext = createContext<SidebarCollapsibleContextValue | null>(null);

function SidebarProvider({
  open,
  onOpenChange,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collapsible?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <SidebarContext.Provider value={{open, onOpenChange}}>
      <div
        className={cn('vbg-custom-app-frame group/sidebar', className)}
        data-sidebar-state={open ? 'expanded' : 'collapsed'}
        data-state={open ? 'expanded' : 'collapsed'}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

function SidebarRoot({
  children,
  className,
  contentClassName,
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return <aside className={cn('vbg-custom-sidebar', className, contentClassName)}>{children}</aside>;
}

SidebarRoot.Provider = SidebarProvider;
SidebarRoot.Header = function SidebarHeader({children, className}: {children: ReactNode; className?: string}) {
  return <header className={cn('vbg-custom-sidebar__header', className)}>{children}</header>;
};
SidebarRoot.Content = function SidebarContent({children}: {children: ReactNode}) {
  return <div className="vbg-custom-sidebar__content">{children}</div>;
};
SidebarRoot.Footer = function SidebarFooter({children, className}: {children: ReactNode; className?: string}) {
  return <footer className={cn('vbg-custom-sidebar__footer', className)}>{children}</footer>;
};
SidebarRoot.Group = function SidebarGroup({children}: {children: ReactNode}) {
  return <section className="vbg-custom-sidebar__group">{children}</section>;
};
SidebarRoot.GroupLabel = function SidebarGroupLabel({children}: {children: ReactNode}) {
  return <p className="vbg-custom-sidebar__label">{children}</p>;
};
SidebarRoot.Menu = function SidebarMenu({children}: {children: ReactNode}) {
  return <ul className="vbg-custom-sidebar__menu">{children}</ul>;
};
SidebarRoot.MenuItem = function SidebarMenuItem({children, className}: {children: ReactNode; className?: string}) {
  return <li className={className}>{children}</li>;
};
SidebarRoot.MenuButton = function SidebarMenuButton({
  children,
  active,
  icon: Icon,
  tooltip,
  className,
  onClick,
  'aria-expanded': ariaExpanded,
  'aria-label': ariaLabel,
}: {
  children?: ReactNode;
  active?: boolean;
  icon?: ComponentType<{className?: string}>;
  tooltip?: string;
  className?: string;
  onClick?: () => void;
  'aria-expanded'?: boolean;
  'aria-label'?: string;
}) {
  return (
    <button
      className={cn('vbg-custom-sidebar__button', className)}
      data-active={active || undefined}
      type="button"
      title={tooltip}
      aria-expanded={ariaExpanded}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {Icon ? <Icon className="vbg-custom-icon" aria-hidden="true" /> : null}
      {children ? <span className="vbg-custom-sidebar__button-text">{children}</span> : null}
    </button>
  );
};
SidebarRoot.MenuChevron = function SidebarMenuChevron() {
  const context = useContext(SidebarCollapsibleContext);
  return <CaretDown className="vbg-custom-sidebar__chevron" data-open={context?.open || undefined} aria-hidden="true" />;
};
SidebarRoot.Collapsible = function SidebarCollapsible({children, open: controlledOpen, onOpenChange}: {children: ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(controlledOpen ?? false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (nextOpen: boolean) => {
    setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  return (
    <SidebarCollapsibleContext.Provider value={{open, setOpen}}>
      <div className="vbg-custom-sidebar__collapsible" data-open={open || undefined}>{children}</div>
    </SidebarCollapsibleContext.Provider>
  );
};
SidebarRoot.CollapsibleTrigger = function SidebarCollapsibleTrigger({render}: {render: ReactElement}) {
  const context = useContext(SidebarCollapsibleContext);
  if (!context || !isValidElement(render)) return render;
  const originalOnClick = (render.props as {onClick?: () => void}).onClick;
  return cloneElement(render, {
    'aria-expanded': context.open,
    onClick: () => {
      originalOnClick?.();
      context.setOpen(!context.open);
    },
  } as Partial<unknown>);
};
SidebarRoot.CollapsibleContent = function SidebarCollapsibleContent({children}: {children: ReactNode}) {
  const context = useContext(SidebarCollapsibleContext);
  if (!context?.open) return null;
  return <div className="vbg-custom-sidebar__collapsible-content">{children}</div>;
};
SidebarRoot.MenuSub = function SidebarMenuSub({children}: {children: ReactNode}) {
  return <ul className="vbg-custom-sidebar__submenu">{children}</ul>;
};
SidebarRoot.MenuSubButton = function SidebarMenuSubButton({children, active, onClick}: {children: ReactNode; active?: boolean; onClick?: () => void}) {
  return (
    <li>
      <button className="vbg-custom-sidebar__subbutton" data-active={active || undefined} type="button" onClick={onClick}>
        {children}
      </button>
    </li>
  );
};
SidebarRoot.Trigger = function SidebarTrigger(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const context = useContext(SidebarContext);
  return (
    <button
      {...props}
      className={cn('vbg-button vbg-button--secondary vbg-button--square', props.className)}
      type="button"
      onClick={(event) => {
        props.onClick?.(event);
        if (context) context.onOpenChange(!context.open);
      }}
    >
      <SidebarSimple className="vbg-custom-icon" aria-hidden="true" />
    </button>
  );
};

export const Sidebar = SidebarRoot;
