import {relationName} from '../common/resource-utils.js';

type NamedRelation = {name: string};
type RoleAssignment = {
  role_id: string;
  role: NamedRelation | NamedRelation[] | null;
};

export type UserRow = {
  id: string;
  auth_user_id: string | null;
  name: string;
  account: string;
  email: string | null;
  phone: string | null;
  employee_no: string | null;
  job_title: string | null;
  manager_name: string | null;
  enterprise_wechat: string | null;
  emergency_contact: string | null;
  office_location: string | null;
  joined_at: string | null;
  avatar_url: string | null;
  gender: string | null;
  status: 'normal' | 'disabled';
  department_id: string | null;
  department_name: string | null;
  tags: string[] | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  department: NamedRelation | NamedRelation[] | null;
  role_assignments: RoleAssignment[] | null;
};

export function toUserRecord(row: UserRow) {
  const assignments = row.role_assignments ?? [];
  const roleNames = assignments.map(assignment => relationName(assignment.role)).filter(Boolean);
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    name: row.name,
    account: row.account,
    email: row.email ?? '',
    phone: row.phone ?? '',
    employeeNo: row.employee_no ?? '',
    jobTitle: row.job_title ?? '',
    managerName: row.manager_name ?? '',
    enterpriseWechat: row.enterprise_wechat ?? '',
    emergencyContact: row.emergency_contact ?? '',
    officeLocation: row.office_location ?? '',
    joinedAt: row.joined_at ?? '',
    avatarUrl: row.avatar_url,
    gender: row.gender ?? '',
    status: row.status,
    authStatus: row.auth_user_id ? 'provisioned' : 'unprovisioned',
    departmentId: row.department_id,
    department: row.department_name ?? relationName(row.department),
    roleIds: assignments.map(assignment => assignment.role_id),
    roleNames,
    role: roleNames.join(' / '),
    tags: row.tags ?? [],
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
