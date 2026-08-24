declare module 'virtual:phosphor-menu-icons' {
  import type {Icon} from '@phosphor-icons/react';

  export const menuIconNames: string[];
  export const menuIconLoaders: Record<string, () => Promise<Icon>>;
}
