import type {ComponentType} from 'react';
import {
  ChartBar,
  GearSix,
  SlidersHorizontal,
  SquaresFour,
  TreeStructure,
  UserCircle,
  UserGear,
  Users,
  type VercelIconProps,
} from './vercel-icons';
import type {IconKey} from '../types';

const icons = {
  dashboard: ChartBar,
  users: Users,
  roles: UserGear,
  departments: TreeStructure,
  club: SquaresFour,
  settings: GearSix,
  profile: UserCircle,
} satisfies Record<IconKey, ComponentType<VercelIconProps>>;

export function ModuleIcon({
  name,
  className,
}: {
  name: IconKey;
  className?: string;
}) {
  const Icon = icons[name] ?? SlidersHorizontal;
  return <Icon className={className ?? 'vbg-custom-icon'} />;
}
