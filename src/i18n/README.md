# i18n 分层约定

- `common`：通用动作和状态。
- `shell`：应用外壳、导航、主题和语言入口。
- `auth`、`notifications`：跨业务能力。
- `dashboard`、`resource`、`userCenter`：页面级文案。
- `adminResources`：字段、枚举和内置组件的展示名称。
- `dateTime`：可复用控件文案。

语言只负责 UI 文案。数据库菜单名、用户姓名、部门、角色、通知和用户输入内容均保持原文。
新增语言时增加语言资源并在 `languageRegistry` 注册，不在组件中增加语言判断。
