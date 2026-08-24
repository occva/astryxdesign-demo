# 审计、文件与组织架构设计

> 本文保留三个能力的专题背景与交互目标。模块级数据库和接口契约分别以 [审计模块](design/modules/audit.md)、[文件模块](design/modules/files.md) 和 [组织架构模块](design/modules/departments.md) 为准。

## 目标与边界

本次在现有 React + NestJS + Supabase、服务端统一访问业务表、`resource.action` RBAC 模型上增加三组企业后台能力：

1. 操作审计：回答谁在什么时间、通过什么入口、对哪个资源做了什么，以及提交和返回了哪些非敏感数据。
2. 文件附件：提供私有文件上传、查询、临时下载、删除，以及面向动态资源字段的附件绑定能力。
3. 组织架构：在部门 CRUD 之上提供完整树、可视化浏览和可往返的 CSV 批量导入导出。

浏览器仍不直连数据库表或 Storage；所有权限校验、对象路径生成、签名 URL 和审计写入均由 NestJS 完成。

## 一、数据库设计

### 1. `audit_logs`：不可变操作证据

| 字段 | 用途 |
| --- | --- |
| `id` | UUID 主键 |
| `occurred_at` | 操作发生时间，索引倒序 |
| `actor_user_id/name/account` | actor 的逻辑 ID 与当时快照；不设外键，避免用户物理清理改写历史 |
| `action` | `create/update/delete/upload/download/import/...` |
| `resource_type/resource_id` | 资源类型及可选目标 ID |
| `request_method/request_path/request_id` | HTTP 入口和请求关联 ID |
| `status` | `succeeded` 或 `failed` |
| `status_code` | HTTP 状态码 |
| `changes` | JSONB，保存已脱敏的请求和响应摘要 |
| `ip_address/user_agent` | 安全追踪上下文 |
| `error_code` | 失败时的稳定错误编码 |

约束：数据库触发器拒绝 `UPDATE/DELETE`；应用角色只有写入和读取需要的最小能力。密码、token、secret、authorization 等键在服务端递归替换为 `[REDACTED]`，文件二进制不进入日志。

### 2. `files` 与 `file_links`：对象与业务绑定分离

`files` 保存 Storage 对象的权威元数据：私有 bucket、服务端生成的对象路径、原始文件名、MIME、字节数、校验和、上传者、状态及软删除时间。对象名不使用用户输入，避免覆盖和路径穿越。

`file_links` 保存多态附件关系：

```text
files 1 --- * file_links(resource_type, resource_id, field_key, sort_order)
```

同一文件可以在受控情况下绑定到资源字段；`resource_type + resource_id + field_key` 是未来动态资源引擎的字段坐标。删除文件前先检查并清除绑定。Storage bucket 为私有，下载接口只返回短有效期签名 URL。

### 3. 部门批量导入

不增加第二棵组织树，继续以 `departments` 为唯一事实源。CSV 使用稳定字段：

```text
code,name,parentCode,ownerAccount,status,sortOrder,description
```

`code` 是导入 upsert 键。预检阶段仅解析和校验；提交阶段调用数据库函数在单事务中完成：先 upsert 部门主体，再解析父部门和负责人，最后依赖现有树环检测触发器保证结构合法。任何一行失败则整批回滚。

## 二、接口设计

### 审计

- `GET /api/audit-logs`：分页查询；支持 actor、resource、action、status、起止时间筛选。
- 写操作由全局审计拦截器自动记录；业务 Controller 不接受客户端传入的 actor。

权限：`audit_logs.read`。

### 文件

- `GET /api/files`：分页查询文件元数据。
- `POST /api/files`：`multipart/form-data` 上传，默认最大 20 MiB。
- `POST /api/files/:id/download`：生成 60 秒签名 URL，并留下 download 审计。
- `DELETE /api/files/:id`：删除 Storage 对象并软删除元数据。
- `POST /api/files/:id/links`：绑定到资源字段。
- `DELETE /api/files/:id/links/:linkId`：解除绑定。

权限：`files.read/upload/download/delete/link`。列表和下载都不暴露 service role key 或永久公网地址。

### 组织架构

- `GET /api/departments/tree`：返回按 `sortOrder/name` 排序的嵌套树及汇总。
- `GET /api/departments/export`：返回 UTF-8 CSV 内容和文件名。
- `POST /api/departments/import/preview`：接收 `{csv}`，返回总行数、新增数、更新数、逐行错误和规范化预览。
- `POST /api/departments/import`：接收 `{csv}`；再次校验后原子提交。

权限：树和导出复用 `departments.read`；导入使用 `departments.import`。现有 create/update/delete 继续使用原权限。

## 三、功能与交互设计

### 审计日志页

以“证据时间线”为核心：首列时间与结果状态固定形成扫描轴；actor、动作、资源、入口分列；展开后查看请求/响应差异摘要。默认最新优先，失败记录具有更高视觉识别度，但不使用装饰性徽章。

### 文件管理页

采用边到边资产表，不用卡片包裹每个文件。顶部展示容量与数量摘要、上传入口；行内提供临时下载和删除。上传状态和错误要明确说明可采取的下一步。

### 组织架构页

桌面端左侧为可折叠树，右侧为选中部门详情和直接下级；移动端顺序堆叠。导入对话先展示预检统计和逐行错误，只有无错误时才允许提交。导出文件可不经修改直接重新导入。

## 四、一致性与失败策略

- 审计写入失败不得让成功的业务写操作伪装成失败；服务端记录错误并保留 request ID，生产环境应对审计写入失败配置告警。
- 文件对象上传成功但元数据写入失败时立即补偿删除对象；删除时先删除对象，再软删除元数据，失败不改变元数据状态。
- 部门导入以数据库事务为边界，禁止部分成功。
- 所有新表启用 RLS，并撤销 `anon/authenticated` 的直接访问；仍只允许 NestJS service role 访问。

## 五、验收条件

- 任意已鉴权写接口产生一条带 actor、时间、目标、状态和脱敏 payload 的审计记录；审计记录无法修改或删除。
- 私有文件可上传、列出、临时下载、绑定和删除；对象路径无法由客户端指定。
- 组织树能反映任意层级；CSV 能导出、预检并原子导入；错误精确定位到行号。
- 新菜单和按钮均由 RBAC 控制，中英文文案完整，桌面与窄屏可用。
