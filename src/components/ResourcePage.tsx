import {useEffect, useMemo, useState} from 'react';
import {
  ArrowsDownUp,
  DownloadSimple,
  MagnifyingGlass,
  Plus,
  Trash,
} from './vercel-icons';
import {mockApi} from '../services/mockApi';
import type {AdminRecord, MockQuery, ResourceField, ResourceSchema} from '../types';
import {FieldValue} from './FieldValue';
import {
  Banner,
  Button,
  Dialog,
  FormDateInput,
  FormInput,
  FormSelect,
  PageTitle,
  Pagination,
  Table,
  Text,
} from './report-ui';
import {uiCopy, type Locale} from '../localization';

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

function hasTimePortion(value: unknown) {
  return /\d{2}:\d{2}/.test(String(value ?? ''));
}

function isDateTimeField(field: ResourceField, value: unknown) {
  const key = field.key.toLowerCase();
  return hasTimePortion(value) || key.endsWith('at') || key.includes('time');
}

function isNumericField(field: ResourceField) {
  return field.kind === 'number' || field.kind === 'currency' || field.kind === 'progress';
}

function tableColumnClassName(field: ResourceField) {
  return [
    'vbg-custom-resource-table__cell',
    isNumericField(field) ? 'vbg-custom-resource-table__cell--numeric' : '',
  ].filter(Boolean).join(' ');
}

function FormField({
  field,
  value,
  onChange,
  error,
  locale,
}: {
  field: ResourceField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  locale: Locale;
}) {
  const copy = uiCopy[locale].resource;
  const placeholder = (verb: string) => locale === 'zh'
    ? `${verb}${field.label}`
    : `${verb} ${field.label.toLowerCase()}`;
  if (field.kind === 'date') {
    return (
      <FormDateInput
        label={field.label}
        value={String(value ?? '')}
        onValueChange={onChange}
        includeTime={isDateTimeField(field, value)}
        placeholder={placeholder(copy.select)}
        locale={locale}
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
        placeholder={placeholder(copy.select)}
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
      placeholder={placeholder(copy.enter)}
      required={field.required}
      error={error}
      type={field.kind === 'email' ? 'email' : 'text'}
    />
  );
}

export function ResourcePage({schema, locale}: {schema: ResourceSchema; locale: Locale}) {
  const copy = uiCopy[locale].resource;
  const [query, setQuery] = useState<MockQuery>(defaultQuery);
  const [rows, setRows] = useState<AdminRecord[]>([]);
  const [total, setTotal] = useState(0);
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
    mockApi.list(schema.id, query).then(page => {
      if (mounted) {
        setRows(page.items);
        setTotal(page.total);
      }
    });
    return () => {
      mounted = false;
    };
  }, [schema.id, query, locale]);

  const filters = useMemo(() => filterFields(schema), [schema]);
  const visibleFields = useMemo(
    () => schema.fields.filter(field => field.visible !== false),
    [schema],
  );
  const tableMinWidthRem = Math.max(56, visibleFields.length * 8 + 14);
  const primaryFieldLabel =
    schema.fields.find(field => field.key === schema.primaryField)?.label ?? copy.name;

  const fieldPrompt = (verb: string, label: string) => locale === 'zh'
    ? `${verb}${label}`
    : `${verb} ${label.toLowerCase()}`;

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
        .map(field => [field.key, fieldPrompt(copy.enter, field.label)]),
    );
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setFormMessage(copy.required);
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
      setFormMessage(error instanceof Error ? error.message : copy.saveFailed);
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
    <div className="vbg-custom-resource-page" data-testid={`resource-page-${schema.id}`}>
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
              {copy.export}
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
              {copy.addNew}
            </Button>
          </>
        }
      />

      <section className="vbg-custom-filterbar" aria-label={copy.search}>
        <div className="vbg-custom-filterbar__fields">
          {filters.map(field => {
            if (field.kind === 'select' || field.kind === 'status') {
              return (
                <FormSelect
                  key={field.key}
                  className="vbg-custom-filterbar__field"
                  label={field.label}
                  value={query.filters?.[field.key] ?? ''}
                  options={[
                    {label: locale === 'zh' ? `${copy.all}${field.label}` : `${copy.all} ${field.label.toLowerCase()}`, value: ''},
                    ...(field.options ?? []).map(option => ({
                      label: option.label,
                      value: option.value,
                    })),
                  ]}
                  onValueChange={value => setFilter(field.key, value)}
                />
              );
            }

            if (field.kind === 'date') {
              const value = query.filters?.[field.key] ?? '';
              return (
                <FormDateInput
                  key={field.key}
                  className="vbg-custom-filterbar__field"
                  label={field.label}
                  value={value}
                  onValueChange={next => setFilter(field.key, next)}
                  placeholder={locale === 'zh' ? `${copy.select}${field.label}` : `${copy.select} ${field.label.toLowerCase()}`}
                  locale={locale}
                />
              );
            }

            return (
              <FormInput
                key={field.key}
                className="vbg-custom-filterbar__field"
                label={field.label}
                value={query.filters?.[field.key] ?? ''}
                onValueChange={value => setFilter(field.key, value)}
                placeholder={fieldPrompt(copy.enter, field.label)}
                type={field.kind === 'email' ? 'email' : 'text'}
              />
            );
          })}
        </div>
        <div className="vbg-custom-filterbar__actions">
          <Button icon={MagnifyingGlass} onClick={refresh}>{copy.search}</Button>
          <Button variant="secondary" onClick={resetFilters}>{copy.reset}</Button>
          <Button
            variant="secondary"
            icon={ArrowsDownUp}
            onClick={() => setQuery(current => ({
              ...current,
              sortKey: schema.primaryField,
              sortDirection: current.sortDirection === 'asc' ? 'desc' : 'asc',
            }))}
          >
            {locale === 'zh' ? primaryFieldLabel : `${primaryFieldLabel}: `}
            {query.sortDirection === 'asc' ? copy.ascending : copy.descending}
          </Button>
        </div>
      </section>

      <section className="vbg-custom-resource-table">
        <div className="vbg-custom-resource-table__scroll">
          {rows.length > 0 ? (
            <Table style={{minWidth: `${tableMinWidthRem}rem`}}>
              <Table.Caption>{schema.title}</Table.Caption>
              <Table.Header sticky>
                <Table.Row>
                  {visibleFields.map(field => (
                    <Table.Head key={field.key} className={tableColumnClassName(field)}>
                      {field.label}
                    </Table.Head>
                  ))}
                  <Table.Head
                    sticky="right"
                    className="vbg-custom-resource-table__actions-head"
                  >
                    {copy.actions}
                  </Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {rows.map(item => (
                  <Table.Row key={item.id}>
                    {visibleFields.map(field => (
                      <Table.Cell key={field.key} className={tableColumnClassName(field)}>
                        {field.key === schema.primaryField ? (
                          <Text as="span" bold truncate>{String(item[field.key] ?? '')}</Text>
                        ) : (
                          <FieldValue field={field} value={item[field.key]} locale={locale} />
                        )}
                      </Table.Cell>
                    ))}
                    <Table.Cell sticky="right" className="vbg-custom-resource-table__actions-cell">
                      <div className="vbg-custom-row-actions">
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
                          {copy.edit}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary-destructive"
                          icon={Trash}
                          onClick={() => setConfirmDelete(item)}
                        >
                          {copy.delete}
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          ) : (
            <div className="vbg-custom-empty-state">
              <Text variant="heading3" as="h2">{copy.noResults}</Text>
              <Text variant="secondary">{copy.noResultsHint}</Text>
            </div>
          )}
        </div>
        <div className="vbg-custom-resource-table__footer">
          <Pagination
            page={query.page}
            setPage={page => setQuery(current => ({...current, page}))}
            perPage={query.pageSize}
            totalCount={total}
            labels={{
              navigation: copy.pagination,
              firstPage: copy.firstPage,
              previousPage: copy.previousPage,
              nextPage: copy.nextPage,
              lastPage: copy.lastPage,
              pageNumber: copy.pageNumber,
              pageSize: copy.pageSize,
            }}
          >
            <Pagination.Info>
              {({pageShowingRange, totalCount}) => (
                <Text as="span" variant="secondary" size="sm">
                  {locale === 'zh'
                    ? `${copy.showing} ${pageShowingRange}，${copy.of} ${totalCount ?? 0} 条`
                    : `${copy.showing} ${pageShowingRange} ${copy.of} ${totalCount ?? 0}`}
                </Text>
              )}
            </Pagination.Info>
            <Pagination.Separator />
            <Pagination.PageSize
              value={query.pageSize}
              label={copy.perPageLabel}
              options={[5, 10, 20]}
              onChange={pageSize => setQuery(current => ({...current, page: 1, pageSize}))}
            />
            <Pagination.Controls pageSelector="input" />
          </Pagination>
        </div>
      </section>

      <Dialog.Root open={dialogMode !== null} onOpenChange={open => !open && setDialogMode(null)}>
        <Dialog size="xl" className="vbg-custom-resource-dialog">
          <div className="vbg-custom-resource-dialog__body">
            <Dialog.Title>
              {dialogMode === 'create'
                ? locale === 'zh' ? `${copy.add}${schema.title}` : `${copy.add} ${schema.title}`
                : locale === 'zh' ? `${copy.edit}${schema.title}` : `${copy.edit} ${schema.title}`}
            </Dialog.Title>
            {formMessage ? <Banner variant="error" title={formMessage} /> : null}
            <div className="vbg-custom-resource-dialog__grid">
              {editableFields(schema).map(field => (
                <FormField
                  key={field.key}
                  field={field}
                  locale={locale}
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
            <div className="vbg-custom-resource-dialog__footer">
              <Button variant="secondary" onClick={() => setDialogMode(null)}>{copy.cancel}</Button>
              <Button variant="primary" loading={isSaving} onClick={saveDraft}>{copy.save}</Button>
            </div>
          </div>
        </Dialog>
      </Dialog.Root>

      <Dialog.Root role="alertdialog" open={confirmDelete !== null} onOpenChange={open => !open && setConfirmDelete(null)}>
        <Dialog size="base" className="vbg-custom-resource-dialog">
          <div className="vbg-custom-resource-dialog__body vbg-custom-resource-dialog__body--compact">
            <Dialog.Title>{copy.deleteTitle}</Dialog.Title>
            <Dialog.Description>{copy.deleteDescription}</Dialog.Description>
            <div className="vbg-custom-resource-dialog__footer">
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>{copy.cancel}</Button>
              <Button variant="destructive" onClick={deleteRecord}>{copy.delete}</Button>
            </div>
          </div>
        </Dialog>
      </Dialog.Root>
    </div>
  );
}
