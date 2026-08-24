import {lazy, Suspense, useEffect, useMemo, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {Button} from '@cloudflare/kumo/components/button';
import { Sidebar } from "@cloudflare/kumo/components/sidebar";
import { Text } from "@cloudflare/kumo/components/text";
import {useKumoToastManager} from '@cloudflare/kumo/components/toast';
import {Moon, Sun, X} from '@phosphor-icons/react';
import { applicationApi } from "./services/applicationApi";
import { AUTH_REQUIRED_EVENT, authApi } from "./services/authApi";
import type {
  AppNotification,
  AuthSession,
} from "./types";
import {AuthPage} from './components/AuthPage';
import {AppSidebar} from './components/AppSidebar';
import {NotificationCenter} from './components/NotificationCenter';
import { ModuleIcon } from "./components/icons";
import {Card, Skeleton} from './components/kumo-ui';
import i18n, {currentLanguage} from './i18n';
import {findParentModule, firstLeafModule, flattenModules, groupModules, modulesFromMenus} from './navigation';
import {systemSchemas} from './resources/systemSchemas';

type ThemeMode = "light" | "dark";

const DashboardPage = lazy(() =>
  import('./components/DashboardPage').then(module => ({default: module.DashboardPage})),
);
const ResourcePage = lazy(() =>
  import('./components/ResourcePage').then(module => ({default: module.ResourcePage})),
);
const UserCenterPage = lazy(() =>
  import('./components/UserCenterPage').then(module => ({default: module.UserCenterPage})),
);
const AuditLogPage = lazy(() =>
  import('./components/AuditLogPage').then(module => ({default: module.AuditLogPage})),
);
const FileManagerPage = lazy(() =>
  import('./components/FileManagerPage').then(module => ({default: module.FileManagerPage})),
);
const OrganizationPage = lazy(() =>
  import('./components/OrganizationPage').then(module => ({default: module.OrganizationPage})),
);

const SIDEBAR_STORAGE_KEY = "kumo-demo-sidebar-open";
const THEME_STORAGE_KEY = "kumo-demo-theme-mode";

function AppLoadingSkeleton() {
  return (
    <main className="grid min-h-screen place-items-center bg-kumo-canvas" aria-busy="true">
      <div className="flex w-64 flex-col gap-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-4 w-3/4" /></div>
    </main>
  );
}

function PageLoadingSkeleton() {
  return (
    <Card aria-busy="true"><Skeleton className="h-64 w-full" /></Card>
  );
}

export function App() {
  const {t: tShell} = useTranslation('shell');
  const {t: tResources} = useTranslation('adminResources');
  const toasts = useKumoToastManager();
  const language = currentLanguage();
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const [currentSession, setCurrentSession] = useState<AuthSession | null>(
    null,
  );
  const [activePage, setActivePage] = useState('/home');
  const [openedPages, setOpenedPages] = useState<string[]>(["/home"]);
  const queryClient = useQueryClient();
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] =
    useState(false);
  const [isAccountPanelOpen, setIsAccountPanelOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark"
      ? "dark"
      : "light";
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) !== "false";
  });
  const [openSidebarGroups, setOpenSidebarGroups] = useState<Record<string, boolean>>({});

  const updateSidebarOpen = (open: boolean) => {
    setIsSidebarOpen(open);
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(open));
  };

  useEffect(() => {
    document.title = tShell('title');
  }, [language, tShell]);

  useEffect(() => {
    authApi.getSession().then((session) => {
      setCurrentSession(session);
      setIsSessionChecked(true);
    });
  }, []);

  const notificationsQuery = useQuery({
    queryKey: ['notifications', currentSession?.user.id],
    queryFn: applicationApi.getNotifications,
    enabled: Boolean(currentSession),
  });
  const notifications: AppNotification[] = notificationsQuery.data ?? [];
  useEffect(() => {
    if (notificationsQuery.error) {
      toasts.add({title: notificationsQuery.error instanceof Error ? notificationsQuery.error.message : tShell('notificationLoadFailed'), variant: 'error'});
    }
  }, [notificationsQuery.error, tShell, toasts]);

  useEffect(() => {
    const returnToLogin = () => {
      queryClient.clear();
      setCurrentSession(null);
      setIsSessionChecked(true);
      setIsAccountPanelOpen(false);
      setIsNotificationCenterOpen(false);
      setActivePage('/home');
      setOpenedPages(["/home"]);
    };
    window.addEventListener(AUTH_REQUIRED_EVENT, returnToLogin);
    return () => window.removeEventListener(AUTH_REQUIRED_EVENT, returnToLogin);
  }, [queryClient]);

  useEffect(() => {
    document.documentElement.dataset.theme = "kumo";
    document.documentElement.dataset.mode = themeMode;
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  const modules = useMemo(() => {
    if (!currentSession) return [];
    return modulesFromMenus(currentSession.user.menus, {
      system: tShell('system'), navigation: tShell('navigation'), userCenter: tShell('userCenter'),
    }, (key, fallback) => String(i18n.t(key, {defaultValue: fallback})));
  }, [currentSession, language, tShell]);
  const schemas = useMemo(() => systemSchemas(tResources), [language, tResources]);
  const sidebarModules = useMemo(
    () => modules.filter((item) => item.id !== "userCenter"),
    [modules],
  );
  const groups = useMemo(() => groupModules(sidebarModules), [sidebarModules]);
  const allModules = useMemo(() => flattenModules(modules), [modules]);
  useEffect(() => {
    if (!currentSession) return;
    const validIds = new Set(allModules.filter(item => item.kind !== "group").map(item => item.id));
    const fallbackId = allModules.find(item => item.kind !== "group")?.id ?? "userCenter";
    setOpenedPages(current => {
      const available = current.filter(id => validIds.has(id));
      if (validIds.has(activePage) && !available.includes(activePage)) available.push(activePage);
      return available.length > 0 ? available : [fallbackId];
    });
    if (!validIds.has(activePage)) setActivePage(fallbackId);
  }, [activePage, allModules, currentSession]);
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
    activeModule?.group === tShell('navigation') ? null : activeModule?.group;
  const activeParentBreadcrumb =
    activeParent && activeParent.title !== activeGroup ? activeParent : undefined;
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
        setActivePage(next.at(-1) ?? "/home");
      }
      return next.length > 0 ? next : ["/home"];
    });
  };

  const canManageMenus = allModules.some(item => item.id === "/system/menu");
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const markNotificationRead = async (id: string) => {
    await markReadMutation.mutateAsync(id).catch(() => undefined);
  };

  const markAllNotificationsRead = async () => {
    await markAllReadMutation.mutateAsync().catch(() => undefined);
  };

  const markReadMutation = useMutation({
    mutationFn: applicationApi.markNotificationRead,
    onSuccess: (_result, id) => {
      queryClient.setQueryData<AppNotification[]>(['notifications', currentSession?.user.id], current =>
        (current ?? []).map(notification =>
        notification.id === id ? {...notification, isRead: true} : notification,
        ),
      );
    },
    onError: error => {
      toasts.add({title: error instanceof Error ? error.message : tShell('operationFailed'), variant: 'error'});
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: applicationApi.markAllNotificationsRead,
    onSuccess: () => {
      queryClient.setQueryData<AppNotification[]>(['notifications', currentSession?.user.id], current =>
        (current ?? []).map(notification => ({...notification, isRead: true})),
      );
    },
    onError: error => {
      toasts.add({title: error instanceof Error ? error.message : tShell('operationFailed'), variant: 'error'});
    },
  });

  const refreshSessionNavigation = async (resourceId: string) => {
    if (resourceId !== "menus" && resourceId !== "roles") return;
    try {
      const session = await authApi.getSession();
      if (session) setCurrentSession(session);
    } catch (error) {
      toasts.add({title: error instanceof Error ? error.message : tShell('navigationRefreshFailed'), variant: 'error'});
    }
  };

  const logout = async () => {
    await authApi.logout();
    setIsAccountPanelOpen(false);
    setCurrentSession(null);
    queryClient.clear();
    setIsSessionChecked(true);
    setActivePage('/home');
    setOpenedPages(["/home"]);
  };

  if (!isSessionChecked) {
    return (
      <div
        data-theme="kumo"
        data-mode={themeMode}
        className="min-h-screen bg-kumo-canvas text-kumo-default"
      >
        <AppLoadingSkeleton />
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div
        data-theme="kumo"
        data-mode={themeMode}
        className="min-h-screen text-kumo-default"
      >
        <AuthPage
          language={language}
          onLanguageChange={next => void i18n.changeLanguage(next)}
          onComplete={(session) => {
            setCurrentSession(session);
            setIsSessionChecked(true);
          }}
        />
      </div>
    );
  }

  if (!activeModule) {
    return (
      <div
        data-theme="kumo"
        data-mode={themeMode}
        className="min-h-screen bg-kumo-canvas text-kumo-default"
      >
        <AppLoadingSkeleton />
      </div>
    );
  }

  const renderPage = () => {
    if (activeModule.kind === "dashboard") return <DashboardPage />;
    if (activeModule.resource === 'audit_logs') return <AuditLogPage />;
    if (activeModule.resource === 'files') return <FileManagerPage permissionCodes={currentSession.user.permissionCodes} />;
    if (activeModule.kind === 'custom' && activeModule.resource === 'departments' && activeSchema) return <OrganizationPage schema={activeSchema} permissionCodes={currentSession.user.permissionCodes} onResourceChanged={refreshSessionNavigation} />;
    if (activeModule.id === "userCenter") {
      return (
        <UserCenterPage
          sessionUser={currentSession?.user}
          onSessionChange={setCurrentSession}
        />
      );
    }
    if (activeSchema) {
      return (
        <ResourcePage
          key={activeSchema.id}
          schema={activeSchema}
          permissionCodes={currentSession?.user.permissionCodes ?? []}
          onResourceChanged={refreshSessionNavigation}
        />
      );
    }
    return (
      <Card>
        <Text>{tShell('noPage')}</Text>
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
        <AppSidebar
          open={isSidebarOpen}
          groups={groups}
          activePage={activePage}
          openGroups={openSidebarGroups}
          user={currentSession.user}
          accountPanelOpen={isAccountPanelOpen}
          language={language}
          themeMode={themeMode}
          canManageMenus={canManageMenus}
          unreadCount={unreadCount}
          onNavigate={navigate}
          onOpenChange={updateSidebarOpen}
          onGroupOpenChange={(groupId, open) => {
            setOpenSidebarGroups(current => ({...current, [groupId]: open}));
          }}
          onAccountPanelOpenChange={setIsAccountPanelOpen}
          onThemeToggle={() => setThemeMode(current => current === 'dark' ? 'light' : 'dark')}
          onNotificationsOpen={() => setIsNotificationCenterOpen(true)}
          onLogout={() => void logout()}
        />

        <main className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-kumo-line/45 bg-kumo-elevated/85 px-6 py-2 backdrop-blur">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex min-w-0 items-center gap-2 text-sm text-kumo-subtle">
                {activeGroup && groupLanding ? (
                  <>
                    <Button
                      className="h-auto truncate px-1 py-0"
                      size="xs"
                      variant="ghost"
                      onClick={() => navigate(groupLanding.id)}
                    >
                      {activeGroup}
                    </Button>
                    <span>/</span>
                  </>
                ) : null}
                {activeParentBreadcrumb ? (
                  <>
                    <Button
                      className="h-auto truncate px-1 py-0"
                      size="xs"
                      variant="ghost"
                      onClick={() => navigate(activeParentBreadcrumb.id)}
                    >
                      {activeParentBreadcrumb.title}
                    </Button>
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
                icon={themeMode === "dark" ? Sun : Moon}
                aria-label={tShell('toggleTheme')}
                onClick={() =>
                  setThemeMode((current) =>
                    current === "dark" ? "light" : "dark",
                  )
                }
              />
            </div>
          </header>

          <nav className="flex min-h-12 gap-1 overflow-x-auto border-b border-kumo-line/45 bg-kumo-base px-4 py-2 shadow-[inset_0_-1px_0_color-mix(in_srgb,var(--color-kumo-line)_45%,transparent)]">
            {openedPages.map((pageId) => {
              const page = allModules.find((item) => item.id === pageId);
              if (!page) return null;
              const isSelected = activePage === pageId;
              return (
                <span
                  key={pageId}
                  className={`inline-flex shrink-0 items-center rounded-lg border ${isSelected ? "border-kumo-line bg-kumo-elevated text-kumo-strong shadow-sm" : "border-transparent text-kumo-subtle hover:border-kumo-line hover:bg-kumo-tint hover:text-kumo-default"}`}
                >
                  <Button
                    className="gap-2 bg-transparent! px-3 shadow-none"
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(pageId)}
                  >
                  <ModuleIcon name={page.icon} className="size-4" />
                  <span>{page.title}</span>
                  </Button>
                  {openedPages.length > 1 ? (
                    <Button
                      shape="square"
                      size="sm"
                      variant="ghost"
                      aria-label={tShell('closePage', {title: page.title})}
                      icon={X}
                      onClick={(event) => {
                        event.stopPropagation();
                        closeTab(pageId);
                      }}
                    />
                  ) : null}
                </span>
              );
            })}
          </nav>

          <section className="min-h-0 min-w-0 flex-1 overflow-auto p-6">
            <Suspense fallback={<PageLoadingSkeleton />}>
              {renderPage()}
            </Suspense>
          </section>
        </main>

        {isNotificationCenterOpen ? (
          <NotificationCenter
            notifications={notifications}
            onMarkRead={markNotificationRead}
            onMarkAllRead={markAllNotificationsRead}
            onClose={() => setIsNotificationCenterOpen(false)}
          />
        ) : null}
      </Sidebar.Provider>
    </div>
  );
}
