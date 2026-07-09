import type {Icon as PhosphorIcon} from '@phosphor-icons/react';
import {
  ChartBar,
  GearSix,
  SlidersHorizontal,
  SquaresFour,
  TreeStructure,
  UserCircle,
  UserGear,
  Users,
} from '@phosphor-icons/react';
import type {IconKey} from '../types';

const icons = {
  dashboard: ChartBar,
  users: Users,
  roles: UserGear,
  departments: TreeStructure,
  club: SquaresFour,
  settings: GearSix,
  profile: UserCircle,
} satisfies Record<IconKey, PhosphorIcon>;

export function ModuleIcon({
  name,
  className,
}: {
  name: IconKey;
  className?: string;
}) {
  const Icon = icons[name] ?? SlidersHorizontal;
  return <Icon className={className ?? 'size-4'} weight="duotone" />;
}
