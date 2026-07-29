import {HStack, VStack} from '@astryxdesign/core/Stack';
import {Text} from '@astryxdesign/core/Text';
import {Token} from '@astryxdesign/core/Token';
import {DropdownMenu} from '@astryxdesign/core/DropdownMenu';
import {StatusDot} from '@astryxdesign/core/StatusDot';
import {ProgressBar} from '@astryxdesign/core/ProgressBar';
import type {ResourceField} from '../types';
import {uiCopy, type Locale} from '../localization';

function optionFor(field: ResourceField, value: unknown) {
  return field.options?.find(option => option.value === String(value));
}

export function FieldValue({field, value, locale}: {field: ResourceField; value: unknown; locale: Locale}) {
  const copy = uiCopy[locale].resource;
  if (field.kind === 'status') {
    const option = optionFor(field, value);
    return (
      <HStack gap={2} vAlign="center">
        <StatusDot
          variant={option?.status ?? 'neutral'}
          label={option?.label ?? String(value)}
          tooltip={option?.label ?? String(value)}
        />
        <Text type="body">{option?.label ?? String(value)}</Text>
      </HStack>
    );
  }

  if (field.kind === 'tags' && Array.isArray(value)) {
    const tags = value.map(tag => String(tag));
    const visibleTags = tags.slice(0, 2);
    const hiddenCount = Math.max(tags.length - visibleTags.length, 0);

    return (
      <HStack gap={1} className="tagList">
        {visibleTags.map(tag => (
          <Token key={tag} label={tag} size="sm" color="gray" />
        ))}
        {hiddenCount > 0 ? (
          <DropdownMenu
            button={{
              label: `+${hiddenCount}`,
              size: 'sm',
              variant: 'secondary',
              tooltip: copy.viewTags,
              className: 'tagMoreButton',
            }}
            hasChevron={false}
            items={[
              {
                type: 'section',
                title: locale === 'zh' ? `全部${field.label}` : `All ${field.label.toLowerCase()}`,
                items: tags.map(tag => ({label: tag})),
              },
            ]}
          />
        ) : null}
      </HStack>
    );
  }

  if (field.kind === 'progress') {
    const progress = Number(value) || 0;
    return (
      <VStack gap={1}>
        <ProgressBar value={progress} max={100} label={`${field.label} ${progress}%`} isLabelHidden />
        <Text type="supporting" color="secondary">
          {progress}%
        </Text>
      </VStack>
    );
  }

  if (field.kind === 'currency') {
    return (
      <Text type="body">
        {locale === 'zh' ? '¥' : '$'}{Number(value).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}
      </Text>
    );
  }

  if (field.kind === 'date') {
    const text = String(value ?? '');
    return <span className="tableText dateCell" title={text}>{text.slice(0, 10)}</span>;
  }

  if (field.kind === 'select') {
    return <Text type="body">{optionFor(field, value)?.label ?? String(value ?? '')}</Text>;
  }

  return <Text type="body">{String(value ?? '')}</Text>;
}
