import type {AppModule, AuthMenu} from './types';

type NavigationLabels = {
  system: string;
  navigation: string;
  userCenter: string;
};

const navigationRegistry: Record<string, Pick<AppModule, 'kind' | 'icon' | 'resource'>> = {
  dashboard: {kind: 'dashboard', icon: 'dashboard'},
  system: {kind: 'group', icon: 'settings'},
  users: {kind: 'resource', icon: 'users', resource: 'users'},
  roles: {kind: 'resource', icon: 'roles', resource: 'roles'},
  departments: {kind: 'resource', icon: 'departments', resource: 'departments'},
  organization: {kind: 'custom', icon: 'departments', resource: 'departments'},
  menus: {kind: 'resource', icon: 'settings', resource: 'menus'},
  audit_logs: {kind: 'custom', icon: 'club', resource: 'audit_logs'},
  files: {kind: 'custom', icon: 'club', resource: 'files'},
};

export function groupModules(modules: AppModule[]) {
  return modules.reduce<Record<string, AppModule[]>>((groups, module) => {
    groups[module.group] = [...(groups[module.group] ?? []), module];
    return groups;
  }, {});
}

export function flattenModules(modules: AppModule[]): AppModule[] {
  return modules.flatMap(module => [module, ...flattenModules(module.children ?? [])]);
}

export function firstLeafModule(module: AppModule): AppModule {
  return module.children?.length ? firstLeafModule(module.children[0]) : module;
}

export function findParentModule(
  modules: AppModule[],
  pageId: string,
  parent?: AppModule,
): AppModule | undefined {
  for (const module of modules) {
    if (module.id === pageId) return parent;
    const nested = findParentModule(module.children ?? [], pageId, module);
    if (nested) return nested;
  }
  return undefined;
}

export function modulesFromMenus(
  menus: AuthMenu[],
  labels: NavigationLabels,
  translate: (key: string, fallback: string) => string,
): AppModule[] {
  const sortedMenus = [...menus].sort((left, right) => left.sortOrder - right.sortOrder);
  const childrenByParent = new Map<string, AuthMenu[]>();

  for (const menu of sortedMenus) {
    if (!menu.parentId) continue;
    childrenByParent.set(menu.parentId, [...(childrenByParent.get(menu.parentId) ?? []), menu]);
  }

  const buildModule = (menu: AuthMenu): AppModule | null => {
    const registered = navigationRegistry[menu.componentKey || menu.code];
    const children = (childrenByParent.get(menu.id) ?? [])
      .map(buildModule)
      .filter((module): module is AppModule => Boolean(module));

    if (!registered && children.length === 0) return null;

    return {
      id: menu.path,
      title: menu.i18nKey ? translate(menu.i18nKey, menu.name) : menu.name,
      kind: children.length > 0 ? 'group' : registered?.kind ?? 'group',
      icon: menu.icon || registered?.icon || 'settings',
      group: menu.parentId ? labels.system : labels.navigation,
      resource: registered?.resource,
      children: children.length > 0 ? children : undefined,
    };
  };

  const rootModules = sortedMenus
    .filter(menu => !menu.parentId)
    .map(buildModule)
    .filter((module): module is AppModule => Boolean(module));

  return [
    ...rootModules,
    {id: 'userCenter', title: labels.userCenter, kind: 'custom', icon: 'profile', group: labels.navigation},
  ];
}
