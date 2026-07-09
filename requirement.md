# 任务：基于 @cloudflare/kumo + Tailwind v4 迁移后台管理系统 UI（新分支）

## 0. 背景与目标

- 新建分支，将当前 React 后台管理系统的 UI 层从 Astryx Design 迁移到 Cloudflare 的 **@cloudflare/kumo** 组件库。
- 本次是**组件库迁移**，不是重新设计：整体排版、信息架构、页面布局、业务数据流和交互行为保持不变，只替换组件实现与样式来源。
- 本文件是该迁移任务的执行准则；在本任务范围内，`requirement.md` 中的 Kumo/Tailwind 规则优先于仓库 `AGENTS.md` 中的 Astryx UI 规则。
- 允许并默认引入 Tailwind CSS v4：如果 Tailwind utility 能让代码更简单、直观、少写自定义 CSS，就优先使用。

---

## 1. 技术栈、依赖与样式方案

### 1.1 依赖安装

保留当前 React 19 版本，安装 Kumo 与必要 peer dependencies：

```bash
npm install @cloudflare/kumo @phosphor-icons/react echarts zod
npm install -D tailwindcss @tailwindcss/vite
```

迁移完成后移除旧设计系统与旧图标库：

```bash
npm uninstall @astryxdesign/cli @astryxdesign/core @astryxdesign/theme-neutral @heroicons/react
```

约束：

- `@cloudflare/kumo` 当前核对版本为 `2.7.0`，peer dependencies 包括 `react`、`react-dom`、`@phosphor-icons/react`、`echarts`、`zod`。
- 图标统一使用 `@phosphor-icons/react`，不再引入 `@heroicons/react` 或其他图标库。
- 不保留任何 `@astryxdesign/*` 运行时代码、样式入口或类型引用。

### 1.2 Tailwind 与 Kumo 样式入口

在入口 CSS 中使用 Kumo 推荐顺序：

```css
@source "../node_modules/@cloudflare/kumo/dist/**/*.{js,jsx,ts,tsx}";
@import "@cloudflare/kumo/styles/tailwind";
@import "tailwindcss";
```

说明：

- `@source` 路径需按入口 CSS 的实际位置调整；当前入口 CSS 在 `src/styles.css`，上述路径可直接使用。
- 需要移除 `src/main.tsx` 中的 Astryx 样式引入：
  - `@astryxdesign/core/reset.css`
  - `@astryxdesign/core/astryx.css`
  - `@astryxdesign/theme-neutral/theme.css`
- 如果 Vite 构建需要 Tailwind v4 插件，则在 `vite.config.ts` 中加入 `@tailwindcss/vite` 的最小配置。

### 1.3 导入方式

优先使用细粒度导入以获得更好的 tree-shaking：

```tsx
import { Button } from "@cloudflare/kumo/components/button";
import { Input } from "@cloudflare/kumo/components/input";
```

仅在原型或临时验证代码中允许使用主包导入：

```tsx
import { Button, Input } from "@cloudflare/kumo";
```

---

## 2. Kumo CLI 工作流

实施前先通过 CLI 确认真实组件 API，不凭记忆猜测 props：

```bash
npx @cloudflare/kumo ls
npx @cloudflare/kumo doc Button
npx @cloudflare/kumo docs
npx @cloudflare/kumo blocks
npx @cloudflare/kumo add PageHeader
npx @cloudflare/kumo add ResourceListPage
npx @cloudflare/kumo add DeleteResource
npx @cloudflare/kumo migrate
```

当前已核对的可用 Blocks：

- `PageHeader`
- `ResourceListPage`
- `DeleteResource`

如果页面结构与 Kumo Block 高度吻合，优先安装并基于 Block 微调；如果 Block 会明显改变现有信息架构或数据流，则改用 Kumo components 手工组合。

---

## 3. 迁移范围与页面清单

必须覆盖当前项目中所有用户可见 UI：

- `src/main.tsx`：入口样式与全局 provider。
- `src/App.tsx`：登录/注册页、应用外壳、侧边导航、顶部栏、面包屑、多标签页、账号菜单、通知中心、加载态。
- `src/components/DashboardPage.tsx`：首页仪表盘、指标卡、趋势图、模块占比、系统动态。
- `src/components/ResourcePage.tsx`：资源列表页、筛选区、表格、分页、新增/编辑弹窗、删除确认、导出。
- `src/components/UserCenterPage.tsx`：用户资料、联系方式、组织身份、编辑资料弹窗、安全设置弹窗。
- `src/components/FieldValue.tsx`：状态、标签、进度、日期、金额、选项等通用字段展示。
- `src/components/icons.tsx` 与 `src/types.ts`：图标与旧组件类型依赖。
- `src/styles.css`：删除 Astryx token、`.astryx-*` 选择器和旧组件覆盖样式，迁移为 Kumo/Tailwind 风格。

不在本次范围内：

- 不重写 `mockApi`、mock 数据结构或业务类型，除非旧 UI 类型依赖必须移除。
- 不改变路由/导航结构、默认打开页面、资源 schema、表单校验规则、CSV 导出逻辑。
- 不新增真实后端接口。

---

## 4. 组件替换规则

### 4.1 替换优先级

1. Kumo 有同类型组件时，必须替换为对应 Kumo 组件。
2. Kumo 没有完全对应组件时，优先使用 Kumo 中视觉和语义最接近的 component 或 primitive。
3. Kumo component/primitive 都不适合时，允许使用语义 HTML + Tailwind utility 实现，但样式必须保持 Kumo 设计语言。
4. 复杂业务展示（如首页趋势柱状图）可保留少量组件内样式或简洁 CSS，但不得保留 Astryx token 或 `.astryx-*` 覆盖规则。

### 4.2 常用替换对照

| 当前 Astryx / 用途 | 目标 Kumo / 实现方式 | 说明 |
|---|---|---|
| `Button` | `Button` | 图标使用 Phosphor；保留 loading、disabled、destructive 等行为 |
| `Card` | `Surface` / `LayerCard` | 仪表盘卡片、资料区块、弹层内容容器优先使用 Kumo 容器 |
| `Dialog` | `Dialog` | 保留打开/关闭、表单提交、删除确认流程 |
| `Banner` | `Banner` | 错误提示、表单消息保持原语义 |
| `TextInput` | `Input` / `Field` + `Input` | 必填、错误信息、placeholder 保持一致 |
| `Selector` | `Select` / `Combobox` | 筛选项、状态选择、表单下拉 |
| `Switch` | `Switch` | 安全设置开关保留乐观更新与回滚 |
| `Grid` | `Grid` / Tailwind grid | 可用 Tailwind 简化响应式布局 |
| `Table` | `Table` / `ResourceListPage` | 资源列表优先评估 `ResourceListPage` |
| `Pagination` | `Pagination` | 保留 page/pageSize/total 逻辑 |
| `Token` | `Badge` / Kumo 文本标签组合 | 用于状态、计数、枚举值，不做纯装饰 |
| `StatusDot` | `Badge` / 语义状态组合 | 若无一一对应，使用 Kumo 风格组合实现 |
| `ProgressBar` | `Meter` | 进度与容量展示 |
| `DropdownMenu` / `MoreMenu` | `DropdownMenu` | 账号菜单、标签溢出菜单 |
| `Breadcrumbs` | `Breadcrumbs` | 保留页面路径语义 |
| `SideNav` | `Sidebar` | 保留分组、折叠、选中态与嵌套导航 |
| `Link` | `Link` | 登录/注册切换等文本链接 |
| `Avatar` | Base UI avatar primitive 或 Kumo 风格组合 | 如果 Kumo 无封装组件，允许语义 HTML + Tailwind |
| `Stack` / `HStack` / `VStack` / `StackItem` / `Center` | Kumo layout、Tailwind utility、语义 HTML | 不保留 Astryx layout 组件 |

### 4.3 严禁行为

- 禁止在同一处 UI 中混用新旧组件，例如按钮已迁移到 Kumo，但外层还保留 Astryx `Card`。
- 禁止为复刻 Astryx 外观写大量自定义 CSS 或使用 `.astryx-*` 选择器。
- 禁止继续使用 Astryx CSS variables，例如 `--color-background-wash`、`--spacing-*`、`--radius-*` 等旧 token。
- 禁止继续使用 `@heroicons/react`；所有图标替换为 Phosphor。
- 自定义 className 需要与 Kumo 组件合并时，使用 Kumo 提供的 `cn()` 或同等官方工具，不做脆弱字符串拼接。

---

## 5. 页面与交互要求

### 5.1 全局布局

- 保留左侧导航 + 顶部栏 + 内容区 + 标签页的后台管理结构。
- 内容区必须撑满侧边栏以外的可用宽度，不出现异常留白。
- 桌面与移动宽度下导航、顶部操作、弹窗和表格均不能遮挡或溢出。
- 页面标题区可使用 `PageHeader`，但不得恢复标题下方说明性描述文字；只保留标题与操作区。

### 5.2 登录与认证

- 登录/注册切换、字段校验、loading 状态、错误提示、登录成功回调保持现有行为。
- 默认用户填充逻辑保持不变。

### 5.3 导航、账号菜单与通知中心

- 侧边导航保留分组、嵌套、选中态、点击后打开标签页逻辑。
- 顶部面包屑、多标签页打开/关闭逻辑保持不变。
- 账号菜单保留退出、设置、主题切换、通知入口。
- 通知中心保留单条已读、全部已读、已读/未读状态展示和关闭行为。

### 5.4 首页仪表盘

- 指标卡、趋势柱状图、模块占比、系统动态的内容和顺序保持不变。
- 趋势柱状图允许使用少量自定义 CSS 或 Tailwind 实现，不引入新的图表库。
- 模块占比进度展示迁移为 `Meter` 或 Kumo 推荐进度组件。

### 5.5 资源列表页

- 优先评估 `ResourceListPage` block；如果会破坏现有 schema 驱动结构，则使用 Kumo `Table`、`Field`、`Select`、`Pagination` 手工组合。
- 保留筛选、查询、重置、主字段排序、分页、pageSize 切换、CSV 导出。
- 保留新增、编辑、删除确认弹窗与表单校验。
- 删除记录后分页回退逻辑保持不变。

### 5.6 用户中心

- 保留资料展示、联系方式操作、组织身份、安全设置。
- 编辑资料弹窗保留字段、状态选择、保存 loading 与错误提示。
- 安全设置保留乐观更新、失败回滚与单项 loading/disabled 状态。

---

## 6. 样式与代码质量要求

- Tailwind utility 可用于布局、间距、响应式、简单状态样式；优先减少 `src/styles.css` 中的自定义规则。
- 颜色、间距、圆角优先使用 Kumo/Tailwind 语义能力，避免 raw hex 和散落硬编码 px。
- 删除 Astryx 专属 CSS：
  - `.astryx-*` 选择器
  - Astryx token
  - 为覆盖 Astryx 组件而写的 `!important`
- 允许保留少量全局 CSS：
  - 根节点高度、字体栈等基础样式
  - 趋势柱状图等业务展示
  - 确有必要的响应式布局补充
- TypeScript 类型中不得引用旧组件库类型；例如 `StatusDotVariant` 需要替换为项目本地状态类型或 Kumo 对应类型。

---

## 7. 交付与验收

### 7.1 构建验收

迁移完成后必须通过：

```bash
npm run build
```

### 7.2 静态检查

必须确认无旧设计系统残留：

```bash
rg "@astryxdesign|@heroicons" src package.json
rg "astryx-" src
```

以上命令应无匹配结果。

建议额外检查：

```bash
rg "--color-background|--spacing-|--radius-" src
rg "!important" src
```

若仍有匹配，必须确认不是 Astryx 残留；否则需要继续迁移。

### 7.3 功能回归

必须手工验证以下流程：

- 登录、注册、退出。
- 主题切换。
- 通知中心打开/关闭、单条已读、全部已读。
- 资源列表筛选、查询、重置、排序、分页、pageSize 切换。
- 资源新增、编辑、删除、CSV 导出。
- 用户资料编辑。
- 安全设置开关成功与失败回滚。

### 7.4 UI 回归

必须验证：

- 浅色与暗色模式均正常显示。
- 桌面与移动宽度下导航、弹窗、表格、分页、表单无错位、遮挡或异常留白。
- 页面标题下方不出现说明性描述文字。
- 列表和表格保持边到边的数据密度，不用额外卡片包裹每一行数据。

---

## 8. 实施顺序建议

1. 安装依赖，接入 Tailwind v4 与 Kumo 样式入口，移除 Astryx 样式入口。
2. 迁移图标系统：`@heroicons/react` 全部替换为 `@phosphor-icons/react`。
3. 迁移全局外壳：登录页、加载态、侧边导航、顶部栏、面包屑、标签页、账号菜单、通知中心。
4. 迁移首页仪表盘和用户中心。
5. 迁移资源列表页与 `FieldValue`，重点处理 table、pagination、form、dialog、status/tag/progress 展示。
6. 清理 `src/styles.css`、旧依赖、旧 import 和旧类型引用。
7. 执行构建、静态检查、功能回归和 UI 回归。

---

## 9. 记录规则

- 如果某组件在 Kumo 中确实找不到合适替代，需要在代码附近用简短注释说明原因，并在提交说明中列出。
- 不在代码中写死未验证的 Kumo props；实施前通过 `npx @cloudflare/kumo doc <ComponentName>` 确认具体 API。
- 若引入 Kumo Block 后对当前结构做了微调，需要在提交说明中说明使用了哪个 Block、调整了哪些结构。
