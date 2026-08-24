import type {AdminRecord, ResourcePage, ResourceQuery} from '../types';
import {apiRequest, resourceQueryString} from './apiClient';

const LIST_ALL_PAGE_SIZE = 100;
const LIST_ALL_CONCURRENCY = 4;

export type RolePermission = {
  id: string;
  code: string;
  name: string;
  resource: string;
  action: string;
  description: string;
  isSystem: boolean;
  granted: boolean;
  assignable: boolean;
};

function listResource(resourceId: string, query: ResourceQuery): Promise<ResourcePage<AdminRecord>> {
  return apiRequest(`/${resourceId}?${resourceQueryString(query)}`);
}

async function listAllResources(
  resourceId: string,
  query: Omit<ResourceQuery, 'page' | 'pageSize'>,
): Promise<AdminRecord[]> {
  const firstPage = await listResource(resourceId, {...query, page: 1, pageSize: LIST_ALL_PAGE_SIZE});
  const pageCount = Math.ceil(firstPage.total / LIST_ALL_PAGE_SIZE);
  if (pageCount <= 1) return firstPage.items;

  const items = [...firstPage.items];
  for (let first = 2; first <= pageCount; first += LIST_ALL_CONCURRENCY) {
    const pages = Array.from(
      {length: Math.min(LIST_ALL_CONCURRENCY, pageCount - first + 1)},
      (_, index) => first + index,
    );
    const results = await Promise.all(
      pages.map(page => listResource(resourceId, {...query, page, pageSize: LIST_ALL_PAGE_SIZE})),
    );
    for (const result of results) items.push(...result.items);
  }
  return items;
}

export const resourceApi = {
  list: listResource,
  listAll: listAllResources,

  create(resourceId: string, record: Omit<AdminRecord, 'id'>): Promise<AdminRecord> {
    return apiRequest(`/${resourceId}`, {method: 'POST', body: JSON.stringify(record)});
  },

  update(resourceId: string, id: string, patch: Partial<AdminRecord>): Promise<AdminRecord> {
    return apiRequest(`/${resourceId}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },

  remove(resourceId: string, id: string): Promise<void> {
    return apiRequest(`/${resourceId}/${encodeURIComponent(id)}`, {method: 'DELETE'});
  },

  getAssignableRoles(): Promise<Array<{id: string; name: string; code: string}>> {
    return apiRequest('/users/assignable-roles');
  },

  provisionUserAuth(userId: string, password: string): Promise<AdminRecord> {
    return apiRequest(`/users/${encodeURIComponent(userId)}/auth`, {
      method: 'POST',
      body: JSON.stringify({password}),
    });
  },

  resetUserPassword(userId: string, password: string): Promise<{updated:boolean}> {
    return apiRequest(`/users/${encodeURIComponent(userId)}/auth/password`, {
      method: 'PATCH',
      body: JSON.stringify({password}),
    });
  },

  getRolePermissions(roleId: string): Promise<RolePermission[]> {
    return apiRequest(`/roles/${encodeURIComponent(roleId)}/permissions`);
  },

  replaceRolePermissions(roleId: string, permissionIds: string[]): Promise<{updated: boolean}> {
    return apiRequest(`/roles/${encodeURIComponent(roleId)}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({permissionIds}),
    });
  },
};
