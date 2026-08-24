# Supabase 数据库与 RBAC 设计

> 本文保留数据库选型和 RBAC 技术背景。按模块维护的字段、约束和接口契约以 [模块数据库与接口设计](design/modules/README.md) 为准。

## 设计边界

- Supabase `auth.users` 只负责身份认证和密码。
- `public.users` 保存应用用户档案，通过 `auth_user_id` 关联认证身份。
- 应用只使用 `roles / permissions / user_roles / role_permissions` 一套 RBAC。
- 菜单只是导航配置，不再作为后端权限本身。
- 浏览器不直接访问应用业务表；NestJS 使用服务端密钥访问数据库。

## 核心关系

```text
auth.users 1 --- 0..1 users

users       * --- * roles        (user_roles)
roles       * --- * permissions  (role_permissions)
menus       * --- 0..1 permissions(required_permission_id)

departments 1 --- * users
departments 1 --- * departments  (parent_id)
users       1 --- * departments  (owner_user_id)

users         * --- * notifications (notification_reads)
```

## 命名约定

数据库表按业务实体命名，不使用来源于管理界面的 `admin_` 前缀：

| 旧表 | 当前表 |
| --- | --- |
| `admin_users` | `users` |
| `admin_roles` | `roles` |
| `admin_departments` | `departments` |
| `admin_menus` | `menus` |
| `admin_notifications` | `notifications` |
| `admin_user_notification_reads` | `notification_reads` |
| `admin_dashboard_*` | `dashboard_*` |

应用用户表使用 `public.users`，认证身份使用 `auth.users`，代码和 SQL 中应明确区分 schema。

## RBAC 表

### `roles`

角色定义。`code` 是稳定业务标识，`is_system` 表示受保护的系统角色。

### `permissions`

动作权限目录。权限编码采用 `resource.action`：

- `dashboard.read`
- `users.read/create/update/delete/assign_roles/manage_auth`
- `roles.read/create/update/delete`
- `role_permissions.read/manage`
- `departments.read/create/update/delete`
- `menus.read/create/update/delete`
- `notifications.read/update`

### `user_roles`

用户角色多对多关系，复合主键为 `(user_id, role_id)`。用户可以拥有多个角色，最终权限为所有启用角色权限的并集。

### `role_permissions`

角色权限多对多关系，复合主键为 `(role_id, permission_id)`。采用 grant-only 模型：

- 存在记录：授权
- 不存在记录：未授权

不保存显式拒绝，避免多角色合并时产生允许/拒绝优先级冲突。

### 权限计算

登录或会话校验时，服务端执行：

1. 根据 `users.id` 读取 `user_roles`。
2. 过滤已禁用或已删除角色。
3. 通过 `role_permissions` 汇总权限。
4. 过滤已禁用或已删除权限。
5. 将权限编码写入登录响应的 `permissionCodes`。
6. NestJS `RequirePermission` 守卫按动作权限保护接口。

## 菜单可见性

`menus.required_permission_id` 指向显示菜单所需的读取权限，例如用户管理菜单绑定 `users.read`。

目录菜单可以不绑定权限。当用户拥有某个子菜单权限时，服务端自动把它的所有父目录加入导航结果。

菜单可见性只决定导航显示；接口是否允许访问仍由动作权限守卫判断。

## 用户与身份

`users.auth_user_id` 关联 `auth.users.id`，应用不保存密码，也不签发自定义 JWT：

- 为空：仅业务档案，不能登录。
- 非空：已经开通 Supabase Auth 登录身份。

已开通登录的用户不允许直接修改 `account`，因为当前认证邮箱由账号和 Supabase 项目标识生成。若未来需要支持账号改名，必须同时更新 Auth 身份。

创建 Supabase Auth 身份时，数据库触发器 `auth_user_created` 会同步创建或绑定应用用户，并在用户尚无角色时自动分配启用的 Guest 角色。注册接口只负责调用 Supabase Auth，不再自行维护第二套认证数据。

Auth 身份的 `user_metadata` 必须包含：

- `account`：应用登录账号。
- `name`：用户显示姓名。
- `business_email`：可选的业务联系邮箱；Auth 内部认证邮箱不写入业务邮箱字段。

### 初始化或重置 Auth 账号

`seed.sql` 不能也不应该写入 `auth.users` 或密码。先执行 schema 和 seed，再通过服务端脚本创建或重置 Supabase Auth 账号：

```bash
ALLOW_AUTH_ACCOUNT_PROVISIONING=true \
AUTH_ACCOUNT_PROJECT_REF=your-project \
AUTH_ACCOUNTS=admin \
AUTH_ACCOUNT_PASSWORD='replace-with-a-strong-password' \
npm run provision:auth-accounts
```

脚本通过 Supabase Auth Admin API 创建或更新身份，并绑定已有的 `public.users`。`AUTH_ACCOUNTS` 支持逗号分隔的多个账号。密码只通过环境变量传入，不进入 DDL 或 seed。

### 会话生命周期

- 登录响应返回 Supabase Access Token、Refresh Token 和过期时间。
- 前端在 Access Token 即将过期时调用 `/auth/refresh`，并发刷新会合并为一个请求。
- 业务 API 返回 401 时，前端最多强制刷新并重试一次，避免循环重试。
- `/auth/logout` 调用 Supabase Auth 全局注销，撤销该用户的 Refresh Token；前端无论远程注销是否成功都会清理本地会话。
- 浏览器的“保持登录”决定会话写入 `localStorage` 还是 `sessionStorage`，不会保存密码。

### 密码与账号开通

- 已登录用户可在个人中心修改自己的 Supabase Auth 密码。
- 拥有 `users.manage_auth` 权限的管理员可在用户管理中为业务用户开通 Auth 身份或重置密码。
- 用户列表通过 `authStatus` 展示“已开通/未开通”，实际依据是 `auth_user_id` 是否为空。
- 当前 Auth 认证邮箱是由账号生成的内部邮箱，不具备邮件投递能力，因此不伪造自助找回邮件流程；忘记密码由管理员在用户管理中重置。
- 所有密码只发送给 Supabase Auth，不存入 `public.users`、日志、DDL 或 seed。

## 部门

`departments` 是当前应用使用的部门树。当前 RBAC 是全局应用级权限；如果未来启用多租户，应把租户维度加入 `user_roles` 和业务数据，而不是增加另一套角色字段。

## 数据完整性

数据库迁移负责保证：

- 账号、邮箱、角色编码、菜单路径等标识唯一。
- 标识统一去空格并规范为小写。
- 菜单树和部门树不能形成循环。
- 不能引用已软删除的部门、角色或权限。
- 系统角色和系统权限不能软删除。
- 角色权限和用户角色通过数据库函数整体替换。
- Supabase Auth 新身份自动绑定应用用户并获得默认 Guest 角色。
- 部门名称、负责人名称和成员数量兼容字段由触发器同步。
- 所有应用表对 `anon` 和 `authenticated` 撤销直接访问权限。

## 数据库说明

迁移使用 `COMMENT ON TABLE` 和 `COMMENT ON COLUMN` 为核心表及字段写入中文说明。可通过 Supabase Table Editor、数据库客户端或以下 SQL 查看：

```sql
select
  cols.table_name,
  cols.column_name,
  pg_catalog.col_description(cls.oid, attrs.attnum) as description
from information_schema.columns cols
join pg_catalog.pg_class cls on cls.relname = cols.table_name
join pg_catalog.pg_namespace ns on ns.oid = cls.relnamespace and ns.nspname = cols.table_schema
join pg_catalog.pg_attribute attrs on attrs.attrelid = cls.oid and attrs.attname = cols.column_name
where cols.table_schema = 'public'
order by cols.table_name, cols.ordinal_position;
```

## 迁移

最终基线结构和初始化数据分别位于：

```text
supabase/migrations/202608180003_schema.sql
supabase/seed.sql
```

`202608180003_schema.sql` 只包含 DDL、约束、函数、触发器、RLS 和中文数据库说明；`seed.sql` 只包含角色、权限、菜单及演示数据。新的空数据库先应用 baseline，再按需执行 seed。
