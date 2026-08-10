import {Badge, Meter, Popover, Text, colorToBadgeVariant, StatusBadge} from './report-ui';
import type {ResourceField, StatusTone} from '../types';
import {uiCopy, type Locale} from '../localization';

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

export function FieldValue({field, value, locale}: {field: ResourceField; value: unknown; locale: Locale}) {
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
      <div className="vbg-table-tags">
        {visibleTags.map(tag => (
          <span className="vbg-table-tag" key={tag}>{tag}</span>
        ))}
        {hiddenCount > 0 ? (
          <Popover>
            <Popover.Trigger
              render={
                <button
                  className="vbg-table-tag vbg-table-tag--more"
                  type="button"
                  aria-label={locale === 'zh'
                    ? `${uiCopy.zh.resource.viewTags}${tags.length}${uiCopy.zh.resource.tags}`
                    : `${uiCopy.en.resource.viewTags} ${tags.length} ${uiCopy.en.resource.tags}`}
                >
                  +{hiddenCount}
                </button>
              }
            />
            <Popover.Content side="top" align="center" className="vbg-table-tags-popover">
              <div className="vbg-table-tags-popover__grid">
                {tags.map(tag => (
                  <span className="vbg-table-tag" key={tag}>{tag}</span>
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
      <div className="vbg-custom-progress-cell">
        <Meter label={`${field.label} ${progress}%`} value={progress} showValue={false} />
        <Text variant="secondary" size="sm">{progress}%</Text>
      </div>
    );
  }

  if (field.kind === 'currency') {
    return <Text as="span">{locale === 'zh' ? '¥' : '$'}{Number(value).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}</Text>;
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

  return <Text as="span" truncate>{String(value ?? '')}</Text>;
}
