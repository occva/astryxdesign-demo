import {Icon} from '@astryxdesign/core/Icon';
import {
  AdjustmentsHorizontalIcon,
  BuildingOffice2Icon,
  ChartBarSquareIcon,
  Cog6ToothIcon,
  RectangleGroupIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import type {IconKey} from '../types';

const icons = {
  dashboard: ChartBarSquareIcon,
  users: UserGroupIcon,
  roles: ShieldCheckIcon,
  departments: BuildingOffice2Icon,
  club: RectangleGroupIcon,
  settings: Cog6ToothIcon,
  profile: UserCircleIcon,
} satisfies Record<IconKey, typeof ChartBarSquareIcon>;

export function ModuleIcon({name, size = 'sm'}: {name: IconKey; size?: 'xsm' | 'sm' | 'md' | 'lg'}) {
  return <Icon icon={icons[name] ?? AdjustmentsHorizontalIcon} size={size} />;
}
