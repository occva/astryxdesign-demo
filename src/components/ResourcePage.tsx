import {useEffect, useMemo, useState} from 'react';
import {Badge} from '@cloudflare/kumo/components/badge';
import {Banner} from '@cloudflare/kumo/components/banner';
import {Button} from '@cloudflare/kumo/components/button';
import {Dialog} from '@cloudflare/kumo/components/dialog';
import {Pagination} from '@cloudflare/kumo/components/pagination';
import {Table} from '@cloudflare/kumo/components/table';
import {Text} from '@cloudflare/kumo/components/text';
import {
  ArrowsDownUp,
  DownloadSimple,
  MagnifyingGlass,
  Plus,
  Trash,
} from '@phosphor-icons/react';
import {mockApi} from '../services/mockApi';
import type {AdminRecord, MockQuery, ResourceField, ResourceSchema} from '../types';
import {FieldValue} from './FieldValue';
import {Card, FormInput, FormSelect, PageTitle} from './kumo-ui';

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
      <FormSelect
        label={field.label}
        value={String(value ?? '')}
        options={(field.options ?? []).map(option => ({label: option.label, value: option.value}))}
        onValueChange={onChange}
        placeholder={`选择${field.label}`}
        error={error}
        required={field.required}
      />
    );
  }

  return (
    <FormInput
      label={field.label}
      value={String(value ?? '')}
      onValueChange={onChange}
      placeholder={`输入${field.label}`}
      required={field.required}
      error={error}
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
  const visibleFields = useMemo(
    () => schema.fields.filter(field => field.visible !== false),
    [schema],
  );
  const tableMinWidthRem = Math.max(56, visibleFields.length * 8 + 14);
  const primaryFieldLabel =
    schema.fields.find(field => field.key === schema.primaryField)?.label ?? '名称';

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

  const deleteRecord = async () => {
    if (!confirmDelete) return;
    await mockApi.remove(schema.id, confirmDelete.id);
    setConfirmDelete(null);
    setQuery(current => {
      const nextTotal = Math.max(total - 1, 0);
      const lastPage = Math.max(Math.ceil(nextTotal / current.pageSize), 1);
      return {...current, page: Math.min(current.page, lastPage)};
    });
  };

  return (
    <div className="flex min-w-0 flex-col gap-5" data-testid={`resource-page-${schema.id}`}>
      <PageTitle
        title={schema.title}
        actions={
          <>
            <Button
              variant="secondary"
              icon={DownloadSimple}
              disabled={total === 0}
              onClick={exportRows}
            >
              导出
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setDraft(emptyRecord(schema));
                setFormErrors({});
                setFormMessage(null);
                setDialogMode('create');
              }}
            >
              新增
            </Button>
          </>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          {filters.map(field => {
            if (field.kind === 'select' || field.kind === 'status') {
              return (
                <div key={field.key} className="min-w-48 flex-1">
                  <FormSelect
                    label={field.label}
                    value={query.filters?.[field.key] ?? ''}
                    options={[
                      {label: `全部${field.label}`, value: ''},
                      ...(field.options ?? []).map(option => ({
                        label: option.label,
                        value: option.value,
                      })),
                    ]}
                    onValueChange={value => setFilter(field.key, value)}
                  />
                </div>
              );
            }

            return (
              <div key={field.key} className="min-w-48 flex-1">
                <FormInput
                  label={field.label}
                  value={query.filters?.[field.key] ?? ''}
                  onValueChange={value => setFilter(field.key, value)}
                  placeholder={`请输入${field.label}`}
                  type={field.kind === 'email' ? 'email' : 'text'}
                />
              </div>
            );
          })}
          <Button icon={MagnifyingGlass} onClick={refresh}>查询</Button>
          <Button variant="secondary" onClick={resetFilters}>重置</Button>
          <Button
            variant="secondary"
            icon={ArrowsDownUp}
            onClick={() => setQuery(current => ({
              ...current,
              sortKey: schema.primaryField,
              sortDirection: current.sortDirection === 'asc' ? 'desc' : 'asc',
            }))}
          >
            {primaryFieldLabel}{query.sortDirection === 'asc' ? '升序' : '降序'}
          </Button>
        </div>
      </Card>

      <Card className="min-w-0 overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <Text variant="heading3" as="h2">数据列表</Text>
            <Text variant="secondary" size="sm">
              {isLoading ? '正在加载...' : `共 ${total} 条记录`}
            </Text>
          </div>
          <Badge variant="secondary">每页 {query.pageSize}</Badge>
        </div>
        <div className="max-w-full overflow-x-auto border-y border-kumo-line">
          {rows.length > 0 ? (
            <Table style={{minWidth: `${tableMinWidthRem}rem`}}>
              <Table.Header sticky>
                <Table.Row>
                  {visibleFields.map(field => (
                    <Table.Head key={field.key} className="whitespace-nowrap">
                      {field.label}
                    </Table.Head>
                  ))}
                  <Table.Head sticky="right" className="w-36 min-w-36 whitespace-nowrap bg-kumo-base">操作</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {rows.map(item => (
                  <Table.Row key={item.id}>
                    {visibleFields.map(field => (
                      <Table.Cell key={field.key} className="max-w-72 whitespace-nowrap">
                        {field.key === schema.primaryField ? (
                          <Text as="span" bold truncate>{String(item[field.key] ?? '')}</Text>
                        ) : (
                          <FieldValue field={field} value={item[field.key]} />
                        )}
                      </Table.Cell>
                    ))}
                    <Table.Cell sticky="right" className="w-36 min-w-36 bg-kumo-base">
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setDraft(item);
                            setFormErrors({});
                            setFormMessage(null);
                            setDialogMode('edit');
                          }}
                        >
                          编辑
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary-destructive"
                          icon={Trash}
                          onClick={() => setConfirmDelete(item)}
                        >
                          删除
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          ) : (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <Text variant="heading3" as="h2">没有匹配结果</Text>
              <Text variant="secondary">调整筛选条件后重试。</Text>
            </div>
          )}
        </div>
        <div className="flex justify-end p-4">
          <Pagination
            page={query.page}
            setPage={page => setQuery(current => ({...current, page}))}
            perPage={query.pageSize}
            totalCount={total}
            labels={{
              navigation: '分页',
              firstPage: '第一页',
              previousPage: '上一页',
              nextPage: '下一页',
              lastPage: '最后一页',
              pageNumber: '页码',
              pageSize: '每页数量',
            }}
          >
            <Pagination.Info>
              {({pageShowingRange, totalCount}) => (
                <Text as="span" variant="secondary" size="sm">
                  显示 {pageShowingRange}，共 {totalCount ?? 0} 条
                </Text>
              )}
            </Pagination.Info>
            <Pagination.Separator />
            <Pagination.PageSize
              value={query.pageSize}
              label="每页"
              options={[5, 10, 20]}
              onChange={pageSize => setQuery(current => ({...current, page: 1, pageSize}))}
            />
            <Pagination.Controls pageSelector="input" />
          </Pagination>
        </div>
      </Card>

      <Dialog.Root open={dialogMode !== null} onOpenChange={open => !open && setDialogMode(null)}>
        <Dialog size="xl" className="max-h-[82dvh] overflow-y-auto p-6">
          <div className="flex flex-col gap-5">
            <Dialog.Title>{dialogMode === 'create' ? `新增${schema.title}` : `编辑${schema.title}`}</Dialog.Title>
            {formMessage ? <Banner variant="error" title={formMessage} /> : null}
            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDialogMode(null)}>取消</Button>
              <Button variant="primary" loading={isSaving} onClick={saveDraft}>保存</Button>
            </div>
          </div>
        </Dialog>
      </Dialog.Root>

      <Dialog.Root role="alertdialog" open={confirmDelete !== null} onOpenChange={open => !open && setConfirmDelete(null)}>
        <Dialog size="base" className="p-6">
          <div className="flex flex-col gap-4">
            <Dialog.Title>删除记录</Dialog.Title>
            <Dialog.Description>删除后当前列表会立即更新。</Dialog.Description>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>取消</Button>
              <Button variant="destructive" onClick={deleteRecord}>确认删除</Button>
            </div>
          </div>
        </Dialog>
      </Dialog.Root>
    </div>
  );
}
