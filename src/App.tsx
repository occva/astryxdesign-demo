import {lazy, Suspense, useEffect, useMemo, useRef, useState} from 'react';
import {AppShell} from '@astryxdesign/core/AppShell';
import {Avatar} from '@astryxdesign/core/Avatar';
import {BreadcrumbItem, Breadcrumbs} from '@astryxdesign/core/Breadcrumbs';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Divider} from '@astryxdesign/core/Divider';
import {MoreMenu} from '@astryxdesign/core/MoreMenu';
import {Heading, Text} from '@astryxdesign/core/Text';
import {HStack, StackItem, VStack} from '@astryxdesign/core/Stack';
import {Theme} from '@astryxdesign/core/theme';
import type {ThemeMode} from '@astryxdesign/core/theme';
import {
  SideNav,
  SideNavCollapseButton,
  SideNavHeading,
  SideNavItem,
  SideNavSection,
} from '@astryxdesign/core/SideNav';
import type {SideNavImperativeCollapseHandle} from '@astryxdesign/core/SideNav';
import {Icon} from '@astryxdesign/core/Icon';
import {
  ArrowRightEndOnRectangleIcon,
  Bars3Icon,
  BellIcon,
  Cog6ToothIcon,
  LanguageIcon,
  SunIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {neutralTheme} from '@astryxdesign/theme-neutral/built';
import {mockApi} from './services/mockApi';
import type {AppConfig, AppModule, AppNotification, AuthSession, AuthUser, ResourceSchema} from './types';
import {ModuleIcon} from './components/icons';
import {NotificationCenter} from './components/NotificationCenter';
import {LOCALE_STORAGE_KEY, localeMeta, uiCopy, type Locale} from './localization';

const AuthPage = lazy(() => import('./components/AuthPage').then(module => ({default: module.AuthPage})));
const DashboardPage = lazy(() => import('./components/DashboardPage').then(module => ({default: module.DashboardPage})));
const ResourcePage = lazy(() => import('./components/ResourcePage').then(module => ({default: module.ResourcePage})));
const UserCenterPage = lazy(() => import('./components/UserCenterPage').then(module => ({default: module.UserCenterPage})));

function PageFallback() {
  return (
    <Card>
      <Text type="body">…</Text>
    </Card>
  );
}

function groupedModules(modules: AppModule[]) {
  return modules.reduce<Record<string, AppModule[]>>((groups, item) => {
    groups[item.group] = [...(groups[item.group] ?? []), item];
    return groups;
  }, {});
}

function flattenModules(items: AppModule[]): AppModule[] {
  return items.flatMap(item => [item, ...flattenModules(item.children ?? [])]);
}

function firstLeafModule(item: AppModule): AppModule {
  return item.children?.length ? firstLeafModule(item.children[0]) : item;
}

function findParentModule(items: AppModule[], pageId: string, parent?: AppModule): AppModule | undefined {
  for (const item of items) {
    if (item.id === pageId) return parent;
    const nested = findParentModule(item.children ?? [], pageId, item);
    if (nested) return nested;
  }
  return undefined;
}

export function App() {
  const sideNavHandleRef = useRef<SideNavImperativeCollapseHandle>(null);
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'en';
    return window.localStorage.getItem(LOCALE_STORAGE_KEY) === 'zh' ? 'zh' : 'en';
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const [currentSession, setCurrentSession] = useState<AuthSession | null>(null);
  const [activePage, setActivePage] = useState('charts');
  const [openedPages, setOpenedPages] = useState<string[]>(['charts']);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [authUsers, setAuthUsers] = useState<AuthUser[] | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [schemas, setSchemas] = useState<ResourceSchema[]>([]);
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const copy = uiCopy[locale];

  useEffect(() => {
    mockApi.setLocale(locale);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = localeMeta[locale].htmlLang;
    document.title = locale === 'zh' ? '通用后台管理' : 'Admin Console';
    mockApi.getAppConfig().then(setAppConfig);
    mockApi.getAuthUsers().then(setAuthUsers);
    mockApi.getSession().then(session => {
      setCurrentSession(session);
      setIsAuthenticated(Boolean(session));
      setIsSessionChecked(true);
    });
    mockApi.getNotifications().then(setNotifications);
    mockApi.getSchemas().then(setSchemas);
  }, [locale]);

  const toggleLocale = () => {
    const nextLocale: Locale = locale === 'en' ? 'zh' : 'en';
    mockApi.setLocale(nextLocale);
    setLocale(nextLocale);
  };

  const modules = appConfig?.modules ?? [];
  const appProfile = appConfig?.profile;
  const accountMenuActions = appConfig?.accountMenuActions ?? [];
  const groups = useMemo(() => groupedModules(modules), [modules]);
  const allModules = useMemo(() => flattenModules(modules), [modules]);
  const activeModule =
    allModules.find(item => item.id === activePage && item.kind !== 'group')
    ?? allModules.find(item => item.kind !== 'group')
    ?? modules[0]
    ?? null;
  const activeParent = useMemo(
    () => activeModule ? findParentModule(modules, activeModule.id) : undefined,
    [modules, activeModule?.id],
  );
  const activeGroup = activeModule?.group === copy.navigationGroup ? null : activeModule?.group;
  const groupLanding = activeModule && activeGroup
    ? firstLeafModule(modules.find(item => item.group === activeGroup) ?? activeModule)
    : undefined;
  const activeSchema = activeModule?.resource
    ? schemas.find(schema => schema.id === activeModule.resource)
    : undefined;

  const navigate = (pageId: string) => {
    const target = allModules.find(item => item.id === pageId);
    const leaf = target ? firstLeafModule(target) : undefined;
    const nextPageId = leaf?.id ?? pageId;
    setActivePage(nextPageId);
    setOpenedPages(current => current.includes(nextPageId) ? current : [...current, nextPageId]);
  };

  const closeTab = (pageId: string) => {
    setOpenedPages(current => {
      const next = current.filter(id => id !== pageId);
      if (pageId === activePage) {
        setActivePage(next.at(-1) ?? 'charts');
      }
      return next.length > 0 ? next : ['charts'];
    });
  };

  const accountMenuItems = accountMenuActions.map(item => {
    if (item.id === 'logout') {
      return {
        label: item.label,
        icon: ArrowRightEndOnRectangleIcon,
        onClick: async () => {
          await mockApi.logout();
          setCurrentSession(null);
          setIsAuthenticated(false);
          setIsSessionChecked(true);
          setActivePage('charts');
          setOpenedPages(['charts']);
        },
      };
    }
    if (item.id === 'settings') {
      return {
        label: item.label,
        icon: Cog6ToothIcon,
        onClick: () => navigate('sysMenu'),
      };
    }
    if (item.id === 'theme') {
      return {
        label: themeMode === 'dark'
          ? locale === 'zh' ? '切换浅色主题' : 'Switch to light theme'
          : locale === 'zh' ? '切换深色主题' : 'Switch to dark theme',
        icon: SunIcon,
        onClick: () => setThemeMode(current => current === 'dark' ? 'light' : 'dark'),
      };
    }
    return {
      label: notifications.some(notification => !notification.isRead)
        ? `${item.label} (${notifications.filter(notification => !notification.isRead).length})`
        : item.label,
      icon: BellIcon,
      onClick: () => setIsNotificationCenterOpen(true),
    };
  });

  const markNotificationRead = async (id: string) => {
    const next = await mockApi.markNotificationRead(id);
    setNotifications(next);
  };

  const markAllNotificationsRead = async () => {
    const next = await mockApi.markAllNotificationsRead();
    setNotifications(next);
  };

  if (!appConfig || !authUsers || !isSessionChecked) {
    return (
      <Theme theme={neutralTheme} mode={themeMode}>
        <AppShell height="fill" variant="wash" contentPadding={4} mobileNav={false}>
          <Card>
            <Text type="body">{copy.loading}</Text>
          </Card>
        </AppShell>
      </Theme>
    );
  }

  if (!isAuthenticated) {
    return (
      <Theme theme={neutralTheme} mode={themeMode}>
        <Suspense fallback={<PageFallback />}>
          <AuthPage
            appConfig={appConfig}
            authUsers={authUsers}
            locale={locale}
            onLocaleToggle={toggleLocale}
            onComplete={session => {
              setCurrentSession(session);
              setIsAuthenticated(true);
              setIsSessionChecked(true);
            }}
          />
        </Suspense>
      </Theme>
    );
  }

  if (!activeModule || !appProfile) {
    return (
      <Theme theme={neutralTheme} mode={themeMode}>
        <AppShell height="fill" variant="wash" contentPadding={4} mobileNav={false}>
          <Card>
            <Text type="body">{copy.loading}</Text>
          </Card>
        </AppShell>
      </Theme>
    );
  }

  const renderSideNavItem = (item: AppModule) => {
    if (item.children?.length) {
      return (
        <SideNavItem
          key={item.id}
          label={item.title}
          icon={() => <ModuleIcon name={item.icon} />}
          collapsible={{defaultIsCollapsed: false}}
        >
          {item.children.map(renderSideNavItem)}
        </SideNavItem>
      );
    }

    return (
      <SideNavItem
        key={item.id}
        label={item.title}
        href="#"
        isSelected={activePage === item.id}
        icon={() => <ModuleIcon name={item.icon} />}
        onClick={event => {
          event.preventDefault();
          navigate(item.id);
        }}
      />
    );
  };

  return (
    <Theme theme={neutralTheme} mode={themeMode}>
      <AppShell
        height="fill"
        variant="section"
        contentPadding={0}
        className="adminShell"
        sideNav={
          <SideNav
            className="adminSideNav"
            handleRef={sideNavHandleRef}
            collapsible={{defaultIsCollapsed: false, hasButton: false, buttonLabel: copy.collapseNavigation}}
            header={
              <SideNavHeading
                heading={appProfile.name}
                icon={
                  <img
                    className="astryx-navicon brandNavIcon"
                    src="/astryx-team.png"
                    alt=""
                    aria-hidden="true"
                  />
                }
                headingHref="#"
                onClick={() => navigate('charts')}
              />
            }
            footer={
              <HStack
                gap={3}
                vAlign="center"
                className="accountDock accountSummary"
                data-testid="account-dock">
                <Avatar name={currentSession?.user.name ?? appProfile.operator} size="small" className="accountAvatar" />
                <StackItem size="fill" className="accountDetails">
                  <VStack gap={0}>
                    <Text type="body" className="accountName">{currentSession?.user.name ?? appProfile.operator}</Text>
                    <Text type="supporting" color="secondary" className="accountDept">{appProfile.department}</Text>
                  </VStack>
                </StackItem>
                <MoreMenu
                  className="accountMenu"
                  data-testid="account-menu"
                  label={copy.accountMenu}
                  size="sm"
                  variant="ghost"
                  items={accountMenuItems}
                />
              </HStack>
            }>
            {Object.entries(groups).map(([group, items]) => (
              <SideNavSection key={group} title={group}>
                {items.map(renderSideNavItem)}
              </SideNavSection>
            ))}
          </SideNav>
        }>
        <VStack gap={0} className="workspace">
          <HStack hAlign="between" vAlign="center" className="appHeader">
            <HStack gap={3} vAlign="center" className="breadcrumbArea">
              <SideNavCollapseButton
                handleRef={sideNavHandleRef}
                className="headerCollapseButton"
              >
                <Icon icon={Bars3Icon} size="sm" />
              </SideNavCollapseButton>
              <ModuleIcon name={activeModule.icon} />
              <Breadcrumbs variant="supporting" label={locale === 'zh' ? '页面路径' : 'Page path'} className="breadcrumbs">
                {activeParent ? (
                  <BreadcrumbItem
                    href="#"
                    onClick={event => {
                      event.preventDefault();
                      navigate(firstLeafModule(activeParent).id);
                    }}
                  >
                    {activeParent.title}
                  </BreadcrumbItem>
                ) : activeGroup ? (
                  <BreadcrumbItem
                    href="#"
                    onClick={event => {
                      event.preventDefault();
                      navigate(groupLanding?.id ?? activeModule.id);
                    }}
                  >
                    {activeGroup}
                  </BreadcrumbItem>
                ) : null}
                <BreadcrumbItem isCurrent>{activeModule.title}</BreadcrumbItem>
              </Breadcrumbs>
            </HStack>
            <Button
              label={locale === 'en' ? '中文' : 'EN'}
              size="sm"
              variant="ghost"
              icon={<Icon icon={LanguageIcon} size="sm" />}
              onClick={toggleLocale}
            />
          </HStack>
          <Divider />
          <HStack gap={1} vAlign="center" className="navTabs">
            {openedPages.map(pageId => {
              const page = allModules.find(item => item.id === pageId);
              if (!page) return null;
              return (
                <Button
                  key={pageId}
                  label={page.title}
                  size="sm"
                  variant={pageId === activePage ? 'primary' : 'secondary'}
                  onClick={() => navigate(pageId)}
                  endContent={
                    openedPages.length > 1 ? (
                      <Icon
                        icon={XMarkIcon}
                        size="xsm"
                        onClick={event => {
                          event.stopPropagation();
                          closeTab(pageId);
                        }}
                      />
                    ) : undefined
                  }
                />
              );
            })}
          </HStack>
          <Divider />
          <StackItem size="fill" className="pageContent">
            <Suspense fallback={<PageFallback />}>
              {activeModule.kind === 'dashboard' ? (
                <DashboardPage locale={locale} />
              ) : activeModule.id === 'userCenter' ? (
                <UserCenterPage
                  locale={locale}
                  onProfileUpdated={profile => {
                    setCurrentSession(current => current
                      ? {...current, user: {name: profile.name, email: profile.email}}
                      : current);
                  }}
                />
              ) : activeSchema ? (
                <ResourcePage schema={activeSchema} locale={locale} />
              ) : (
                <Card>
                  <Text type="body">{copy.noPage}</Text>
                </Card>
              )}
            </Suspense>
          </StackItem>
        </VStack>
        {isNotificationCenterOpen ? (
          <NotificationCenter
            notifications={notifications}
            locale={locale}
            onMarkRead={id => {
              void markNotificationRead(id);
            }}
            onMarkAllRead={() => {
              void markAllNotificationsRead();
            }}
            onClose={() => setIsNotificationCenterOpen(false)}
          />
        ) : null}
      </AppShell>
    </Theme>
  );
}
