import i18n from './index';

export type ApiErrorBody = {code?: string; message?: string | string[]};

const errorKeys = {
  AUTH_INVALID_CREDENTIALS: 'authInvalidCredentials',
  AUTH_REQUIRED: 'authRequired',
  AUTH_ACCOUNT_NOT_PROVISIONED: 'authAccountNotProvisioned',
  AUTH_ACCOUNT_DISABLED: 'authAccountDisabled',
  AUTH_PERMISSIONS_UNAVAILABLE: 'authPermissionsUnavailable',
  AUTH_ACCOUNT_EXISTS: 'authAccountExists',
  AUTH_ACCOUNT_ALREADY_PROVISIONED: 'authAccountAlreadyProvisioned',
  AUTH_PROVISION_FAILED: 'authProvisionFailed',
  AUTH_PASSWORD_UPDATE_FAILED: 'authPasswordUpdateFailed',
  AUTH_REGISTRATION_FAILED: 'authRegistrationFailed',
  AUTH_REGISTRATION_UNAVAILABLE: 'authRegistrationUnavailable',
  AUTH_RATE_LIMITED: 'authRateLimited',
  PERMISSION_DENIED: 'permissionDenied',
  ROLE_ASSIGNMENT_DENIED: 'roleAssignmentDenied',
  SYSTEM_ROLE_ASSIGNMENT_DENIED: 'systemRoleAssignmentDenied',
  ROLE_PERMISSION_ESCALATION_DENIED: 'rolePermissionEscalationDenied',
  ASSIGNABLE_ROLE_NOT_FOUND: 'assignableRoleNotFound',
  SYSTEM_ROLE_PROTECTED: 'systemRoleProtected',
  SYSTEM_USER_PROTECTED: 'systemUserProtected',
  USER_SCOPE_DENIED: 'userScopeDenied',
  SELF_DELETE_DENIED: 'selfDeleteDenied',
  SELF_ROLE_PERMISSION_CHANGE_DENIED: 'selfRolePermissionChangeDenied',
  RESOURCE_CONFLICT: 'resourceConflict',
  INVALID_REFERENCE: 'invalidReference',
  INVALID_RESOURCE_DATA: 'invalidResourceData',
  DATABASE_ERROR: 'databaseError',
  PROFILE_SAVE_FAILED: 'profileSaveFailed',
  FILE_REQUIRED: 'fileRequired',
  AVATAR_IMAGE_REQUIRED: 'avatarImageRequired',
  FILE_SCOPE_DENIED: 'fileScopeDenied',
  FILE_NOT_READY: 'fileNotReady',
  INVALID_CSV: 'invalidCsv',
  INVALID_CSV_HEADERS: 'invalidCsvHeaders',
  DEPARTMENT_IMPORT_INVALID: 'departmentImportInvalid',
  DEPARTMENT_OWNER_REASSIGN_REQUIRED: 'departmentOwnerReassignRequired',
} as const;

export function apiErrorMessage(body: ApiErrorBody | null, fallback: string) {
  const key = body?.code ? errorKeys[body.code as keyof typeof errorKeys] : undefined;
  if (key) return i18n.t(key, {ns:'errors'});
  if (Array.isArray(body?.message)) return body.message.join(' ');
  return body?.message ?? fallback;
}
