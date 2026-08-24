import {useEffect, useRef, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Button} from '@cloudflare/kumo/components/button';
import {Dialog} from '@cloudflare/kumo/components/dialog';
import {Empty} from '@cloudflare/kumo/components/empty';
import {Pagination} from '@cloudflare/kumo/components/pagination';
import {Table} from '@cloudflare/kumo/components/table';
import {Text} from '@cloudflare/kumo/components/text';
import {useKumoToastManager} from '@cloudflare/kumo/components/toast';
import {Eye, MagnifyingGlass} from '@phosphor-icons/react';
import {useTranslation} from 'react-i18next';
import {enterpriseApi} from '../services/enterpriseApi';
import type {AuditLog, ResourceQuery} from '../types';
import {Card, FormInput, FormSelect, PageTitle, Skeleton, StatusBadge} from './kumo-ui';

const initialQuery: ResourceQuery = {
  page: 1,
  pageSize: 10,
  filters: {},
  sortKey: 'occurredAt',
  sortDirection: 'desc',
};

const resourceValues = ['users', 'roles', 'role_permissions', 'departments', 'menus', 'notifications', 'files', 'auth'];
const actionValues = ['create', 'update', 'delete', 'upload', 'download', 'preview', 'import', 'mark_read', 'assign_permissions', 'manage_auth'];

export function AuditLogPage() {
  const {t} = useTranslation('enterprise');
  const toasts = useKumoToastManager();
  const reportedError = useRef<unknown>(null);
  const [query, setQuery] = useState<ResourceQuery>(initialQuery);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const listQuery = useQuery({
    queryKey: ['audit-logs', query],
    queryFn: () => enterpriseApi.auditLogs(query),
  });
  const rows: AuditLog[] = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const loading = listQuery.isLoading || listQuery.isFetching;
  const resources = t('audit.resources', {returnObjects: true}) as Record<string, string>;
  const actions = t('audit.actions', {returnObjects: true}) as Record<string, string>;

  useEffect(() => {
    if (!listQuery.error || reportedError.current === listQuery.error) return;
    reportedError.current = listQuery.error;
    toasts.add({title: listQuery.error instanceof Error ? listQuery.error.message : t('loadFailed'), variant: 'error'});
  }, [listQuery.error, t, toasts]);

  const search = () => setQuery(current => ({...current, page: 1, filters: draft}));
  const reset = () => {
    setDraft({});
    setQuery({...initialQuery});
  };
  const resourceLabel = (value: string) => resources[value] ?? value;
  const actionLabel = (value: string) => actions[value] ?? value;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-5">
      <PageTitle title={t('audit.title')} />

      <Card className="p-4">
        <div className="grid items-end gap-3 md:grid-cols-2 xl:grid-cols-[minmax(12rem,1.4fr)_minmax(11rem,1fr)_minmax(11rem,1fr)_minmax(10rem,.8fr)_auto]">
          <FormInput label={t('audit.actor')} value={draft.actor ?? ''} onValueChange={actor => setDraft(current => ({...current, actor}))} />
          <FormSelect label={t('audit.resource')} value={draft.resourceType ?? ''} options={[{label: t('all'), value: ''}, ...resourceValues.map(value => ({label: resourceLabel(value), value}))]} onValueChange={resourceType => setDraft(current => ({...current, resourceType}))} />
          <FormSelect label={t('audit.action')} value={draft.action ?? ''} options={[{label: t('all'), value: ''}, ...actionValues.map(value => ({label: actionLabel(value), value}))]} onValueChange={action => setDraft(current => ({...current, action}))} />
          <FormSelect label={t('audit.status')} value={draft.status ?? ''} options={[{label: t('all'), value: ''}, {label: t('audit.succeeded'), value: 'succeeded'}, {label: t('audit.failed'), value: 'failed'}]} onValueChange={status => setDraft(current => ({...current, status}))} />
          <div className="flex gap-2"><Button icon={MagnifyingGlass} onClick={search}>{t('search')}</Button><Button variant="secondary" onClick={reset}>{t('reset')}</Button></div>
        </div>
      </Card>

      <Card className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-0">
        <div className="min-h-0 flex-1 overflow-auto border-b border-kumo-line">
          {loading ? (
            <Table style={{minWidth:'58rem'}} aria-label={t('audit.title')}>
              <Table.Header sticky><Table.Row>{Array.from({length:5},(_,index)=><Table.Head key={index}><Skeleton className="h-4 w-24" /></Table.Head>)}</Table.Row></Table.Header>
              <Table.Body>{Array.from({length:query.pageSize},(_,rowIndex)=><Table.Row key={rowIndex}>{Array.from({length:5},(_,cellIndex)=><Table.Cell key={cellIndex}><Skeleton className={`h-5 ${cellIndex<3?'w-28':'w-20'}`} /></Table.Cell>)}</Table.Row>)}</Table.Body>
            </Table>
          ) : rows.length ? (
            <Table style={{minWidth: '58rem'}}>
              <Table.Header sticky><Table.Row><Table.Head>{t('audit.actor')}</Table.Head><Table.Head>{t('audit.time')}</Table.Head><Table.Head>{t('audit.operation')}</Table.Head><Table.Head>{t('audit.result')}</Table.Head><Table.Head>{t('audit.evidence')}</Table.Head></Table.Row></Table.Header>
              <Table.Body>{rows.map(row => (
                <Table.Row key={row.id}>
                  <Table.Cell><div className="flex min-w-32 flex-col gap-0.5"><Text bold>{row.actorName}</Text><Text size="sm" variant="secondary">@{row.actorAccount}</Text></div></Table.Cell>
                  <Table.Cell className="whitespace-nowrap"><Text size="sm">{new Date(row.occurredAt).toLocaleString()}</Text></Table.Cell>
                  <Table.Cell><div className="flex min-w-48 flex-col gap-0.5"><Text bold>{actionLabel(row.action)}</Text><Text size="sm" variant="secondary">{resourceLabel(row.resourceType)}{row.resourceId ? ` · ${row.resourceId.slice(0, 8)}` : ''}</Text></div></Table.Cell>
                  <Table.Cell><StatusBadge tone={row.status === 'succeeded' ? 'success' : 'error'}>{row.status === 'succeeded' ? t('audit.succeeded') : t('audit.failed')}</StatusBadge></Table.Cell>
                  <Table.Cell><Button size="sm" variant="secondary" icon={Eye} onClick={() => setSelectedLog(row)}>{t('audit.view')}</Button></Table.Cell>
                </Table.Row>
              ))}</Table.Body>
            </Table>
          ) : <Empty size="sm" title={t('empty')} description={t('audit.emptyHint')} />}
        </div>

        {!loading ? (
          <div className="shrink-0 overflow-x-auto p-4">
            <Pagination className="min-w-[38rem] flex-nowrap" page={query.page} setPage={page => setQuery(current => ({...current, page}))} perPage={query.pageSize} totalCount={total} labels={{navigation: t('pagination'), firstPage: t('firstPage'), previousPage: t('previousPage'), nextPage: t('nextPage'), lastPage: t('lastPage'), pageNumber: t('pageNumber'), pageSize: t('pageSize')}}>
              <Pagination.Info className="shrink-0">
                {({pageShowingRange, totalCount}) => t('audit.pageSummary', {range: totalCount ? pageShowingRange.replace('-', '–') : '0', total:totalCount ?? 0})}
              </Pagination.Info>
              <Pagination.Separator />
              <Pagination.PageSize value={query.pageSize} label={t('perPage')} options={[10, 20, 50]} onChange={pageSize => setQuery(current => ({...current, page: 1, pageSize}))} />
              <Pagination.Separator />
              <Pagination.Controls pageSelector="input" />
            </Pagination>
          </div>
        ) : null}
      </Card>

      <Dialog.Root open={selectedLog !== null} onOpenChange={open => { if (!open) setSelectedLog(null); }}>
        <Dialog size="xl" className="max-h-[84dvh] overflow-hidden p-0">
          <div className="flex max-h-[84dvh] flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-kumo-line px-6 py-5">
              <Dialog.Title>{t('audit.detailTitle')}</Dialog.Title>
              <Dialog.Close render={<Button variant="secondary">{t('audit.close')}</Button>} />
            </div>
            {selectedLog ? <div className="min-h-0 overflow-y-auto p-6">
              <div className="grid gap-px overflow-hidden rounded-lg border border-kumo-line bg-kumo-line sm:grid-cols-2 lg:grid-cols-3">
                {[
                  [t('audit.actor'), `${selectedLog.actorName} (@${selectedLog.actorAccount})`],
                  [t('audit.time'), new Date(selectedLog.occurredAt).toLocaleString()],
                  [t('audit.operation'), `${actionLabel(selectedLog.action)} · ${resourceLabel(selectedLog.resourceType)}`],
                  [t('audit.requestMethod'), selectedLog.requestMethod],
                  [t('audit.statusCode'), String(selectedLog.statusCode)],
                  [t('audit.errorCode'), selectedLog.errorCode ?? '—'],
                  [t('audit.requestPath'), selectedLog.requestPath],
                  [t('audit.requestId'), selectedLog.requestId],
                  [t('audit.target'), selectedLog.resourceId ?? '—'],
                ].map(([label, value]) => <div key={label} className="min-w-0 bg-kumo-base p-4"><Text as="p" size="sm" variant="secondary">{label}</Text><div className="mt-1 break-all"><Text as="p" bold>{value}</Text></div></div>)}
              </div>
              <div className="mt-5"><Text as="h3" bold>{t('audit.evidence')}</Text>{selectedLog.changes ? <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-kumo-tint p-4 text-xs leading-5 whitespace-pre-wrap">{JSON.stringify(selectedLog.changes, null, 2)}</pre> : <div className="mt-2"><Text as="p" variant="secondary">{t('audit.noChanges')}</Text></div>}</div>
            </div> : null}
          </div>
        </Dialog>
      </Dialog.Root>
    </div>
  );
}
