# 组织架构模块：数据库与接口设计

## 一、模块边界

组织架构模块以部门树为唯一事实源，负责部门维护、负责人和成员关系、树形查询、统计及批量导入导出。用户档案只保存所属部门引用，不复制另一套组织层级。

## 二、数据库设计

### 2.1 `departments`：部门

| 字段 | 类型 | 必填 | 设计说明 |
| --- | --- | --- | --- |
| `id` | UUID | 是 | 部门主键 |
| `name` | 文本 | 是 | 部门名称 |
| `code` | 文本 | 建议必填 | 稳定编码及导入匹配键 |
| `parent_id` | UUID | 否 | 父部门，空表示根部门 |
| `owner_user_id` | UUID | 否 | 有效业务用户负责人 |
| `status` | 枚举 | 是 | `enabled` 或 `disabled` |
| `sort_order` | 整数 | 是 | 同级排序，非负 |
| `description` | 文本 | 否 | 部门说明 |
| `parent_name` | 文本 | 否 | 父部门名称派生快照 |
| `owner_name` | 文本 | 否 | 负责人名称派生快照 |
| `member_count` | 整数 | 是 | 直属有效成员数派生值 |
| `created_at` | 时间 | 是 | 创建时间 |
| `updated_at` | 时间 | 是 | 更新时间及版本依据 |
| `deleted_at` | 时间 | 否 | 软删除时间 |

成员关系由 `users.department_id` 表达，不增加部门成员中间表。一个用户当前只属于一个部门；若未来需要兼职部门，应另建带关系类型和有效期的成员关系模型。

### 2.2 约束与索引

- 有效部门编码大小写不敏感唯一，规范化为小写。
- 名称非空且不超过 100；编码以字母开头，只含字母、数字、下划线和连字符。
- 父部门和负责人必须有效；部门不能以自己为父级，也不能形成循环。
- 有有效子部门或成员时禁止软删除；仍作为负责人不阻止部门自身删除，但负责人用户删除需先处理引用。
- `member_count` 只统计直属、未删除用户，不含子部门成员。
- 为父级与排序、负责人、状态、有效编码建立索引；用户部门引用建立反向索引。

## 三、日常管理接口

| 方法与路径 | 权限 | 请求/查询 | 响应 | 核心规则 |
| --- | --- | --- | --- | --- |
| `GET /api/departments` | `departments.read` | 名称、负责人、状态、分页排序 | 部门分页列表 | 返回直属成员数和父级摘要 |
| `GET /api/departments/:id` | `departments.read` | 部门标识 | 部门详情 | 包含直属成员、子部门和版本摘要 |
| `GET /api/departments/tree` | `departments.read` | 可选状态 | 完整嵌套树与汇总 | 同级按排序和名称稳定排序 |
| `POST /api/departments` | `departments.create` | 名称、编码、父级、负责人、状态、排序、说明 | 新部门 | 校验父级、负责人和树结构 |
| `PATCH /api/departments/:id` | `departments.update` | 可编辑字段、版本 | 更新后部门 | 父级调整检查完整循环 |
| `DELETE /api/departments/:id` | `departments.delete` | 部门标识、版本 | 无内容 | 有子部门或成员时拒绝 |

树响应每个节点区分 `members`（直属人数）和 `totalMembers`（包含后代的汇总人数），并可返回直属人员摘要。大规模组织下，人员列表应按部门单独分页，树中只返回数量。

## 四、导入导出接口

| 方法与路径 | 权限 | 请求 | 响应 | 核心规则 |
| --- | --- | --- | --- | --- |
| `GET /api/departments/export` | `departments.read` | 可选状态范围 | UTF-8 CSV | 输出可直接重新导入的稳定列 |
| `POST /api/departments/import/preview` | `departments.import` | CSV 内容 | 统计、规范化预览、逐行错误、预检标识 | 只校验，不写数据 |
| `POST /api/departments/import` | `departments.import` | CSV 内容或预检标识 | 新增、更新和总数 | 再次校验后整批原子提交 |

CSV 列固定为 `code,name,parentCode,ownerAccount,status,sortOrder,description`。预检至少检查表头、必填、编码格式、批内重复、父级存在、负责人存在、状态范围、非负排序和整棵树循环。

预检标识若被采用，需要绑定内容摘要、操作者和短期有效时间；提交时仍要检查数据版本，防止预检后组织结构发生变化。

## 五、事务与并发

- 单部门更新使用版本校验。
- 批量导入在一个事务内先 upsert 部门主体，再解析父级和负责人；任一行失败全部回滚。
- 部门改名、父级改名和负责人改名时同步派生快照。
- 用户调动时原部门和新部门的直属成员数在同一事务内更新或由可重建统计替代。
- 大批量导入设置行数和内容大小上限，避免长事务拖垮在线查询。

## 六、主要错误

| 场景 | 建议错误码 |
| --- | --- |
| 父部门或负责人无效 | `DEPARTMENT_REFERENCE_INVALID` |
| 自引用或树循环 | `DEPARTMENT_HIERARCHY_INVALID` |
| 编码冲突 | `DEPARTMENT_CODE_CONFLICT` |
| 仍有子部门 | `DEPARTMENT_HAS_CHILDREN` |
| 仍有成员 | `DEPARTMENT_HAS_MEMBERS` |
| CSV 表头错误 | `INVALID_CSV_HEADERS` |
| 导入存在逐行错误 | `DEPARTMENT_IMPORT_INVALID` |
| 预检已过期或数据变化 | `IMPORT_PREVIEW_STALE` |

## 七、验收标准

- 任意层级新增、移动和删除都保持树无环。
- 直属人数和汇总人数定义明确且可重建。
- 有子部门或成员的部门不能直接删除。
- 导出文件不修改即可通过预检并重新导入。
- 预检错误精确到行和字段，失败提交不产生部分数据。
- 并发移动或编辑产生版本冲突，不静默覆盖。
