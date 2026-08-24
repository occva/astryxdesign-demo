import type {RolePermission} from '../services/resourceApi';
import type {AppLanguage} from '../i18n';
import type {AdminRecord, DepartmentNode, ResourceField, ResourceQuery, ResourceSchema} from '../types';
import {FormDateInput, FormInput, FormSelect} from './kumo-ui';
import {Button} from '@cloudflare/kumo/components/button';
import {Field} from '@cloudflare/kumo/components/field';
import {Text} from '@cloudflare/kumo/components/text';
import {MenuIcon, menuIconLabel, menuIconNames} from './icons';
import {Popover} from '@cloudflare/kumo/components/popover';
import {Collapsible} from '@cloudflare/kumo/components/collapsible';
import {Checkbox} from '@cloudflare/kumo/components/checkbox';
import {CaretDown, User} from '@phosphor-icons/react';
import {useTranslation} from 'react-i18next';
import {useMemo, useState} from 'react';
import {iconCategoryKeywords, menuIconCategories, recommendedMenuIcons, type MenuIconCategory} from '../menu-icon-categories';

export type PermissionGroup = {
  resource: string;
  items: RolePermission[];
};

const permissionResourceOrder = [
  'dashboard',
  'users',
  'roles',
  'role_permissions',
  'departments',
  'menus',
  'notifications',
];

export function defaultResourceQuery(schema: ResourceSchema): ResourceQuery {
  const isMenuResource = schema.id === 'menus';
  return {
    page: 1,
    pageSize: 10,
    filters: {},
    sortKey: isMenuResource ? 'sortOrder' : schema.primaryField,
    sortDirection: 'asc',
  };
}

export function groupPermissions(permissions: RolePermission[]): PermissionGroup[] {
  const groups = new Map<string, RolePermission[]>();
  for (const permission of permissions) {
    groups.set(permission.resource, [...(groups.get(permission.resource) ?? []), permission]);
  }

  return [...groups.entries()]
    .map(([resource, items]) => ({
      resource,
      items: items.sort((left, right) => left.code.localeCompare(right.code)),
    }))
    .sort((left, right) => {
      const leftIndex = permissionResourceOrder.indexOf(left.resource);
      const rightIndex = permissionResourceOrder.indexOf(right.resource);
      const normalizedLeft = leftIndex < 0 ? Number.MAX_SAFE_INTEGER : leftIndex;
      const normalizedRight = rightIndex < 0 ? Number.MAX_SAFE_INTEGER : rightIndex;
      return normalizedLeft - normalizedRight || left.resource.localeCompare(right.resource);
    });
}

export function editableFields(schema: ResourceSchema) {
  return schema.fields.filter(
    field => field.editable === true && field.kind !== 'progress',
  );
}

export function emptyRecord(schema: ResourceSchema): AdminRecord {
  const record: AdminRecord = {id: ''};
  for (const field of editableFields(schema)) {
    record[field.key] = field.kind === 'multiselect' ? [] : field.options?.[0]?.value ?? '';
  }
  return record;
}

export function payloadValue(field: ResourceField, value: unknown) {
  if (field.kind === 'multiselect') return Array.isArray(value) ? value : [];
  if (field.kind === 'tags') return Array.isArray(value) ? value : String(value ?? '').split(/[,，]/).map(item => item.trim()).filter(Boolean);
  if (field.valueType === 'boolean') return value === true || value === 'true';
  if (field.valueType === 'number') return value === '' ? 0 : Number(value);
  return value ?? '';
}

export function menuDepth(menu: AdminRecord, menusById: Map<string, AdminRecord>) {
  let depth = 0;
  let parentId = String(menu.parentId ?? '');
  const visited = new Set<string>([menu.id]);

  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = menusById.get(parentId);
    if (!parent) break;
    depth += 1;
    parentId = String(parent.parentId ?? '');
  }
  return depth;
}

export function isMenuDescendant(
  menu: AdminRecord,
  ancestorId: string,
  menusById: Map<string, AdminRecord>,
) {
  let parentId = String(menu.parentId ?? '');
  const visited = new Set<string>();

  while (parentId && !visited.has(parentId)) {
    if (parentId === ancestorId) return true;
    visited.add(parentId);
    parentId = String(menusById.get(parentId)?.parentId ?? '');
  }
  return false;
}

export function filterFields(schema: ResourceSchema) {
  const fieldsByKey = new Map(schema.fields.map(field => [field.key, field]));
  return schema.filterFields
    .map(key => fieldsByKey.get(key))
    .filter((field): field is ResourceField => Boolean(field));
}

function isDateTimeField(field: ResourceField, value: unknown) {
  const key = field.key.toLowerCase();
  return /\d{2}:\d{2}/.test(String(value ?? '')) || key.endsWith('at') || key.includes('time');
}

type ResourceFormFieldProps = {
  field: ResourceField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  language: AppLanguage;
  fieldPrompt: (type: 'selectField' | 'enterField', field: string) => string;
  departmentTree?: DepartmentNode[];
  targetDepartmentId?: string;
};

function findOwner(nodes: DepartmentNode[], ownerId: string): {name: string; account: string} | undefined {
  for (const node of nodes) {
    const person = node.people.find(item => item.id === ownerId);
    if (person) return person;
    const nested = findOwner(node.children, ownerId);
    if (nested) return nested;
  }
  return undefined;
}

function OwnerTreeNodes({nodes, targetDepartmentId, onChange, depth = 0}: {
  nodes: DepartmentNode[];
  targetDepartmentId: string;
  onChange: (value: string) => void;
  depth?: number;
}) {
  return nodes.map(node => {
    const isTarget = node.id === targetDepartmentId;
    return (
      <Collapsible.Root key={node.id} defaultOpen={depth < 2 || isTarget} className="border-b border-kumo-line last:border-b-0">
        <Collapsible.DefaultTrigger className="w-full py-2 text-kumo-default">
          <Text as="span" bold truncate>{node.name}</Text>
        </Collapsible.DefaultTrigger>
        <Collapsible.DefaultPanel className="[&>div]:my-0 [&>div]:border-l-0 [&>div]:p-0">
          <div className="pb-2 pl-3">
            {node.people.length ? <div className="flex flex-col gap-1">{node.people.map(person => {
              const selectable = isTarget && person.status === 'normal';
              return <Popover.Close key={person.id} render={<Button className="w-full justify-start" size="sm" variant="ghost" icon={User} disabled={!selectable} onClick={() => onChange(person.id)} />}>
                <span className="min-w-0 truncate">{person.name} <span className="text-kumo-subtle">@{person.account}</span></span>
              </Popover.Close>;
            })}</div> : null}
            {node.children.length ? <div className="mt-1 border-l border-kumo-line pl-3"><OwnerTreeNodes nodes={node.children} targetDepartmentId={targetDepartmentId} onChange={onChange} depth={depth + 1} /></div> : null}
          </div>
        </Collapsible.DefaultPanel>
      </Collapsible.Root>
    );
  });
}

function DepartmentOwnerTreeField({field, value, nodes, targetDepartmentId, onChange, error}: {
  field: ResourceField;
  value: unknown;
  nodes: DepartmentNode[];
  targetDepartmentId: string;
  onChange: (value: unknown) => void;
  error?: string;
}) {
  const {t} = useTranslation('resource');
  const selected = findOwner(nodes, String(value ?? ''));
  return (
    <Field label={field.label} error={error ? {message:error, match:true} : undefined}>
      <Popover>
        <Popover.Trigger render={<Button className="w-full justify-between font-normal" variant="secondary" disabled={!targetDepartmentId} />}>
          <span className="min-w-0 truncate">{selected ? `${selected.name} (@${selected.account})` : t('selectDepartmentOwner')}</span><CaretDown className="size-4 shrink-0" />
        </Popover.Trigger>
        <Popover.Content align="start" className="max-h-96 w-[var(--anchor-width)] min-w-80 overflow-y-auto p-2">
          <OwnerTreeNodes nodes={nodes} targetDepartmentId={targetDepartmentId} onChange={onChange} />
        </Popover.Content>
      </Popover>
    </Field>
  );
}

function MenuIconPicker({field, value, onChange, error}: {field: ResourceField; value: unknown; onChange: (value: unknown) => void; error?: string}) {
  const {t} = useTranslation('resource');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<MenuIconCategory>('recommended');
  const filteredIcons = useMemo(() => {
    const query = search.trim().replace(/\s+/g, '').toLowerCase();
    return menuIconNames.filter(name => {
      if (query && !name.toLowerCase().includes(query)) return false;
      if (query || category === 'all') return true;
      if (category === 'recommended') return recommendedMenuIcons.has(name);
      return iconCategoryKeywords[category]?.test(name) ?? true;
    });
  }, [category, search]);
  const visibleIcons = filteredIcons.slice(0, 120);
  const selectedIcon = String(value || 'SlidersHorizontalIcon');

  const chooseRandomIcon = () => {
    if (menuIconNames.length === 0) return;
    let nextIcon = menuIconNames[Math.floor(Math.random() * menuIconNames.length)];
    if (menuIconNames.length > 1 && nextIcon === value) {
      nextIcon = menuIconNames[(menuIconNames.indexOf(nextIcon) + 1) % menuIconNames.length];
    }
    onChange(nextIcon);
  };

  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 text-sm font-medium text-kumo-default">{field.label}{field.required ? <span className="text-kumo-danger"> *</span> : null}</legend>
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <Popover.Trigger render={<Button type="button" className="min-w-0 flex-1 justify-between" variant="secondary" />}>
            <span className="inline-flex min-w-0 items-center gap-3">
              <span className="inline-flex size-6 shrink-0 items-center justify-center"><MenuIcon code={selectedIcon} className="size-5" /></span>
              <Text as="span">{t('chooseIcon')}</Text>
            </span>
            <CaretDown className="size-4 shrink-0" />
          </Popover.Trigger>
          <Popover.Content align="start" positionMethod="fixed" className="w-[min(32rem,calc(100vw-2rem))] p-3">
            <FormInput label={t('iconSearch')} value={search} onValueChange={setSearch} placeholder={t('iconSearchPlaceholder')} />
            <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
              {menuIconCategories.map(item => <Button key={item} type="button" size="xs" variant={category === item ? 'primary' : 'secondary'} onClick={() => setCategory(item)}>{t(`iconCategories.${item}`)}</Button>)}
            </div>
            <div className="mt-3 grid max-h-64 grid-cols-7 gap-2 overflow-y-auto pr-1 sm:grid-cols-8">
              {visibleIcons.map(name => {
                const selected = String(value ?? '') === name;
                const label = menuIconLabel(name);
                return <Button key={name} type="button" shape="square" size="sm" variant={selected ? 'primary' : 'secondary'} aria-label={label} aria-pressed={selected} title={label} onClick={() => { onChange(name); setOpen(false); }}><MenuIcon code={name} className="size-5" /></Button>;
              })}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3"><Text size="sm" variant="secondary">{t('iconResultCount', {shown: visibleIcons.length, total: filteredIcons.length})}</Text><span title={menuIconLabel(selectedIcon)}><MenuIcon code={selectedIcon} className="size-5" /></span></div>
          </Popover.Content>
        </Popover>
        <Button type="button" variant="secondary" onClick={chooseRandomIcon}>{t('randomIcon')}</Button>
      </div>
      {error ? <div className="mt-2"><Text as="p" size="sm" variant="error">{error}</Text></div> : null}
    </fieldset>
  );
}

export function ResourceFormField({
  field,
  value,
  onChange,
  error,
  language,
  fieldPrompt,
  departmentTree = [],
  targetDepartmentId = '',
}: ResourceFormFieldProps) {
  if (field.key === 'ownerUserId') {
    return <DepartmentOwnerTreeField field={field} value={value} nodes={departmentTree} targetDepartmentId={targetDepartmentId} onChange={onChange} error={error} />;
  }
  if (field.kind === 'icon') {
    return <MenuIconPicker field={field} value={value} onChange={onChange} error={error} />;
  }

  if (field.kind === 'date') {
    return (
      <FormDateInput
        label={field.label}
        value={String(value ?? '')}
        onValueChange={onChange}
        includeTime={isDateTimeField(field, value)}
        placeholder={fieldPrompt('selectField', field.label)}
        locale={language}
        required={field.required}
        error={error}
      />
    );
  }

  if (field.kind === 'select' || field.kind === 'status') {
    return (
      <FormSelect
        label={field.label}
        value={String(value ?? '')}
        options={(field.options ?? []).map(option => ({label: option.label, value: option.value}))}
        onValueChange={onChange}
        placeholder={fieldPrompt('selectField', field.label)}
        error={error}
        required={field.required}
      />
    );
  }

  if (field.kind === 'multiselect') {
    const selected = Array.isArray(value) ? value.map(String) : [];
    return (
      <Checkbox.Group value={selected} onValueChange={onChange} className="gap-2">
        <Checkbox.Legend>{field.label}</Checkbox.Legend>
        <div className="max-h-48 overflow-y-auto rounded-lg border border-kumo-line p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {(field.options ?? []).map(option => (
              <Checkbox.Item key={option.value} value={option.value} label={option.label} />
            ))}
          </div>
        </div>
        {error ? <Text as="p" size="sm" variant="error">{error}</Text> : null}
      </Checkbox.Group>
    );
  }

  if (field.kind === 'tags') {
    return (
      <FormInput
        label={field.label}
        value={Array.isArray(value) ? value.join(', ') : String(value ?? '')}
        onValueChange={onChange}
        placeholder={fieldPrompt('enterField', field.label)}
        required={field.required}
        error={error}
      />
    );
  }

  return (
    <FormInput
      label={field.label}
      value={String(value ?? '')}
      onValueChange={onChange}
      placeholder={fieldPrompt('enterField', field.label)}
      required={field.required}
      error={error}
      type={field.kind === 'email' ? 'email' : field.kind === 'number' ? 'number' : 'text'}
    />
  );
}
