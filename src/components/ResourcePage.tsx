import {useEffect, useMemo, useState} from 'react';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Dialog} from '@astryxdesign/core/Dialog';
import {Divider} from '@astryxdesign/core/Divider';
import {Heading, Text} from '@astryxdesign/core/Text';
import {HStack, StackItem, VStack} from '@astryxdesign/core/Stack';
import {Icon} from '@astryxdesign/core/Icon';
import {Pagination} from '@astryxdesign/core/Pagination';
import {Selector} from '@astryxdesign/core/Selector';
import {Table, pixel, proportional, useTableStickyColumns} from '@astryxdesign/core/Table';
import type {TableColumn} from '@astryxdesign/core/Table';
import {TextInput} from '@astryxdesign/core/TextInput';
import {
  ArrowDownTrayIcon,
  ArrowsUpDownIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {mockApi} from '../services/mockApi';
import type {AdminRecord, MockQuery, ResourceField, ResourceSchema} from '../types';
import {FieldValue} from './FieldValue';

type DialogMode = 'create' | 'edit' | null;

const defaultQuery: MockQuery = {
  page: 1,
  pageSize: 5,
  filters: {},
  sortKey: undefined,
  sortDirection: 'asc',
};

function editableFields(schema: ResourceSchema) {
  return schema.fields.filter(field => field.editable !== false && field.kind !== 'tags' && field.kind !== 'progress');
}

function emptyRecord(schema: ResourceSchema): AdminRecord {
  const next: AdminRecord = {id: ''};
  for (const field of editableFields(schema)) {
    next[field.key] = field.options?.[0]?.value ?? '';
  }
  return next;
}

function fieldWidth(field: ResourceField) {
  if (field.width === 'fluid') return proportional(1.55, {minWidth: 156});
  if (field.kind === 'tags') return proportional(1.25, {minWidth: 160});
  if (field.kind === 'date') return proportional(1.05, {minWidth: 132});
  if (field.kind === 'phone') return proportional(1.05, {minWidth: 132});
  if (field.kind === 'status') return proportional(0.75, {minWidth: 96});
  if (field.kind === 'select') return proportional(0.75, {minWidth: 88});
  if (field.kind === 'number') return proportional(0.7, {minWidth: 88});
  return proportional(0.95, {minWidth: 116});
}

function filterFields(schema: ResourceSchema) {
  const fieldsByKey = new Map(schema.fields.map(field => [field.key, field]));
  return schema.filterFields
    .map(key => fieldsByKey.get(key))
    .filter((field): field is ResourceField => Boolean(field));
}

function serializeCsvValue(value: unknown) {
  const text = Array.isArray(value) ? value.join(' / ') : String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function FormField({
  field,
  value,
  onChange,
  error,
}: {
  field: ResourceField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}) {
  if (field.kind === 'select' || field.kind === 'status') {
    return (
      <Selector
        label={field.label}
        value={String(value ?? '')}
        options={(field.options ?? []).map(option => ({label: option.label, value: option.value}))}
        onChange={onChange}
        placeholder={`选择${field.label}`}
        status={error ? {type: 'error', message: error} : undefined}
      />
    );
  }

  return (
    <TextInput
      label={field.label}
      value={String(value ?? '')}
      onChange={onChange}
      placeholder={`输入${field.label}`}
      isRequired={field.required}
      status={error ? {type: 'error', message: error} : undefined}
      type={field.kind === 'email' ? 'email' : 'text'}
    />
  );
}

export function ResourcePage({schema}: {schema: ResourceSchema}) {
  const [query, setQuery] = useState<MockQuery>(defaultQuery);
  const [rows, setRows] = useState<AdminRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [draft, setDraft] = useState<AdminRecord>(() => emptyRecord(schema));
  const [confirmDelete, setConfirmDelete] = useState<AdminRecord | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setQuery(defaultQuery);
    setDraft(emptyRecord(schema));
    setFormErrors({});
    setFormMessage(null);
  }, [schema]);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    mockApi.list(schema.id, query).then(page => {
      if (mounted) {
        setRows(page.items);
        setTotal(page.total);
        setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [schema.id, query]);

  const filters = useMemo(() => filterFields(schema), [schema]);
  const stickyActions = useTableStickyColumns<AdminRecord>({endKeys: ['actions']});
  const primaryFieldLabel =
    schema.fields.find(field => field.key === schema.primaryField)?.label ?? '名称';
  const columns = useMemo<TableColumn<AdminRecord>[]>(() => {
    const visible = schema.fields.filter(field => field.visible !== false);
    return [
      ...visible.map(field => ({
        key: field.key,
        header: field.label,
        width: fieldWidth(field),
        renderCell: (item: AdminRecord) => {
          const primary = field.key === schema.primaryField;
          if (primary) {
            return (
              <Text type="body" className="primaryCellText">{String(item[field.key] ?? '')}</Text>
            );
          }
          return <FieldValue field={field} value={item[field.key]} />;
        },
      })),
      {
        key: 'actions',
        header: '操作',
        width: pixel(156),
        resizable: false,
        renderCell: (item: AdminRecord) => (
          <HStack gap={1} vAlign="center" className="tableActions">
            <Button
              label="编辑"
              size="sm"
              variant="secondary"
              onClick={() => {
                setDraft(item);
                setFormErrors({});
                setFormMessage(null);
                setDialogMode('edit');
              }}
            />
            <Button
              label="删除"
              size="sm"
              variant="destructive"
              icon={<Icon icon={TrashIcon} size="xsm" />}
              onClick={() => setConfirmDelete(item)}
            />
          </HStack>
        ),
      },
    ];
  }, [schema]);

  const refresh = () => setQuery(current => ({...current}));

  const setFilter = (key: string, value: string | null) => {
    setQuery(current => ({
      ...current,
      page: 1,
      filters: {
        ...(current.filters ?? {}),
        [key]: value ?? '',
      },
    }));
  };

  const resetFilters = () => {
    setQuery(current => ({...current, page: 1, filters: {}}));
  };

  const exportRows = async () => {
    const page = await mockApi.list(schema.id, {
      ...query,
      page: 1,
      pageSize: Math.max(total, query.pageSize),
    });
    const visibleFields = schema.fields.filter(field => field.visible !== false);
    const header = visibleFields.map(field => serializeCsvValue(field.label)).join(',');
    const body = page.items
      .map(item => visibleFields.map(field => serializeCsvValue(item[field.key])).join(','))
      .join('\n');
    const csv = `\uFEFF${header}\n${body}`;
    const url = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${schema.title}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const saveDraft = async () => {
    const errors = Object.fromEntries(
      editableFields(schema)
        .filter(field => field.required && String(draft[field.key] ?? '').trim().length === 0)
        .map(field => [field.key, `请输入${field.label}`]),
    );
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setFormMessage('请补全必填项后再保存。');
      return;
    }

    const payload = Object.fromEntries(
      editableFields(schema).map(field => [field.key, draft[field.key] ?? '']),
    ) as Omit<AdminRecord, 'id'>;

    setIsSaving(true);
    try {
      if (dialogMode === 'create') {
        await mockApi.create(schema.id, payload);
      } else if (dialogMode === 'edit') {
        await mockApi.update(schema.id, draft.id, payload);
      }
      setDialogMode(null);
      setFormErrors({});
      setFormMessage(null);
      refresh();
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : '保存失败，请重试。');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <VStack gap={5} className="resourcePage" data-testid={`resource-page-${schema.id}`}>
      <HStack hAlign="between" vAlign="center" wrap="wrap" className="resourceHeader">
        <Heading level={1}>{schema.title}</Heading>
        <HStack gap={2} vAlign="center" className="resourceActions">
          <Button
            label="导出"
            variant="secondary"
            icon={<Icon icon={ArrowDownTrayIcon} size="sm" />}
            isDisabled={total === 0}
            onClick={exportRows}
          />
          <Button
            label="新增"
            icon={<Icon icon={PlusIcon} size="sm" />}
            onClick={() => {
              setDraft(emptyRecord(schema));
              setFormErrors({});
              setFormMessage(null);
              setDialogMode('create');
            }}
          />
        </HStack>
      </HStack>

      <Card padding={3} className="filterPanel">
        <HStack gap={3} vAlign="end" wrap="wrap" className="filterForm">
          {filters.map(field => {
            if (field.kind === 'select' || field.kind === 'status') {
              return (
                <StackItem key={field.key} className="filterField">
                  <Selector
                    data-testid={`filter-${field.key}`}
                    label={field.label}
                    value={query.filters?.[field.key] ?? ''}
                    width="100%"
                    options={[
                      {label: `全部${field.label}`, value: ''},
                      ...(field.options ?? []).map(option => ({
                        label: option.label,
                        value: option.value,
                      })),
                    ]}
                    onChange={value => setFilter(field.key, value)}
                  />
                </StackItem>
              );
            }

            return (
              <StackItem key={field.key} className="filterField">
                <TextInput
                  data-testid={`filter-${field.key}`}
                  label={field.label}
                  value={query.filters?.[field.key] ?? ''}
                  width="100%"
                  onChange={value => setFilter(field.key, value)}
                  placeholder={`请输入${field.label}`}
                  hasClear
                  type={field.kind === 'email' ? 'email' : 'text'}
                />
              </StackItem>
            );
          })}
          <Button
            label="查询"
            icon={<Icon icon={MagnifyingGlassIcon} size="sm" />}
            onClick={refresh}
          />
          <Button label="重置" variant="secondary" onClick={resetFilters} />
          <Button
            label={`${primaryFieldLabel}${query.sortDirection === 'asc' ? '升序' : '降序'}`}
            variant="secondary"
            icon={<Icon icon={ArrowsUpDownIcon} size="sm" />}
            onClick={() => setQuery(current => ({
              ...current,
              sortKey: schema.primaryField,
              sortDirection: current.sortDirection === 'asc' ? 'desc' : 'asc',
            }))}
          />
        </HStack>
      </Card>

      <Card padding={0} className="tablePanel">
        <VStack gap={0}>
          <HStack hAlign="between" vAlign="center" className="tableTitle">
            <VStack gap={0}>
              <Heading level={3}>数据列表</Heading>
              <Text type="supporting" color="secondary">
                {isLoading ? '正在加载...' : `共 ${total} 条记录`}
              </Text>
            </VStack>
          </HStack>
          <Divider />
          {rows.length > 0 ? (
            <Table<AdminRecord>
              tableProps={{className: 'resourceTable'}}
              data={rows}
              columns={columns}
              idKey="id"
              density="balanced"
              dividers="rows"
              hasHover
              textOverflow="truncate"
              plugins={{stickyActions}}
            />
          ) : (
            <VStack gap={2} hAlign="center" className="emptyState">
              <Heading level={3}>没有匹配结果</Heading>
              <Text type="body" color="secondary">调整筛选条件后重试。</Text>
            </VStack>
          )}
          <Divider />
          <HStack hAlign="end" className="paginationBar">
            <Pagination
              page={query.page}
              pageSize={query.pageSize}
              totalItems={total}
              variant="pages"
              size="sm"
              onChange={page => setQuery(current => ({...current, page}))}
              pageSizeOptions={[5, 10, 20]}
              onPageSizeChange={pageSize => setQuery(current => ({...current, page: 1, pageSize}))}
            />
          </HStack>
        </VStack>
      </Card>

      <Dialog
        isOpen={dialogMode !== null}
        onOpenChange={open => !open && setDialogMode(null)}
        width="min(45rem, calc(100vw - var(--spacing-12)))"
        maxHeight="min(82dvh, 46rem)"
        padding={0}
        purpose="form"
      >
        <VStack gap={0} className="dialogFrame formDialog">
          <StackItem className="dialogHeader">
            <Heading level={2}>{dialogMode === 'create' ? `新增${schema.title}` : `编辑${schema.title}`}</Heading>
          </StackItem>
          <StackItem size="fill" className="dialogScrollArea">
            <VStack gap={4}>
              {formMessage ? (
                <Banner status="error" title={formMessage} container="card" />
              ) : null}
              {editableFields(schema).map(field => (
                <FormField
                  key={field.key}
                  field={field}
                  value={draft[field.key]}
                  error={formErrors[field.key]}
                  onChange={value => {
                    setDraft(current => ({...current, [field.key]: value}));
                    setFormErrors(current => {
                      const {[field.key]: _removed, ...rest} = current;
                      return rest;
                    });
                    setFormMessage(null);
                  }}
                />
              ))}
            </VStack>
          </StackItem>
          <HStack hAlign="end" gap={2} className="dialogFooter">
            <Button label="取消" variant="secondary" onClick={() => setDialogMode(null)} />
            <Button label="保存" isLoading={isSaving} onClick={saveDraft} />
          </HStack>
        </VStack>
      </Dialog>

      <Dialog
        isOpen={confirmDelete !== null}
        onOpenChange={open => !open && setConfirmDelete(null)}
        width="min(27.5rem, calc(100vw - var(--spacing-12)))"
        maxHeight="min(82dvh, 46rem)"
        padding={0}
        purpose="required"
      >
        <VStack gap={0} className="dialogFrame confirmDialog">
          <StackItem className="dialogHeader">
            <Heading level={2}>删除记录</Heading>
          </StackItem>
          <StackItem className="dialogContent">
            <Text type="body" color="secondary">
              删除后当前列表会立即更新。
            </Text>
          </StackItem>
          <HStack hAlign="end" gap={2} className="dialogFooter">
            <Button label="取消" variant="secondary" onClick={() => setConfirmDelete(null)} />
            <Button
              label="确认删除"
              variant="destructive"
              onClick={async () => {
                if (confirmDelete) {
                  await mockApi.remove(schema.id, confirmDelete.id);
                  setConfirmDelete(null);
                  setQuery(current => {
                    const nextTotal = Math.max(total - 1, 0);
                    const lastPage = Math.max(Math.ceil(nextTotal / current.pageSize), 1);
                    return {...current, page: Math.min(current.page, lastPage)};
                  });
                }
              }}
            />
          </HStack>
        </VStack>
      </Dialog>
    </VStack>
  );
}
