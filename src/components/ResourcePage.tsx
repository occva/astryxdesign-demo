import {useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import Papa from 'papaparse';
import {useTranslation} from 'react-i18next';
import {Button} from '@cloudflare/kumo/components/button';
import {Empty} from '@cloudflare/kumo/components/empty';
import {Pagination} from '@cloudflare/kumo/components/pagination';
import {Table} from '@cloudflare/kumo/components/table';
import {Text} from '@cloudflare/kumo/components/text';
import {useKumoToastManager} from '@cloudflare/kumo/components/toast';
import {
  DownloadSimple,
  MagnifyingGlass,
  Key,
  Plus,
  Trash,
} from '@phosphor-icons/react';
import {resourceApi, type RolePermission} from '../services/resourceApi';
import {enterpriseApi} from '../services/enterpriseApi';
import {AuthenticationRequiredError} from '../services/authApi';
import type {AdminRecord, ResourceQuery, ResourceSchema} from '../types';
import {FieldValue} from './FieldValue';
import {Card, FormDateInput, FormInput, FormSelect, PageTitle, Skeleton} from './kumo-ui';
import {currentLanguage, translationMap} from '../i18n';
import {
  DeleteConfirmationDialog,
  ResourceEditorDialog,
  RolePermissionsDialog,
  UserAuthDialog,
} from './ResourceDialogs';
import {
  defaultResourceQuery,
  editableFields,
  emptyRecord,
  filterFields,
  groupPermissions,
  isMenuDescendant,
  menuDepth,
  payloadValue,
} from './resource-page-utils';

type DialogMode = 'create' | 'edit' | null;

export function ResourcePage({
  schema,
  permissionCodes,
  onResourceChanged,
  headerActions,
  hideExport = false,
}: {
  schema: ResourceSchema;
  permissionCodes: string[];
  onResourceChanged?: (resourceId: string) => void;
  headerActions?: ReactNode;
  hideExport?: boolean;
}) {
  const {t} = useTranslation(['resource', 'common']);
  const toasts = useKumoToastManager();
  const queryClient = useQueryClient();
  const language = currentLanguage();
  const copy = {
    ...translationMap(['loadFailed','name','required','saveFailed','permissionsLoadFailed','permissionsSaveFailed','export','addNew','search','reset','actions','configurePermissions','edit','delete','noResults','noResultsHint','pagination','firstPage','previousPage','nextPage','lastPage','pageNumber','pageSize','perPageLabel','permissionsTitle','permissionsEmpty','deleteTitle','deleteDescription','provisionAuth','resetPassword','provisionAuthTitle','resetPasswordTitle','newPassword','confirmNewPassword','passwordShort','passwordMismatch','authActionSuccess','authActionFailed'] as const, key => t(`resource:${key}`)),
    ...translationMap(['loading','cancel','save'] as const, key => t(`common:${key}`)),
  };
  const [draft, setDraft] = useState<AdminRecord>(() => emptyRecord(schema));
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [authValues, setAuthValues] = useState({password: '', confirmation: ''});
  const [authErrors, setAuthErrors] = useState({password: '', confirmation: ''});
  const [query, setQuery] = useState<ResourceQuery>(() => defaultResourceQuery(schema));
  const [filterDraft, setFilterDraft] = useState<Record<string, string>>({});
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminRecord | null>(null);
  const [permissionRole, setPermissionRole] = useState<AdminRecord | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [authUser, setAuthUser] = useState<AdminRecord | null>(null);
  const reportedPermissionsError = useRef<unknown>(null);
  const permissionSet = useMemo(() => new Set(permissionCodes),[permissionCodes]);
  const canAssignUserRoles = schema.id === 'users' && permissionSet.has('users.assign_roles');
  const listQuery = useQuery({
    queryKey: ['resources', schema.id, query],
    queryFn: () => resourceApi.list(schema.id, query),
  });
  const rows = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const isLoadingList = listQuery.isLoading || listQuery.isFetching;
  const menuCatalogQuery = useQuery({
    queryKey: ['resource-catalog', 'menus'],
    queryFn: () => resourceApi.listAll('menus', {sortKey: 'sortOrder', sortDirection: 'asc'}),
    enabled: schema.id === 'menus',
  });
  const menuCatalog = menuCatalogQuery.data ?? [];
  const departmentTreeQuery = useQuery({
    queryKey: ['department-tree', 'owner-selector'],
    queryFn: enterpriseApi.departmentTree,
    enabled: schema.id === 'departments' && dialogMode !== null,
  });
  const departmentTree = departmentTreeQuery.data?.items ?? [];
  const departmentCatalogQuery = useQuery({
    queryKey: ['resource-catalog', 'user-departments'],
    queryFn: () => resourceApi.listAll('departments', {sortKey: 'name', sortDirection: 'asc'}),
    enabled: schema.id === 'users' && dialogMode !== null,
  });
  const departmentCatalog = departmentCatalogQuery.data ?? [];
  const roleCatalogQuery = useQuery({
    queryKey: ['resource-catalog', 'user-roles'],
    queryFn: resourceApi.getAssignableRoles,
    enabled: canAssignUserRoles && dialogMode !== null,
  });
  const roleCatalog = roleCatalogQuery.data ?? [];
  const editingRoleId = schema.id === 'roles' && dialogMode === 'edit' ? String(draft.id) : '';
  const permissionTargetId = permissionRole?.id ?? editingRoleId;
  const permissionsQuery = useQuery({
    queryKey: ['role-permissions', permissionTargetId],
    queryFn: () => resourceApi.getRolePermissions(permissionTargetId),
    enabled: Boolean(permissionTargetId && permissionCodes.includes('role_permissions.manage')),
  });
  const rolePermissions: RolePermission[] = permissionsQuery.data ?? [];

  useEffect(() => {
    const error = listQuery.error ?? menuCatalogQuery.error;
    if (error && !(error instanceof AuthenticationRequiredError)) {
      toasts.add({title: error instanceof Error ? error.message : copy.loadFailed, variant: 'error'});
    }
  }, [listQuery.error, menuCatalogQuery.error, copy.loadFailed, toasts]);

  useEffect(() => {
    if (permissionsQuery.data) {
      const nextIds = permissionsQuery.data.filter(item => item.granted).map(item => item.id);
      setSelectedPermissionIds(current =>
        current.length === nextIds.length && current.every((id, index) => id === nextIds[index])
          ? current
          : nextIds,
      );
      reportedPermissionsError.current = null;
    } else if (permissionsQuery.error) {
      setSelectedPermissionIds(current => current.length ? [] : current);
      if (
        reportedPermissionsError.current !== permissionsQuery.error
        && !(permissionsQuery.error instanceof AuthenticationRequiredError)
      ) {
        reportedPermissionsError.current = permissionsQuery.error;
        toasts.add({title: permissionsQuery.error instanceof Error ? permissionsQuery.error.message : copy.permissionsLoadFailed, variant: 'error'});
      }
    }
  }, [permissionsQuery.data, permissionsQuery.error, copy.permissionsLoadFailed, toasts]);

  const filters = useMemo(() => filterFields(schema), [schema]);
  const visibleFields = useMemo(
    () => schema.fields.filter(field => field.visible !== false),
    [schema],
  );
  const canCreate = permissionSet.has(`${schema.id}.create`);
  const canUpdate = permissionSet.has(`${schema.id}.update`);
  const canDelete = permissionSet.has(`${schema.id}.delete`);
  const canManageAuth = schema.id === 'users' && permissionSet.has('users.manage_auth');
  const canManageRolePermissions = schema.id === 'roles' && permissionSet.has('role_permissions.manage');
  const hasRowActions = canUpdate || canDelete || canManageAuth;
  const tableMinWidthRem = Math.max(56, visibleFields.length * 8 + 22);
  const menuCatalogById = useMemo(
    () => new Map(menuCatalog.map(menu => [menu.id, menu])),
    [menuCatalog],
  );
  const formFields = useMemo(() => editableFields(schema)
    .filter(field => !(schema.id === 'users' && field.key === 'roleIds' && !canAssignUserRoles))
    .filter(field => !(schema.id === 'menus' && dialogMode === 'edit' && (field.key === 'code' || field.key === 'status')))
    .map(field => {
    if (schema.id === 'menus' && field.key === 'parentId') {
      return {
        ...field,
        options: [
          ...(field.options ?? []).filter(option => option.value === ''),
          ...menuCatalog
            .filter(menu => menu.id !== draft.id && !isMenuDescendant(menu, draft.id, menuCatalogById))
            .map(menu => ({
              label: `${'— '.repeat(menuDepth(menu, menuCatalogById))}${String(menu.name)}`,
              value: menu.id,
            })),
        ],
      };
    }
    if (schema.id === 'users' && field.key === 'departmentId') {
      return {
        ...field,
        options: [
          ...(field.options ?? []).filter(option => option.value === ''),
          ...departmentCatalog
            .filter(department => department.status === 'enabled')
            .map(department => ({label: String(department.name), value: department.id})),
        ],
      };
    }
    if (schema.id === 'users' && field.key === 'roleIds') {
      return {
        ...field,
        options: roleCatalog.map(role => ({label: String(role.name), value: role.id})),
      };
    }
    return field;
  }), [canAssignUserRoles, departmentCatalog, dialogMode, draft.id, menuCatalog, menuCatalogById, roleCatalog, schema]);
  const permissionGroups = useMemo(() => groupPermissions(rolePermissions),[rolePermissions]);
  const permissionResourceLabels = t('resource:permissionResources',{returnObjects:true}) as Record<string,string>;
  const permissionNames = t('resource:permissionNames',{returnObjects:true}) as Record<string,string>;
  const saveResourceMutation = useMutation({
    mutationFn: ({mode, id, payload}: {mode: Exclude<DialogMode, null>; id: string; payload: Omit<AdminRecord, 'id'>}) =>
      mode === 'create' ? resourceApi.create(schema.id, payload) : resourceApi.update(schema.id, id, payload),
  });
  const deleteResourceMutation = useMutation({
    mutationFn: (id: string) => resourceApi.remove(schema.id, id),
  });
  const savePermissionsMutation = useMutation({
    mutationFn: ({roleId, permissionIds}: {roleId: string; permissionIds: string[]}) =>
      resourceApi.replaceRolePermissions(roleId, permissionIds),
  });
  const saveAuthMutation = useMutation({
    mutationFn: async ({user, password}: {user: AdminRecord; password: string}) => {
      if (user.authUserId) await resourceApi.resetUserPassword(user.id, password);
      else await resourceApi.provisionUserAuth(user.id, password);
    },
  });
  const isSaving = saveResourceMutation.isPending;
  const isDeleting = deleteResourceMutation.isPending;
  const isLoadingPermissions = permissionsQuery.isLoading || permissionsQuery.isFetching;
  const isSavingPermissions = savePermissionsMutation.isPending;
  const isSavingAuth = saveAuthMutation.isPending;

  const reloadList = () => void queryClient.invalidateQueries({queryKey: ['resources', schema.id]});

  const setFilterDraftValue = (key: string, value: string | null) => {
    setFilterDraft(current => ({...current, [key]: value ?? ''}));
  };

  const resetFilters = () => {
    setFilterDraft({});
    setQuery(current => ({...current, page: 1, filters: {}}));
  };

  const applyFilters = () => {
    setQuery(current => ({...current, page: 1, filters: filterDraft}));
  };

  const loadMenuCatalog = async () => {
    if (schema.id === 'menus' && !menuCatalogQuery.data) await menuCatalogQuery.refetch();
  };

  const exportRows = async () => {
    try {
      const items = await resourceApi.listAll(schema.id, {
        filters: query.filters,
        sortKey: query.sortKey,
        sortDirection: query.sortDirection,
      });
      const csv = `\uFEFF${Papa.unparse([
        visibleFields.map(field => field.label),
        ...items.map(item => visibleFields.map(field => {
          const value = item[field.key];
          return Array.isArray(value) ? value.join(' / ') : String(value ?? '');
        })),
      ], {newline: '\r\n', escapeFormulae: true})}`;
      const url = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'}));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${schema.title}.csv`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      if (error instanceof AuthenticationRequiredError) return;
      toasts.add({title: error instanceof Error ? error.message : copy.loadFailed, variant: 'error'});
    }
  };

  const saveDraft = async () => {
    const errors = Object.fromEntries(editableFields(schema).flatMap(field => {
      const value = draft[field.key];
      const invalid = field.required && !String(value ?? '').trim()
        || field.valueType === 'number' && value !== '' && !Number.isFinite(Number(value));
      return invalid ? [[field.key, t('resource:enterField', {field: field.label})]] : [];
    }));
    setFormErrors(errors);
    if (Object.keys(errors).length) return void toasts.add({title: copy.required, variant: 'error'});
    const payload = Object.fromEntries(
      formFields.map(field => [field.key, payloadValue(field, draft[field.key])]),
    ) as Omit<AdminRecord, 'id'>;

    try {
      if (!dialogMode) return;
      await saveResourceMutation.mutateAsync({mode: dialogMode, id: String(draft.id ?? ''), payload});
      setDialogMode(null);
      reloadList();
      if (schema.id === 'menus') void queryClient.invalidateQueries({queryKey: ['resource-catalog', 'menus']});
      onResourceChanged?.(schema.id);
    } catch (error) {
      if (error instanceof AuthenticationRequiredError) return;
      toasts.add({title: error instanceof Error ? error.message : copy.saveFailed, variant: 'error'});
    }
  };

  const deleteRecord = async () => {
    if (!confirmDelete) return;
    try {
      await deleteResourceMutation.mutateAsync(confirmDelete.id);
      setConfirmDelete(null);
      setQuery(current => {
        const nextTotal = Math.max(total - 1, 0);
        const lastPage = Math.max(Math.ceil(nextTotal / current.pageSize), 1);
        return {...current, page: Math.min(current.page, lastPage)};
      });
      reloadList();
      if (schema.id === 'menus') void queryClient.invalidateQueries({queryKey: ['resource-catalog', 'menus']});
      onResourceChanged?.(schema.id);
    } catch (error) {
      if (error instanceof AuthenticationRequiredError) return;
      toasts.add({title: error instanceof Error ? error.message : copy.loadFailed, variant: 'error'});
    }
  };

  const openPermissions = (role: AdminRecord) => {
    setPermissionRole(role);
  };

  const savePermissions = async () => {
    if (!permissionRole) return;
    try {
      await savePermissionsMutation.mutateAsync({roleId: permissionRole.id, permissionIds: selectedPermissionIds});
      setPermissionRole(null);
      reloadList();
      onResourceChanged?.('roles');
    } catch (error) {
      toasts.add({title: error instanceof Error ? error.message : copy.permissionsSaveFailed, variant: 'error'});
    }
  };

  const openAuthAction = (user: AdminRecord) => {
    setAuthUser(user);
    setAuthValues({password: '', confirmation: ''});
    setAuthErrors({password: '', confirmation: ''});
  };

  const saveAuthAction = async () => {
    if (!authUser) return;
    const errors = {
      password: authValues.password.length < 6 ? copy.passwordShort : '',
      confirmation: authValues.password !== authValues.confirmation ? copy.passwordMismatch : '',
    };
    setAuthErrors(errors);
    const error = errors.password || errors.confirmation;
    if (error) return void toasts.add({title: error, variant: 'error'});
    try {
      await saveAuthMutation.mutateAsync({user: authUser, password: authValues.password});
      setAuthUser(null);
      reloadList();
      toasts.add({title:copy.authActionSuccess,variant:'success'});
    } catch (error) {
      if (error instanceof AuthenticationRequiredError) return;
      toasts.add({title:error instanceof Error?error.message:copy.authActionFailed,variant:'error'});
    }
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-5" data-testid={`resource-page-${schema.id}`}>
      <PageTitle
        title={schema.title}
        actions={
          <>
            {headerActions}
            {!hideExport ? (
              <Button
                variant="secondary"
                icon={DownloadSimple}
                disabled={total === 0}
                onClick={exportRows}
              >
                {copy.export}
              </Button>
            ) : null}
            {canCreate ? (
              <Button
                variant="primary"
                icon={Plus}
                onClick={async () => {
                  await loadMenuCatalog();
                  setDraft(emptyRecord(schema));
                  setFormErrors({});
                  setDialogMode('create');
                }}
              >
                {copy.addNew}
              </Button>
            ) : null}
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
                    value={filterDraft[field.key] ?? ''}
                    options={[
                      {label: t('resource:allField', {field:field.label}), value: ''},
                      ...(field.options ?? []).map(option => ({
                        label: option.label,
                        value: option.value,
                      })),
                    ]}
                    onValueChange={value => setFilterDraftValue(field.key, value)}
                  />
                </div>
              );
            }

            if (field.kind === 'date') {
              const value = filterDraft[field.key] ?? '';
              return (
                <div key={field.key} className="min-w-48 flex-1">
                  <FormDateInput
                    label={field.label}
                    value={value}
                    onValueChange={next => setFilterDraftValue(field.key, next)}
                    placeholder={t('resource:selectField', {field:field.label})}
                    locale={language}
                  />
                </div>
              );
            }

            return (
              <div key={field.key} className="min-w-48 flex-1">
                <FormInput
                  label={field.label}
                  value={filterDraft[field.key] ?? ''}
                  onValueChange={value => setFilterDraftValue(field.key, value)}
                  placeholder={t('resource:enterField', {field:field.label})}
                  type={field.kind === 'email' ? 'email' : 'text'}
                />
              </div>
            );
          })}
          <Button icon={MagnifyingGlass} onClick={applyFilters}>{copy.search}</Button>
          <Button variant="secondary" onClick={resetFilters}>{copy.reset}</Button>
        </div>
      </Card>

      <Card className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-0">
        <div className="min-h-0 max-w-full flex-1 overflow-auto border-b border-kumo-line">
          {isLoadingList ? (
            <Table style={{minWidth: `${tableMinWidthRem}rem`}} aria-label={copy.loading}>
              <Table.Header sticky className="[&_th]:bg-kumo-elevated [&_th]:shadow-[inset_0_-1px_0_var(--color-kumo-line)]">
                <Table.Row>
                  {visibleFields.map(field => <Table.Head key={field.key}><Skeleton className="h-4 w-24" /></Table.Head>)}
                  {hasRowActions ? <Table.Head sticky="right" className="w-px bg-kumo-elevated before:to-kumo-elevated"><Skeleton className="h-4 w-20" /></Table.Head> : null}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {Array.from({length:query.pageSize},(_,rowIndex)=><Table.Row key={rowIndex}>
                  {visibleFields.map((field,cellIndex)=><Table.Cell key={field.key}><Skeleton className={`h-5 ${cellIndex===0?'w-28':'w-20'}`} /></Table.Cell>)}
                  {hasRowActions ? <Table.Cell sticky="right" className="w-px bg-kumo-base"><Skeleton className="h-8 w-24" /></Table.Cell> : null}
                </Table.Row>)}
              </Table.Body>
            </Table>
          ) : rows.length > 0 ? (
            <Table style={{minWidth: `${tableMinWidthRem}rem`}}>
              <Table.Header
                sticky
                className="[&_th]:bg-kumo-elevated [&_th]:shadow-[inset_0_-1px_0_var(--color-kumo-line)]"
              >
                <Table.Row>
                  {visibleFields.map(field => (
                    <Table.Head key={field.key} className="whitespace-nowrap">
                      {field.label}
                    </Table.Head>
                  ))}
                  {hasRowActions ? (
                    <Table.Head
                      sticky="right"
                      className="w-px whitespace-nowrap bg-kumo-elevated before:to-kumo-elevated"
                    >
                      {copy.actions}
                    </Table.Head>
                  ) : null}
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
                    {hasRowActions ? (
                      <Table.Cell sticky="right" className="w-px whitespace-nowrap bg-kumo-base">
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          {canManageAuth ? (
                            <Button size="sm" variant="secondary" icon={Key} onClick={() => openAuthAction(item)}>
                              {item.authUserId ? copy.resetPassword : copy.provisionAuth}
                            </Button>
                          ) : null}
                          {canUpdate && !(schema.id === 'roles' && item.isSystem) ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={async () => {
                                await loadMenuCatalog();
                                setDraft(item);
                                setFormErrors({});
                                setDialogMode('edit');
                              }}
                            >
                              {copy.edit}
                            </Button>
                          ) : null}
                          {canDelete && !(schema.id === 'roles' && item.isSystem) ? (
                            <Button
                              size="sm"
                              variant="secondary-destructive"
                              icon={Trash}
                              onClick={() => setConfirmDelete(item)}
                            >
                              {copy.delete}
                            </Button>
                          ) : null}
                        </div>
                      </Table.Cell>
                    ) : null}
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          ) : (
            <Empty size="sm" title={copy.noResults} description={copy.noResultsHint} />
          )}
        </div>
        <div className="flex shrink-0 justify-end p-4">
          {isLoadingList ? (
            <div className="flex items-center gap-3 py-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-56" />
            </div>
          ) : (
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
                  {t('resource:pageSummary', {range:pageShowingRange, total:totalCount ?? 0})}
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
          )}
        </div>
      </Card>

      <ResourceEditorDialog
        open={dialogMode !== null}
        title={dialogMode === 'create'
          ? t('resource:createTitle', {resource: schema.title})
          : t('resource:editTitle', {resource: schema.title})}
        fields={formFields}
        departmentTree={departmentTree}
        targetDepartmentId={String(draft.id ?? '')}
        language={language}
        draft={draft}
        errors={formErrors}
        isSaving={isSaving}
        formExtra={dialogMode === 'edit' && canManageRolePermissions && !draft.isSystem ? (
          <fieldset className="min-w-0">
            <legend className="mb-3 text-sm font-medium text-kumo-default">{copy.permissionsTitle}</legend>
            <Button className="w-full justify-between" variant="secondary" onClick={() => openPermissions(draft)}>
              <span>{copy.configurePermissions}</span>
              <Text as="span" size="sm" variant="secondary">
                {isLoadingPermissions ? copy.loading : t('resource:permissionsSelectedCount', {count:selectedPermissionIds.length})}
              </Text>
            </Button>
          </fieldset>
        ) : undefined}
        cancel={copy.cancel}
        save={copy.save}
        onClose={() => setDialogMode(null)}
        onSave={saveDraft}
        fieldPrompt={(key, fieldLabel) => t(`resource:${key}`, {field: fieldLabel})}
        onFieldChange={(fieldKey, value) => {
          setDraft(current => ({...current, [fieldKey]: value}));
          setFormErrors(current => ({...current, [fieldKey]: ''}));
        }}
      />

      <RolePermissionsDialog
        role={permissionRole}
        groups={permissionGroups}
        selectedIds={selectedPermissionIds}
        resourceLabels={permissionResourceLabels}
        permissionNames={permissionNames}
        title={copy.permissionsTitle}
        emptyLabel={copy.permissionsEmpty}
        loadingLabel={copy.loading}
        isLoading={isLoadingPermissions}
        isSaving={isSavingPermissions}
        cancel={copy.cancel}
        save={copy.save}
        onClose={() => setPermissionRole(null)}
        onSave={savePermissions}
        onSelectionChange={setSelectedPermissionIds}
      />

      <UserAuthDialog
        user={authUser}
        password={authValues.password}
        confirmation={authValues.confirmation}
        passwordError={authErrors.password}
        confirmationError={authErrors.confirmation}
        isSaving={isSavingAuth}
        labels={{
          cancel: copy.cancel,
          provision: copy.provisionAuth,
          reset: copy.resetPassword,
          provisionTitle: copy.provisionAuthTitle,
          resetTitle: copy.resetPasswordTitle,
          password: copy.newPassword,
          confirmation: copy.confirmNewPassword,
        }}
        onClose={() => setAuthUser(null)}
        onSave={saveAuthAction}
        onPasswordChange={password => setAuthValues(current => ({...current, password}))}
        onConfirmationChange={confirmation => setAuthValues(current => ({...current, confirmation}))}
      />

      <DeleteConfirmationDialog
        record={confirmDelete}
        title={copy.deleteTitle}
        description={copy.deleteDescription}
        cancel={copy.cancel}
        confirm={copy.delete}
        isDeleting={isDeleting}
        onClose={() => setConfirmDelete(null)}
        onConfirm={deleteRecord}
      />
    </div>
  );
}
