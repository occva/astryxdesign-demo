import {useEffect, useMemo, useRef, useState} from 'react';
import {AppShell} from '@astryxdesign/core/AppShell';
import {Avatar} from '@astryxdesign/core/Avatar';
import {Banner} from '@astryxdesign/core/Banner';
import {BreadcrumbItem, Breadcrumbs} from '@astryxdesign/core/Breadcrumbs';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Center} from '@astryxdesign/core/Center';
import {Dialog} from '@astryxdesign/core/Dialog';
import {Divider} from '@astryxdesign/core/Divider';
import {Link} from '@astryxdesign/core/Link';
import {List, ListItem} from '@astryxdesign/core/List';
import {MoreMenu} from '@astryxdesign/core/MoreMenu';
import {Heading, Text} from '@astryxdesign/core/Text';
import {TextInput} from '@astryxdesign/core/TextInput';
import {HStack, StackItem, VStack} from '@astryxdesign/core/Stack';
import {Token} from '@astryxdesign/core/Token';
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
  EnvelopeIcon,
  LockClosedIcon,
  SunIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {neutralTheme} from '@astryxdesign/theme-neutral/built';
import {mockApi} from './services/mockApi';
import type {AppConfig, AppModule, AppNotification, AuthSession, AuthUser, ResourceSchema, SelectOption} from './types';
import {DashboardPage} from './components/DashboardPage';
import {ResourcePage} from './components/ResourcePage';
import {UserCenterPage} from './components/UserCenterPage';
import {ModuleIcon} from './components/icons';

type AuthMode = 'login' | 'register';

const notificationColors: Record<AppNotification['status'], SelectOption['color']> = {
  info: 'blue',
  success: 'green',
  warning: 'orange',
  error: 'red',
};

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

function AuthPage({
  appConfig,
  authUsers,
  onComplete,
}: {
  appConfig: AppConfig;
  authUsers: AuthUser[];
  onComplete: (session: AuthSession) => void;
}) {
  const defaultUser = authUsers[0] ?? {name: '', email: '', password: ''};
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState(defaultUser.name);
  const [email, setEmail] = useState(defaultUser.email);
  const [password, setPassword] = useState(defaultUser.password);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === 'register';
  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setMessage(null);
  };
  const submit = async () => {
    if (isRegister && name.trim().length === 0) {
      setMessage('请输入姓名后再注册。');
      return;
    }
    if (!email.includes('@')) {
      setMessage('请输入有效的邮箱地址。');
      return;
    }
    if (password.length < 6) {
      setMessage('密码至少需要 6 位。');
      return;
    }
    setIsSubmitting(true);
    try {
      let session: AuthSession;
      if (isRegister) {
        session = await mockApi.registerAuthUser({name, email, password});
      } else {
        session = await mockApi.login(email, password);
      }
      setMessage(null);
      onComplete(session);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '认证失败，请重试。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell height="fill" variant="wash" contentPadding={0} mobileNav={false}>
      <Center minHeight="100dvh" width="100%" className="authPage">
        <VStack gap={4} className="authPanel">
          <VStack gap={2} hAlign="center">
            <img
              className="authBrandIcon"
              src="/astryx-team.png"
              alt=""
              aria-hidden="true"
            />
            <Text type="supporting" color="secondary">{appConfig.profile.name}</Text>
          </VStack>
          <Card padding={8} width="100%">
            <VStack gap={4}>
              <VStack gap={1}>
                <Heading level={1}>{isRegister ? '注册账号' : '登录账号'}</Heading>
              </VStack>
              {message ? (
                <Banner status="error" title={message} container="card" />
              ) : null}
              {isRegister ? (
                <TextInput
                  label="姓名"
                  value={name}
                  startIcon={UserIcon}
                  isRequired
                  hasAutoFocus
                  onChange={setName}
                />
              ) : null}
              <TextInput
                label="邮箱"
                value={email}
                type="email"
                startIcon={EnvelopeIcon}
                isRequired
                hasAutoFocus={!isRegister}
                onChange={setEmail}
              />
              <TextInput
                label="密码"
                value={password}
                type="password"
                startIcon={LockClosedIcon}
                isRequired
                onChange={setPassword}
              />
              <Button
                label={isRegister ? '注册并进入' : '登录'}
                variant="primary"
                icon={<Icon icon={ArrowRightEndOnRectangleIcon} size="sm" />}
                isLoading={isSubmitting}
                onClick={submit}
              />
              <HStack gap={1} hAlign="center" wrap="wrap">
                <Text type="supporting" color="secondary">
                  {isRegister ? '已有账号？' : '还没有账号？'}
                </Text>
                <Link
                  href={isRegister ? '#login' : '#register'}
                  isStandalone
                  onClick={event => {
                    event.preventDefault();
                    switchMode(isRegister ? 'login' : 'register');
                  }}
                >
                  {isRegister ? '返回登录' : '立即注册'}
                </Link>
              </HStack>
            </VStack>
          </Card>
        </VStack>
      </Center>
    </AppShell>
  );
}

function NotificationCenter({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClose,
}: {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}) {
  const unreadCount = notifications.filter(item => !item.isRead).length;

  return (
    <Dialog
      isOpen
      onOpenChange={open => !open && onClose()}
      width="min(38.75rem, calc(100vw - var(--spacing-12)))"
      maxHeight="min(82dvh, 46rem)"
      padding={0}
      purpose="info"
    >
      <VStack gap={0} className="dialogFrame">
        <StackItem className="dialogHeader">
          <HStack hAlign="between" vAlign="center" gap={3}>
            <VStack gap={0}>
              <Heading level={2}>通知中心</Heading>
            </VStack>
            <Button
              label="全部已读"
              size="sm"
              variant="secondary"
              isDisabled={unreadCount === 0}
              onClick={onMarkAllRead}
            />
          </HStack>
        </StackItem>
        <StackItem className="dialogContent">
          {notifications.length > 0 ? (
            <List hasDividers density="balanced">
              {notifications.map(item => (
                <ListItem
                  key={item.id}
                  label={item.title}
                  description={`${item.description} · ${item.time}`}
                  onClick={() => onMarkRead(item.id)}
                  endContent={
                    <Token
                      label={item.isRead ? '已读' : '未读'}
                      color={item.isRead ? 'gray' : notificationColors[item.status]}
                      size="sm"
                    />
                  }
                />
              ))}
            </List>
          ) : (
            <Text type="body" color="secondary">暂无数据</Text>
          )}
        </StackItem>
        <HStack hAlign="end" gap={2} className="dialogFooter">
          <Button label="关闭" onClick={onClose} />
        </HStack>
      </VStack>
    </Dialog>
  );
}

export function App() {
  const sideNavHandleRef = useRef<SideNavImperativeCollapseHandle>(null);
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

  useEffect(() => {
    mockApi.getAppConfig().then(setAppConfig);
    mockApi.getAuthUsers().then(setAuthUsers);
    mockApi.getSession().then(session => {
      setCurrentSession(session);
      setIsAuthenticated(Boolean(session));
      setIsSessionChecked(true);
    });
    mockApi.getNotifications().then(setNotifications);
    mockApi.getSchemas().then(setSchemas);
  }, []);

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
  const activeGroup = activeModule?.group === '导航' ? null : activeModule?.group;
  const groupLanding = activeGroup
    ? firstLeafModule(modules.find(item => item.group === activeGroup) ?? activeModule!)
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
        label: themeMode === 'dark' ? '切换浅色主题' : '切换深色主题',
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
            <Text type="body">正在加载...</Text>
          </Card>
        </AppShell>
      </Theme>
    );
  }

  if (!isAuthenticated) {
    return (
      <Theme theme={neutralTheme} mode={themeMode}>
        <AuthPage
          appConfig={appConfig}
          authUsers={authUsers}
          onComplete={session => {
            setCurrentSession(session);
            setIsAuthenticated(true);
            setIsSessionChecked(true);
          }}
        />
      </Theme>
    );
  }

  if (!activeModule || !appProfile) {
    return (
      <Theme theme={neutralTheme} mode={themeMode}>
        <AppShell height="fill" variant="wash" contentPadding={4} mobileNav={false}>
          <Card>
            <Text type="body">正在加载...</Text>
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
            collapsible={{defaultIsCollapsed: false, hasButton: false, buttonLabel: '折叠导航'}}
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
                  label="账号菜单"
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
              <Breadcrumbs variant="supporting" label="页面路径" className="breadcrumbs">
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
            {activeModule.kind === 'dashboard' ? (
              <DashboardPage />
            ) : activeModule.id === 'userCenter' ? (
              <UserCenterPage />
            ) : activeSchema ? (
              <ResourcePage schema={activeSchema} />
            ) : (
              <Card>
                <Text type="body">正在加载...</Text>
              </Card>
            )}
          </StackItem>
        </VStack>
        {isNotificationCenterOpen ? (
          <NotificationCenter
            notifications={notifications}
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
