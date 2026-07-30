import { useEffect, useMemo, useState } from "react";
import { Badge } from "@cloudflare/kumo/components/badge";
import { Banner } from "@cloudflare/kumo/components/banner";
import { Button } from "@cloudflare/kumo/components/button";
import { Dialog } from "@cloudflare/kumo/components/dialog";
import { DropdownMenu } from "@cloudflare/kumo/components/dropdown";
import { Link } from "@cloudflare/kumo/components/link";
import { Sidebar } from "@cloudflare/kumo/components/sidebar";
import { Text } from "@cloudflare/kumo/components/text";
import {
  Bell,
  GearSix,
  Moon,
  SignIn,
  SignOut,
  Sun,
  Translate,
  X,
} from "@phosphor-icons/react";
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
import { Avatar, Card, FormInput } from "./components/kumo-ui";
import {
  LOCALE_STORAGE_KEY,
  localeMeta,
  uiCopy,
  type Locale,
} from "./localization";

type AuthMode = "login" | "register";
type ThemeMode = "light" | "dark";

const SIDEBAR_STORAGE_KEY = "kumo-demo-sidebar-open";
const COLLAPSED_SIDEBAR_BUTTON_CLASS =
  "group-data-[state=collapsed]/sidebar:mx-auto group-data-[state=collapsed]/sidebar:size-10 group-data-[state=collapsed]/sidebar:min-h-10 group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:px-0 group-data-[state=collapsed]/sidebar:py-0 group-data-[state=collapsed]/sidebar:[&>div]:w-full group-data-[state=collapsed]/sidebar:[&>div]:translate-x-0 group-data-[state=collapsed]/sidebar:[&>div]:justify-center group-data-[state=collapsed]/sidebar:[&>div>span]:hidden";
const SIDEBAR_ACTIVE_CLASS =
  "data-[active]:bg-kumo-fill data-[active]:text-kumo-strong data-[active]:[&_svg]:opacity-75";

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
    <img
      className={`size-8 shrink-0 rounded-xl ${className}`}
      src="/original-logo.png"
      alt=""
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
      className={`mr-2 inline-flex size-5 shrink-0 items-center justify-center ${active ? "text-kumo-strong" : "text-kumo-subtle"}`}
      aria-hidden="true"
    >
      <ModuleIcon name={name} className="size-4" />
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
    <main className="relative grid min-h-screen place-items-center bg-kumo-canvas px-6 py-10">
      <Button
        className="absolute right-6 top-6"
        shape="square"
        variant="secondary"
        icon={Translate}
        aria-label={localeMeta[locale].switchLabel}
        title={localeMeta[locale].switchLabel}
        onClick={onLocaleToggle}
      />
      <div className="flex w-full max-w-[24rem] flex-col gap-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <BrandMark />
          <Text variant="secondary" size="sm">
            {appConfig.profile.name}
          </Text>
        </div>
        <Card className="p-6 sm:p-7">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
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
            <div className="flex flex-col gap-4">
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
              className="w-full justify-center"
              variant="primary"
              icon={SignIn}
              loading={isSubmitting}
              onClick={submit}
            >
              {isRegister ? copy.registerAction : copy.loginAction}
            </Button>
            <div className="flex flex-wrap justify-center gap-1 text-sm">
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
      <Dialog size="xl" className="max-h-[82dvh] overflow-y-auto p-6">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
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
            <div className="divide-y divide-kumo-line rounded-lg border border-kumo-line">
              {notifications.map((item) => (
                <button
                  key={item.id}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-kumo-tint"
                  type="button"
                  onClick={() => onMarkRead(item.id)}
                >
                  <span className="min-w-0">
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
          <div className="flex justify-end">
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
    if (item.id === "theme" || item.id === "notifications") {
      return [];
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
        data-theme="kumo"
        data-mode={themeMode}
        className="min-h-screen bg-kumo-canvas p-6 text-kumo-default"
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
        data-theme="kumo"
        data-mode={themeMode}
        className="min-h-screen text-kumo-default"
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
        data-theme="kumo"
        data-mode={themeMode}
        className="min-h-screen bg-kumo-canvas p-6 text-kumo-default"
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
            className="group-data-[state=collapsed]/sidebar:overflow-visible"
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
              <DropdownMenu.Content side="right" align="start" className="min-w-44 p-2">
                {item.children.map((child) => {
                  const isChildActive = activePage === child.id;
                  return (
                    <DropdownMenu.Item
                      key={child.id}
                      className={`min-h-10 px-3 py-2 text-sm font-medium ${isChildActive ? "bg-kumo-fill text-kumo-strong" : "text-kumo-default"}`}
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
          className="group-data-[state=collapsed]/sidebar:overflow-visible"
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
        className="group-data-[state=collapsed]/sidebar:overflow-visible"
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
      data-theme="kumo"
      data-mode={themeMode}
      className="h-dvh overflow-hidden bg-kumo-canvas text-kumo-default"
    >
      <Sidebar.Provider
        open={isSidebarOpen}
        onOpenChange={updateSidebarOpen}
        collapsible="icon"
        className="h-full overflow-hidden"
      >
        <Sidebar className="h-dvh shrink-0" contentClassName="bg-kumo-elevated">
          <Sidebar.Header>
            <button
              className={`flex w-full min-w-0 items-center gap-3 rounded-lg p-2 text-left hover:bg-kumo-tint ${COLLAPSED_SIDEBAR_BUTTON_CLASS}`}
              type="button"
              onClick={() => navigate("charts")}
            >
              <BrandMark className="group-data-[state=collapsed]/sidebar:size-8" />
              <span className="min-w-0 truncate font-semibold group-data-[state=collapsed]/sidebar:hidden">
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
          <Sidebar.Footer className="h-auto py-2">
            <div className="flex w-full min-w-0 items-center gap-1 group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:p-0">
              <button
                className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 text-left hover:bg-kumo-tint group-data-[state=collapsed]/sidebar:flex-none ${COLLAPSED_SIDEBAR_BUTTON_CLASS}`}
                type="button"
                aria-label={copy.openUserCenter}
                title={copy.openUserCenter}
                onClick={() => navigate("userCenter")}
              >
                <Avatar
                  name={sidebarUserName}
                  src={userProfile?.avatarUrl}
                  className="size-8 shrink-0"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5 group-data-[state=collapsed]/sidebar:hidden">
                  <Text as="span" size="sm" bold truncate>
                    {sidebarUserName}
                  </Text>
                  <Text as="span" variant="secondary" size="xs" truncate>
                    {sidebarUserDepartment}
                  </Text>
                </span>
              </button>
              <DropdownMenu>
                <DropdownMenu.Trigger
                  render={
                    <button
                      className="shrink-0 rounded-md p-1.5 text-kumo-subtle hover:bg-kumo-tint group-data-[state=collapsed]/sidebar:hidden"
                      type="button"
                      aria-label={copy.accountMenu}
                    >
                      <GearSix className="size-4" />
                    </button>
                  }
                />
                <DropdownMenu.Content side="top" align="start">
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
            </div>
          </Sidebar.Footer>
        </Sidebar>

        <main className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex min-h-18 flex-wrap items-center justify-between gap-3 border-b border-kumo-line bg-kumo-elevated/85 px-6 py-4 backdrop-blur">
            <div className="flex min-w-0 items-center gap-3">
              <Sidebar.Trigger aria-label={copy.collapseNavigation} />
              <div className="flex min-w-0 items-center gap-2 text-sm text-kumo-subtle">
                {activeGroup && groupLanding ? (
                  <>
                    <button
                      className="truncate rounded px-1 hover:text-kumo-default"
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
                      className="truncate rounded px-1 hover:text-kumo-default"
                      type="button"
                      onClick={() => navigate(activeParent.id)}
                    >
                      {activeParent.title}
                    </button>
                    <span>/</span>
                  </>
                ) : null}
                <span className="truncate font-medium text-kumo-default">
                  {activeModule.title}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                shape="square"
                variant="secondary"
                icon={Translate}
                aria-label={localeMeta[locale].switchLabel}
                title={localeMeta[locale].switchLabel}
                onClick={toggleLocale}
              />
              <Button
                shape="square"
                variant="secondary"
                icon={themeMode === "dark" ? Sun : Moon}
                aria-label={copy.toggleTheme}
                onClick={() =>
                  setThemeMode((current) =>
                    current === "dark" ? "light" : "dark",
                  )
                }
              />
              <Button
                shape="square"
                variant="secondary"
                icon={Bell}
                aria-label={copy.notificationsLabel}
                onClick={() => setIsNotificationCenterOpen(true)}
              />
            </div>
          </header>

          <nav className="flex min-h-12 gap-1 overflow-x-auto border-b border-kumo-line bg-kumo-base px-4 py-2 shadow-[inset_0_-1px_0_var(--color-kumo-line)]">
            {openedPages.map((pageId) => {
              const page = allModules.find((item) => item.id === pageId);
              if (!page) return null;
              const isSelected = activePage === pageId;
              return (
                <button
                  key={pageId}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${isSelected ? "border-kumo-line bg-kumo-elevated text-kumo-strong shadow-sm" : "border-transparent text-kumo-subtle hover:border-kumo-line hover:bg-kumo-tint hover:text-kumo-default"}`}
                  type="button"
                  onClick={() => navigate(pageId)}
                >
                  <ModuleIcon name={page.icon} className="size-4" />
                  <span>{page.title}</span>
                  {openedPages.length > 1 ? (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={`${copy.closePage} ${page.title}`}
                      className="rounded p-0.5 hover:bg-kumo-fill"
                      onClick={(event) => {
                        event.stopPropagation();
                        closeTab(pageId);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          closeTab(pageId);
                        }
                      }}
                    >
                      <X className="size-3" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <section className="min-h-0 min-w-0 flex-1 overflow-auto p-6">
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
