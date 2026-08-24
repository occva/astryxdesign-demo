import {useTranslation} from 'react-i18next';
import {Badge} from '@cloudflare/kumo/components/badge';
import {Button} from '@cloudflare/kumo/components/button';
import {Dialog} from '@cloudflare/kumo/components/dialog';
import {Empty} from '@cloudflare/kumo/components/empty';
import {Text} from '@cloudflare/kumo/components/text';
import i18n from '../i18n';
import {formatRelativeTime} from '../i18n/relative-time';
import type {AppNotification} from '../types';

const notificationVariants: Record<AppNotification['status'], 'blue' | 'green' | 'orange' | 'red'> = {
  info: 'blue',
  success: 'green',
  warning: 'orange',
  error: 'red',
};

type NotificationCenterProps = {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
};

export function NotificationCenter({notifications, onMarkRead, onMarkAllRead, onClose}: NotificationCenterProps) {
  const {t} = useTranslation(['notifications', 'common']);
  const unreadCount = notifications.filter(notification => !notification.isRead).length;
  const translateContent = (key: string, fallback: string) => String(i18n.t(key, {defaultValue: fallback}));

  return (
    <Dialog.Root open onOpenChange={open => !open && onClose()}>
      <Dialog size="xl" className="max-h-[82dvh] overflow-y-auto p-6">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <Dialog.Title>{t('notifications:title')}</Dialog.Title>
            <Button size="sm" variant="secondary" disabled={unreadCount === 0} onClick={onMarkAllRead}>
              {t('notifications:markAllRead')}
            </Button>
          </div>
          {notifications.length > 0 ? (
            <div className="divide-y divide-kumo-line rounded-lg border border-kumo-line">
              {notifications.map(notification => (
                <Button
                  key={notification.id}
                  className="flex h-auto w-full items-center justify-between gap-4 p-4 text-left hover:bg-kumo-tint"
                  variant="ghost"
                  onClick={() => onMarkRead(notification.id)}
                >
                  <span className="min-w-0">
                    <Text as="span" bold>
                      {notification.i18nKey
                        ? translateContent(`${notification.i18nKey}.title`, notification.title)
                        : notification.title}
                    </Text>
                    <Text variant="secondary" size="sm">
                      {notification.i18nKey
                        ? translateContent(`${notification.i18nKey}.description`, notification.description)
                        : notification.description}
                      {' · '}
                      {formatRelativeTime(notification.occurredAt, i18n.resolvedLanguage ?? i18n.language)}
                    </Text>
                  </span>
                  <Badge variant={notification.isRead ? 'neutral' : notificationVariants[notification.status]}>
                    {notification.isRead ? t('notifications:read') : t('notifications:unread')}
                  </Badge>
                </Button>
              ))}
            </div>
          ) : (
            <Empty size="sm" title={t('notifications:empty')} />
          )}
          <div className="flex justify-end">
            <Dialog.Close render={<Button>{t('common:close')}</Button>} />
          </div>
        </div>
      </Dialog>
    </Dialog.Root>
  );
}
