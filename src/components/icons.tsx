import {lazy, Suspense} from 'react';
import type {Icon as PhosphorIcon} from '@phosphor-icons/react';
import {ChartBarIcon, GearSixIcon, ListBulletsIcon, SlidersHorizontalIcon, SquaresFourIcon, TableIcon, TreeStructureIcon, UserCircleIcon, UserGearIcon, UsersIcon} from '@phosphor-icons/react';
import {menuIconLoaders, menuIconNames} from 'virtual:phosphor-menu-icons';
import type {IconKey} from '../types';

const builtInIcons: Record<string, PhosphorIcon> = {
  dashboard: ChartBarIcon,
  users: UsersIcon,
  roles: UserGearIcon,
  departments: TreeStructureIcon,
  club: SquaresFourIcon,
  menu: ListBulletsIcon,
  table: TableIcon,
  settings: GearSixIcon,
  profile: UserCircleIcon,
};

const builtInMenuIcons: Record<string, PhosphorIcon> = {
  ChartBarIcon,
  GearSixIcon,
  ListBulletsIcon,
  TableIcon,
  TreeStructureIcon,
  UserGearIcon,
  UsersIcon,
};

const legacyMenuIcons: Record<string, string> = {
  'i-chart': 'ChartBarIcon',
  'i-settings': 'GearSixIcon',
  'i-setting': 'GearSixIcon',
  'i-user': 'UsersIcon',
  'i-role': 'UserGearIcon',
  'i-department': 'TreeStructureIcon',
  'i-menu': 'ListBulletsIcon',
  'i-table': 'TableIcon',
};

export {menuIconNames};

export function menuIconLabel(code: string) {
  const normalized = legacyMenuIcons[code] ?? code;
  return normalized.replace(/Icon$/, '').replace(/([a-z0-9])([A-Z])/g, '$1 $2');
}

const lazyMenuIcons = new Map<string, ReturnType<typeof lazy>>();

function resolveMenuIcon(code: string) {
  const normalized = legacyMenuIcons[code] ?? code;
  const builtIn = builtInMenuIcons[normalized];
  if (builtIn) return builtIn;
  const loader = menuIconLoaders[normalized];
  if (!loader) return SlidersHorizontalIcon;
  let Icon = lazyMenuIcons.get(normalized);
  if (!Icon) {
    Icon = lazy(async () => ({default: await loader()}));
    lazyMenuIcons.set(normalized, Icon);
  }
  return Icon;
}

export function ModuleIcon({name, className}: {name: IconKey; className?: string}) {
  const Icon = builtInIcons[name] ?? resolveMenuIcon(name);
  return <Suspense fallback={<SlidersHorizontalIcon className={className ?? 'size-4'} weight="duotone" />}><Icon className={className ?? 'size-4'} weight="duotone" /></Suspense>;
}

export function MenuIcon({code, className}: {code: string; className?: string}) {
  const Icon = resolveMenuIcon(code);
  return <Suspense fallback={<SlidersHorizontalIcon className={className ?? 'size-4'} weight="duotone" />}><Icon className={className ?? 'size-4'} weight="duotone" /></Suspense>;
}
