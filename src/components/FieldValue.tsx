import {Badge} from '@cloudflare/kumo/components/badge';
import {Button} from '@cloudflare/kumo/components/button';
import {Meter} from '@cloudflare/kumo/components/meter';
import {Popover} from '@cloudflare/kumo/components/popover';
import {Text} from '@cloudflare/kumo/components/text';
import {useTranslation} from 'react-i18next';
import {colorToBadgeVariant, StatusBadge} from './kumo-ui';
import type {ResourceField, StatusTone} from '../types';
import {currentLanguage, languageRegistry} from '../i18n';
import {MenuIcon} from './icons';

function optionFor(field: ResourceField, value: unknown) {
  return field.options?.find(option => option.value === String(value));
}

function toneFor(status?: StatusTone) {
  if (status === 'accent') return 'info';
  return status ?? 'neutral';
}

function formatDateValue(value: unknown) {
  const text = String(value ?? '');
  return text.replace('T', ' ').slice(0, text.includes(':') ? 16 : 10);
}

export function FieldValue({field, value}: {field: ResourceField; value: unknown}) {
  const {t} = useTranslation('resource');
  const language = currentLanguage();
  if (field.kind === 'status') {
    const option = optionFor(field, value);
    return (
      <StatusBadge tone={toneFor(option?.status)}>
        {option?.label ?? String(value)}
      </StatusBadge>
    );
  }

  if (field.kind === 'tags' && Array.isArray(value)) {
    const tags = value.map(tag => String(tag));
    const visibleTags = tags.slice(0, 2);
    const hiddenCount = Math.max(tags.length - visibleTags.length, 0);

    return (
      <div className="flex min-w-0 items-center gap-1 whitespace-nowrap">
        {visibleTags.map(tag => (
          <Badge key={tag} variant="secondary">{tag}</Badge>
        ))}
        {hiddenCount > 0 ? (
          <Popover>
            <Popover.Trigger
              render={
                <Button
                  size="xs"
                  variant="ghost"
                  className="rounded-full p-0"
                  aria-label={t('viewTags', {count: tags.length})}
                >
                  <Badge variant="secondary">+{hiddenCount}</Badge>
                </Button>
              }
            />
            <Popover.Content side="top" align="start" positionMethod="fixed" className="max-w-72">
              <div className="flex flex-wrap gap-1">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </Popover.Content>
          </Popover>
        ) : null}
      </div>
    );
  }

  if (field.kind === 'progress') {
    const progress = Number(value) || 0;
    return (
      <div className="min-w-32">
        <Meter label={`${field.label} ${progress}%`} value={progress} showValue={false} />
        <Text variant="secondary" size="sm">{progress}%</Text>
      </div>
    );
  }

  if (field.kind === 'currency') {
    return <Text as="span">{new Intl.NumberFormat(language, {style:'currency', currency:languageRegistry[language].currency}).format(Number(value))}</Text>;
  }

  if (field.kind === 'date') {
    const text = String(value ?? '');
    return (
      <time title={text} dateTime={text.replace(' ', 'T')}>
        <Text as="span" truncate>{formatDateValue(value)}</Text>
      </time>
    );
  }

  if (field.kind === 'select') {
    const option = optionFor(field, value);
    if (option?.color) {
      return <Badge variant={colorToBadgeVariant(option.color)}>{option.label}</Badge>;
    }
    return <Text as="span">{option?.label ?? String(value ?? '')}</Text>;
  }

  if (field.kind === 'icon') {
    const option = optionFor(field, value);
    return (
      <span
        className="inline-flex size-8 items-center justify-center rounded-md bg-kumo-tint text-kumo-default"
        title={option?.label ?? String(value ?? '')}
        aria-label={option?.label ?? String(value ?? '')}
        role="img"
      >
        <MenuIcon code={String(value ?? '')} className="size-4" />
      </span>
    );
  }

  return <Text as="span" truncate>{String(value ?? '')}</Text>;
}
