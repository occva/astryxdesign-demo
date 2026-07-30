import {Button} from '@astryxdesign/core/Button';
import {Dialog} from '@astryxdesign/core/Dialog';
import {Heading, Text} from '@astryxdesign/core/Text';
import {HStack, StackItem, VStack} from '@astryxdesign/core/Stack';
import {List, ListItem} from '@astryxdesign/core/List';
import {Token} from '@astryxdesign/core/Token';
import type {AppNotification, SelectOption} from '../types';
import {uiCopy, type Locale} from '../localization';

const notificationColors: Record<AppNotification['status'], SelectOption['color']> = {
  info: 'blue',
  success: 'green',
  warning: 'orange',
  error: 'red',
};

export function NotificationCenter({
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
              <Heading level={2}>{copy.title}</Heading>
            </VStack>
            <Button
              label={copy.markAllRead}
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
                      label={item.isRead ? copy.read : copy.unread}
                      color={item.isRead ? 'gray' : notificationColors[item.status]}
                      size="sm"
                    />
                  }
                />
              ))}
            </List>
          ) : (
            <Text type="body" color="secondary">{copy.empty}</Text>
          )}
        </StackItem>
        <HStack hAlign="end" gap={2} className="dialogFooter">
          <Button label={copy.close} onClick={onClose} />
        </HStack>
      </VStack>
    </Dialog>
  );
}
