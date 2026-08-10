import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Banner,
  Button,
  Card,
  Dialog,
  DropdownMenu,
  Link,
  Sidebar,
  Text,
  FormInput,
} from "./components/report-ui";
import {
  Bell,
  DotsThreeHorizontal,
  GearSix,
  Moon,
  SignIn,
  SignOut,
  Sun,
  Translate,
  X,
} from "./components/vercel-icons";
import { mockApi } from "./services/mockApi";
import type {
  AppConfig,
  AppModule,
  AppNotification,
  AuthSession,
  AuthUser,
  ResourceSchema,
  SelectOption,
  UserProfile,
} from "./types";
import { DashboardPage } from "./components/DashboardPage";
import { ResourcePage } from "./components/ResourcePage";
import { UserCenterPage } from "./components/UserCenterPage";
import { ModuleIcon } from "./components/icons";
import {
  LOCALE_STORAGE_KEY,
  localeMeta,
  uiCopy,
  type Locale,
} from "./localization";

type AuthMode = "login" | "register";
type ThemeMode = "light" | "dark";

const SIDEBAR_STORAGE_KEY = "kumo-demo-sidebar-open";
const COLLAPSED_SIDEBAR_BUTTON_CLASS = "";
const SIDEBAR_ACTIVE_CLASS = "";

const notificationColors: Record<
  AppNotification["status"],
  SelectOption["color"]
> = {
  info: "blue",
  success: "green",
  warning: "orange",
  error: "red",
};

function groupedModules(modules: AppModule[]) {
  return modules.reduce<Record<string, AppModule[]>>((groups, item) => {
    groups[item.group] = [...(groups[item.group] ?? []), item];
    return groups;
  }, {});
}

function flattenModules(items: AppModule[]): AppModule[] {
  return items.flatMap((item) => [
    item,
    ...flattenModules(item.children ?? []),
  ]);
}

function firstLeafModule(item: AppModule): AppModule {
  return item.children?.length ? firstLeafModule(item.children[0]) : item;
}

function findParentModule(
  items: AppModule[],
  pageId: string,
  parent?: AppModule,
): AppModule | undefined {
  for (const item of items) {
    if (item.id === pageId) return parent;
    const nested = findParentModule(item.children ?? [], pageId, item);
    if (nested) return nested;
  }
  return undefined;
}

function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`vbg-logo vbg-custom-brand-mark ${className}`}
      aria-hidden="true"
    />
  );
}

function sidebarIcon(name: AppModule["icon"]) {
  return function SidebarModuleIcon({ className }: { className?: string }) {
    return <ModuleIcon name={name} className={className} />;
  };
}

function dropdownModuleIcon(name: AppModule["icon"], active = false) {
  return (
    <span
      className="vbg-sidebar-flyout-menu__icon"
      data-active={active || undefined}
      aria-hidden="true"
    >
      <ModuleIcon name={name} className="vbg-custom-icon" />
    </span>
  );
}

function AuthPage({
  appConfig,
  authUsers,
  locale,
  onLocaleToggle,
  onComplete,
}: {
  appConfig: AppConfig;
  authUsers: AuthUser[];
  locale: Locale;
  onLocaleToggle: () => void;
  onComplete: (session: AuthSession) => void;
}) {
  const copy = uiCopy[locale].auth;
  const defaultUser = authUsers[0] ?? { name: "", email: "", password: "" };
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState(defaultUser.name);
  const [email, setEmail] = useState(defaultUser.email);
  const [password, setPassword] = useState(defaultUser.password);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === "register";
  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setMessage(null);
  };
  const submit = async () => {
    if (isRegister && name.trim().length === 0) {
      setMessage(copy.nameRequired);
      return;
    }
    if (!email.includes("@")) {
      setMessage(copy.emailInvalid);
      return;
    }
    if (password.length < 6) {
      setMessage(copy.passwordShort);
      return;
    }
    setIsSubmitting(true);
    try {
      let session: AuthSession;
      if (isRegister) {
        session = await mockApi.registerAuthUser({ name, email, password });
      } else {
        session = await mockApi.login(email, password);
      }
      setMessage(null);
      onComplete(session);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.failed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="vbg-custom-auth">
      <Button
        className="vbg-custom-auth__locale"
        shape="square"
        variant="secondary"
        icon={Translate}
        aria-label={localeMeta[locale].switchLabel}
        title={localeMeta[locale].switchLabel}
        onClick={onLocaleToggle}
      />
      <div className="vbg-custom-auth__panel">
        <div className="vbg-custom-auth__brand">
          <BrandMark />
          <Text variant="secondary" size="sm">
            {appConfig.profile.name}
          </Text>
        </div>
        <Card className="vbg-custom-auth-card">
          <div className="vbg-custom-auth-form">
            <div className="vbg-custom-auth-form__header">
              <Text variant="heading2" as="h1">
                {isRegister ? copy.registerTitle : copy.loginTitle}
              </Text>
              <Text variant="secondary" size="sm">
                {isRegister
                  ? copy.registerDescription
                  : copy.loginDescription}
              </Text>
            </div>
            {message ? <Banner variant="error" title={message} /> : null}
            <div className="vbg-custom-auth-form__fields">
              {isRegister ? (
                <FormInput
                  label={copy.name}
                  value={name}
                  required
                  autoFocus
                  onValueChange={setName}
                />
              ) : null}
              <FormInput
                label={copy.email}
                value={email}
                type="email"
                required
                autoFocus={!isRegister}
                onValueChange={setEmail}
              />
              <FormInput
                label={copy.password}
                value={password}
                type="password"
                required
                onValueChange={setPassword}
              />
            </div>
            <Button
              className="vbg-custom-auth-form__submit"
              variant="primary"
              icon={SignIn}
              loading={isSubmitting}
              onClick={submit}
            >
              {isRegister ? copy.registerAction : copy.loginAction}
            </Button>
            <div className="vbg-custom-auth-form__switch">
              <Text as="span" variant="secondary">
                {isRegister ? copy.hasAccount : copy.newHere}
              </Text>
              <Link
                href={isRegister ? "#login" : "#register"}
                onClick={(event) => {
                  event.preventDefault();
                  switchMode(isRegister ? "login" : "register");
                }}
              >
                {isRegister ? copy.loginAction : copy.registerTitle}
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

function NotificationCenter({
  notifications,
  locale,
  onMarkRead,
  onMarkAllRead,
  onClose,
}: {
  notifications: AppNotification[];
  locale: Locale;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}) {
  const copy = uiCopy[locale].notifications;
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog size="lg" className="vbg-notification-dialog">
        <div className="vbg-notification-dialog__body">
          <div className="vbg-notification-dialog__header">
            <Dialog.Title>{copy.title}</Dialog.Title>
            <Button
              size="sm"
              variant="secondary"
              disabled={unreadCount === 0}
              onClick={onMarkAllRead}
            >
              {copy.markAllRead}
            </Button>
          </div>
          {notifications.length > 0 ? (
            <div className="vbg-custom-list">
              {notifications.map((item) => (
                <button
                  key={item.id}
                  className="vbg-custom-list__button"
                  type="button"
                  onClick={() => onMarkRead(item.id)}
                >
                  <span className="vbg-notification-dialog__item-copy">
                    <Text as="span" bold>
                      {item.title}
                    </Text>
                    <Text variant="secondary" size="sm">
                      {item.description} · {item.time}
                    </Text>
                  </span>
                  <Badge
                    variant={
                      item.isRead
                        ? "neutral"
                        : notificationColors[item.status] === "orange"
                          ? "orange"
                          : notificationColors[item.status] === "green"
                            ? "green"
                            : notificationColors[item.status] === "red"
                              ? "red"
                              : "blue"
                    }
                  >
                    {item.isRead ? copy.read : copy.unread}
                  </Badge>
                </button>
              ))}
            </div>
          ) : (
            <Text variant="secondary">{copy.empty}</Text>
          )}
          <div className="vbg-notification-dialog__footer">
            <Button onClick={onClose}>{copy.close}</Button>
          </div>
        </div>
      </Dialog>
    </Dialog.Root>
  );
}

export function App() {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") return "en";
    return window.localStorage.getItem(LOCALE_STORAGE_KEY) === "zh" ? "zh" : "en";
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const [currentSession, setCurrentSession] = useState<AuthSession | null>(
    null,
  );
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activePage, setActivePage] = useState("charts");
  const [openedPages, setOpenedPages] = useState<string[]>(["charts"]);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [authUsers, setAuthUsers] = useState<AuthUser[] | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] =
    useState(false);
  const [schemas, setSchemas] = useState<ResourceSchema[]>([]);
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) !== "false";
  });
  const [openSidebarGroups, setOpenSidebarGroups] = useState<Record<string, boolean>>({});
  const copy = uiCopy[locale];

  const updateSidebarOpen = (open: boolean) => {
    setIsSidebarOpen(open);
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(open));
  };

  useEffect(() => {
    mockApi.setLocale(locale);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = localeMeta[locale].htmlLang;
    document.title = locale === "zh" ? "通用后台管理" : "Admin Console";
    mockApi.getAppConfig().then(setAppConfig);
    mockApi.getAuthUsers().then(setAuthUsers);
    mockApi.getSession().then((session) => {
      setCurrentSession(session);
      setIsAuthenticated(Boolean(session));
      setIsSessionChecked(true);
      if (session) {
        mockApi.getUserProfile().then(setUserProfile);
      } else {
        setUserProfile(null);
      }
    });
    mockApi.getNotifications().then(setNotifications);
    mockApi.getSchemas().then(setSchemas);
  }, [locale]);

  const toggleLocale = () => {
    const nextLocale: Locale = locale === "en" ? "zh" : "en";
    mockApi.setLocale(nextLocale);
    setLocale(nextLocale);
  };

  const modules = appConfig?.modules ?? [];
  const sidebarModules = useMemo(
    () => modules.filter((item) => item.id !== "userCenter"),
    [modules],
  );
  const appProfile = appConfig?.profile;
  const accountMenuActions = appConfig?.accountMenuActions ?? [];
  const groups = useMemo(() => groupedModules(sidebarModules), [sidebarModules]);
  const allModules = useMemo(() => flattenModules(modules), [modules]);
  const activeModule =
    allModules.find(
      (item) => item.id === activePage && item.kind !== "group",
    ) ??
    allModules.find((item) => item.kind !== "group") ??
    modules[0] ??
    null;
  const activeParent = useMemo(
    () =>
      activeModule ? findParentModule(modules, activeModule.id) : undefined,
    [modules, activeModule?.id],
  );
  const activeGroup =
    activeModule?.group === copy.navigationGroup ? null : activeModule?.group;
  const groupLanding = activeGroup
    ? firstLeafModule(
        modules.find((item) => item.group === activeGroup) ?? activeModule!,
      )
    : undefined;
  const activeSchema = activeModule?.resource
    ? schemas.find((schema) => schema.id === activeModule.resource)
    : undefined;

  const navigate = (pageId: string) => {
    const target = allModules.find((item) => item.id === pageId);
    const leaf = target ? firstLeafModule(target) : undefined;
    const nextPageId = leaf?.id ?? pageId;
    setActivePage(nextPageId);
    setOpenedPages((current) =>
      current.includes(nextPageId) ? current : [...current, nextPageId],
    );
  };

  const closeTab = (pageId: string) => {
    setOpenedPages((current) => {
      const next = current.filter((id) => id !== pageId);
      if (pageId === activePage) {
        setActivePage(next.at(-1) ?? "charts");
      }
      return next.length > 0 ? next : ["charts"];
    });
  };

  const accountMenuItems = accountMenuActions.flatMap((item) => {
    if (item.id === "notifications") {
      return [];
    }
    if (item.id === "theme") {
      return [
        {
          label:
            themeMode === "dark"
              ? locale === "zh" ? "切换到浅色" : "Switch to light"
              : locale === "zh" ? "切换到深色" : "Switch to dark",
          icon: themeMode === "dark" ? Sun : Moon,
          onClick: () =>
            setThemeMode((current) =>
              current === "dark" ? "light" : "dark",
            ),
        },
      ];
    }
    if (item.id === "logout") {
      return [
        {
          label: item.label,
          icon: SignOut,
          onClick: async () => {
            await mockApi.logout();
            setCurrentSession(null);
            setUserProfile(null);
            setIsAuthenticated(false);
            setIsSessionChecked(true);
            setActivePage("charts");
            setOpenedPages(["charts"]);
          },
        },
      ];
    }
    if (item.id === "settings") {
      return [
        {
          label: item.label,
          icon: GearSix,
          onClick: () => navigate("sysMenu"),
        },
      ];
    }
    return [];
  });

  const markNotificationRead = async (id: string) => {
    const next = await mockApi.markNotificationRead(id);
    setNotifications(next);
  };

  const markAllNotificationsRead = async () => {
    const next = await mockApi.markAllNotificationsRead();
    setNotifications(next);
  };

  const syncSavedProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    setCurrentSession((current) =>
      current
        ? {
            ...current,
            user: {
              ...current.user,
              name: profile.name,
              email: profile.email,
            },
          }
        : current,
    );
  };

  if (!appConfig || !authUsers || !isSessionChecked) {
    return (
      <div
        className="vbg-report vbg-custom-loading"
        data-mode={themeMode}
      >
        <Card>
          <Text>{copy.loading}</Text>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        className="vbg-report"
        data-mode={themeMode}
      >
        <AuthPage
          appConfig={appConfig}
          authUsers={authUsers}
          locale={locale}
          onLocaleToggle={toggleLocale}
          onComplete={(session) => {
            setCurrentSession(session);
            setIsAuthenticated(true);
            setIsSessionChecked(true);
            mockApi.getUserProfile().then(setUserProfile);
          }}
        />
      </div>
    );
  }

  if (!activeModule || !appProfile) {
    return (
      <div
        className="vbg-report vbg-custom-loading"
        data-mode={themeMode}
      >
        <Card>
          <Text>{copy.loading}</Text>
        </Card>
      </div>
    );
  }

  const sidebarUserName =
    userProfile?.name ?? currentSession?.user.name ?? appProfile.operator;
  const sidebarUserDepartment = userProfile?.department ?? appProfile.department;

  const renderSideNavItem = (item: AppModule) => {
    if (item.children?.length) {
      const hasActiveChild = item.children.some((child) => child.id === activePage);
      if (!isSidebarOpen) {
        return (
          <Sidebar.MenuItem
            key={item.id}
          >
            <DropdownMenu>
              <DropdownMenu.Trigger
                render={
                  <Sidebar.MenuButton
                    className={`${COLLAPSED_SIDEBAR_BUTTON_CLASS} ${SIDEBAR_ACTIVE_CLASS}`}
                    active={hasActiveChild}
                    icon={sidebarIcon(item.icon)}
                    aria-label={item.title}
                  />
                }
              />
              <DropdownMenu.Content side="right" align="start" className="vbg-sidebar-flyout-menu">
                {item.children.map((child) => {
                  const isChildActive = activePage === child.id;
                  return (
                    <DropdownMenu.Item
                      key={child.id}
                      className={isChildActive ? "is-active" : ""}
                      icon={dropdownModuleIcon(child.icon, isChildActive)}
                      onClick={() => navigate(child.id)}
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

      const isGroupOpen = openSidebarGroups[item.id] ?? true;
      return (
        <Sidebar.MenuItem
          key={item.id}
        >
          <Sidebar.Collapsible
            open={isGroupOpen}
            onOpenChange={(open) => {
              setOpenSidebarGroups((current) => ({...current, [item.id]: open}));
            }}
          >
            <Sidebar.CollapsibleTrigger
              render={
                <Sidebar.MenuButton
                  className={`${COLLAPSED_SIDEBAR_BUTTON_CLASS} ${SIDEBAR_ACTIVE_CLASS}`}
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
              <Sidebar.MenuSub>
                {item.children.map((child) => (
                  <Sidebar.MenuSubButton
                    key={child.id}
                    active={activePage === child.id}
                    onClick={() => navigate(child.id)}
                  >
                    {child.title}
                  </Sidebar.MenuSubButton>
                ))}
              </Sidebar.MenuSub>
            </Sidebar.CollapsibleContent>
          </Sidebar.Collapsible>
        </Sidebar.MenuItem>
      );
    }

    return (
      <Sidebar.MenuItem
        key={item.id}
      >
        <Sidebar.MenuButton
          className={`${COLLAPSED_SIDEBAR_BUTTON_CLASS} ${SIDEBAR_ACTIVE_CLASS}`}
          active={activePage === item.id}
          icon={sidebarIcon(item.icon)}
          tooltip={item.title}
          onClick={() => navigate(item.id)}
        >
          {isSidebarOpen ? item.title : null}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    );
  };

  const renderPage = () => {
    if (activeModule.kind === "dashboard") return <DashboardPage locale={locale} />;
    if (activeModule.id === "userCenter") {
      return <UserCenterPage locale={locale} onProfileSaved={syncSavedProfile} />;
    }
    if (activeSchema) return <ResourcePage schema={activeSchema} locale={locale} />;
    return (
      <Card>
        <Text>{copy.noPage}</Text>
      </Card>
    );
  };

  return (
    <div
      className="vbg-report"
      data-mode={themeMode}
    >
      <Sidebar.Provider
        open={isSidebarOpen}
        onOpenChange={updateSidebarOpen}
        collapsible="icon"
      >
        <Sidebar>
          <Sidebar.Header>
            <button
              className={`vbg-custom-sidebar__brand ${COLLAPSED_SIDEBAR_BUTTON_CLASS}`}
              type="button"
              onClick={() => navigate("charts")}
            >
              <BrandMark className="vbg-custom-sidebar__brand-mark" />
              <span className="vbg-custom-sidebar__brand-label">
                {appProfile.name}
              </span>
            </button>
          </Sidebar.Header>
          <Sidebar.Content>
            {Object.entries(groups).map(([group, items]) => (
              <Sidebar.Group key={group}>
                <Sidebar.GroupLabel>{group}</Sidebar.GroupLabel>
                <Sidebar.Menu>{items.map(renderSideNavItem)}</Sidebar.Menu>
              </Sidebar.Group>
            ))}
          </Sidebar.Content>
          <Sidebar.Footer>
            <div className="vbg-custom-sidebar-footer-row">
              <button
                className={`vbg-custom-user-entry__button ${COLLAPSED_SIDEBAR_BUTTON_CLASS}`}
                type="button"
                aria-label={copy.openUserCenter}
                title={copy.openUserCenter}
                onClick={() => navigate("userCenter")}
              >
                <Avatar
                  name={sidebarUserName}
                  src={userProfile?.avatarUrl}
                  className="vbg-custom-avatar--sidebar"
                />
                <span className="vbg-custom-sidebar-user-copy">
                  <span className="vbg-custom-sidebar-user-copy__name">
                    {sidebarUserName}
                  </span>
                  <span className="vbg-custom-sidebar-user-copy__meta">
                    {sidebarUserDepartment}
                  </span>
                </span>
              </button>
              <DropdownMenu>
                <DropdownMenu.Trigger
                  render={
                    <button
                      className="vbg-custom-sidebar-footer-action"
                      type="button"
                      aria-label={copy.accountMenu}
                      title={copy.accountMenu}
                    >
                      <DotsThreeHorizontal className="vbg-custom-icon" />
                    </button>
                  }
                />
                <DropdownMenu.Content side={isSidebarOpen ? "top" : "right"} align={isSidebarOpen ? "start" : "end"}>
                  {accountMenuItems.map((item) => (
                    <DropdownMenu.Item
                      key={item.label}
                      icon={item.icon}
                      onClick={item.onClick}
                    >
                      {item.label}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu>
              <button
                className="vbg-custom-sidebar-footer-action"
                type="button"
                aria-label={copy.notificationsLabel}
                title={copy.notificationsLabel}
                onClick={() => setIsNotificationCenterOpen(true)}
              >
                <Bell className="vbg-custom-icon" />
              </button>
            </div>
          </Sidebar.Footer>
        </Sidebar>

        <main className="vbg-custom-main">
          <header className="vbg-custom-topbar">
            <div className="vbg-custom-topbar__left">
              <Sidebar.Trigger aria-label={copy.collapseNavigation} />
              <div className="vbg-custom-breadcrumbs">
                {activeGroup && groupLanding && activeParent?.title !== activeGroup ? (
                  <>
                    <button
                      className="vbg-custom-breadcrumbs__button"
                      type="button"
                      onClick={() => navigate(groupLanding.id)}
                    >
                      {activeGroup}
                    </button>
                    <span>/</span>
                  </>
                ) : null}
                {activeParent ? (
                  <>
                    <button
                      className="vbg-custom-breadcrumbs__button"
                      type="button"
                      onClick={() => navigate(activeParent.id)}
                    >
                      {activeParent.title}
                    </button>
                    <span>/</span>
                  </>
                ) : null}
                <span className="vbg-custom-breadcrumbs__current">
                  {activeModule.title}
                </span>
              </div>
            </div>
            <div className="vbg-custom-topbar__actions">
              <Button
                shape="square"
                variant="secondary"
                icon={Translate}
                aria-label={localeMeta[locale].switchLabel}
                title={localeMeta[locale].switchLabel}
                onClick={toggleLocale}
              />
            </div>
          </header>

          <nav className="vbg-custom-tabsbar">
            {openedPages.map((pageId) => {
              const page = allModules.find((item) => item.id === pageId);
              if (!page) return null;
              const isSelected = activePage === pageId;
              return (
                <span
                  key={pageId}
                  className="vbg-custom-page-tab"
                  data-active={isSelected || undefined}
                >
                  <button
                    className="vbg-custom-page-tab__main"
                    type="button"
                    aria-current={isSelected ? "page" : undefined}
                    onClick={() => navigate(pageId)}
                  >
                    <span>{page.title}</span>
                  </button>
                  {openedPages.length > 1 ? (
                    <button
                      type="button"
                      aria-label={`${copy.closePage} ${page.title}`}
                      className="vbg-custom-page-tab__close"
                      onClick={(event) => {
                        event.stopPropagation();
                        closeTab(pageId);
                      }}
                    >
                      <X className="vbg-custom-icon vbg-custom-icon--xs" />
                    </button>
                  ) : null}
                </span>
              );
            })}
          </nav>

          <section className="vbg-custom-page">
            {renderPage()}
          </section>
        </main>

        {isNotificationCenterOpen ? (
          <NotificationCenter
            notifications={notifications}
            locale={locale}
            onMarkRead={markNotificationRead}
            onMarkAllRead={markAllNotificationsRead}
            onClose={() => setIsNotificationCenterOpen(false)}
          />
        ) : null}
      </Sidebar.Provider>
    </div>
  );
}
