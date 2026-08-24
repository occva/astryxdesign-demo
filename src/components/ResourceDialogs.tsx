import {Badge} from '@cloudflare/kumo/components/badge';
import {Button} from '@cloudflare/kumo/components/button';
import {Checkbox} from '@cloudflare/kumo/components/checkbox';
import {Collapsible} from '@cloudflare/kumo/components/collapsible';
import {Dialog} from '@cloudflare/kumo/components/dialog';
import {Text} from '@cloudflare/kumo/components/text';
import type {ReactNode} from 'react';
import type {AppLanguage} from '../i18n';
import type {AdminRecord, DepartmentNode, ResourceField} from '../types';
import {FormInput, Skeleton} from './kumo-ui';
import {ResourceFormField, type PermissionGroup} from './resource-page-utils';

type CommonLabels = {
  cancel: string;
  save: string;
};

type ResourceEditorDialogProps = CommonLabels & {
  open: boolean;
  title: string;
  fields: ResourceField[];
  departmentTree?: DepartmentNode[];
  targetDepartmentId?: string;
  language: AppLanguage;
  draft: AdminRecord;
  errors: Record<string, string>;
  isSaving: boolean;
  formExtra?: ReactNode;
  onClose: () => void;
  onSave: () => void;
  onFieldChange: (fieldKey: string, value: unknown) => void;
  fieldPrompt: (type: 'selectField' | 'enterField', field: string) => string;
};

export function ResourceEditorDialog({
  open,
  title,
  fields,
  departmentTree,
  targetDepartmentId,
  language,
  draft,
  errors,
  isSaving,
  formExtra,
  cancel,
  save,
  onClose,
  onSave,
  onFieldChange,
  fieldPrompt,
}: ResourceEditorDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={nextOpen => !nextOpen && onClose()}>
      <Dialog size="xl" className="max-h-[82dvh] overflow-hidden p-0">
        <div className="flex max-h-[82dvh] flex-col">
          <Dialog.Title className="shrink-0 border-b border-kumo-line px-6 py-5">{title}</Dialog.Title>
          <div className="grid min-h-0 flex-1 gap-x-6 gap-y-5 overflow-y-auto px-6 py-5 sm:grid-cols-2">
            {fields.map(field => (
              <ResourceFormField
                key={field.key}
                field={field}
                departmentTree={departmentTree}
                targetDepartmentId={targetDepartmentId}
                language={language}
                fieldPrompt={fieldPrompt}
                value={draft[field.key]}
                error={errors[field.key]}
                onChange={value => onFieldChange(field.key, value)}
              />
            ))}
            {formExtra}
          </div>
          <div className="flex shrink-0 justify-end gap-2 border-t border-kumo-line px-6 py-4">
            <Dialog.Close render={<Button variant="secondary">{cancel}</Button>} />
            <Button variant="primary" loading={isSaving} onClick={onSave}>{save}</Button>
          </div>
        </div>
      </Dialog>
    </Dialog.Root>
  );
}

type RolePermissionsDialogProps = CommonLabels & {
  role: AdminRecord | null;
  groups: PermissionGroup[];
  selectedIds: string[];
  resourceLabels: Record<string, string>;
  permissionNames: Record<string, string>;
  title: string;
  emptyLabel: string;
  loadingLabel: string;
  isLoading: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
  onSelectionChange: (ids: string[]) => void;
};

export function RolePermissionsDialog({
  role,
  groups,
  selectedIds,
  resourceLabels,
  permissionNames,
  title,
  emptyLabel,
  loadingLabel,
  isLoading,
  isSaving,
  cancel,
  save,
  onClose,
  onSave,
  onSelectionChange,
}: RolePermissionsDialogProps) {
  return (
    <Dialog.Root open={role !== null} onOpenChange={open => !open && onClose()}>
      <Dialog size="xl" className="max-h-[82dvh] overflow-hidden p-0">
        <div className="flex max-h-[82dvh] flex-col">
          <Dialog.Title className="shrink-0 border-b border-kumo-line px-6 py-5">
            {role ? `${String(role.name)} · ${title}` : title}
          </Dialog.Title>
          <div className="min-h-0 flex-1 overflow-y-auto px-6">
            {isLoading ? (
              <div className="flex flex-col gap-3 py-5" aria-label={loadingLabel}>
                {Array.from({length: 5}, (_, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Skeleton className="size-4" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                ))}
              </div>
            ) : groups.length > 0 ? (
              <Checkbox.Group value={selectedIds} onValueChange={onSelectionChange} className="gap-0 py-1">
                <Checkbox.Legend className="sr-only">{title}</Checkbox.Legend>
                {groups.map(group => {
                  const selectedCount = group.items.filter(permission => selectedIds.includes(permission.id)).length;
                  return (
                    <Collapsible.Root key={`${role?.id ?? ''}-${group.resource}`} className="border-b border-kumo-line last:border-b-0">
                      <Collapsible.DefaultTrigger className="w-full justify-between py-4 text-kumo-default">
                        <span className="flex min-w-0 flex-1 items-center justify-between gap-4 pr-3">
                          <Text as="span" bold>{resourceLabels[group.resource] ?? group.resource}</Text>
                          <Badge variant={selectedCount ? 'secondary' : 'neutral'}>
                            {selectedCount}/{group.items.length}
                          </Badge>
                        </span>
                      </Collapsible.DefaultTrigger>
                      <Collapsible.DefaultPanel className="[&>div]:my-0 [&>div]:border-l-0 [&>div]:px-0 [&>div]:pb-5 [&>div]:pt-1">
                        <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                          {group.items.map(permission => (
                            <Checkbox.Item
                              key={permission.id}
                              value={permission.id}
                              label={permissionNames[permission.code] ?? permission.code}
                              disabled={!permission.assignable}
                            />
                          ))}
                        </div>
                      </Collapsible.DefaultPanel>
                    </Collapsible.Root>
                  );
                })}
              </Checkbox.Group>
            ) : (
              <div className="py-5"><Text variant="secondary">{emptyLabel}</Text></div>
            )}
          </div>
          <div className="flex shrink-0 justify-end gap-2 border-t border-kumo-line px-6 py-4">
            <Dialog.Close render={<Button variant="secondary">{cancel}</Button>} />
            <Button variant="primary" loading={isSaving} disabled={isLoading} onClick={onSave}>{save}</Button>
          </div>
        </div>
      </Dialog>
    </Dialog.Root>
  );
}

type UserAuthDialogProps = {
  user: AdminRecord | null;
  password: string;
  confirmation: string;
  passwordError?: string;
  confirmationError?: string;
  isSaving: boolean;
  labels: {
    cancel: string;
    provision: string;
    reset: string;
    provisionTitle: string;
    resetTitle: string;
    password: string;
    confirmation: string;
  };
  onClose: () => void;
  onSave: () => void;
  onPasswordChange: (value: string) => void;
  onConfirmationChange: (value: string) => void;
};

export function UserAuthDialog({
  user,
  password,
  confirmation,
  passwordError,
  confirmationError,
  isSaving,
  labels,
  onClose,
  onSave,
  onPasswordChange,
  onConfirmationChange,
}: UserAuthDialogProps) {
  const isProvisioned = Boolean(user?.authUserId);
  return (
    <Dialog.Root open={user !== null} onOpenChange={open => !open && onClose()}>
      <Dialog size="base" className="p-6">
        <div className="flex flex-col gap-5">
          <Dialog.Title>{isProvisioned ? labels.resetTitle : labels.provisionTitle}</Dialog.Title>
          <div className="grid gap-4">
            <FormInput label={labels.password} value={password} type="password" autoComplete="new-password" required error={passwordError} onValueChange={onPasswordChange} />
            <FormInput label={labels.confirmation} value={confirmation} type="password" autoComplete="new-password" required error={confirmationError} onValueChange={onConfirmationChange} />
          </div>
          <div className="flex justify-end gap-2">
            <Dialog.Close render={<Button variant="secondary">{labels.cancel}</Button>} />
            <Button variant="primary" loading={isSaving} disabled={!password || !confirmation} onClick={onSave}>
              {isProvisioned ? labels.reset : labels.provision}
            </Button>
          </div>
        </div>
      </Dialog>
    </Dialog.Root>
  );
}

type DeleteConfirmationDialogProps = {
  record: AdminRecord | null;
  isDeleting: boolean;
  title: string;
  description: string;
  cancel: string;
  confirm: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteConfirmationDialog({
  record,
  isDeleting,
  title,
  description,
  cancel,
  confirm,
  onClose,
  onConfirm,
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog.Root role="alertdialog" open={record !== null} onOpenChange={open => !open && onClose()}>
      <Dialog size="base" className="p-6">
        <div className="flex flex-col gap-4">
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>{description}</Dialog.Description>
          <div className="flex justify-end gap-2">
            <Dialog.Close render={<Button variant="secondary">{cancel}</Button>} />
            <Button variant="destructive" loading={isDeleting} onClick={onConfirm}>{confirm}</Button>
          </div>
        </div>
      </Dialog>
    </Dialog.Root>
  );
}
