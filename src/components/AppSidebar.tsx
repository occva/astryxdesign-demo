import {useTranslation} from 'react-i18next';
import {Button} from '@cloudflare/kumo/components/button';
import {DropdownMenu} from '@cloudflare/kumo/components/dropdown';
import {Popover} from '@cloudflare/kumo/components/popover';
import {Sidebar} from '@cloudflare/kumo/components/sidebar';
import {Tabs} from '@cloudflare/kumo/components/tabs';
import {Text} from '@cloudflare/kumo/components/text';
import {Tooltip} from '@cloudflare/kumo/components/tooltip';
import {
  Bell,
  CaretDoubleLeft,
  CaretDoubleRight,
  GearSix,
  Moon,
  SignOut,
  Sun,
  Translate,
  UserCircle,
} from '@phosphor-icons/react';
import i18n, {languageRegistry, supportedLanguages, type AppLanguage} from '../i18n';
import type {AppModule, AuthSession} from '../types';
import {BrandMark} from './BrandMark';
import {ModuleIcon} from './icons';
import {Avatar} from './kumo-ui';

type ThemeMode = 'light' | 'dark';

const COLLAPSED_BUTTON_CLASS =
  'group-data-[state=collapsed]/sidebar:mx-auto group-data-[state=collapsed]/sidebar:size-10 group-data-[state=collapsed]/sidebar:min-h-10 group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:px-0 group-data-[state=collapsed]/sidebar:py-0 group-data-[state=collapsed]/sidebar:[&>div]:w-full group-data-[state=collapsed]/sidebar:[&>div]:translate-x-0 group-data-[state=collapsed]/sidebar:[&>div]:justify-center group-data-[state=collapsed]/sidebar:[&>div>span]:hidden';
const ACTIVE_BUTTON_CLASS =
  'data-[active]:bg-kumo-fill data-[active]:text-kumo-strong data-[active]:[&_svg]:opacity-75';
const SUB_BUTTON_CLASS =
  'hover:!bg-kumo-fill hover:!text-kumo-strong data-[active]:!bg-kumo-fill data-[active]:!text-kumo-strong data-[active]:shadow-sm';

function sidebarIcon(name: AppModule['icon']) {
  return function SidebarModuleIcon({className}: {className?: string}) {
    return <ModuleIcon name={name} className={className} />;
  };
}

function dropdownModuleIcon(name: AppModule['icon'], active: boolean) {
  return (
    <span
      className={`mr-2 inline-flex size-5 shrink-0 items-center justify-center ${active ? 'text-kumo-strong' : 'text-kumo-subtle'}`}
      aria-hidden="true"
    >
      <ModuleIcon name={name} className="size-4" />
    </span>
  );
}

type AppSidebarProps = {
  open: boolean;
  groups: Record<string, AppModule[]>;
  activePage: string;
  openGroups: Record<string, boolean>;
  user: AuthSession['user'];
  accountPanelOpen: boolean;
  language: AppLanguage;
  themeMode: ThemeMode;
  canManageMenus: boolean;
  unreadCount: number;
  onNavigate: (pageId: string) => void;
  onOpenChange: (open: boolean) => void;
  onGroupOpenChange: (groupId: string, open: boolean) => void;
  onAccountPanelOpenChange: (open: boolean) => void;
  onThemeToggle: () => void;
  onNotificationsOpen: () => void;
  onLogout: () => void;
};

export function AppSidebar({
  open,
  groups,
  activePage,
  openGroups,
  user,
  accountPanelOpen,
  language,
  themeMode,
  canManageMenus,
  unreadCount,
  onNavigate,
  onOpenChange,
  onGroupOpenChange,
  onAccountPanelOpenChange,
  onThemeToggle,
  onNotificationsOpen,
  onLogout,
}: AppSidebarProps) {
  const {t} = useTranslation('shell');

  const navigateFromAccountPanel = (pageId: string) => {
    onAccountPanelOpenChange(false);
    onNavigate(pageId);
  };

  const renderNavigationItem = (item: AppModule) => {
    if (!item.children?.length) {
      return (
        <Sidebar.MenuItem key={item.id} className="group-data-[state=collapsed]/sidebar:overflow-visible">
          <Sidebar.MenuButton
            className={`${COLLAPSED_BUTTON_CLASS} ${ACTIVE_BUTTON_CLASS}`}
            active={activePage === item.id}
            icon={sidebarIcon(item.icon)}
            tooltip={item.title}
            onClick={() => onNavigate(item.id)}
          >
            {open ? item.title : null}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      );
    }

    const hasActiveChild = item.children.some(child => child.id === activePage);
    if (!open) {
      return (
        <Sidebar.MenuItem key={item.id} className="group-data-[state=collapsed]/sidebar:overflow-visible">
          <DropdownMenu>
            <DropdownMenu.Trigger
              render={
                <Sidebar.MenuButton
                  className={`${COLLAPSED_BUTTON_CLASS} ${ACTIVE_BUTTON_CLASS}`}
                  active={hasActiveChild}
                  icon={sidebarIcon(item.icon)}
                  aria-label={item.title}
                />
              }
            />
            <DropdownMenu.Content side="right" align="start" className="min-w-44 p-2">
              {item.children.map(child => {
                const active = activePage === child.id;
                return (
                  <DropdownMenu.Item
                    key={child.id}
                    className={`min-h-10 px-3 py-2 text-sm font-medium ${active ? 'bg-kumo-fill text-kumo-strong' : 'text-kumo-default'}`}
                    icon={dropdownModuleIcon(child.icon, active)}
                    onClick={() => onNavigate(child.id)}
                  >
                    {child.title}
                  </DropdownMenu.Item>
                );
              })}
            </DropdownMenu.Content>
          </DropdownMenu>
        </Sidebar.MenuItem>
      );
    }

    return (
      <Sidebar.MenuItem key={item.id} className="group-data-[state=collapsed]/sidebar:overflow-visible">
        <Sidebar.Collapsible
          open={openGroups[item.id] ?? true}
          onOpenChange={nextOpen => onGroupOpenChange(item.id, nextOpen)}
        >
          <Sidebar.CollapsibleTrigger
            render={
              <Sidebar.MenuButton
                className={`${COLLAPSED_BUTTON_CLASS} ${ACTIVE_BUTTON_CLASS}`}
                active={hasActiveChild}
                icon={sidebarIcon(item.icon)}
                tooltip={item.title}
              >
                {item.title}
                <Sidebar.MenuChevron />
              </Sidebar.MenuButton>
            }
          />
          <Sidebar.CollapsibleContent>
            <Sidebar.MenuSub className="mt-1.5 pt-0.5">
              {item.children.map(child => (
                <Sidebar.MenuSubButton
                  key={child.id}
                  className={SUB_BUTTON_CLASS}
                  active={activePage === child.id}
                  onClick={() => onNavigate(child.id)}
                >
                  {child.title}
                </Sidebar.MenuSubButton>
              ))}
            </Sidebar.MenuSub>
          </Sidebar.CollapsibleContent>
        </Sidebar.Collapsible>
      </Sidebar.MenuItem>
    );
  };

  return (
    <Sidebar className="h-dvh shrink-0" contentClassName="bg-kumo-elevated">
      <Sidebar.Header className="border-kumo-line/45 px-3">
        {open ? (
          <div className="flex w-full min-w-0 items-center gap-3">
            <Button
              className="h-auto min-w-0 flex-1 items-center gap-3 rounded-lg p-2 text-left hover:bg-kumo-tint"
              variant="ghost"
              onClick={() => onNavigate('/home')}
            >
              <BrandMark />
              <span className="min-w-0 truncate font-semibold">{t('title')}</span>
            </Button>
            <Button
              className="ml-auto shrink-0 text-kumo-subtle"
              shape="square"
              size="sm"
              variant="ghost"
              icon={CaretDoubleLeft}
              aria-label={t('collapseNavigation')}
              title={t('collapseNavigation')}
              onClick={() => onOpenChange(false)}
            />
          </div>
        ) : (
          <Tooltip
            content={t('openNavigation')}
            side="right"
            render={
              <Button
                className="group relative mx-auto grid size-10 place-items-center rounded-lg text-kumo-subtle transition-colors hover:text-kumo-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kumo-focus/25"
                shape="square"
                variant="ghost"
                aria-label={t('openNavigation')}
                onClick={() => onOpenChange(true)}
              >
                <BrandMark className="transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0" />
                <CaretDoubleRight
                  className="absolute size-5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                  aria-hidden="true"
                />
              </Button>
            }
          />
        )}
      </Sidebar.Header>

      <Sidebar.Content>
        {Object.entries(groups).map(([group, items]) => (
          <Sidebar.Group key={group}>
            <Sidebar.GroupLabel>{group}</Sidebar.GroupLabel>
            <Sidebar.Menu>{items.map(renderNavigationItem)}</Sidebar.Menu>
          </Sidebar.Group>
        ))}
      </Sidebar.Content>

      <Sidebar.Footer className="h-auto border-t border-kumo-line/45 !bg-kumo-elevated !px-3 py-3 group-data-[state=collapsed]/sidebar:border-r-0">
        <div className="flex w-full min-w-0 items-center gap-3 group-data-[state=collapsed]/sidebar:justify-center">
          <Popover open={accountPanelOpen} onOpenChange={onAccountPanelOpenChange}>
            <Popover.Trigger
              render={
                <Button
                  className="group/user-entry h-auto min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-2 text-left data-[popup-open]:bg-kumo-fill group-data-[state=collapsed]/sidebar:size-10 group-data-[state=collapsed]/sidebar:flex-none group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:p-0"
                  variant="ghost"
                  aria-label={t('accountMenu')}
                >
                  <Avatar name={user.name} src={user.avatarUrl} className="size-7 shrink-0" />
                  <span className="flex min-w-0 flex-1 flex-col gap-px group-data-[state=collapsed]/sidebar:hidden">
                    <span className="truncate text-sm font-medium leading-4 text-kumo-strong">{user.name}</span>
                    <span className="truncate text-[12px] leading-4 text-kumo-subtle">{user.department}</span>
                  </span>
                </Button>
              }
            />
            <Popover.Content
              side="top"
              align="start"
              sideOffset={10}
              className="w-72 border border-kumo-line bg-kumo-elevated p-0 text-kumo-default shadow-xl"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-3 border-b border-kumo-line px-4 py-3">
                  <Avatar name={user.name} src={user.avatarUrl} className="size-10" />
                  <span className="min-w-0 flex-1">
                    <Popover.Title className="truncate text-sm font-semibold text-kumo-strong">{user.name}</Popover.Title>
                    <Popover.Description className="truncate text-sm text-kumo-subtle">{user.email}</Popover.Description>
                  </span>
                </div>
                <div className="border-b border-kumo-line p-2">
                  <Button
                    className="h-auto w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm"
                    variant="ghost"
                    onClick={() => navigateFromAccountPanel('userCenter')}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <UserCircle className="size-4 text-kumo-subtle" />
                      <span className="truncate">{t('profileSettings')}</span>
                    </span>
                    <Text as="span" size="sm" variant="secondary">{user.department}</Text>
                  </Button>
                </div>
                <div className="border-b border-kumo-line p-2">
                  <div className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="flex min-w-0 items-center gap-2 text-sm text-kumo-default">
                      <Translate className="size-4 text-kumo-subtle" />
                      <span>{t('language')}</span>
                    </span>
                    <Tabs
                      size="sm"
                      value={language}
                      onValueChange={value => void i18n.changeLanguage(value)}
                      tabs={supportedLanguages.map(item => ({
                        value: item,
                        label: languageRegistry[item].shortLabel,
                      }))}
                    />
                  </div>
                  <Button
                    className="mt-1 h-auto w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm"
                    variant="ghost"
                    onClick={onThemeToggle}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {themeMode === 'dark'
                        ? <Sun className="size-4 text-kumo-subtle" />
                        : <Moon className="size-4 text-kumo-subtle" />}
                      <span className="truncate">{t('toggleTheme')}</span>
                    </span>
                    <Text as="span" size="sm" variant="secondary">
                      {themeMode === 'dark' ? t('dark') : t('light')}
                    </Text>
                  </Button>
                </div>
                <div className="p-2">
                  {canManageMenus ? (
                    <Button
                      className="h-auto w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm"
                      variant="ghost"
                      onClick={() => navigateFromAccountPanel('/system/menu')}
                    >
                      <GearSix className="size-4 text-kumo-subtle" />
                      <span className="truncate">{t('settings')}</span>
                    </Button>
                  ) : null}
                  <Button
                    className="mt-1 h-auto w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-kumo-danger hover:bg-kumo-danger/5"
                    variant="ghost"
                    onClick={onLogout}
                  >
                    <SignOut className="size-4" />
                    <span className="truncate">{t('signOut')}</span>
                  </Button>
                </div>
              </div>
            </Popover.Content>
          </Popover>
          <Button
            className="ml-auto relative shrink-0 text-kumo-default/70 group-data-[state=collapsed]/sidebar:hidden"
            shape="square"
            variant="ghost"
            aria-label={t('notifications')}
            title={t('notifications')}
            onClick={onNotificationsOpen}
          >
            <Bell className="size-4" />
            {unreadCount > 0 ? (
              <span className="absolute right-2 top-2 size-2 rounded-full bg-kumo-danger ring-2 ring-kumo-elevated" />
            ) : null}
          </Button>
        </div>
      </Sidebar.Footer>
    </Sidebar>
  );
}
